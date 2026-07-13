import { PlatformConfigProvider } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import * as PgClient from "@effect/sql-pg/PgClient";
import * as Config from "effect/Config";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import { identity } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Schedule from "effect/Schedule";
import * as String from "effect/String";
import * as path from "node:path";
import pg from "pg";

// Return these PostgreSQL types as strings instead of Date / parsed JSON.
// - 114: JSON
// - 1082: DATE
// - 1114: TIMESTAMP WITHOUT TIME ZONE
// - 1184: TIMESTAMP WITH TIME ZONE
// - 3802: JSONB
const stringTypeOids = [114, 1082, 1114, 1184, 3802] as const;

const makePgTypes = () => {
  const types = new pg.TypeOverrides();

  for (const oid of stringTypeOids) {
    types.setTypeParser(oid, identity);
  }

  return types;
};

export const PgLive = Layer.unwrapEffect(
  Effect.gen(function*() {
    return PgClient.layer({
      url: yield* Config.redacted("DATABASE_URL"),
      transformQueryNames: String.camelToSnake,
      transformResultNames: String.snakeToCamel,
      types: makePgTypes(),
    });
  }),
).pipe(
  (self) =>
    Layer.retry(
      self,
      Schedule.identity<Layer.Layer.Error<typeof self>>().pipe(
        Schedule.check((input) => input._tag === "SqlError"),
        Schedule.intersect(Schedule.exponential("1 second")),
        Schedule.intersect(Schedule.recurs(2)),
        Schedule.onDecision(([[_error, duration], attempt], decision) =>
          decision._tag === "Continue"
            ? Effect.logInfo(
              `Retrying database connection in ${Duration.format(duration)} (attempt #${++attempt})`,
            )
            : Effect.void
        ),
      ),
    ),
  Layer.provide(
    PlatformConfigProvider.layerDotEnvAdd(path.join(process.cwd(), ".env")),
  ), // We are adding the .env file as a fallback source of config here. By default, Effect will use process.env.
  Layer.provide(NodeContext.layer),
);
