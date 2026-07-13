import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) =>
    sql`
    -- Existing rows hold plaintext tokens that will never match hashed lookups.
    DELETE FROM sessions;

    ALTER TABLE sessions
    RENAME COLUMN token TO token_hash;
  `,
);
