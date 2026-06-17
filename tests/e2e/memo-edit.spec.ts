// E2E: memo edit flow on /restaurants/[id]/edit
// Regression test for the RestaurantForm prefix bug — before the fix the
// memo field (and others) were silently dropped because React's RSC
// progressive-enhancement renamed form fields to _1_note.

import { test, expect } from "@playwright/test";
import { waitForHydration, waitForInteractive } from "./helpers";

test.describe("memo edit", () => {
  test("editing the memo persists across reload", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    const firstCard = page.locator("a[href^='/restaurants/']").first();
    if ((await firstCard.count()) === 0) {
      test.skip(true, "식당이 없어 skip");
      return;
    }
    const href = await firstCard.getAttribute("href");
    expect(href).toBeTruthy();

    await page.goto(`${href!}/edit`);
    await waitForInteractive(page, 'textarea[name="note"]');

    const stamp = `playwright-${Date.now()}`;
    const memo = `이건 E2E 테스트 메모입니다 ${stamp}`;
    await page.locator('textarea[name="note"]').fill(memo);

    // Submit button enabled after fill (depends on name not being empty —
    // which it isn't, the page loaded with existing restaurant data)
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      undefined,
      { timeout: 5_000 },
    );
    await page.getByRole("button", { name: /수정 저장/ }).click();

    // Should land on the detail page
    await expect(page).toHaveURL(new RegExp(`${href!}$`));
    // router.refresh might serve cached page; reload to confirm DB write
    await page.reload();
    await waitForHydration(page);
    await expect(page.getByText(stamp)).toBeVisible();
  });
});
