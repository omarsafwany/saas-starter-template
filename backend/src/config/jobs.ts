import { PgBoss } from "pg-boss";
import type { Job } from "pg-boss";
import { env } from "./env.js";
import { logger } from "./logger.js";
import { sendEmail } from "../services/email.js";

// PERPRO-11: background jobs & cron, on top of pg-boss. pg-boss stores its
// queue tables in the same Postgres database (schema "pgboss") - no new
// infra beyond the DATABASE_URL every other module already uses.

export const SEND_WELCOME_EMAIL_QUEUE = "send-welcome-email";
export const NIGHTLY_CLEANUP_QUEUE = "nightly-cleanup";

// Constructing PgBoss only builds the client config; it does not connect to
// Postgres until start() is called. That happens once, from startJobs()
// below (invoked by index.ts), so importing this module - e.g. transitively
// via config/auth.ts - is always safe, including under Vitest, which never
// calls startJobs().
export const boss = new PgBoss(env.DATABASE_URL);

boss.on("error", (err) => {
  logger.error({ err }, "[jobs] pg-boss error");
});

export interface SendWelcomeEmailData {
  email: string;
  name?: string;
}

/**
 * Queues the welcome email instead of sending it synchronously during
 * registration. Mirrors the "best-effort, never break signup" behavior it
 * replaced in config/auth.ts: a failure to enqueue is logged, not thrown.
 */
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
    logger.info({ email }, "[jobs] processing send-welcome-email job");
    await sendEmail({
      to: email,
      template: "welcome",
      data: { name, loginUrl: env.FRONTEND_URL },
    });
  }
}

/**
 * Template scheduled job: replace this body with real cleanup work (e.g.
 * purging expired sessions or soft-deleted rows) once there's something to
 * clean up. For now it just proves the schedule fires and is processed.
 */
export async function handleNightlyCleanup(): Promise<void> {
  logger.info("[jobs] nightly-cleanup ran (no-op placeholder)");
}

let started = false;

/**
 * Starts pg-boss, registers the queues/workers, and schedules the
 * nightly-cleanup cron job. Called once from index.ts alongside the Express
 * server - never from app.ts, so the Vitest/Supertest suite (which only
 * boots createApp()) never starts pg-boss or touches its Postgres schema.
 */
export async function startJobs(): Promise<void> {
  if (started) return;
  started = true;

  await boss.start();

  await boss.createQueue(SEND_WELCOME_EMAIL_QUEUE);
  await boss.work<SendWelcomeEmailData, void>(SEND_WELCOME_EMAIL_QUEUE, handleSendWelcomeEmail);

  await boss.createQueue(NIGHTLY_CLEANUP_QUEUE);
  await boss.work(NIGHTLY_CLEANUP_QUEUE, handleNightlyCleanup);
  // Cron syntax verified against pg-boss's schedule() docs (standard 5-field:
  // minute hour day month weekday). "0 3 * * *" = every day at 03:00 UTC.
  await boss.schedule(NIGHTLY_CLEANUP_QUEUE, "0 3 * * *", null, { tz: "UTC" });

  logger.info(
    "[jobs] pg-boss started; send-welcome-email and nightly-cleanup workers registered",
  );
}

export async function stopJobs(): Promise<void> {
  if (!started) return;
  await boss.stop();
  started = false;
}
