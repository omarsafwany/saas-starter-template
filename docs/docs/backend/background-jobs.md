---
sidebar_position: 5
---

# Background Jobs (pg-boss)

## What it is

[pg-boss](https://github.com/timgit/pg-boss) is a job queue that stores its queue tables in the
same PostgreSQL database as everything else (in a dedicated `pgboss` schema). It backs one
real queue today (`send-welcome-email`) and one scheduled cron job (`nightly-cleanup`), both
defined in `backend/src/config/jobs.ts`.

## Why pg-boss over the alternatives

BullMQ and most other Node job queues need Redis. For a template whose whole infra story is
"one Postgres database," adding Redis just for a queue is a second piece of infrastructure to
provision, monitor, and pay for — for what a new project's early job volume almost never needs.
pg-boss gets real job semantics (at-least-once delivery, retries, cron scheduling, a dashboard-
free but query-able job table) on top of the database that's already there.

## How it's wired

```ts title="backend/src/config/jobs.ts"
// Constructing PgBoss only builds the client config; it does not connect to
// Postgres until start() is called. That happens once, from startJobs()
// (invoked by index.ts), so importing this module — e.g. transitively via
// config/auth.ts — is always safe, including under Vitest, which never
// calls startJobs().
export const boss = new PgBoss(env.DATABASE_URL);

export async function enqueueWelcomeEmail(data: SendWelcomeEmailData): Promise<void> {
  try {
    await boss.send(SEND_WELCOME_EMAIL_QUEUE, data);
  } catch (err) {
    logger.error({ err }, "[jobs] failed to enqueue send-welcome-email job");
  }
}

export async function handleSendWelcomeEmail(jobs: Job<SendWelcomeEmailData>[]): Promise<void> {
  for (const job of jobs) {
    const { email, name } = job.data;
    await sendEmail({ to: email, template: "welcome", data: { name, loginUrl: env.FRONTEND_URL } });
  }
}

export async function startJobs(): Promise<void> {
  if (started) return;
  started = true;

  await boss.start();
  await boss.createQueue(SEND_WELCOME_EMAIL_QUEUE);
  await boss.work<SendWelcomeEmailData, void>(SEND_WELCOME_EMAIL_QUEUE, handleSendWelcomeEmail);

  await boss.createQueue(NIGHTLY_CLEANUP_QUEUE);
  await boss.work(NIGHTLY_CLEANUP_QUEUE, handleNightlyCleanup);
  // Standard 5-field cron: minute hour day month weekday.
  await boss.schedule(NIGHTLY_CLEANUP_QUEUE, "0 3 * * *", null, { tz: "UTC" });
}
```

Two design details worth keeping when you add a new job:

- **`enqueueWelcomeEmail` never throws.** It's called from a Better Auth database hook
  (`config/auth.ts`'s `databaseHooks.user.create.after`) — a failure to *enqueue* the welcome
  email must never break signup, so the function swallows and logs its own errors instead of
  propagating them.
- **`startJobs()` is only called from `index.ts`**, never from `app.ts`. `app.ts`'s
  `createApp()` is what the Vitest/Supertest suite imports directly (see
  [Testing](/backend/testing)) — keeping `startJobs()` out of it means the test suite never
  starts pg-boss or touches its Postgres schema.

## Adding a new job

1. Add a queue name constant and a typed job-data interface in `jobs.ts`.
2. Write the `handle*` worker function.
3. Register it in `startJobs()` with `boss.createQueue()` + `boss.work()` (and `boss.schedule()`
   if it's a cron job, not an on-demand one).
4. Call `boss.send(QUEUE_NAME, data)` (or write a thin `enqueue*` wrapper like
   `enqueueWelcomeEmail`, matching the "never throws" pattern if it's called from a place that
   can't afford to fail).
