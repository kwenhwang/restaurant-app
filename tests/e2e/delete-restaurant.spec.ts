// E2E: restaurant delete flow
// Creates a throwaway restaurant via direct REST calls to the Supabase
// admin endpoints (no @supabase/supabase-js to avoid Node-20 realtime/ws
// init issues on CI). Then deletes it via the detail-page actions menu
// and verifies the DB row is gone.

import { test, expect } from "@playwright/test";
import { waitForHydration } from "./helpers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const E2E_EMAIL = process.env.E2E_TEST_EMAIL ?? "kwenhwang@gmail.com";

const adminHeaders = {
  apikey: SERVICE_ROLE,
  Authorization: `Bearer ${SERVICE_ROLE}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function findUserId(): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=200`, {
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
  });
  const json = (await res.json()) as { users?: { id: string; email: string }[] };
  const u = (json.users ?? []).find((x) => x.email === E2E_EMAIL);
  if (!u) throw new Error(`test user ${E2E_EMAIL} not found`);
  return u.id;
}

async function insertRestaurant(userId: string, name: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/restaurants`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ user_id: userId, name, category: "기타" }),
  });
  if (!res.ok) throw new Error(`insert failed: ${res.status} ${await res.text()}`);
  const rows = (await res.json()) as { id: string }[];
  return rows[0].id;
}

async function getRestaurant(id: string): Promise<unknown | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/restaurants?id=eq.${id}&select=id`, {
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
  });
  const rows = (await res.json()) as unknown[];
  return rows[0] ?? null;
}

async function forceDelete(id: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/restaurants?id=eq.${id}`, {
    method: "DELETE",
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
  });
}

test.describe("restaurant delete", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.accept().catch(() => {}));
  });

  test("delete via actions menu removes restaurant and redirects home", async ({ page }) => {
    const userId = await findUserId();
    const stamp = `e2e-delete-${Date.now()}`;
    const restaurantId = await insertRestaurant(userId, stamp);

    try {
      await page.goto(`/restaurants/${restaurantId}`);
      await waitForHydration(page);

      await page.getByRole("button", { name: "더보기" }).click();
      await page.getByRole("button", { name: "삭제", exact: true }).click();
      // Confirmation modal — click the confirm button (also labeled "삭제")
      const confirmBtn = page.getByRole("button", { name: "삭제", exact: true }).last();
      await confirmBtn.click();

      await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });

      // Verify DB
      const still = await getRestaurant(restaurantId);
      expect(still).toBeNull();
    } finally {
      await forceDelete(restaurantId);
    }
  });
});
