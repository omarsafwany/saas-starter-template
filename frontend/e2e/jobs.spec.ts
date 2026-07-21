import { expect, test } from "@playwright/test";
import { connectDb, registerViaUI } from "./helpers.js";

/**
 * Background job side-effect (PERPRO-22): registering a user queues a
 * "send-welcome-email" pg-boss job (see config/auth.ts's databaseHooks and
 * config/jobs.ts). pg-boss only starts from index.ts's full server bootstrap
 * (never from createApp(), which is all Vitest boots) - so this is the only
 * layer of testing in the repo that can see a real pg-boss worker actually
 * pick up and finish a job, as opposed to merely being enqueued.
 *
 * There's no real Resend key in this environment (see backend/.env), so
 * sendEmail() itself no-ops/logs rather than calling a real API - this test
 * doesn't (and can't) assert an email was delivered. It asserts the job
 * pg-boss queued genuinely reached a terminal "completed" state, which is
 * the real, available signal that the worker ran without throwing.
 */
test("welcome-email job queued on signup actually runs to completion", async ({ page }) => {
  const user = await registerViaUI(page, "jobs-welcome-email");

  const db = connectDb();
  await db.connect();
  try {
    const deadline = Date.now() + 15_000;
    let state: string | undefined;

    while (Date.now() < deadline) {
      // pg-boss 12.x keeps completed jobs in the "job" table itself (no
      // separate "archive" relation until its maintenance job eventually
      // sweeps old rows out, well outside this test's window).
      const result = await db.query<{ state: string }>(
        `select state from pgboss.job
          where name = 'send-welcome-email' and data->>'email' = $1
         limit 1`,
        [user.email],
      );
      state = result.rows[0]?.state;
      if (state === "completed") break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    expect(state, "expected the send-welcome-email pg-boss job to reach 'completed'").toBe("completed");
  } finally {
    await db.end();
  }
});
