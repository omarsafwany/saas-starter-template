import type { Subscription } from "../../generated/prisma/client.js";
import * as payments from "../../services/payments.js";
import { paymentsRepository } from "./payments.repository.js";

/**
 * Creates a Polar checkout session for the given user and returns the URL
 * the frontend should navigate the browser to.
 */
export async function createCheckout(userId: string, userEmail: string): Promise<string> {
  return payments.createCheckoutSession({ userId, userEmail });
}

/**
 * Verifies and processes an inbound Polar webhook request, persisting the
 * subscription's current state. Throws WebhookVerificationError
 * (re-exported from services/payments.ts) if the signature doesn't check
 * out - the controller maps that to a 400.
 *
 * Every subscription.* event Polar sends carries a full snapshot of the
 * subscription (not a diff), so each case below just upserts the whole
 * row - see services/payments.ts's verifyWebhookEvent for where these
 * payload shapes come from. Every other event type Polar can send
 * (checkout.*, order.*, product.*, etc.) is intentionally a no-op here:
 * this module only needs to answer "is this user currently subscribed",
 * which the subscription.* events fully determine on their own.
 */
export async function handleWebhookEvent(
  body: string | Buffer,
  headers: Record<string, string>,
): Promise<void> {
  const event = payments.verifyWebhookEvent(body, headers);

  switch (event.type) {
    case "subscription.created":
    case "subscription.updated":
    case "subscription.active":
    case "subscription.canceled":
    case "subscription.uncanceled":
    case "subscription.revoked": {
      const subscription = event.data;
      const userId = subscription.customer.externalId;
      if (!userId) {
        // Not one of our checkouts (e.g. a subscription created directly
        // in the Polar dashboard against a customer with no externalId
        // set) - there's nothing in our own User table to attach this to.
        return;
      }
      await paymentsRepository.upsertFromWebhook({
        userId,
        polarSubscriptionId: subscription.id,
        polarCustomerId: subscription.customerId,
        polarProductId: subscription.productId,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      });
      return;
    }
    default:
      return;
  }
}

/** Current subscription for a user, or null if they've never subscribed. */
export async function getSubscriptionStatus(userId: string): Promise<Subscription | null> {
  return paymentsRepository.findLatestByUserId(userId);
}
