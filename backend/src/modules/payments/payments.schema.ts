import { z } from "zod";

/**
 * Zod schemas for the payments module. Kept colocated with the module
 * (not in a shared "schemas" folder) so a new module can be built by
 * copying this whole directory.
 *
 * The checkout route takes no client input - the product, success URL,
 * and customer identity all come from server config plus the
 * authenticated session, not the request body - so there's no request
 * schema to validate here. The webhook route's body isn't parsed with
 * zod either: it's verified against Polar's HMAC signature and parsed
 * into Polar's own typed payloads by services/payments.ts's
 * verifyWebhookEvent before this module ever sees it.
 */
export const checkoutResponseSchema = z.object({
  url: z.string(),
});

export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;
