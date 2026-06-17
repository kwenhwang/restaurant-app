import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { getPremiumStatus, isPremium, requirePremiumOrThrow, PremiumRequiredError } from "@/lib/premium";

// Freeze time so trial/period checks are deterministic.
const NOW = new Date("2026-06-15T12:00:00Z");
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterAll(() => {
  vi.useRealTimers();
});

const FUTURE = "2026-07-15T12:00:00Z";
const PAST = "2026-05-15T12:00:00Z";

/**
 * Minimal Supabase stub. Returns whatever rows we hand it via the
 * `current_subscription` view. Only the chain
 *   .from(view).select(...).eq(user_id).maybeSingle()
 * is used by getPremiumStatus.
 */
function mockSupabase(row: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: async () => ({ data: row, error: null }),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { from: () => chain } as any;
}

describe("premium — getPremiumStatus", () => {
  it("returns null when no row", async () => {
    const status = await getPremiumStatus(mockSupabase(null), "u1");
    expect(status).toBeNull();
  });

  it("trialing uses trial_end_at; active when in future", async () => {
    const status = await getPremiumStatus(
      mockSupabase({ status: "trialing", plan: "premium-monthly", trial_end_at: FUTURE, current_period_end: null }),
      "u1",
    );
    expect(status).not.toBeNull();
    expect(status!.status).toBe("trialing");
    expect(status!.until).toBe(FUTURE);
  });

  it("active uses current_period_end", async () => {
    const status = await getPremiumStatus(
      mockSupabase({ status: "active", plan: "premium-yearly", trial_end_at: PAST, current_period_end: FUTURE }),
      "u1",
    );
    expect(status!.plan).toBe("premium-yearly");
    expect(status!.until).toBe(FUTURE);
  });

  it("returns null when expiry is in the past", async () => {
    const status = await getPremiumStatus(
      mockSupabase({ status: "active", plan: "premium-monthly", trial_end_at: null, current_period_end: PAST }),
      "u1",
    );
    expect(status).toBeNull();
  });

  it("returns null when expiry is missing", async () => {
    const status = await getPremiumStatus(
      mockSupabase({ status: "active", plan: "premium-monthly", trial_end_at: null, current_period_end: null }),
      "u1",
    );
    expect(status).toBeNull();
  });
});

describe("premium — isPremium / requirePremiumOrThrow", () => {
  it("isPremium true when status present", async () => {
    expect(
      await isPremium(
        mockSupabase({ status: "active", plan: "premium-monthly", trial_end_at: null, current_period_end: FUTURE }),
        "u1",
      ),
    ).toBe(true);
  });

  it("isPremium false when missing", async () => {
    expect(await isPremium(mockSupabase(null), "u1")).toBe(false);
  });

  it("requirePremiumOrThrow throws when not premium", async () => {
    await expect(requirePremiumOrThrow(mockSupabase(null), "u1")).rejects.toBeInstanceOf(PremiumRequiredError);
  });
});
