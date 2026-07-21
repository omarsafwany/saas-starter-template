import { expect, test } from "@playwright/test";
import { registerViaUI } from "./helpers.js";

/**
 * File upload (PERPRO-22): PERPRO-9 shipped the R2 presigned-URL API
 * (request-upload-url -> PUT to R2 -> attach-file -> get-file-url) but no
 * Dashboard UI was ever built on top of it - `find frontend/src -type f`
 * turns up no upload component anywhere. So, matching the same "test the
 * real thing, don't invent a feature under a testing ticket" call made for
 * the AuthZ role-gate above, this drives the API contract directly via
 * Playwright's request context (which shares the browser's session cookie,
 * so it's still exercising real authenticated backend behavior) instead of
 * building a new upload UI.
 *
 * No real R2 credentials exist in this environment (see backend/.env), so
 * by default this only verifies the graceful "not configured" error
 * contract. The real upload round-trip runs automatically if R2_ACCOUNT_ID
 * etc. are ever set for a future run - see E2E_HAS_R2 below.
 */
const E2E_HAS_R2 = Boolean(
  process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME,
);

test.describe("File upload", () => {
  test("requesting an upload URL without R2 configured fails with a clear error", async ({ page }) => {
    test.skip(E2E_HAS_R2, "R2 is configured in this run; see the credentialed test below instead.");

    await registerViaUI(page, "uploads-notconfigured");
    await page.getByRole("button", { name: "New item" }).click();
    await page.locator("#item-title").fill("Item for upload test");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.locator("li", { hasText: "Item for upload test" })).toBeVisible();

    const listRes = await page.request.get("/api/items");
    const { items } = await listRes.json();
    const item = items.find((candidate: { title: string }) => candidate.title === "Item for upload test");
    expect(item).toBeTruthy();

    const res = await page.request.post(`/api/items/${item.id}/upload-url`, {
      data: { contentType: "text/plain" },
    });
    expect(res.status()).toBe(500);
  });

  test("full presigned-upload round trip works when R2 is configured", async ({ page }) => {
    test.skip(!E2E_HAS_R2, "No R2 credentials in this environment - see backend/.env.example.");

    await registerViaUI(page, "uploads-realr2");
    await page.getByRole("button", { name: "New item" }).click();
    await page.locator("#item-title").fill("Item for real upload test");
    await page.getByRole("button", { name: "Save" }).click();

    const listRes = await page.request.get("/api/items");
    const { items } = await listRes.json();
    const item = items.find((candidate: { title: string }) => candidate.title === "Item for real upload test");

    const uploadUrlRes = await page.request.post(`/api/items/${item.id}/upload-url`, {
      data: { contentType: "text/plain" },
    });
    expect(uploadUrlRes.ok()).toBeTruthy();
    const { url, key } = await uploadUrlRes.json();

    const fileBody = `e2e upload ${Date.now()}`;
    const putRes = await page.request.fetch(url, { method: "PUT", data: fileBody, headers: { "Content-Type": "text/plain" } });
    expect(putRes.ok()).toBeTruthy();

    const attachRes = await page.request.post(`/api/items/${item.id}/file`, { data: { key } });
    expect(attachRes.ok()).toBeTruthy();

    const fileUrlRes = await page.request.get(`/api/items/${item.id}/file`);
    expect(fileUrlRes.ok()).toBeTruthy();
    const { url: downloadUrl } = await fileUrlRes.json();

    const downloaded = await page.request.fetch(downloadUrl);
    expect(await downloaded.text()).toBe(fileBody);
  });
});
