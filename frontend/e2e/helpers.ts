import type { Page } from "@playwright/test";
import { Client } from "pg";
import { E2E_DATABASE_URL } from "./env.js";

/** Matches the convention already used in backend/tests/*.test.ts. */
export function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

export const TEST_PASSWORD = "Password123!";

/**
 * One-off Postgres client against the isolated "e2e" schema, for assertions
 * a Playwright `page` can't make directly (e.g. confirming a pg-boss job
 * actually completed, not just that the UI didn't show an error).
 * Callers are expected to `await client.end()` when done.
 */
export function connectDb(): Client {
  return new Client({ connectionString: E2E_DATABASE_URL });
}

export interface RegisteredUser {
  name: string;
  email: string;
  password: string;
}

/**
 * Drives the real Register page through the browser (not an API shortcut),
 * since this itself is the AuthN flow under test. Waits for the redirect to
 * /dashboard, which only happens after Better Auth's session cookie is set -
 * i.e. this only resolves once the user is genuinely logged in.
 */
export async function registerViaUI(page: Page, label: string): Promise<RegisteredUser> {
  const user: RegisteredUser = {
    name: `${label} user`,
    email: uniqueEmail(label),
    password: TEST_PASSWORD,
  };

  await page.goto("/register");
  await page.locator("#name").fill(user.name);
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.locator("#confirmPassword").fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/dashboard");

  return user;
}

export async function loginViaUI(page: Page, user: Pick<RegisteredUser, "email" | "password">): Promise<void> {
  await page.goto("/login");
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/dashboard");
}
