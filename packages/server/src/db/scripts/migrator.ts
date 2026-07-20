import { runMigrations, schemaDirectory } from "#db/migrate.js";
import { PgLive } from "#db/pg-client.js";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";

NodeRuntime.runMain(
  Effect.gen(function*() {
    const migrations = yield* runMigrations({ schemaDirectory });

    if (migrations.length === 0) {
      yield* Effect.log("No new migrations found");
    } else {
      yield* Effect.log(`Applying ${migrations.length} migrations:`);
      for (const [id, name] of migrations) {
        yield* Effect.log(`- ${id}: ${name}`);
      }
    }
  }).pipe(Effect.provide([NodeContext.layer, PgLive])),
);
