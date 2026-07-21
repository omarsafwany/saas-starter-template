import { expect, test } from "@playwright/test";
import { loginViaUI, registerViaUI } from "./helpers.js";

/**
 * AuthN + AuthZ (PERPRO-22).
 *
 * AuthZ note: the ticket asks for "a logged-in user without the right role
 * is blocked from a role-gated action (once roles exist per PERPRO-7)".
 * PERPRO-7 only added a `role` column to the User model (default "user")
 * and never wired up any middleware or route that actually checks it - so
 * there is currently no role-gated action anywhere in the app to test
 * against. Rather than inventing a new authorization feature under this
 * testing ticket, that specific sub-item is intentionally left uncovered
 * here; see the PR description for the flagged follow-up.
 */

test.describe("AuthN", () => {
  test("register -> session persists across refresh -> logout", async ({ page }) => {
    const user = await registerViaUI(page, "authn-register");

    await expect(page.getByText(`Signed in as ${user.email}`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();

    // Session persists across a full page refresh, not just client-side nav.
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(`Signed in as ${user.email}`)).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log out" })).toHaveCount(0);
  });

  test("register -> logout -> log back in with the same credentials", async ({ page }) => {
    const user = await registerViaUI(page, "authn-relogin");
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();

    await loginViaUI(page, user);
    await expect(page.getByText(`Signed in as ${user.email}`)).toBeVisible();
  });

  test("rejects login with the wrong password", async ({ page }) => {
    const user = await registerViaUI(page, "authn-badpw");
    await page.getByRole("button", { name: "Log out" }).click();

    await page.goto("/login");
    await page.locator("#email").fill(user.email);
    await page.locator("#password").fill("definitely-wrong-password");
    await page.getByRole("button", { name: "Log in" }).click();

    // Don't assert on exact copy text (that's owned by the app, not this
    // spec); just verify an inline error is rendered and we stay on /login.
    const errorMessage = page.locator("p.text-destructive");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).not.toBeEmpty();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("AuthZ", () => {
  test("unauthenticated visitors are redirected away from protected routes", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("an authenticated user hitting /login or /register is bounced back to the dashboard", async ({
    page,
  }) => {
    await registerViaUI(page, "authz-guestonly");

    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/register");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
