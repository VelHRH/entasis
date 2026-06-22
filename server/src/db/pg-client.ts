import * as PgClient from "@effect/sql-pg/PgClient";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import { identity } from "effect/Function";
import * as Layer from "effect/Layer";
import * as String from "effect/String";

export const PgLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    return PgClient.layer({
      url: yield* Config.redacted("DATABASE_URL"), // Technically Config.redacted("DATABASE_URL") is not an Effect, but yield* implicitly does Effect.config(Config.redacted("DATABASE_URL"))
      transformQueryNames: String.camelToSnake,
      transformResultNames: String.snakeToCamel,
      // - 114: JSON (return as string instead of parsed object)
      // - 1082: DATE
      // - 1114: TIMESTAMP WITHOUT TIME ZONE
      // - 1184: TIMESTAMP WITH TIME ZONE
      // - 3802: JSONB (return as string instead of parsed object)
      types: {
        114: {
          to: 25,
          from: [114],
          parse: identity,
          serialize: identity,
        },
        1082: {
          to: 25,
          from: [1082],
          parse: identity,
          serialize: identity,
        },
        1114: {
          to: 25,
          from: [1114],
          parse: identity,
          serialize: identity,
        },
        1184: {
          to: 25,
          from: [1184],
          parse: identity,
          serialize: identity,
        },
        3802: {
          to: 25,
          from: [3802],
          parse: identity,
          serialize: identity,
        },
      },
    });
  }),
);
