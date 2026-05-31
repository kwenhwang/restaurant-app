// One-time auth setup.
//
// Headless mode (server-friendly): uses Supabase service role to mint a
// magic-link, hits GoTrue's GET /verify to redeem it, parses the
// access_token + refresh_token from the redirect hash, and plants the
// @supabase/ssr cookie on the app domain.
//
// Headed mode (HEADED=1): opens a real browser for Google OAuth.
//
// Result is written to tests/e2e/.auth/user.json and reused on subsequent
// runs until ~25 days old.

import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const AUTH_FILE = path.join(__dirname, ".auth/user.json");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "kwenhwang@gmail.com";

function ageDays(p: string): number {
  try {
    const stat = fs.statSync(p);
    return (Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24);
  } catch {
    return Infinity;
  }
}

setup("authenticate", async ({ page, baseURL }) => {
  if (fs.existsSync(AUTH_FILE) && ageDays(AUTH_FILE) < 25) {
    console.log(`[auth] reusing existing session (${ageDays(AUTH_FILE).toFixed(1)} days old)`);
    return;
  }

  if (process.env.HEADED) {
    await page.goto("/login");
    await page.getByRole("button", { name: /Google/i }).click();
    await page.waitForURL("**/", { timeout: 120_000 });
    await expect(page.locator("body")).toContainText(/맛집|환영/, { timeout: 30_000 });
    await page.context().storageState({ path: AUTH_FILE });
    console.log(`[auth] saved session (headed) to ${AUTH_FILE}`);
    return;
  }

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required.\n" +
        "Run: set -a && source .env.local && set +a && pnpm test:e2e",
    );
  }

  // 1. Mint a fresh magic-link via admin API
  const genRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "magiclink",
      email: TEST_EMAIL,
      options: { redirect_to: baseURL },
    }),
  });
  if (!genRes.ok) {
    throw new Error(`generate_link failed: ${genRes.status} ${(await genRes.text()).slice(0, 200)}`);
  }
  const linkJson = await genRes.json();
  const hashedToken: string = linkJson.hashed_token ?? linkJson.properties?.hashed_token;
  if (!hashedToken) throw new Error(`no hashed_token in response`);
  console.log("[auth] minted magic-link");

  // 2. Redeem the token. GoTrue returns 303 with tokens in the URL hash.
  const verifyUrl = `${SUPABASE_URL}/auth/v1/verify?token=${hashedToken}&type=magiclink&redirect_to=${encodeURIComponent(baseURL!)}`;
  const verifyRes = await fetch(verifyUrl, { redirect: "manual" });
  if (verifyRes.status !== 303 && verifyRes.status !== 302) {
    throw new Error(`verify expected 303, got ${verifyRes.status}: ${(await verifyRes.text()).slice(0, 200)}`);
  }
  const location = verifyRes.headers.get("location");
  if (!location || !location.includes("#")) {
    throw new Error(`verify redirect missing hash: ${location}`);
  }
  const hash = location.split("#")[1];
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const expiresIn = parseInt(params.get("expires_in") ?? "3600", 10);
  const expiresAt = parseInt(params.get("expires_at") ?? "0", 10);
  if (!accessToken || !refreshToken) {
    throw new Error(`no tokens in verify hash: ${hash.slice(0, 100)}`);
  }
  console.log("[auth] redeemed token for session");

  // 3. Fetch the user payload so the SSR cookie passes the same shape as
  //    a normal browser login.
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const userJson = userRes.ok ? await userRes.json() : null;

  const sessionPayload = {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: expiresIn,
    expires_at: expiresAt || Math.floor(Date.now() / 1000) + expiresIn,
    refresh_token: refreshToken,
    user: userJson,
  };

  // 4. Plant the SSR cookie. @supabase/ssr v0.10.x stores either raw JSON or
  //    `base64-<base64(JSON)>` — we use base64 since values often exceed
  //    cookie size limits when the user payload is large.
  const projectRef = projectRefFromUrl(SUPABASE_URL);
  const cookieName = `sb-${projectRef}-auth-token`;
  const json = JSON.stringify(sessionPayload);
  const value = "base64-" + Buffer.from(json, "utf-8").toString("base64");

  const appUrl = new URL(baseURL!);
  const cookies = chunkCookie(cookieName, value).map((c) => ({
    name: c.name,
    value: c.value,
    domain: appUrl.hostname,
    path: "/",
    httpOnly: false,
    secure: appUrl.protocol === "https:",
    sameSite: "Lax" as const,
    expires: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  }));

  await page.context().addCookies(cookies);
  console.log(`[auth] planted ${cookies.length} cookie chunk(s) named ${cookieName}*`);

  // 4b. Pre-seed localStorage so the LocationConsent modal doesn't intercept
  //     pointer events during tests. We can't write localStorage before any
  //     page is loaded, so go to the app first, then write.
  await page.goto("/");
  await page.evaluate(() => {
    try { localStorage.setItem("location-consent", "denied"); } catch {}
  });

  // 5. Smoke check
  const resp = await page.goto("/");
  console.log(`[auth] GET / → ${resp?.status()} ${page.url()}`);
  if (page.url().includes("/login")) {
    throw new Error(`Cookie was rejected — landed on /login. Cookie name or projectRef may differ.`);
  }
  await expect(page.locator("body")).toContainText(/맛집|환영/, { timeout: 15_000 });

  await page.context().storageState({ path: AUTH_FILE });
  console.log(`[auth] saved session to ${AUTH_FILE}`);
});

const COOKIE_CHUNK_SIZE = 3180;

function chunkCookie(name: string, value: string): { name: string; value: string }[] {
  if (value.length <= COOKIE_CHUNK_SIZE) return [{ name, value }];
  const chunks: { name: string; value: string }[] = [];
  for (let i = 0; i * COOKIE_CHUNK_SIZE < value.length; i++) {
    chunks.push({
      name: `${name}.${i}`,
      value: value.slice(i * COOKIE_CHUNK_SIZE, (i + 1) * COOKIE_CHUNK_SIZE),
    });
  }
  return chunks;
}

function projectRefFromUrl(url: string): string {
  const host = new URL(url).hostname;
  const cloud = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
  if (cloud) return cloud[1];
  return host.split(".")[0].toLowerCase();
}
