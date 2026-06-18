// E2E: restaurant delete flow
// Creates a throwaway restaurant via the REST API (no UI capture flow,
// avoids polluting other tests with extra cards), then deletes via the
// detail-page actions menu. Verifies the row is GONE from the DB and the
// page redirects.

import { test, expect } from "@playwright/test";
import { waitForHydration } from "./helpers";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const E2E_EMAIL = process.env.E2E_TEST_EMAIL ?? "kwenhwang@gmail.com";

test.describe("restaurant delete", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.accept().catch(() => {}));
  });

  test("delete via actions menu removes restaurant and redirects home", async ({ page }) => {
    // Find the test user's id
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: users } = await admin.auth.admin.listUsers();
    const userId = users.users.find((u) => u.email === E2E_EMAIL)?.id;
    expect(userId, "test user must exist").toBeTruthy();

    // Insert a throwaway restaurant via service role
    const stamp = `e2e-delete-${Date.now()}`;
    const { data: created, error: createErr } = await admin
      .from("restaurants")
      .insert({
        user_id: userId,
        name: stamp,
        category: "기타",
      })
      .select("id")
      .single();
    expect(createErr).toBeNull();
    const restaurantId = created!.id as string;

    // Also seed a restaurant_scores row so the detail page can render
    await admin.from("restaurant_scores").upsert({
      restaurant_id: restaurantId,
      user_id: userId,
      elo: 1000,
      comparisons_count: 0,
      tier: null,
    });

    try {
      await page.goto(`/restaurants/${restaurantId}`);
      await waitForHydration(page);

      await page.getByRole("button", { name: "더보기" }).click();
      await page.getByRole("button", { name: "삭제", exact: true }).click();
      // Confirmation modal — click confirm button (also "삭제")
      const confirmBtn = page.getByRole("button", { name: "삭제", exact: true }).last();
      await confirmBtn.click();

      // Should land on home
      await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });

      // DB check — restaurant must be gone
      const { data: stillThere } = await admin
        .from("restaurants")
        .select("id")
        .eq("id", restaurantId)
        .maybeSingle();
      expect(stillThere).toBeNull();
    } finally {
      // Belt-and-suspenders: if anything failed mid-test, force-clean
      await admin.from("restaurants").delete().eq("id", restaurantId);
    }
  });
});
