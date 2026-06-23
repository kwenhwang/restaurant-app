// E2E: memo edit flow on /restaurants/[id]
// Uses a throwaway restaurant created via REST so the real user's data
// stays untouched. force-delete in finally cleans up even on failure.

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

async function forceDelete(id: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/restaurants?id=eq.${id}`, {
    method: "DELETE",
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
  });
}

test.describe("memo edit", () => {
  test("inline memo edit on detail page persists across reload", async ({ page }) => {
    const userId = await findUserId();
    // Keep the restaurant NAME stable so the stamp lives only in the memo,
    // making the post-save visibility check unambiguous.
    const stamp = `memostamp-${Date.now()}`;
    const restaurantId = await insertRestaurant(userId, `E2E throwaway`);

    try {
      await page.goto(`/restaurants/${restaurantId}`);
      await waitForHydration(page);

      const memo = `E2E 테스트 메모 ${stamp}`;

      // Empty-state shows "메모 추가"; existing memo shows "메모 편집"
      const addBtn = page.getByRole("button", { name: /메모 추가/ });
      const editBtn = page.getByRole("button", { name: /메모 편집/ });
      if ((await addBtn.count()) > 0) {
        await addBtn.click();
      } else {
        await editBtn.first().click();
      }

      const textarea = page.locator("textarea").first();
      await expect(textarea).toBeVisible();
      await textarea.fill(memo);
      await page.getByRole("button", { name: "저장", exact: true }).click();

      // Reload to confirm DB write took effect
      await page.waitForTimeout(800);
      await page.reload();
      await waitForHydration(page);
      await expect(page.getByText(stamp)).toBeVisible();
    } finally {
      await forceDelete(restaurantId);
    }
  });
});
