---
sidebar_position: 1
---

# CI (GitHub Actions)

## What it is

A single workflow (`.github/workflows/ci.yml`) with two parallel jobs — `backend` and
`frontend` — that both run on every push and pull request against `main`. There's no separate
deploy job; the current phase is "build and merge," not "deploy" (see
[Deployment & Analytics](/infrastructure/deployment-and-analytics)).

## Why one workflow, two jobs, no deploy step

Splitting backend/frontend into separate jobs lets them run in parallel and fail independently —
a frontend lint failure doesn't block seeing whether the backend's tests passed. Keeping deploy
out of CI entirely, for now, matches the project's actual phase: Render hosting is a deliberately
deferred decision, so there's nothing to deploy *to* yet. Adding a `deploy` job later is additive,
not a rework of this file.

## The backend job: a real Postgres, not a mock

```yaml title=".github/workflows/ci.yml"
backend:
  name: Backend (typecheck, lint, test)
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:17
      env:
        POSTGRES_DB: app
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
      ports:
        - 5432:5432
      options: >-
        --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/app
    BETTER_AUTH_SECRET: ci-only-secret-do-not-use-in-production-xx
    NODE_ENV: test
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 24
        cache: npm
        cache-dependency-path: backend/package-lock.json
    - run: npm ci
    - run: npx prisma generate
    - run: npx prisma migrate deploy
    - run: npm run typecheck
    - run: npm run lint
    - run: npm run build
    - run: npm run test
```

A real `postgres:17` service container — not an in-memory fake — runs the exact same
`prisma migrate deploy` a production deploy would run, so a broken or missing migration fails CI
before it ever reaches production. `BETTER_AUTH_SECRET` here is an explicit
dev-only placeholder, not a real secret; nothing in CI reads or exposes it beyond signing test
cookies for the duration of the run.

## The frontend job

```yaml
frontend:
  name: Frontend (typecheck, lint, build)
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 24
        cache: npm
        cache-dependency-path: frontend/package-lock.json
    - run: npm ci
    - run: npm run lint
    # `build` runs `tsc -b && vite build`; there is no separate typecheck
    # script for the frontend package, so this step covers both.
    - run: npm run build
```

Note this job does **not** run the Playwright E2E suite — that suite boots both apps against a
live database and is currently a local/manual step (`npm run test:e2e`), not wired into CI. Adding
it as a third job (with the same Postgres service pattern as `backend`) is a natural next step
once E2E run time/flakiness has been tuned for CI.

## Extending CI

Add steps to the relevant job for a new check (an additional lint rule, a new test file — nothing
extra to wire up, both jobs already run the project's full `test`/`lint`/`build` scripts). Add a
new job, mirroring the `services: postgres:` block, if a new job needs its own service dependency.
