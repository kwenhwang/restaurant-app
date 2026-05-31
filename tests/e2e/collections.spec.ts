// E2E: Group Collections (한국 특화 #2)

import { test, expect } from "@playwright/test";
import { waitForHydration, waitForInteractive } from "./helpers";

test.describe("collections", () => {
  test.beforeEach(async ({ page }) => {
    // Auto-accept any window.confirm() dialogs (delete confirmations)
    page.on("dialog", (d) => d.accept().catch(() => {}));
  });
  test("entry point from profile", async ({ page }) => {
    await page.goto("/profile");
    await waitForHydration(page);
    const link = page.locator('a[href="/collections"]');
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/collections$/);
  });

  test("create, edit, public-share, delete", async ({ page }) => {
    const collectionName = `E2E 컬렉션 ${Date.now()}`;

    await page.goto("/collections/new");
    await waitForInteractive(page, 'input[name="name"]');
    await waitForInteractive(page, 'button[type="submit"]');

    await page.locator('input[name="name"]').fill(collectionName);
    await page.locator('textarea[name="description"]').fill("Playwright 테스트");
    await page.locator('input[name="is_public"]').check();

    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      undefined,
      { timeout: 5_000 },
    );
    await page.getByRole("button", { name: "만들기" }).click();

    await expect(page).toHaveURL(/\/collections\/[a-f0-9-]{36}$/);
    const collectionId = page.url().split("/").pop()!;
    await waitForHydration(page);

    await expect(page.getByRole("heading", { name: collectionName })).toBeVisible();
    await expect(page.getByText("공유 링크")).toBeVisible();

    // Edit
    await page.goto(`/collections/${collectionId}/edit`);
    await waitForInteractive(page, 'input[name="name"]');
    await waitForInteractive(page, 'button[type="submit"]');
    await page.locator('input[name="name"]').fill(`${collectionName} (수정)`);
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      undefined,
      { timeout: 5_000 },
    );
    await page.getByRole("button", { name: "저장" }).click();
    await expect(page).toHaveURL(new RegExp(`/collections/${collectionId}$`));
    // router.push may navigate before the cache revalidates. Hard-reload
    // so we read the fresh row.
    await page.reload();
    await waitForHydration(page);
    await expect(
      page.getByRole("heading", { name: `${collectionName} (수정)` }),
    ).toBeVisible();

    // Delete
    await page.goto(`/collections/${collectionId}/edit`);
    await waitForHydration(page);
    await page.getByRole("button", { name: "컬렉션 삭제" }).click();
    await expect(page).toHaveURL(/\/collections$/);
  });

  test("public share page works for anon visitors", async ({ page, browser }) => {
    const name = `E2E 공유 ${Date.now()}`;

    await page.goto("/collections/new");
    await waitForInteractive(page, 'input[name="name"]');
    await waitForInteractive(page, 'button[type="submit"]');
    await page.locator('input[name="name"]').fill(name);
    await page.locator('input[name="is_public"]').check();
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      undefined,
      { timeout: 5_000 },
    );
    await page.getByRole("button", { name: "만들기" }).click();
    await expect(page).toHaveURL(/\/collections\/[a-f0-9-]{36}$/);
    const collectionId = page.url().split("/").pop()!;
    await waitForHydration(page);

    const shareText = await page.locator('text=eatlog.duckdns.org/c/').first().textContent();
    const tokenMatch = shareText?.match(/c\/([\w-]+)/);
    expect(tokenMatch).toBeTruthy();
    const token = tokenMatch![1];

    const anon = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const anonPage = await anon.newPage();
    await anonPage.goto(`/c/${token}`);
    await expect(anonPage.getByRole("heading", { name })).toBeVisible();
    // Hero label "맛집 컬렉션 · N곳" — match the eyebrow specifically (avoid
    // the metadata "맛집 컬렉션" elsewhere in the document)
    await expect(anonPage.getByText(/맛집 컬렉션 ·/)).toBeVisible();
    await expect(anonPage.getByRole("link", { name: /시작하기/ })).toBeVisible();
    await anon.close();

    // Cleanup
    await page.goto(`/collections/${collectionId}/edit`);
    await waitForHydration(page);
    await page.getByRole("button", { name: "컬렉션 삭제" }).click();
  });
});
