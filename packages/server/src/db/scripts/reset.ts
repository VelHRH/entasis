import { SqlClient, SqlSchema } from "@effect/sql";
import { Effect, Schema } from "effect";
import { PgLive } from "../pg-client.js";

Effect.runPromise(
  Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient;

    const schemaList = ["public"];

    const getTypes = SqlSchema.findAll({
      Request: Schema.Void,
      Result: Schema.Struct({
        typname: Schema.String,
        schemaname: Schema.String,
      }),
      execute: () =>
        sql`
      SELECT
        t.typname,
        n.nspname AS schemaname
      FROM
        pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE
        t.typtype = 'e'
        AND n.nspname IN ${sql.in(schemaList)}
    `,
    });

    const getTables = SqlSchema.findAll({
      Request: Schema.Void,
      Result: Schema.Struct({
        tableName: Schema.String,
        schemaName: Schema.String,
      }),
      execute: () =>
        sql`
      SELECT
        table_name,
        table_schema AS schema_name
      FROM
        information_schema.tables
      WHERE
        table_schema IN ${sql.in(schemaList)}
        AND table_type = 'BASE TABLE'
    `,
    });

    const getFunctions = SqlSchema.findAll({
      Request: Schema.Void,
      Result: Schema.Struct({
        schemaName: Schema.String,
        functionName: Schema.String,
        identityArguments: Schema.String,
      }),
      execute: () =>
        sql`
      SELECT
        n.nspname AS schema_name,
        p.proname AS function_name,
        pg_get_function_identity_arguments(p.oid) AS identity_arguments
      FROM
        pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE
        n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND n.nspname NOT LIKE 'pg_toast%'
        AND n.nspname NOT LIKE 'pg_temp_%'
        AND p.prokind IN ('f', 'p')
        AND NOT EXISTS (
          SELECT 1
          FROM pg_depend d
          WHERE d.objid = p.oid
            AND d.deptype = 'e'
        )
    `,
    });

    const types = yield* getTypes();
    const tables = yield* getTables();
    const functions = yield* getFunctions();

    yield* sql.withTransaction(
      Effect.gen(function*() {
        console.log(
          `🗑️ Starting database reset for schemas: ${schemaList.join(", ")}`,
        );

        if (types.length > 0) {
          console.log(`Dropping ${types.length} types`);
          for (const type of types) {
            yield* sql`DROP TYPE IF EXISTS ${sql(type.schemaname)}.${sql(type.typname)} CASCADE`;
          }
          console.log(`✅ Dropped ${types.length} types`);
        } else {
          console.log(`No types to drop`);
        }

        if (tables.length > 0) {
          console.log(`Dropping ${tables.length} tables`);
          for (const table of tables) {
            yield* sql`DROP TABLE IF EXISTS ${sql(table.schemaName)}.${sql(table.tableName)} CASCADE`;
          }
          console.log(`✅ Dropped ${tables.length} tables`);
        } else {
          console.log(`No tables to drop`);
        }

        if (functions.length > 0) {
          console.log(`Dropping ${functions.length} functions`);
          for (const fn of functions) {
            const signature = fn.identityArguments.length === 0
              ? sql.literal("()")
              : sql.literal(`(${fn.identityArguments})`);

            yield* sql`DROP FUNCTION IF EXISTS ${sql(fn.schemaName)}.${sql(fn.functionName)}${signature} CASCADE`;
          }
          console.log(`✅ Dropped ${functions.length} functions`);
        } else {
          console.log(`No functions to drop`);
        }
      }),
    );
  }).pipe(Effect.provide(PgLive)),
);
