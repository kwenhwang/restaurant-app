// E2E: Blog Reviews AI Summary (한국 특화 #1)

import { test, expect } from "@playwright/test";
import { waitForHydration } from "./helpers";

test.describe("blog reviews section", () => {
  test("renders on restaurant detail page", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    const firstCard = page.locator("a[href^='/restaurants/']").first();
    if ((await firstCard.count()) === 0) {
      test.skip(true, "No restaurants — skipping");
      return;
    }

    const href = await firstCard.getAttribute("href");
    expect(href).toBeTruthy();
    await page.goto(href!);
    await waitForHydration(page);

    await expect(page.getByRole("heading", { name: "블로그 후기" })).toBeVisible();

    const cta = page.getByRole("button", { name: /블로그 후기 요약/ });
    const cached = page.getByText(/👍 좋은 점|✨ 하이라이트/);
    const ctaCount = await cta.count();
    const cachedCount = await cached.count();
    expect(ctaCount + cachedCount).toBeGreaterThan(0);
  });
});
