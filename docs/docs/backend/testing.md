---
sidebar_position: 9
---

# Testing (Vitest + Supertest + Playwright)

## What it is

Three layers: **Vitest + Supertest** for backend integration tests (`backend/tests/`), and
**Playwright** for end-to-end tests that drive both apps together through a real browser
(`frontend/e2e/`).

## Why this split over the alternatives

Supertest against the real `createApp()` — not mocked route handlers — because the thing worth
testing on the backend is the *behavior* of the API (status codes, auth enforcement, response
shape), which unit-testing individual functions in isolation doesn't catch. Playwright for E2E
over Cypress because Playwright's multi-browser support and built-in test runner are the current
default choice for new projects, and its trace viewer makes flaky-test debugging tractable.

## Backend: Vitest + Supertest

```ts title="backend/tests/items.test.ts"
vi.mock("../src/services/email.js", () => ({
  sendEmail: vi.fn().mockResolvedValue({ sent: false, reason: "mocked in tests" }),
}));

const { createApp } = await import("../src/app.js");
const { resetDb } = await import("./resetDb.js");
const app = createApp();

beforeEach(async () => {
  await resetDb();
});

describe("items module", () => {
  it("returns 404 (not 403) when a different user tries to read, update, or delete an item they don't own", async () => {
    const a = await registerAgent("owner-b");
    const b = await registerAgent("intruder-b");

    const create = await a.post("/api/items").send({ title: "A's item" });
    const itemId = create.body.item.id as string;

    const getAsB = await b.get(`/api/items/${itemId}`);
    expect(getAsB.status).toBe(404);
    // ... A's item must be unaffected by B's attempts, B's own list stays empty.
  });
});
```

Three things this suite establishes as conventions for every new module's tests:

- **`createApp()` is imported directly, no server is bound to a port.** Supertest drives the
  Express app in-process.
- **External services are mocked at the module boundary** (`vi.mock("../src/services/email.js")`),
  not by injecting fake credentials — the test suite never depends on/exercises a real Resend
  call.
- **`resetDb()` runs before every test**, truncating tables so tests are isolated from each other
  and from whatever's in your local dev database. It runs against the same `DATABASE_URL` docker-
  compose brings up, layering a `test` schema on top (see `backend/tests/testEnv.ts`) rather than
  needing an entirely separate Postgres instance.
- **Authorization bugs get their own explicit test.** The `404-not-403` case above exists because
  leaking "this resource exists, you're just not allowed to see it" via a 403 is itself an
  information disclosure — worth testing for by name, not just implicitly covered by a
  happy-path test.

## CI

Every push/PR runs the full backend suite (typecheck, lint, `prisma migrate deploy`, then
`npm run test`) against a real Postgres 17 service container — see [CI](/infrastructure/ci) for
the workflow.

## Frontend: Playwright E2E

`frontend/e2e/` boots both the backend and frontend dev servers against a throwaway test
database and drives real browser interactions: register → login → create/edit/delete an item →
file upload → (credential-gated, conditionally skipped) payments checkout → background-job
side effects. Run it locally with:

```bash
cd frontend && npm run test:e2e
```

Credential-gated specs (payments) check for the relevant env var at the top of the spec and call
`test.skip()` if it's absent, rather than failing — the suite stays green in an environment with
no real Polar sandbox credentials configured, while still running for real once they're added.

## Adding tests for a new module

Mirror `items.test.ts`: mock any external service the module calls, `resetDb()` in
`beforeEach`, then assert on status codes and response bodies through Supertest against the real
`createApp()` — not against hand-called service functions.
