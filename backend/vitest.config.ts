import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./tests/globalSetup.ts"],
    setupFiles: ["./tests/setupEnv.ts"],
    // Integration tests share one Postgres schema; running test files
    // concurrently would let them race on the same tables. Sequential
    // files keep the suite simple and deterministic over fast-but-flaky.
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
    },
  },
});
