import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { PgMigrator } from "@effect/sql-pg";
import { Effect } from "effect";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { PgLive } from "../pg-client.js";

NodeRuntime.runMain(
  Effect.gen(function*() {
    const migrations = yield* PgMigrator.run({
      loader: PgMigrator.fromFileSystem(
        path.join(
          fileURLToPath(new URL(".", import.meta.url)),
          "../migrations",
        ),
      ),
      schemaDirectory: path.join(
        fileURLToPath(new URL(".", import.meta.url)),
        "../migrations/sql",
      ),
    });

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
