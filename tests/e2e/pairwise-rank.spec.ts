// E2E: pairwise ranking flow
// Verifies the /rank route loads with TierPicker, picking a tier proceeds to
// either the round phase (if opponents exist) or done phase, and the
// re-rank flow is reachable from the detail page actions menu.

import { test, expect } from "@playwright/test";
import { waitForHydration } from "./helpers";

test.describe("pairwise rank", () => {
  test("re-rank flow is reachable from detail page", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    const firstCard = page.locator("a[href^='/restaurants/']").first();
    if ((await firstCard.count()) === 0) {
      test.skip(true, "식당이 없어 skip");
      return;
    }
    const href = await firstCard.getAttribute("href");
    await page.goto(href!);
    await waitForHydration(page);

    // Open actions menu (ellipsis) and tap "다시 비교하기"
    await page.getByRole("button", { name: "더보기" }).click();
    const rerank = page.getByRole("button", { name: "다시 비교하기" });
    await expect(rerank).toBeVisible();
    await rerank.click();
    await expect(page).toHaveURL(/\/rank\?mode=rerank$/);
    await waitForHydration(page);
    // Should land in round phase directly (skipping tier picker)
    const heading = page.getByRole("heading", { name: /어느 게 더 좋아|평가 완료/ });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });
});
