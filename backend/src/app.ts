import cors from "cors";
import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { apiRouter } from "./routes/index.js";
import { authRouter } from "./routes/auth.js";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

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

  app.use(express.json());

  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
