// One-time auth setup.
//
// On first run (no .auth/user.json), Playwright opens a real browser, you
// log in with Google, and the resulting cookies are saved. Subsequent test
// runs reuse them — no OAuth flow.
//
// Run manually once:  HEADED=1 pnpm test:e2e:auth
// Re-auth when session expires (cookies last ~1 month for Supabase).

import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const AUTH_FILE = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  // Skip if a session file already exists and is fresh (< 25 days)
  if (fs.existsSync(AUTH_FILE)) {
    const stat = fs.statSync(AUTH_FILE);
    const ageDays = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24);
    if (ageDays < 25) {
      console.log(`[auth] reusing existing session (${ageDays.toFixed(1)} days old)`);
      return;
    }
    console.log(`[auth] session is ${ageDays.toFixed(1)} days old, re-authenticating`);
  }

  // First-time login requires HEADED=1 so the user can complete OAuth.
  if (!process.env.HEADED) {
    throw new Error(
      `Auth state missing at ${AUTH_FILE}. Run once with: HEADED=1 pnpm test:e2e:auth`,
    );
  }

  await page.goto("/login");
  await page.getByRole("button", { name: /Google/i }).click();

  // The user completes Google OAuth in the opened browser.
  // We wait for the redirect back to home (/) after success.
  await page.waitForURL("**/", { timeout: 120_000 });

  // Sanity check: home shows the user's avatar or restaurant grid
  await expect(page.locator("body")).toContainText(/맛집|환영/, { timeout: 30_000 });

  await page.context().storageState({ path: AUTH_FILE });
  console.log(`[auth] saved session to ${AUTH_FILE}`);
});
