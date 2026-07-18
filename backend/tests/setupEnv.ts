/**
 * Vitest `setupFiles` entry. Runs before each test file's own imports, so
 * this is where process.env must be finalized: src/config/env.ts parses
 * process.env at *module load* time, and every src module that needs
 * config (app.ts, db.ts, auth.ts, ...) imports it transitively.
 */
import { TEST_DATABASE_URL } from "./testEnv.js";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ?? "test-only-secret-do-not-use-in-production-xx";
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:4000";
process.env.FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

// Deliberately unset: with no Resend key / Better Stack DSN / OAuth client
// creds, the email and observability service wrappers stay on their
// built-in no-op/log-only fallback paths, so the suite can never reach a
// real external API even if a real key is exported in the host shell.
delete process.env.RESEND_API_KEY;
delete process.env.BETTER_STACK_DSN;
delete process.env.GOOGLE_CLIENT_ID;
delete process.env.GOOGLE_CLIENT_SECRET;
delete process.env.GITHUB_CLIENT_ID;
delete process.env.GITHUB_CLIENT_SECRET;
