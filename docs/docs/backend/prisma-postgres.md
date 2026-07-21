---
sidebar_position: 2
---

# Prisma + PostgreSQL

## What it is

PostgreSQL 17 is the only datastore in the stack — Prisma 7 (with `@prisma/adapter-pg`) is the
ORM/query builder and migration tool on top of it. There's no Redis, no separate session store,
no separate queue database: Better Auth's sessions, pg-boss's job queues, and application data
all live in the same `DATABASE_URL`.

## Why Postgres + Prisma over the alternatives

A single relational database keeps a starter template's infra story to "one `DATABASE_URL`."
Postgres specifically (over MySQL/SQLite) because Better Auth, pg-boss, and Prisma's own tooling
all treat it as the first-class target. Prisma over a raw query builder like Kysely or Drizzle
because its migration workflow (`prisma migrate dev` / `deploy`) and generated client types are
the fastest path from "add a field to schema.prisma" to "typed, autocompleted client" — a real
win for a template meant to be extended quickly by a new project.

## The schema

`backend/prisma/schema.prisma` has five models. `User`, `Session`, `Account`, and `Verification`
are shaped to match exactly what Better Auth's Prisma adapter expects (see
[Better Auth](/backend/better-auth)) — that alignment is intentional, so wiring up auth never
requires a schema rewrite later. `Item` is the reference domain model every new feature module
copies the shape of, and `Subscription` is Polar's webhook-driven billing state.

```prisma
// Reference domain model — copy this shape when adding a new table.
model Item {
  id        String   @id @default(cuid())
  title     String
  body      String?

  // R2 object key for an attached file. Null until a client completes the
  // presigned-upload flow and confirms via POST /:id/file.
  fileKey   String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// One row per Polar subscription, created/updated from webhook events
// (subscription.active/canceled/etc). The checkout route does not write
// here directly; Polar's webhook is the source of truth.
model Subscription {
  id                   String    @id @default(cuid())
  polarSubscriptionId  String    @unique
  polarCustomerId      String
  polarProductId       String
  status               String
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean   @default(false)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  userId               String
  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

Note the generator block at the top of the schema:

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "esm"
}
```

Prisma 7 generates a plain ESM client into `backend/src/generated/prisma` rather than living
inside `node_modules` — this is Prisma's current recommended setup and avoids version-mismatch
surprises between the generated client and the `@prisma/client` package.

## Talking to the database

`backend/src/config/db.ts` exports a single shared `prisma` client (constructed once, with the
`@prisma/adapter-pg` driver adapter). Feature modules never import Prisma directly — they go
through a per-module repository. See `backend/src/modules/items/items.repository.ts` for the
concrete example, and [Patterns](/patterns) for why that indirection exists.

## Adding a field or model

1. Edit `backend/prisma/schema.prisma`.
2. `npx prisma migrate dev --name <description>` locally — this generates a migration file under
   `backend/prisma/migrations/` and regenerates the client.
3. Commit the generated migration folder. CI runs `npx prisma migrate deploy` against a fresh
   Postgres container (see [CI](/infrastructure/ci)) as part of every pull request, so a missing
   or broken migration fails the build before it fails production.
