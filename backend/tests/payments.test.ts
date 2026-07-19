import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// Never let this suite exercise a real Polar API call or a real HMAC
// signature check - mock the service wrapper entirely, same pattern as
// tests/jobs.test.ts's mock of services/email.js. WebhookVerificationError
// is re-exported as a real class so `instanceof` checks in
// payments.controller.ts still work against errors thrown by the mock.
class FakeWebhookVerificationError extends Error {}
vi.mock("../src/services/payments.js", () => ({
  createCheckoutSession: vi.fn(),
  verifyWebhookEvent: vi.fn(),
  WebhookVerificationError: FakeWebhookVerificationError,
}));

const paymentsService = await import("../src/services/payments.js");
const { createApp } = await import("../src/app.js");
const { prisma } = await import("../src/config/db.js");
const { resetDb } = await import("./resetDb.js");
const { handleWebhookEvent } = await import(
  "../src/modules/payments/payments.service.js"
);

const app = createApp();

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

async function registerAgent(label: string) {
  const agent = request.agent(app);
  const email = uniqueEmail(label);
  const res = await agent
    .post("/api/auth/register")
    .send({ name: label, email, password: "Password123!" });
  expect(res.status).toBe(200);
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  return { agent, userId: user.id, email };
}

beforeEach(async () => {
  await resetDb();
  vi.mocked(paymentsService.createCheckoutSession).mockReset();
  vi.mocked(paymentsService.verifyWebhookEvent).mockReset();
});

describe("payments module - checkout route", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const res = await request(app).post("/api/payments/checkout");
    expect(res.status).toBe(401);
  });

  it("creates a checkout session for an authenticated user and returns its url", async () => {
    const { agent, email } = await registerAgent("checkout-user");
    vi.mocked(paymentsService.createCheckoutSession).mockResolvedValue(
      "https://sandbox-api.polar.sh/checkout/abc123",
    );

    const res = await agent.post("/api/payments/checkout");

    expect(res.status).toBe(200);
    expect(res.body.url).toBe("https://sandbox-api.polar.sh/checkout/abc123");
    expect(paymentsService.createCheckoutSession).toHaveBeenCalledTimes(1);
    expect(paymentsService.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ userEmail: email }),
    );
  });
});

describe("payments module - webhook route", () => {
  it("maps an invalid signature to 400 instead of 500", async () => {
    vi.mocked(paymentsService.verifyWebhookEvent).mockImplementation(() => {
      throw new FakeWebhookVerificationError("bad signature");
    });

    const res = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ type: "subscription.active" }));

    expect(res.status).toBe(400);
  });
});

describe("payments module - handleWebhookEvent", () => {
  it("persists a subscription.active event for a user linked via externalId", async () => {
    const { userId } = await registerAgent("webhook-user");
    const fakeEvent = {
      type: "subscription.active",
      timestamp: new Date(),
      data: {
        id: "sub_test_1",
        customerId: "cus_test_1",
        productId: "prod_test_1",
        status: "active",
        currentPeriodEnd: new Date("2026-08-19T00:00:00Z"),
        cancelAtPeriodEnd: false,
        customer: { externalId: userId },
      },
    };
    vi.mocked(paymentsService.verifyWebhookEvent).mockReturnValue(fakeEvent as never);

    await handleWebhookEvent("{}", {});

    const row = await prisma.subscription.findUnique({
      where: { polarSubscriptionId: "sub_test_1" },
    });
    expect(row).not.toBeNull();
    expect(row?.userId).toBe(userId);
    expect(row?.status).toBe("active");
    expect(row?.cancelAtPeriodEnd).toBe(false);
  });

  it("ignores subscription events with no externalId on the customer", async () => {
    const fakeEvent = {
      type: "subscription.active",
      timestamp: new Date(),
      data: {
        id: "sub_test_2",
        customerId: "cus_test_2",
        productId: "prod_test_2",
        status: "active",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        customer: { externalId: null },
      },
    };
    vi.mocked(paymentsService.verifyWebhookEvent).mockReturnValue(fakeEvent as never);

    await handleWebhookEvent("{}", {});

    const row = await prisma.subscription.findUnique({
      where: { polarSubscriptionId: "sub_test_2" },
    });
    expect(row).toBeNull();
  });

  it("ignores non-subscription event types", async () => {
    const fakeEvent = {
      type: "order.paid",
      timestamp: new Date(),
      data: { id: "order_test_1" },
    };
    vi.mocked(paymentsService.verifyWebhookEvent).mockReturnValue(fakeEvent as never);

    await expect(handleWebhookEvent("{}", {})).resolves.toBeUndefined();

    const count = await prisma.subscription.count();
    expect(count).toBe(0);
  });
});
