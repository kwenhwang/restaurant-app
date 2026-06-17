// E2E: memo edit flow on /restaurants/[id]/edit
// Regression test for the RestaurantForm prefix bug — before the fix the
// memo field (and others) were silently dropped because React's RSC
// progressive-enhancement renamed form fields to _1_note.

import { test, expect } from "@playwright/test";
import { waitForHydration, waitForInteractive } from "./helpers";

test.describe("memo edit", () => {
  test("inline memo edit on detail page persists across reload", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    const firstCard = page.locator("a[href^='/restaurants/']").first();
    if ((await firstCard.count()) === 0) {
      test.skip(true, "식당이 없어 skip");
      return;
    }
    const href = await firstCard.getAttribute("href");
    expect(href).toBeTruthy();

    await page.goto(href!);
    await waitForHydration(page);

    const stamp = `playwright-${Date.now()}`;
    const memo = `E2E 테스트 메모 ${stamp}`;

    // Tap into edit mode — either via the empty-state "메모 추가" button or
    // by tapping the existing memo card to enter edit mode.
    const addBtn = page.getByRole("button", { name: /메모 추가/ });
    const editBtn = page.getByRole("button", { name: /메모 편집/ });
    if (await addBtn.count() > 0) {
      await addBtn.click();
    } else {
      await editBtn.first().click();
    }

    // Replace value
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    await textarea.fill(memo);
    await page.getByRole("button", { name: "저장", exact: true }).click();

    // Verify it's persisted by reloading
    await page.waitForTimeout(800);
    await page.reload();
    await waitForHydration(page);
    await expect(page.getByText(stamp)).toBeVisible();
  });
});
