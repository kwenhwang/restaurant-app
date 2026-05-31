// E2E: Blog Reviews AI Summary (한국 특화 #1)
// We don't actually call Gemini (it would burn quota every run). Instead we
// verify the section renders + the CTA button is wired up. If a cached
// review already exists for a restaurant, we verify the rendered content.

import { test, expect } from "@playwright/test";

test.describe("blog reviews section", () => {
  test("renders on restaurant detail page", async ({ page }) => {
    await page.goto("/");

    // Open the first restaurant card.
    const firstCard = page.locator("a[href^='/restaurants/']").first();
    if ((await firstCard.count()) === 0) {
      test.skip(true, "No restaurants registered — skipping");
      return;
    }
    await firstCard.click();
    await expect(page).toHaveURL(/\/restaurants\/[a-f0-9-]{36}/);

    // 블로그 후기 section header
    const heading = page.getByRole("heading", { name: "블로그 후기" });
    await expect(heading).toBeVisible();

    // Either the CTA button or the cached content is visible
    const cta = page.getByRole("button", { name: /블로그 후기 요약/ });
    const cached = page.getByText(/👍 좋은 점|✨ 하이라이트/);
    const ctaCount = await cta.count();
    const cachedCount = await cached.count();
    expect(ctaCount + cachedCount).toBeGreaterThan(0);
  });
});
