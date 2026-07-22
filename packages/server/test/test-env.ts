// Connection settings for the api-seam tests. Defaults match the
// docker-compose Postgres; override via environment when needed.
export const TEST_DATABASE_NAME = "landline_test";

const host = process.env.TEST_DATABASE_HOST ?? "localhost:5433";
const credentials = process.env.TEST_DATABASE_CREDENTIALS ?? "postgres:postgres";

// Admin connection used only to drop/recreate the test database.
export const ADMIN_DATABASE_URL = `postgresql://${credentials}@${host}/postgres`;

export const TEST_DATABASE_URL = `postgresql://${credentials}@${host}/${TEST_DATABASE_NAME}`;
