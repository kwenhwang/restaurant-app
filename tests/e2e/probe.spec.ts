import { test } from "@playwright/test";

test("probe form submit network", async ({ page }) => {
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("collections")) {
      console.log("[POST]", r.url(), "post-data:", r.postData()?.slice(0, 300));
    }
  });
  page.on("response", (r) => {
    if (r.request().method() === "POST" && r.url().includes("collections")) {
      console.log("[RES]", r.status(), r.url().slice(0, 100));
    }
  });
  page.on("console", (m) => console.log("[B]", m.type(), m.text().slice(0, 200)));

  await page.goto("/collections/new");
  await page.waitForTimeout(4000);

  await page.locator('input[name="name"]').fill("MY TEST NAME");
  console.log("filled name");

  const v = await page.locator('input[name="name"]').inputValue();
  console.log("value after fill:", v);

  await page.getByRole("button", { name: "만들기" }).click();
  await page.waitForTimeout(5000);

  console.log("final URL:", page.url());
  const v2 = await page.locator('input[name="name"]').inputValue().catch(() => "(unavailable)");
  console.log("value after submit:", v2);
});
