import cors from "cors";
import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { toNodeHandler } from "better-auth/node";
import * as Sentry from "@sentry/node";

import { auth } from "./config/auth.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { apiRouter } from "./routes/index.js";
import { authRouter } from "./routes/auth.js";
import { paymentsWebhookRouter } from "./modules/payments/payments.routes.js";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
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

  // Manual verification route for the Sentry/Better Stack wiring (PERPRO-12).
  // Not mounted in production so it can't be used to trigger 500s remotely.
  if (env.NODE_ENV !== "production") {
    app.get("/debug-sentry", (_req, _res) => {
      throw new Error("Test error for Sentry/Better Stack integration");
    });
  }

  // Our own thin-controller auth routes (register/login/logout/forgot-password/
  // reset-password/me). These call auth.api.* directly with an already-parsed
  // body object, so scoping express.json() to just this path is safe.
  app.use("/api/auth", express.json(), authRouter);

  // Better Auth's own handler, for everything our thin routes above don't
  // claim: OAuth authorize/callback redirects, and Better Auth's native
  // sign-in/social endpoint (what its client SDK posts to in order to kick
  // off OAuth). This must see the raw, unparsed request — do NOT put
  // express.json() in front of it (see Better Auth's Express integration
  // docs). Mounted after our routes above so those win for the paths they
  // claim; this is the fallback for the rest of /api/auth/*.
  app.all("/api/auth/*splat", toNodeHandler(auth));

  // Polar webhook receiver (PERPRO-10) - must be mounted with express.raw()
  // ahead of the global express.json() below, exactly like the Better Auth
  // handler above: this route needs the untouched raw body bytes to verify
  // Polar's HMAC signature. See payments.controller.ts's webhook handler.
  app.use(
    "/api/payments",
    express.raw({ type: "application/json" }),
    paymentsWebhookRouter,
  );

  app.use(express.json());

  app.use("/api", apiRouter);

  app.use(notFound);

  // Must come after all routes/middleware that can throw, but before our
  // own errorHandler, so Sentry captures the error and then hands off to
  // errorHandler to actually shape the JSON response.
  Sentry.setupExpressErrorHandler(app);

  app.use(errorHandler);

  return app;
}
