import { Router, type Response } from "express";
import { APIError } from "better-auth/api";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../config/auth.js";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

/** Applies any Set-Cookie (etc.) headers Better Auth wants set on the response. */
function applyHeaders(res: Response, headers: Headers) {
  headers.forEach((value, key) => res.appendHeader(key, value));
}

function sendAuthError(res: Response, err: unknown) {
  if (err instanceof APIError) {
    res.status(err.statusCode).json({ error: err.body?.message ?? err.message });
    return;
  }
  throw err;
}

// Thin controllers over Better Auth's server API — kept as our own stable
// route names/shapes (rather than exposing Better Auth's own path scheme
// directly) so the frontend contract doesn't shift if the underlying auth
// library ever changes. Note: OAuth sign-in/callback still goes through
// Better Auth's own catch-all handler mounted separately in app.ts, since
// those redirects aren't something a thin JSON controller can wrap.

authRouter.post("/register", async (req, res) => {
  try {
    const { headers, response } = await auth.api.signUpEmail({
      body: {
        name: req.body?.name,
        email: req.body?.email,
        password: req.body?.password,
      },
      returnHeaders: true,
    });
    applyHeaders(res, headers);
    res.status(200).json(response);
  } catch (err) {
    sendAuthError(res, err);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { headers, response } = await auth.api.signInEmail({
      body: {
        email: req.body?.email,
        password: req.body?.password,
      },
      returnHeaders: true,
    });
    applyHeaders(res, headers);
    res.status(200).json(response);
  } catch (err) {
    sendAuthError(res, err);
  }
});

authRouter.post("/logout", async (req, res) => {
  try {
    const { headers, response } = await auth.api.signOut({
      headers: fromNodeHeaders(req.headers),
      returnHeaders: true,
    });
    applyHeaders(res, headers);
    res.status(200).json(response);
  } catch (err) {
    sendAuthError(res, err);
  }
});

authRouter.post("/forgot-password", async (req, res) => {
  try {
    const response = await auth.api.requestPasswordReset({
      body: {
        email: req.body?.email,
        redirectTo: `${env.FRONTEND_URL}/reset-password`,
      },
    });
    res.status(200).json(response);
  } catch (err) {
    sendAuthError(res, err);
  }
});

authRouter.post("/reset-password", async (req, res) => {
  try {
    const response = await auth.api.resetPassword({
      body: {
        newPassword: req.body?.newPassword,
        token: req.body?.token,
      },
    });
    res.status(200).json(response);
  } catch (err) {
    sendAuthError(res, err);
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.status(200).json({ user: req.user });
});
