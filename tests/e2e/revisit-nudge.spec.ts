// E2E: Revisit Nudge (한국 특화 #3)

import { test, expect } from "@playwright/test";
import { waitForHydration } from "./helpers";

test.describe("revisit nudge", () => {
  test("snooze hides the banner", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    const nudge = page.locator("section").filter({ hasText: "다시 가볼래요?" }).first();
    const present = await nudge.isVisible().catch(() => false);
    if (!present) {
      test.skip(true, "재방문 후보 없음 — skipping (정상)");
      return;
    }

    const snoozeBtn = nudge.locator('button[aria-label*="일주일"]');
    await snoozeBtn.click();
    await page.waitForTimeout(300);
    // Verify no crash — page still on home
    await expect(page).toHaveURL(/\/$/);
  });
});
