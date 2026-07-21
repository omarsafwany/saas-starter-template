---
sidebar_position: 2
---

# Deployment & Analytics

## Status: decisions recorded, deliberately not built yet

Unlike every other page in this section, Render (hosting) and PostHog (product analytics) are
stack **decisions**, not shipped integrations. The project's current phase is explicitly "build
and merge, do not deploy" — this page documents the reasoning behind each choice and what
adopting it will actually involve, without pretending either is wired into the app today.

## Deployment: Render

**Decision**: Render is the target host for both the Express backend and the built frontend
static assets, once the project is ready to deploy.

**Why Render over the alternatives**: Render (over Fly.io, Railway, or hand-rolled Docker on a
VPS) for the combination of a managed Postgres offering, straightforward `render.yaml`-based
infra-as-code, and a free tier that fits an indie project's first stage. It's a smaller
operational surface than Fly.io's more infrastructure-oriented model, at the cost of some
flexibility a project won't need until it has real scale problems.

**What's actually needed when this gets picked up**: a `render.yaml` (or two services configured
in Render's dashboard — one for `backend/`, one static site for `frontend/`'s build output), the
production environment variables from `backend/.env.example` set as real secrets, and a decision
on whether the frontend's `VITE_SITE_URL`/`FRONTEND_URL` values point at Render's own subdomain or
a custom domain. `docker-compose.yml` at the repo root is a local-dev convenience only — it isn't
what Render would deploy from.

## Analytics: PostHog

**Decision**: `posthog-js` for product analytics (page views, custom events, funnels), once
there's traffic worth measuring.

**Why PostHog over the alternatives**: PostHog over Google Analytics/Mixpanel/Amplitude for being
self-hostable if a project later wants to own its analytics data, while still offering a hosted
free tier for getting started — and because it bundles product analytics, session replay, and
feature flags in one SDK rather than three separate integrations.

**What's actually needed when this gets picked up**: `npm install posthog-js` in `frontend/`, a
`VITE_POSTHOG_KEY`/`VITE_POSTHOG_HOST` pair added to the frontend's env handling (following the
same "optional, lazy, never blocks the app" pattern used for every backend integration — see
[File Storage](/backend/file-storage) for the reference shape of that pattern), and a decision on
where `posthog.init()` is called from (likely `main.tsx`, gated on the key being present).

## Why these are grouped together on one page

Both are real, considered decisions with documented rationale — but neither has running code in
the repo yet, unlike every technology in the Backend and Frontend sections. Splitting them into
two separate "empty" pages would overstate how much is actually here; this page is honest about
that while still giving a project ready to pick either up a concrete starting point.
