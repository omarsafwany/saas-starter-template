import pino from "pino";

import { env } from "./env.js";

/**
 * Structured JSON logger (Pino). Every line is a JSON object suitable for
 * a log shipper (e.g. Better Stack) to ingest directly - no pretty-printing
 * by default, so `logger.info(...)` output is always machine-parseable.
 *
 * Level is driven by NODE_ENV:
 * - production: "info"  (avoid noisy debug logs in prod)
 * - test: "silent"      (keep test output clean)
 * - development: "debug"
 */
function defaultLevel(): string {
  if (env.NODE_ENV === "production") return "info";
  if (env.NODE_ENV === "test") return "silent";
  return "debug";
}

export const logger = pino({
  level: defaultLevel(),
  base: { service: "backend" },
});
