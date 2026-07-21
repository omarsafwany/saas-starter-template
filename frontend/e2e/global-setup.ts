import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { E2E_DATABASE_URL, E2E_SCHEMA } from "./env.js";

const backendRoot = fileURLToPath(new URL("../../backend", import.meta.url));

/**
 * Playwright globalSetup (PERPRO-22): runs once, before any webServer or
 * test starts, so the suite always begins from a genuinely clean database -
 * per the ticket's acceptance criteria ("boots the full stack from a clean
 * database") - rather than trusting leftover state from a prior run.
 *
 * 1. Drop the "e2e" Postgres schema outright (not just truncate - a dropped
 *    schema also survives a Prisma schema change between runs cleanly).
 * 2. `prisma migrate deploy` recreates it from the real migration history,
 *    the same command backend/tests/globalSetup.ts uses for the "test"
 *    schema, and the same one CI/production deploys run.
 */
export default async function globalSetup(): Promise<void> {
  const baseUrl = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/app";
  const client = new Client({ connectionString: baseUrl });
  await client.connect();
  try {
    await client.query(`DROP SCHEMA IF EXISTS "${E2E_SCHEMA}" CASCADE`);
  } finally {
    await client.end();
  }

  execSync("npx prisma migrate deploy", {
    cwd: backendRoot,
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
    stdio: "inherit",
  });
}
