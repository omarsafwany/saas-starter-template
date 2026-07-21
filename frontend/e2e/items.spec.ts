import { expect, test } from "@playwright/test";
import { registerViaUI } from "./helpers.js";

/**
 * Core CRUD flow (PERPRO-22) against the items reference module, driven
 * entirely through the real Dashboard UI - not the API directly - and
 * re-verified after a full page reload so a false-positive from
 * client-side cache alone (TanStack Query) can't pass this test.
 */
test.describe("Items CRUD", () => {
  test("create, edit, and delete an item; changes really persist", async ({ page }) => {
    await registerViaUI(page, "items-crud");

    const title = `E2E item ${Date.now()}`;
    const body = "Created by the Playwright items CRUD spec.";

    await page.getByRole("button", { name: "New item" }).click();
    await page.locator("#item-title").fill(title);
    await page.locator("#item-body").fill(body);
    await page.getByRole("button", { name: "Save" }).click();

    const row = page.locator("li", { hasText: title });
    await expect(row).toBeVisible();
    await expect(row.getByText(body)).toBeVisible();

    // Reload: if this only lived in TanStack Query's cache, it would vanish.
    await page.reload();
    await expect(page.locator("li", { hasText: title })).toBeVisible();

    const updatedTitle = `${title} (edited)`;
    await page.locator("li", { hasText: title }).getByRole("button", { name: "Edit" }).click();
    await page.locator("#item-title").fill(updatedTitle);
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.locator("li", { hasText: updatedTitle })).toBeVisible();
    await page.reload();
    await expect(page.locator("li", { hasText: updatedTitle })).toBeVisible();

    await page.locator("li", { hasText: updatedTitle }).getByRole("button", { name: "Delete" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();

    await expect(page.locator("li", { hasText: updatedTitle })).toHaveCount(0);
    await page.reload();
    await expect(page.locator("li", { hasText: updatedTitle })).toHaveCount(0);
  });
});
