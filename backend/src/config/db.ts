import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

// Prisma client singleton.
//
// tsx watch re-executes this module on every file change during `npm run
// dev`. Without caching the client (and its adapter's connection pool) on
// `globalThis`, each reload would create a brand new pool without tearing
// down the previous one, quickly exhausting Postgres connections. Stashing
// the instance on globalThis in development survives module reloads.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
