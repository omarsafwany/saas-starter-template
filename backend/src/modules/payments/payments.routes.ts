import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as paymentsController from "./payments.controller.js";

/**
 * Authenticated payments routes, mounted under /api/payments in
 * routes/index.ts (normal JSON body parsing applies here). The webhook
 * receiver is NOT part of this router - it must bypass the app's global
 * express.json() (see app.ts), so it's exported separately below as
 * paymentsWebhookRouter and mounted directly in app.ts instead.
 */
export const paymentsRouter = Router();

paymentsRouter.use(requireAuth);

paymentsRouter.post("/checkout", paymentsController.checkout);
paymentsRouter.get("/status", paymentsController.getStatus);

/**
 * Deliberately a separate, unauthenticated router - Polar (not one of our
 * users) calls this endpoint, and requireAuth would reject it outright.
 * Must be mounted in app.ts with express.raw({ type: "application/json" })
 * ahead of the global express.json(), so the raw bytes survive for
 * signature verification.
 */
export const paymentsWebhookRouter = Router();
paymentsWebhookRouter.post("/webhook", paymentsController.webhook);
