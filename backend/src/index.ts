import "dotenv/config";
import "./instrument.js";

import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { startJobs } from "./config/jobs.js";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "Backend listening");
});

// PERPRO-11: pg-boss worker started alongside the HTTP server. Deliberately
// not started from app.ts, so the Vitest/Supertest suite (which only boots
// createApp()) never touches pg-boss or its Postgres schema.
startJobs().catch((err) => {
  logger.error({ err }, "[jobs] failed to start background jobs");
});
