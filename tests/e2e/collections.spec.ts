// E2E: Group Collections (한국 특화 #2)
//
// Each test that creates a collection MUST register the id with the helper
// so the afterEach force-deletes it via REST even if the test bails mid-flow.
// Previously the create/edit/delete spec relied on the in-app delete button
// at the end of the test — if anything failed earlier (modal slow, button
// disabled, dark-mode race) the collection lingered. We accumulated 31
// orphan rows that way.

import { test, expect } from "@playwright/test";
import { waitForHydration, waitForInteractive } from "./helpers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminHeaders = {
  apikey: SERVICE_ROLE,
  Authorization: `Bearer ${SERVICE_ROLE}`,
};

const collectionsToCleanup = new Set<string>();

async function forceDeleteCollection(id: string): Promise<void> {
  // collection_items cascade via FK; subscriptions / wishlist 무관
  await fetch(`${SUPABASE_URL}/rest/v1/collections?id=eq.${id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
}

function track(id: string) {
  collectionsToCleanup.add(id);
}

test.describe("collections", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.accept().catch(() => {}));
  });

  test.afterEach(async () => {
    for (const id of collectionsToCleanup) {
      await forceDeleteCollection(id);
    }
    collectionsToCleanup.clear();
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
    track(collectionId); // ← cleanup-safety registered as soon as we have the id
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
    await page.reload();
    await waitForHydration(page);
    await expect(
      page.getByRole("heading", { name: `${collectionName} (수정)` }),
    ).toBeVisible();

    // Delete via UI (validates the user-facing flow). afterEach is a
    // safety net if this click fails.
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
    track(collectionId);
    await waitForHydration(page);

    const shareText = await page.locator('text=eatlog.duckdns.org/c/').first().textContent();
    const tokenMatch = shareText?.match(/c\/([\w-]+)/);
    expect(tokenMatch).toBeTruthy();
    const token = tokenMatch![1];

    const anon = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const anonPage = await anon.newPage();
    await anonPage.goto(`/c/${token}`);
    await expect(anonPage.getByRole("heading", { name })).toBeVisible();
    await expect(anonPage.getByText(/맛집 컬렉션 ·/)).toBeVisible();
    await expect(anonPage.getByRole("link", { name: /시작하기/ })).toBeVisible();
    await anon.close();

    // afterEach cleans up — no in-app delete click needed.
  });
});
