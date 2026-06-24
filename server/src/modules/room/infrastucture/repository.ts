import * as SqlClient from "@effect/sql/SqlClient";
import * as SqlSchema from "@effect/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { flow } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
import { PgLive } from "src/db/pg-client.js";
import { RoomNotFoundError } from "../domain/errors.js";
import { CreateRoomInput, RoomsRepo, UpdateRoomInput } from "../domain/repo.js";
import { Room, RoomId } from "../domain/schema.js";

export const RoomsRepoLive = Layer.effect(
  RoomsRepo,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const findAll = SqlSchema.findAll({
      Result: Room,
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
    };
  }),
).pipe(Layer.provide(PgLive));
