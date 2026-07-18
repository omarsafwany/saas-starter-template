/**
 * Vitest `globalSetup`. Runs once, before any test file, in its own
 * process - separate from the `setupFiles` env wiring. This is where the
 * ticket's "migrates the test Postgres schema before the suite runs"
 * requirement is satisfied: `prisma migrate deploy` against the isolated
 * "test" schema, applying every migration already committed under
 * prisma/migrations (Prisma creates the schema itself if it doesn't
 * exist yet).
 */
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { TEST_DATABASE_URL } from "./testEnv.js";

const backendRoot = fileURLToPath(new URL("..", import.meta.url));

export async function setup(): Promise<void> {
  execSync("npx prisma migrate deploy", {
    cwd: backendRoot,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });
}
