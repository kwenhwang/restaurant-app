// E2E: inline AI feedback thumbs
// Verifies POST /api/feedback round-trip + idempotent toggle.

import { test, expect } from "@playwright/test";
import { waitForHydration } from "./helpers";

test.describe("feedback", () => {
  test("API: upsert and toggle-off via vote=0", async ({ request }) => {
    // Authed via the same storageState (cookies attached to /api/feedback).
    // We call the API directly with a synthetic target so we don't accidentally
    // pollute production restaurant rows.
    const target = `e2e-test-${Date.now()}`;

    const upRes = await request.post("/api/feedback", {
      data: {
        surface: "review",
        target_ref: target,
        vote: 1,
        prompt_context: { summary: "테스트 요약" },
      },
    });
    expect(upRes.ok()).toBeTruthy();
    const upJson = await upRes.json();
    expect(upJson.vote).toBe(1);

    // Toggle off
    const offRes = await request.post("/api/feedback", {
      data: { surface: "review", target_ref: target, vote: 0 },
    });
    expect(offRes.ok()).toBeTruthy();
    const offJson = await offRes.json();
    expect(offJson.vote).toBe(0);
  });

  test("API: invalid surface rejected", async ({ request }) => {
    const res = await request.post("/api/feedback", {
      data: { surface: "spam", target_ref: "x", vote: 1 },
    });
    expect(res.status()).toBe(400);
  });
});
