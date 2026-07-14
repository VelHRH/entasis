import { PgMigrator } from "@effect/sql-pg";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const migrationsDirectory = fileURLToPath(new URL("./migrations", import.meta.url));

// Where the migrator dumps the reference schema; only the CLI script passes
// this — the test harness skips the dump (it needs pg_dump on the host).
export const schemaDirectory = path.join(migrationsDirectory, "sql");

export const runMigrations = (options?: { readonly schemaDirectory?: string }) =>
  PgMigrator.run({
    loader: PgMigrator.fromFileSystem(migrationsDirectory),
    ...options,
  });
