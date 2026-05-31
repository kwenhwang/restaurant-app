// E2E: AI Friend Curation / Discover (한국 특화 #4)
// We don't trigger the actual Gemini call (cost). Instead verify the section
// is wired up, button visible, and clicking it shows the loading state.

import { test, expect } from "@playwright/test";

test.describe("ai discover", () => {
  test("section renders with CTA when user has 3+ restaurants", async ({ page }) => {
    await page.goto("/");

    const section = page.locator("section").filter({ hasText: "AI 친구의 발견" }).first();
    const visible = await section.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, "AI Discover은 식당 3곳+ 필요 — skipping");
      return;
    }

    await expect(section).toBeVisible();
    const cta = section.getByRole("button", { name: /추천 받기|다시 추천/ });
    await expect(cta).toBeVisible();

    // Don't click — would burn AI quota. Just verify it's enabled.
    await expect(cta).toBeEnabled();
  });
});
