---
sidebar_position: 8
---

# Payments (Polar)

## What it is

Subscription billing via [Polar](https://polar.sh): a checkout-session route that redirects the
user to Polar's hosted checkout, and a webhook receiver that keeps a local `Subscription` table
in sync with subscription lifecycle events.

## Why Polar over the alternatives

Stripe is the default choice almost everywhere, but Polar is built specifically for indie/solo
developers selling digital products and handles merchant-of-record tax/VAT compliance itself —
meaningful for a solo project that doesn't want to build its own tax handling. Its SDK
(`@polar-sh/sdk`) and webhook verification helpers are small and map cleanly onto the same
service-wrapper pattern used for R2 and email, so swapping in Stripe later (if a project's needs
change) means rewriting one file, not the payments module's controller/routes/schema.

## The wrapper

```ts title="backend/src/services/payments.ts"
/**
 * The Polar client is built lazily inside each exported function, so
 * importing this file never crashes when Polar credentials aren't
 * configured yet — same pattern as services/storage.ts.
 */
export async function createCheckoutSession(params: {
  userId: string;
  userEmail: string;
}): Promise<string> {
  const client = getClient();
  const checkout = await client.checkouts.create({
    products: [env.POLAR_PRODUCT_ID],
    successUrl: env.POLAR_SUCCESS_URL,
    customerEmail: params.userEmail,
    // Our own User.id, not Polar's customer id — lets later webhook
    // payloads be matched back to a user via payload.data.customer.externalId
    // without looking up or storing Polar's customer id up front.
    externalCustomerId: params.userId,
  });
  return checkout.url;
}

export function verifyWebhookEvent(body: string | Buffer, headers: Record<string, string>) {
  if (!env.POLAR_WEBHOOK_SECRET) throw new AppError(NOT_CONFIGURED_MESSAGE, 500);
  return validateEvent(body, headers, env.POLAR_WEBHOOK_SECRET);
}
```

Because this is a decoupled Express API + React SPA (not server-rendered pages), there's no HTTP
redirect to issue from the backend — `createCheckoutSession` returns Polar's checkout URL as
JSON, and the frontend does `window.location.href = url` itself.

## Webhook verification needs the raw body

`verifyWebhookEvent`'s `body` parameter must be the **unparsed** request body — Polar signs the
exact bytes it sent, and Express's `express.json()` middleware would already have re-serialized
it by the time a parsed object reaches this function. That's why `app.ts` mounts the payments
webhook route with `express.raw({ type: "application/json" })` ahead of the global
`express.json()`:

```ts title="backend/src/app.ts"
app.use(
  "/api/payments",
  express.raw({ type: "application/json" }),
  paymentsWebhookRouter,
);
```

## Data model

`Subscription` (see [Prisma + PostgreSQL](/backend/prisma-postgres)) is written **only** from
webhook events (`subscription.active`, `subscription.canceled`, etc.) — the checkout route never
writes to it directly. Polar's webhook is the single source of truth for subscription state,
which avoids the class of bug where a user's browser closes mid-checkout and the app's local
state disagrees with what was actually purchased.

## Without Polar configured

`POLAR_ACCESS_TOKEN`, `POLAR_PRODUCT_ID`, and `POLAR_WEBHOOK_SECRET` are all optional env vars.
Without them, `createCheckoutSession`/`verifyWebhookEvent` throw a clear "not configured"
`AppError` only when actually called — the rest of the app is unaffected.
