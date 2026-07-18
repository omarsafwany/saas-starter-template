/**
 * Test-only environment resolution.
 *
 * Locally this targets the same docker-compose Postgres every other npm
 * script uses (see DATABASE_URL in .env.example), but isolates the test
 * suite into its own Postgres *schema* ("test") so it never touches
 * dev/manual-testing data living in the default "public" schema.
 *
 * In CI (PERPRO-18), whatever DATABASE_URL the Actions Postgres service
 * container is configured with is honored as the base and still gets the
 * same "test" schema appended - this file makes no assumption about the
 * exact CI connection string.
 */
function withTestSchema(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.searchParams.set("schema", "test");
  return url.toString();
}

const baseDatabaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/app";

export const TEST_DATABASE_URL = withTestSchema(baseDatabaseUrl);
