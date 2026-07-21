import { expect, test } from "@playwright/test";
import { registerViaUI } from "./helpers.js";

/**
 * Payments (PERPRO-22): like file upload, PERPRO-10 shipped the Polar
 * checkout/webhook API but no billing/subscribe page exists in the
 * frontend (App.tsx's routes are just Home/Login/Register/Dashboard). This
 * drives the checkout API directly via `page.request` (shares the browser's
 * session cookie) rather than inventing a billing UI under this ticket.
 *
 * No real Polar sandbox credentials exist in this environment (see
 * backend/.env), so by default this only verifies the "not configured"
 * error contract. A full "checkout completes -> webhook fires -> DB
 * updates" round trip additionally requires a live webhook delivery from
 * Polar's own servers, which a local/CI E2E run has no way to trigger
 * deterministically even with real sandbox keys - that stays a manual,
 * pre-release check (see the PR description).
 */
const E2E_HAS_POLAR = Boolean(
  process.env.POLAR_ACCESS_TOKEN && process.env.POLAR_WEBHOOK_SECRET && process.env.POLAR_PRODUCT_ID,
);

test.describe("Payments", () => {
  test("checkout without Polar configured fails with a clear error", async ({ page }) => {
    test.skip(E2E_HAS_POLAR, "Polar is configured in this run; see the credentialed test below instead.");

    await registerViaUI(page, "payments-notconfigured");
    const res = await page.request.post("/api/payments/checkout");
    expect(res.status()).toBe(500);
  });

  test("checkout creates a real Polar sandbox session when configured", async ({ page }) => {
    test.skip(!E2E_HAS_POLAR, "No Polar sandbox credentials in this environment - see backend/.env.example.");

    await registerViaUI(page, "payments-realpolar");
    const res = await page.request.post("/api/payments/checkout");
    expect(res.ok()).toBeTruthy();
    const { url } = await res.json();
    expect(url).toMatch(/^https:\/\//);

    // Deliberately not driven further: completing checkout requires Polar's
    // own hosted page + test card, and the resulting webhook is delivered
    // by Polar's servers, not something this test can trigger. See the
    // module doc comment above.
  });
});
