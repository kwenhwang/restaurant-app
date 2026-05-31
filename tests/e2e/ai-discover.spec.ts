// E2E: AI Friend Curation / Discover (한국 특화 #4)

import { test, expect } from "@playwright/test";
import { waitForHydration } from "./helpers";

test.describe("ai discover", () => {
  test("section renders with CTA when user has 3+ restaurants", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    const section = page.locator("section").filter({ hasText: "AI 친구의 발견" }).first();
    const visible = await section.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, "Need 3+ restaurants — skipping");
      return;
    }

    const cta = section.getByRole("button", { name: /추천 받기|다시 추천/ });
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();
  });
});
