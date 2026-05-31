// E2E: URL Import (한국 특화 #5)

import { test, expect } from "@playwright/test";
import { waitForHydration, waitForInteractive } from "./helpers";

test.describe("url import", () => {
  test("import page is reachable from capture flow", async ({ page }) => {
    await page.goto("/capture");
    await waitForHydration(page);
    const linkBtn = page.getByRole("link", { name: "링크", exact: true });
    await expect(linkBtn).toBeVisible();
    await linkBtn.click();
    await expect(page).toHaveURL(/\/import$/);
    await waitForHydration(page);
    await expect(page.getByPlaceholder(/instagram.com\/p/)).toBeVisible();
  });

  test("blocks localhost (SSRF guard)", async ({ page }) => {
    await page.goto("/import");
    await waitForInteractive(page, 'input[type="url"]');
    await waitForInteractive(page, 'button[type="submit"]');
    const input = page.getByPlaceholder(/instagram.com\/p/);
    await input.fill("http://localhost:8080/foo");
    // Give React a tick to propagate the state-driven enable
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      undefined,
      { timeout: 5_000 },
    );

    const submitBtn = page.getByRole("button", { name: "가져오기" });
    await submitBtn.click();

    await expect(page.getByText(/내부 주소는 가져올 수 없어요/)).toBeVisible({
      timeout: 15_000,
    });
  });
});
