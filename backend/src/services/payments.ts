import { Polar } from "@polar-sh/sdk";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const NOT_CONFIGURED_MESSAGE =
  "Payments are not configured. Set POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET, " +
  "and POLAR_PRODUCT_ID.";

export { WebhookVerificationError };

/**
 * The Polar client is built lazily inside each exported function rather
 * than once at module load, so importing this file never crashes when
 * Polar credentials aren't configured yet (see PERPRO-10's "build now,
 * verify later" note - this module is fully implemented but
 * credential-gated, same pattern as services/storage.ts and
 * services/jobs.ts).
 */
function getClient(): Polar {
  if (!env.POLAR_ACCESS_TOKEN) {
    throw new AppError(NOT_CONFIGURED_MESSAGE, 500);
  }
  return new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
    server: env.POLAR_SERVER,
  });
}

/**
 * Creates a Polar checkout session for the configured product and returns
 * the URL the frontend should send the browser to
 * (`window.location.href = url`). This is a decoupled Express API + React
 * SPA, not server-rendered pages, so there's no HTTP redirect response to
 * issue here - the caller (payments.controller.ts) returns this URL as
 * JSON and the frontend performs the navigation.
 *
 * `externalCustomerId` is set to our own User.id so that later
 * subscription.* webhook payloads can be matched back to a user via
 * `payload.data.customer.externalId`, without us having to look up or
 * store Polar's own customer id up front.
 */
export async function createCheckoutSession(params: {
  userId: string;
  userEmail: string;
}): Promise<string> {
  if (!env.POLAR_PRODUCT_ID) {
    throw new AppError(NOT_CONFIGURED_MESSAGE, 500);
  }
  const client = getClient();
  const checkout = await client.checkouts.create({
    products: [env.POLAR_PRODUCT_ID],
    successUrl: env.POLAR_SUCCESS_URL,
    customerEmail: params.userEmail,
    externalCustomerId: params.userId,
  });
  return checkout.url;
}

/**
 * Verifies the inbound webhook request against POLAR_WEBHOOK_SECRET and
 * returns the parsed, typed event. Throws WebhookVerificationError (from
 * @polar-sh/sdk/webhooks) if the signature is invalid or missing -
 * callers should map that to a 400, not a 500.
 *
 * `body` must be the *raw, unparsed* request body (a Buffer or string),
 * not JSON already parsed by Express - see app.ts, where this route is
 * mounted with express.raw() ahead of the global express.json().
 *
 * `headers` must contain the three Standard Webhooks headers Polar signs
 * with (confirmed directly against the standardwebhooks package Polar's
 * SDK wraps internally): webhook-id, webhook-timestamp, webhook-signature.
 */
export function verifyWebhookEvent(body: string | Buffer, headers: Record<string, string>) {
  if (!env.POLAR_WEBHOOK_SECRET) {
    throw new AppError(NOT_CONFIGURED_MESSAGE, 500);
  }
  return validateEvent(body, headers, env.POLAR_WEBHOOK_SECRET);
}
