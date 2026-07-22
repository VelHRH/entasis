import path from "path";
import { defineConfig } from "vitest/config";
import { TEST_DATABASE_URL } from "./test/test-env";

export default defineConfig({
  plugins: [],
  test: {
    setupFiles: [path.join(__dirname, "setupTests.ts")],
    globalSetup: [path.join(__dirname, "test/globalSetup.ts")],
    include: ["./test/**/*.test.ts"],
    // Every suite migrates the one shared test database in its server layer.
    // The migrator is idempotent across sequential boots, but two suites
    // migrating an empty DB at once race on the DDL (both CREATE the
    // effect_sql_migrations table -> duplicate pg_type entry). Run test files
    // serially so migrations never overlap.
    fileParallelism: false,
    globals: true,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
    },
  },
  resolve: {
    alias: {
      "@landline/server/test": path.join(__dirname, "test"),
      "@landline/server": path.join(__dirname, "src"),
    },
  },
});
