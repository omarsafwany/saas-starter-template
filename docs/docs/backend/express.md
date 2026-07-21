---
sidebar_position: 1
---

# Express

## What it is

The backend is a plain Express 5 API server (`backend/src/app.ts`), not a framework like NestJS
or a full-stack meta-framework. It talks JSON over `/api/*` to the React SPA in `frontend/` and
nothing else — no server-rendered views.

## Why Express over the alternatives

Express was chosen over NestJS/Fastify/Hono for a reusable *starter* template specifically
because it has the smallest conceptual surface area. NestJS's DI containers and decorators, or
Fastify's plugin encapsulation model, are powerful but add a framework-specific vocabulary a new
idea has to learn before touching business logic. Express plus a few well-understood middleware
packages (`helmet`, `cors`, `express-rate-limit`, `pino-http`) gets the same production
essentials with nothing to unlearn later.

## How it's wired here

`createApp()` in `backend/src/app.ts` builds and returns the Express app without calling
`.listen()` — that split is what lets the Vitest/Supertest suite import the app directly and
never bind a real port (see [Testing](/backend/testing)).

```ts
export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(pinoHttp({ logger }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Our own thin-controller auth routes. These call auth.api.* directly with
  // an already-parsed body, so scoping express.json() to just this path is safe.
  app.use("/api/auth", express.json(), authRouter);

  // Better Auth's own handler for everything our thin routes don't claim
  // (OAuth redirects, its native sign-in endpoint). Must see the raw,
  // unparsed request — no express.json() in front of it.
  app.all("/api/auth/*splat", toNodeHandler(auth));

  // Polar webhook receiver — needs the untouched raw body to verify Polar's
  // HMAC signature, so it's mounted with express.raw() ahead of the global
  // express.json() below, the same trick as the Better Auth handler above.
  app.use(
    "/api/payments",
    express.raw({ type: "application/json" }),
    paymentsWebhookRouter,
  );

  app.use(express.json());
  app.use("/api", apiRouter);
  app.use(notFound);

  // Must come after everything that can throw, before our own errorHandler,
  // so Sentry captures the error and then hands off to shape the response.
  Sentry.setupExpressErrorHandler(app);
  app.use(errorHandler);

  return app;
}
```

Three things worth calling out from that file (`backend/src/app.ts`):

- **Raw-body routes are mounted before the global `express.json()`.** Both Better Auth's OAuth
  handler and the Polar webhook receiver need the untouched request body — Better Auth to run
  its own body parsing, Polar to verify an HMAC signature against the exact bytes it signed.
  Mounting order matters: once `express.json()` runs, the original body is gone.
- **`/health` and `/debug-sentry`** exist for infra checks and manually verifying the
  Sentry/Better Stack wiring; `/debug-sentry` is excluded outside `NODE_ENV !== "production"`
  so it can't be used to trigger 500s remotely.
- **Error handling order**: `notFound` → `Sentry.setupExpressErrorHandler` →
  `errorHandler`. Sentry needs to see the error before the app's own handler reshapes it into a
  JSON response.

## Adding a new route

New feature routes don't get added to `app.ts` directly — they're mounted once, generically,
via `apiRouter` in `backend/src/routes/index.ts`, and each feature module owns its own
`*.routes.ts` file. See [Patterns](/patterns) for the full module-per-feature convention, and
the [Items module](/patterns) reference implementation it's modeled on.
