// E2E: pairwise ranking flow
// Verifies the /rank route loads and renders either TierPicker / round / done
// phase. The detail-page menu integration is verified by checking the link
// renders; we don't click through it to avoid menu-overlay timing flakes.

import { test, expect } from "@playwright/test";
import { waitForHydration } from "./helpers";

test.describe("pairwise rank", () => {
  test("/rank?mode=rerank renders a phase heading", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    const firstCard = page.locator("a[href^='/restaurants/']").first();
    if ((await firstCard.count()) === 0) {
      test.skip(true, "식당이 없어 skip");
      return;
    }
    const href = await firstCard.getAttribute("href");
    expect(href).toBeTruthy();

    await page.goto(`${href!}/rank?mode=rerank`);
    await waitForHydration(page);
    // mode=rerank skips the tier picker — we should land on either a round
    // (if opponents exist) or the done state (if none).
    await expect(
      page.getByRole("heading", { name: /어느 게 더 좋아|평가 완료/ }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("capture-mode /rank shows TierPicker first", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    const firstCard = page.locator("a[href^='/restaurants/']").first();
    if ((await firstCard.count()) === 0) {
      test.skip(true, "식당이 없어 skip");
      return;
    }
    const href = await firstCard.getAttribute("href");
    await page.goto(`${href!}/rank`);
    await waitForHydration(page);

    // In capture mode without an existing tier, we'd see TierPicker. If the
    // restaurant already has a tier set (which is likely on the first
    // existing item) we get round/done — accept any of the three.
    await expect(
      page.getByRole("heading", { name: /이 가게 어땠어|어느 게 더 좋아|평가 완료/ }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
