// E2E: Group Collections (한국 특화 #2)
// Tests the create → add → share-link → remove → delete lifecycle.

import { test, expect } from "@playwright/test";

const COLLECTION_NAME = `E2E 테스트 컬렉션 ${Date.now()}`;

test.describe("collections", () => {
  test("create, edit, public-share, delete", async ({ page }) => {
    // 1. Navigate from profile
    await page.goto("/profile");
    await expect(page.getByText("나의 큐레이션")).toBeVisible();
    await page.getByRole("link", { name: /^컬렉션/ }).click();
    await expect(page).toHaveURL(/\/collections$/);

    // 2. Create new
    await page.getByRole("link", { name: /새 리스트|첫 컬렉션/ }).first().click();
    await expect(page).toHaveURL(/\/collections\/new/);

    await page.getByPlaceholder(/강남 데이트 코스/).fill(COLLECTION_NAME);
    await page.getByPlaceholder(/한 줄로 소개/).fill("Playwright가 만든 테스트 컬렉션");
    await page.getByLabel(/공개 리스트/).check();
    await page.getByRole("button", { name: "만들기" }).click();

    // 3. Should land on detail page
    await expect(page).toHaveURL(/\/collections\/[a-f0-9-]{36}/);
    await expect(page.getByRole("heading", { name: COLLECTION_NAME })).toBeVisible();
    await expect(page.getByText("공유 링크")).toBeVisible();

    // 4. Share-bar should show eatlog.duckdns.org/c/<token>
    const shareUrl = await page.locator("text=/eatlog.*c\\//").first().textContent();
    expect(shareUrl).toBeTruthy();

    // 5. Edit
    await page.getByRole("link", { name: /편집/ }).click();
    await expect(page).toHaveURL(/\/edit$/);
    const nameInput = page.locator('input[name="name"]');
    await nameInput.fill(`${COLLECTION_NAME} (수정됨)`);
    await page.getByRole("button", { name: "저장" }).click();
    await expect(page).toHaveURL(/\/collections\/[a-f0-9-]{36}$/);
    await expect(
      page.getByRole("heading", { name: `${COLLECTION_NAME} (수정됨)` }),
    ).toBeVisible();

    // 6. Delete — go to edit, scroll down, hit delete
    await page.getByRole("link", { name: /편집/ }).click();
    await page.getByRole("button", { name: "컬렉션 삭제" }).click();
    await expect(page).toHaveURL(/\/collections$/);
    await expect(
      page.getByRole("heading", { name: `${COLLECTION_NAME} (수정됨)` }),
    ).not.toBeVisible();
  });

  test("public share page works for anon visitors", async ({ page, browser }) => {
    // Create a public collection first (reuse the authed session)
    await page.goto("/collections/new");
    const name = `E2E 공유 ${Date.now()}`;
    await page.getByPlaceholder(/강남 데이트 코스/).fill(name);
    await page.getByLabel(/공개 리스트/).check();
    await page.getByRole("button", { name: "만들기" }).click();
    await expect(page).toHaveURL(/\/collections\/[a-f0-9-]{36}/);

    const shareBox = page.locator("text=/eatlog.*c\\//").first();
    await expect(shareBox).toBeVisible();
    const path = await shareBox.textContent();
    const tokenMatch = path?.match(/c\/([\w-]+)/);
    expect(tokenMatch).toBeTruthy();

    // Open in a fresh, anonymous browser context
    const anon = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const anonPage = await anon.newPage();
    await anonPage.goto(`/c/${tokenMatch![1]}`);
    await expect(anonPage.getByRole("heading", { name })).toBeVisible();
    await expect(anonPage.getByText(/맛집 컬렉션/)).toBeVisible();
    await expect(anonPage.getByRole("link", { name: /시작하기/ })).toBeVisible();
    await anon.close();

    // Cleanup: delete the collection
    await page.getByRole("link", { name: /편집/ }).click();
    await page.getByRole("button", { name: "컬렉션 삭제" }).click();
  });
});
