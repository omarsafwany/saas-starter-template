import type { Subscription } from "../../generated/prisma/client.js";
import { prisma } from "../../config/db.js";

/**
 * Repository pattern (see project architecture rule 3): the service below
 * only ever talks to this interface, never to Prisma directly. Swapping
 * the datastore later means rewriting this one file, not the service,
 * controller, or routes.
 */
export interface PaymentsRepository {
  /** Most recently updated subscription row for a user, if any. */
  findLatestByUserId(userId: string): Promise<Subscription | null>;
  /**
   * Creates or updates the row keyed by Polar's own subscription id.
   * Every subscription.* webhook payload is a full snapshot of the
   * subscription, so upserting the whole row on each event is simpler
   * and safer than tracking per-field diffs.
   */
  upsertFromWebhook(data: {
    userId: string;
    polarSubscriptionId: string;
    polarCustomerId: string;
    polarProductId: string;
    status: string;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  }): Promise<Subscription>;
}

export const paymentsRepository: PaymentsRepository = {
  findLatestByUserId(userId) {
    return prisma.subscription.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  },

  upsertFromWebhook(data) {
    const { polarSubscriptionId, ...rest } = data;
    return prisma.subscription.upsert({
      where: { polarSubscriptionId },
      create: { polarSubscriptionId, ...rest },
      update: rest,
    });
  },
};
