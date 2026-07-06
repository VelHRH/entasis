import type * as SqlError from "@effect/sql/SqlError";
import * as SqlClient from "@effect/sql/SqlClient";
import * as SqlSchema from "@effect/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { flow } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
import { PgLive } from "src/db/pg-client.js";
import { UserId } from "src/modules/user/domain/schema.js";
import { RoomNotFoundError } from "../domain/errors.js";
import {
  AddRoomMemberInput,
  CreateRoomInput,
  RoomsRepo,
  UpdateRoomInput,
} from "../domain/repo.js";
import { Room, RoomId } from "../domain/schema.js";

const isForeignKeyViolation = (error: SqlError.SqlError) =>
  (error.cause as { code?: string } | undefined)?.code === "23503";

export const RoomsRepoLive = Layer.effect(
  RoomsRepo,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const findAll = SqlSchema.findAll({
      Result: Room, // TODO: Effect schema is not in sync with the database schema, since we are not using ORM. So we will need some integration tests to ensure that the schema is correct.
      Request: Schema.Void,
      execute: () => sql`
        SELECT
          *
        FROM
          rooms
      `,
    });

    const create = SqlSchema.single({
      Result: Room,
      Request: CreateRoomInput,
      execute: (request) => sql`
        INSERT INTO
          rooms ${sql.insert(request)}
        RETURNING
          *
      `,
    });

    const update = SqlSchema.single({
      Result: Room,
      Request: UpdateRoomInput,
      execute: (request) => sql`
        UPDATE rooms
        SET
          ${sql.update(request)}
        WHERE
          id = ${request.id}
        RETURNING
          *
      `,
    });

    const addMember = SqlSchema.void({
      Request: AddRoomMemberInput,
      execute: (request) => sql`
        INSERT INTO
          room_members ${sql.insert(request)}
        ON CONFLICT DO NOTHING
      `,
    });

    const membersAmong = SqlSchema.findAll({
      Result: Schema.Struct({ userId: UserId }),
      Request: Schema.Struct({
        roomId: RoomId,
        userIds: Schema.Array(UserId),
      }),
      execute: (request) => sql`
        SELECT
          user_id
        FROM
          room_members
        WHERE
          room_id = ${request.roomId}
          AND ${sql.in("user_id", request.userIds)}
      `,
    });

    const del = SqlSchema.single({
      Request: RoomId,
      Result: Schema.Unknown,
      execute: (id) => sql`
        DELETE FROM rooms
        WHERE
          id = ${id}
        RETURNING
          id
      `,
    });

    return {
      findAll: flow(findAll, Effect.orDie),
      delete: (id: RoomId) =>
        del(id).pipe(
          Effect.asVoid,
          Effect.catchTags({
            NoSuchElementException: () => new RoomNotFoundError({ id }),
            ParseError: Effect.die,
            SqlError: Effect.die,
          }),
        ),
      update: (request: UpdateRoomInput) =>
        update(request).pipe(
          Effect.catchTags({
            NoSuchElementException: () =>
              new RoomNotFoundError({ id: request.id }),
            ParseError: Effect.die,
            SqlError: Effect.die,
          }),
        ),
      create: flow(create, Effect.orDie),
      addMember: (request: AddRoomMemberInput) =>
        addMember(request).pipe(
          Effect.catchTags({
            // The user always exists (comes from the session), so a FK
            // violation can only mean the room is gone.
            SqlError: (error) =>
              isForeignKeyViolation(error)
                ? new RoomNotFoundError({ id: request.roomId })
                : Effect.die(error),
            ParseError: Effect.die,
          }),
        ),
      membersAmong: (roomId: RoomId, userIds: ReadonlyArray<UserId>) =>
        membersAmong({ roomId, userIds }).pipe(
          Effect.map((rows) => rows.map((row) => row.userId)),
          Effect.orDie,
        ),
    };
  }),
).pipe(Layer.provide(PgLive));
