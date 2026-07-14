import pg from "pg";
import { ADMIN_DATABASE_URL, TEST_DATABASE_NAME } from "./test-env.js";

// Recreates the test database before every run so tests always start from a
// clean, fully migrated state (migrations run in the test server layer).
// Requires the docker-compose Postgres: `docker compose up -d` in this package.
export default async function setup() {
  const client = new pg.Client({ connectionString: ADMIN_DATABASE_URL });
  await client.connect();
  try {
    await client.query(`DROP DATABASE IF EXISTS ${TEST_DATABASE_NAME} WITH (FORCE)`);
    await client.query(`CREATE DATABASE ${TEST_DATABASE_NAME}`);
  } finally {
    await client.end();
  }
}
