import { chromium } from "playwright";
import { createServerClient } from "@supabase/ssr";
import { readFileSync } from "fs";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && v.length) process.env[k.trim()] = v.join("=").trim();
}

const cookies = new Map();
const sb = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { cookies: { getAll(){return [...cookies].map(([n,v])=>({name:n,value:v}));}, setAll(a){a.forEach(({name,value})=>cookies.set(name,value));} } }
);
const email = "shot-" + Date.now() + "@example.com";
const su = await sb.auth.signUp({ email, password: "test12345!" });
const userId = su.data.session.user.id;

// Add some sample restaurants so the page is populated
for (const r of [
  { name: "강남 분식", category: "한식", rating: 4, is_favorite: true },
  { name: "이태원 카페", category: "카페", rating: 5, is_favorite: false },
  { name: "마포 술집", category: "술집", rating: 3, is_favorite: false },
]) {
  await sb.from("restaurants").insert({ ...r, user_id: userId });
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, // iPhone 14
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
});

// Inject cookies
const cookieArray = [...cookies.entries()].map(([name, value]) => ({
  name, value, domain: "eatlog.duckdns.org", path: "/",
}));
await ctx.addCookies(cookieArray);

const page = await ctx.newPage();

for (const path of ["/", "/profile", "/capture"]) {
  await page.goto("https://eatlog.duckdns.org" + path, { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(2000); // let client components hydrate
  const name = path.replace(/\//g, "_") || "_home";
  await page.screenshot({ path: `/tmp/shot${name}.png`, fullPage: true });
  console.log(`✓ /tmp/shot${name}.png`);
}

await browser.close();

// Cleanup
const { data: rs } = await sb.from("restaurants").select("id").eq("user_id", userId);
for (const r of rs ?? []) await sb.from("restaurants").delete().eq("id", r.id);
console.log("Done");
