---
slug: /
sidebar_position: 1
---

# Getting Started

**saas-starter-template** is a reusable, batteries-included starter for indie hackers: an
Express + Prisma backend and a React + Vite frontend, with auth, payments, background jobs,
file storage, email, and observability already wired together, so a new idea can ship in days
instead of weeks.

This page gets a fresh clone running locally. Everything else in the sidebar is a per-technology
page explaining what's here, why it was chosen over the obvious alternative, and how to actually
use it in this codebase — with real code pulled from the repo, not hypothetical snippets.

## Prerequisites

- Node.js 24.x and npm 11.x
- Docker (for PostgreSQL via `docker-compose`)

## Clone and install

```bash
git clone https://github.com/omarsafwany/saas-starter-template.git
cd saas-starter-template
```

The backend and frontend are two independent npm projects (no workspace/monorepo tooling) —
install and run each separately.

```bash
cd backend && npm install
cd ../frontend && npm install
```

## Start Postgres

```bash
docker-compose up -d
```

This brings up a local PostgreSQL 17 instance on `localhost:5432` (see `docker-compose.yml` at
the repo root). Every backend service — Prisma, Better Auth's session store, and pg-boss's job
queues — lives in this one database; there's no separate infra to stand up for background jobs.

## Configure environment variables

```bash
cd backend && cp .env.example .env
```

Open `backend/.env` and fill in what you have. Only `DATABASE_URL` matters to get the app
running end-to-end locally — it already points at the Docker Postgres instance above. Everything
else (Resend, R2, Polar, Better Stack, OAuth) is **optional and lazy**: each integration's page
in this sidebar explains exactly what breaks (nothing critical) if you leave its variables unset.

## Run database migrations

```bash
cd backend
npx prisma migrate deploy
```

## Start both apps

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

The backend listens on `http://localhost:4000`, the frontend on `http://localhost:5173`
(Vite's default). Visit the frontend, register an account, and you should land on `/dashboard`
with a working create/edit/delete items UI — the reference module this whole template is built
around (see [Patterns](/patterns)).

## Run the test suites

```bash
# backend: Vitest + Supertest, needs the Postgres container running
cd backend && npm run test

# frontend: Playwright E2E, boots both apps against a throwaway test DB
cd frontend && npm run test:e2e
```

See [Testing](/backend/testing) for how the backend suite isolates itself from your dev data.

## Where to go next

- Skim the [Patterns](/patterns) page first — it explains the three structural rules
  (module-per-feature, service wrappers, the repository pattern) that every other page assumes
  you already know.
- Then work through **Backend** and **Frontend** in the sidebar, one technology at a time, or
  jump straight to whichever integration you're about to touch.
