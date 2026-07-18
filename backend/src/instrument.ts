/**
 * Sentry instrumentation. Must be imported before any other module so
 * auto-instrumentation can patch things (http, etc.) as early as possible.
 *
 * `env.BETTER_STACK_DSN` holds a Sentry-SDK-compatible DSN. Better Stack's
 * error tracking product accepts requests from the stock @sentry/node SDK -
 * swap the DSN and everything else (capture, setupExpressErrorHandler,
 * stack traces) works unmodified. This keeps us free to point at real
 * Sentry, GlitchTip, or self-hosted Sentry later with a one-line env change.
 *
 * If no DSN is configured (e.g. this dev environment), Sentry.init() runs
 * in a disabled no-op mode: capture calls are silently dropped instead of
 * throwing, so the rest of the app behaves identically either way.
 */
import * as Sentry from "@sentry/node";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

Sentry.init({
  dsn: env.BETTER_STACK_DSN,
  environment: env.NODE_ENV,
  tracesSampleRate: env.NODE_ENV === "production" ? 0.2 : 1.0,
});

if (env.BETTER_STACK_DSN) {
  logger.info("Sentry/Better Stack error reporting enabled");
} else {
  logger.warn("BETTER_STACK_DSN not set; Sentry is initialized in no-op mode (errors are not reported)");
}

export { Sentry };
