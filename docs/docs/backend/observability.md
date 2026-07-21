---
sidebar_position: 6
---

# Observability (Pino + Sentry/Better Stack)

## What it is

Two layers: structured JSON logging via [Pino](https://getpino.io), and error tracking via the
`@sentry/node` SDK pointed at [Better Stack](https://betterstack.com)'s error tracking product
instead of Sentry's own hosted service.

## Why Pino + Better Stack over the alternatives

Pino over `console.log` or Winston because every log line is a structured JSON object from the
start — a log shipper (Better Stack, Datadog, anything) can ingest and query it without a
parsing layer, and `pino-http` gets per-request logging (method, path, status, duration) for
free. Better Stack over Sentry's own hosted product mainly on cost/consolidation grounds for an
indie project: it accepts the stock `@sentry/node` SDK unmodified (its ingest endpoint is
Sentry-DSN-compatible), so the integration code is identical to "real" Sentry — swapping the DSN
is a one-line env change if a project outgrows it or prefers self-hosted Sentry/GlitchTip later.

## Logger

```ts title="backend/src/config/logger.ts"
function defaultLevel(): string {
  if (env.NODE_ENV === "production") return "info";
  if (env.NODE_ENV === "test") return "silent";
  return "debug";
}

export const logger = pino({
  level: defaultLevel(),
  base: { service: "backend" },
});
```

Every module imports `logger` from here rather than constructing its own Pino instance — that's
what keeps `level` and `base` fields (like `service: "backend"`) consistent across every log line
app-wide. `pino-http` (wired in `app.ts`) uses this same instance for per-request logs.

## Error tracking

```ts title="backend/src/instrument.ts"
/**
 * Must be imported before any other module so auto-instrumentation can
 * patch things (http, etc.) as early as possible.
 *
 * env.BETTER_STACK_DSN holds a Sentry-SDK-compatible DSN. Better Stack's
 * error tracking product accepts requests from the stock @sentry/node SDK -
 * swap the DSN and everything else works unmodified.
 *
 * If no DSN is configured, Sentry.init() runs in a disabled no-op mode:
 * capture calls are silently dropped instead of throwing.
 */
Sentry.init({
  dsn: env.BETTER_STACK_DSN,
  environment: env.NODE_ENV,
  tracesSampleRate: env.NODE_ENV === "production" ? 0.2 : 1.0,
});
```

`instrument.ts` is imported first, before `app.ts`, in `backend/src/index.ts` — Sentry's Node SDK
relies on being loaded before the modules it instruments (like `http`) are required. In `app.ts`,
`Sentry.setupExpressErrorHandler(app)` is wired in after every route/middleware that can throw
but before the app's own `errorHandler`, so Sentry sees the original error before it gets
reshaped into a JSON response.

## Verifying it's working

With `NODE_ENV !== "production"`, `GET /debug-sentry` throws a test error on purpose — hit it
locally with `BETTER_STACK_DSN` set to confirm an event shows up in your Better Stack (or Sentry)
dashboard. It's excluded entirely in production so it can't be used to trigger 500s remotely.

## Without a DSN configured

The app boots and runs identically — `logger.warn` fires once at startup noting Sentry is in
no-op mode, and every `Sentry.captureException`-equivalent call silently does nothing. Nothing
in request handling depends on Better Stack being configured.
