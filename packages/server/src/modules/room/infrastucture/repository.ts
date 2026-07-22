import { PgLive } from "#db/pg-client.js";
import { AddRoomMemberInput, CreateRoomInput, RoomsRepo, UpdateRoomInput } from "#modules/room/domain/repo.js";
import * as SqlClient from "@effect/sql/SqlClient";
import type * as SqlError from "@effect/sql/SqlError";
import * as SqlSchema from "@effect/sql/SqlSchema";
import { RoomNotFoundError } from "@landline/domain/room/errors";
import { Room, RoomId, RoomListItem } from "@landline/domain/room/schema";
import { User, UserId } from "@landline/domain/user/schema";
import * as Effect from "effect/Effect";
import { flow } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";

const isForeignKeyViolation = (error: SqlError.SqlError) =>
  (error.cause as { code?: string } | undefined)?.code === "23503";

export const RoomsRepoLive = Layer.effect(
  RoomsRepo,
  Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient;

    // `joined` is a LEFT JOIN against the requester's membership.
    const findAllForUser = SqlSchema.findAll({
      Result: RoomListItem, // TODO: schema is not verified against the DB (no ORM); needs integration tests.
      Request: UserId,
      execute: (userId) =>
        sql`
        SELECT
          r.*,
          rm.user_id IS NOT NULL AS joined
        FROM
          rooms r
          LEFT JOIN room_members rm ON rm.room_id = r.id
          AND rm.user_id = ${userId}
      `,
    });

    const create = SqlSchema.single({
      Result: Room,
      Request: CreateRoomInput,
      execute: (request) =>
        sql`
        INSERT INTO
          rooms ${sql.insert(request)}
        RETURNING
          *
      `,
    });

    const update = SqlSchema.single({
      Result: Room,
      Request: UpdateRoomInput,
      execute: (request) =>
        sql`
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
      execute: (request) =>
        sql`
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
      execute: (request) =>
        sql`
        SELECT
          user_id
        FROM
          room_members
        WHERE
          room_id = ${request.roomId}
          AND ${sql.in("user_id", request.userIds)}
      `,
    });

    const findMembers = SqlSchema.findAll({
      Result: User,
      Request: RoomId,
      // Explicit columns (not u.*) keep password_hash out of the result set.
      execute: (roomId) =>
        sql`
        SELECT
          u.id,
          u.email,
          u.created_at,
          u.updated_at
        FROM
          room_members rm
          JOIN users u ON u.id = rm.user_id
        WHERE
          rm.room_id = ${roomId}
        ORDER BY
          rm.created_at
      `,
    });

    const del = SqlSchema.single({
      Request: RoomId,
      Result: Schema.Unknown,
      execute: (id) =>
        sql`
        DELETE FROM rooms
        WHERE
          id = ${id}
        RETURNING
          id
      `,
    });

    return {
      findAllForUser: flow(findAllForUser, Effect.orDie),
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
            NoSuchElementException: () => new RoomNotFoundError({ id: request.id }),
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
      findMembers: flow(findMembers, Effect.orDie),
    };
  }),
).pipe(Layer.provide(PgLive));
