import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [],
  test: {
    setupFiles: [path.join(__dirname, "setupTests.ts")],
    include: ["./test/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@entasis/server/test": path.join(__dirname, "test"),
      "@entasis/server": path.join(__dirname, "src"),
    },
  },
});
