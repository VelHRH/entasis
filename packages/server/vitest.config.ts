import path from "path";
import { defineConfig } from "vitest/config";
import { TEST_DATABASE_URL } from "./test/test-env";

export default defineConfig({
  plugins: [],
  test: {
    setupFiles: [path.join(__dirname, "setupTests.ts")],
    globalSetup: [path.join(__dirname, "test/globalSetup.ts")],
    include: ["./test/**/*.test.ts"],
    globals: true,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
    },
  },
  resolve: {
    alias: {
      "@entasis/server/test": path.join(__dirname, "test"),
      "@entasis/server": path.join(__dirname, "src"),
    },
  },
});
