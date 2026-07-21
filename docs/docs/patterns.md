---
sidebar_position: 5
---

# Patterns

Three structural rules run through the whole backend. Every other page in this sidebar assumes
you've read this one — the Items module (`backend/src/modules/items/`) is the reference
implementation all three are demonstrated in together, and the template that a new feature module
should be copied from.

## 1. Module-per-feature

Each backend feature lives in its own folder under `backend/src/modules/`, with a consistent set
of files:

```
backend/src/modules/items/
├── items.controller.ts   # HTTP request/response shaping
├── items.repository.ts   # the only file that talks to Prisma
├── items.routes.ts       # Express Router, mounted once in routes/index.ts
├── items.schema.ts       # Zod schemas for request validation
└── items.service.ts      # business logic, ownership checks
```

`items.service.ts`, `items.controller.ts`, and `items.routes.ts` are visible throughout this
documentation because the same five-file shape is what `backend/src/modules/payments/` follows
too. New features copy this folder, not a single file — it keeps request validation, business
logic, and data access from blurring into one file as a module grows.

## 2. Service wrapper (one per external SaaS)

Every third-party integration is a single file other code imports from — never the vendor SDK
directly, anywhere else in the codebase:

| Provider | Wrapper |
|---|---|
| Resend | `backend/src/services/email.tsx` |
| Cloudflare R2 | `backend/src/services/storage.ts` |
| Polar | `backend/src/services/payments.ts` |

```tsx
/**
 * This is the ONLY file in the app allowed to import the Resend SDK.
 * Everything else should call sendEmail().
 */
```

That comment, from `services/email.tsx`, states the rule directly. The concrete benefit shows up
twice, identically, in `storage.ts` and `payments.ts`: the vendor client is constructed **lazily**
inside each exported function rather than once at module load, so importing the file never
crashes when that provider's credentials aren't configured — only actually *calling* an
unconfigured wrapper throws a clear `AppError`, not a cryptic SDK connection failure. See
[File Storage](/backend/file-storage) and [Payments](/backend/payments) for the full pattern in
context.

## 3. Repository pattern

Feature modules never call `prisma.item.findMany(...)` directly from their service layer — they
go through a per-module repository that owns that translation:

```ts title="backend/src/modules/items/items.repository.ts"
/**
 * Repository pattern: the service below only ever talks to this interface,
 * never to Prisma directly. Swapping the datastore later means rewriting
 * this one file, not the service, controller, or routes.
 */
export interface ItemsRepository {
  findManyByUser(userId: string): Promise<Item[]>
  findById(id: string): Promise<Item | null>
  create(userId: string, data: CreateItemInput): Promise<Item>
  update(id: string, data: UpdateItemInput): Promise<Item>
  delete(id: string): Promise<void>
  attachFile(id: string, fileKey: string): Promise<Item>
}

export const itemsRepository: ItemsRepository = {
  findManyByUser(userId) {
    return prisma.item.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
  },
  findById(id) {
    return prisma.item.findUnique({ where: { id } })
  },
  // ...
}
```

`items.service.ts` imports `itemsRepository`, not `prisma`. Two things this buys, concretely, in
this codebase: `items.service.ts`'s `getOwnedOrThrow` (the shared ownership check every mutating
operation runs through) reads as plain business logic with no Prisma-specific syntax mixed in,
and a future swap to a different datastore for one module is a rewrite of one small file with an
explicit interface, not a search-and-replace across the service/controller/routes.

**One documented exception**: Better Auth manages its own `User`/`Session`/`Account`/
`Verification` rows through its own Prisma adapter (see [Better Auth](/backend/better-auth)) —
there's no hand-written `usersRepository`. Better Auth's adapter *is* that module's repository;
duplicating it would mean maintaining two paths to the same tables.

## Repo reuse strategy

This is a single GitHub repository serving as a **template**, not a monorepo with shared
published packages. To start a new project: use GitHub's "Use this template" (or clone + reset
git history), then delete what you don't need and build on what you do — there's no
`@you/backbone-core` package to version and publish. If a specific piece (the service-wrapper
pattern, the SEO components, the CI workflow) proves useful across enough independent projects
over time, extracting it into a real shared package is a reasonable evolution, but that's future
work, not a starting assumption.
