import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/AppError.js";
import { WebhookVerificationError } from "../../services/payments.js";
import * as paymentsService from "./payments.service.js";

/**
 * requireAuth (mounted on the router below) has already populated
 * req.user by the time any of these handlers run - this just narrows
 * the type, it is not a second authentication check.
 */
function currentUser(req: Request): { id: string; email: string } {
  if (!req.user) throw new AppError("Unauthorized", 401);
  return { id: req.user.id, email: req.user.email };
}

/**
 * Creates a Polar checkout session and returns its URL as JSON. This is a
 * decoupled Express API + React SPA, not a server-rendered app, so
 * there's no HTTP redirect to issue here - the frontend does
 * `window.location.href = url` with the returned value.
 */
export const checkout = asyncHandler(async (req: Request, res: Response) => {
  const user = currentUser(req);
  const url = await paymentsService.createCheckout(user.id, user.email);
  res.status(200).json({ url });
});

/** Current user's subscription, or null if they've never subscribed. */
export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = currentUser(req);
  const subscription = await paymentsService.getSubscriptionStatus(user.id);
  res.status(200).json({ subscription });
});

/**
 * Polar webhook receiver. Deliberately unauthenticated (Polar, not one of
 * our users, calls this) - trust comes from the HMAC signature verified
 * inside handleWebhookEvent instead. Mounted in app.ts with express.raw()
 * ahead of the app's global express.json(), so req.body here is the
 * untouched raw bytes the signature was computed over - do not add this
 * route under the normal /api router, which already has a parsed body by
 * the time requests reach it.
 */
export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const headers: Record<string, string> = {
    "webhook-id": String(req.headers["webhook-id"] ?? ""),
    "webhook-timestamp": String(req.headers["webhook-timestamp"] ?? ""),
    "webhook-signature": String(req.headers["webhook-signature"] ?? ""),
  };

  try {
    await paymentsService.handleWebhookEvent(req.body as Buffer, headers);
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      throw new AppError("Invalid webhook signature", 400);
    }
    throw error;
  }

  res.status(200).json({ received: true });
});
