import { prisma } from "../src/config/db.js";

/**
 * Truncates every table the test suite writes to, cascading from User so
 * Session/Account/Item all clear with it (their FKs reference User).
 * Verification isn't user-linked, so it's truncated alongside explicitly.
 * Called before each test so tests are independent and reruns are
 * idempotent - no leftover rows from a previous run/file can cause a
 * unique-constraint (e.g. duplicate email) failure.
 */
export async function resetDb(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "User", "Verification" RESTART IDENTITY CASCADE',
  );
}
