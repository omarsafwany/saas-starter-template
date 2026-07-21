/**
 * E2E-only environment resolution (PERPRO-22).
 *
 * Mirrors backend/tests/testEnv.ts's approach: isolate E2E data into its own
 * Postgres *schema* ("e2e") on the same docker-compose Postgres instance
 * every other npm script uses, rather than a separate database. This keeps
 * dev ("public" schema) and Vitest ("test" schema, see backend/tests/testEnv.ts)
 * data completely untouched by a full-stack E2E run.
 *
 * pg-boss (PERPRO-11) is a partial exception: it always manages its own
 * fixed "pgboss" schema regardless of this "schema" query param (that query
 * param is a Prisma-only convention, not a general Postgres/pg one) - so job
 * queue state lives outside this isolation. That's fine here: E2E is the
 * only process that ever calls startJobs() against this Postgres instance
 * outside of a developer's own "npm run dev".
 */
function withSchema(rawUrl: string, schema: string): string {
  const url = new URL(rawUrl);
  url.searchParams.set("schema", schema);
  return url.toString();
}

const baseDatabaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/app";

export const E2E_SCHEMA = "e2e";
export const E2E_DATABASE_URL = withSchema(baseDatabaseUrl, E2E_SCHEMA);

export const BACKEND_PORT = 4000;
export const FRONTEND_PORT = 5173;
export const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
export const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;
