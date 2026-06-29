import { describe, it, expect } from "vitest";
import { buildMonthlyReport, activeMonths } from "@/lib/monthly-report";

const RESTAURANTS = [
  // Created in May
  { id: "a", name: "굴다리", category: "한식", address: "서울 강남구 ...", tier: 0 as const, created_at: "2026-05-01T00:00:00Z" },
  { id: "b", name: "교촌", category: "한식", address: "서울 강남구 ...", tier: 1 as const, created_at: "2026-05-15T00:00:00Z" },
  // Created earlier — tier 0 but pre-existing, should NOT be in favorites
  { id: "c", name: "스벅", category: "카페", address: "서울 송파구 ...", tier: 0 as const, created_at: "2026-04-01T00:00:00Z" },
];

const VISITS = [
  { restaurant_id: "a", visited_at: "2026-05-02" },
  { restaurant_id: "a", visited_at: "2026-05-03" }, // consecutive — streak 2
  { restaurant_id: "b", visited_at: "2026-05-15" },
  { restaurant_id: "c", visited_at: "2026-05-20" }, // revisit (created in April)
  { restaurant_id: "c", visited_at: "2026-04-30" }, // outside window
];

describe("monthly-report — buildMonthlyReport", () => {
  it("counts visits in window", () => {
    const r = buildMonthlyReport({ yyyymm: "2026-05", restaurants: RESTAURANTS, visits: VISITS });
    expect(r.visits).toBe(4); // 4 visits in May
    expect(r.uniqueRestaurants).toBe(3);
  });

  it("new discoveries = restaurants created in window", () => {
    const r = buildMonthlyReport({ yyyymm: "2026-05", restaurants: RESTAURANTS, visits: VISITS });
    expect(r.newDiscoveries).toBe(2); // a, b
  });

  it("revisits = visits whose restaurant was created BEFORE window", () => {
    const r = buildMonthlyReport({ yyyymm: "2026-05", restaurants: RESTAURANTS, visits: VISITS });
    expect(r.revisits).toBe(1); // 'c' visited 5-20 was created in April
  });

  it("topVisited orders by visit count", () => {
    const r = buildMonthlyReport({ yyyymm: "2026-05", restaurants: RESTAURANTS, visits: VISITS });
    expect(r.topVisited[0].id).toBe("a");
    expect(r.topVisited[0].visits).toBe(2);
  });

  it("favorites picks tier 0 (좋아함) NEW discoveries only", () => {
    const r = buildMonthlyReport({ yyyymm: "2026-05", restaurants: RESTAURANTS, visits: VISITS });
    const ids = r.favorites.map((f) => f.id);
    expect(ids).toContain("a");      // tier 0 created in May
    expect(ids).not.toContain("c");  // tier 0 but pre-existing
  });

  it("longest streak detects consecutive days", () => {
    const r = buildMonthlyReport({ yyyymm: "2026-05", restaurants: RESTAURANTS, visits: VISITS });
    expect(r.longestStreak).toBe(2); // May 2-3
  });

  it("hasData false for empty month", () => {
    const r = buildMonthlyReport({ yyyymm: "2026-03", restaurants: RESTAURANTS, visits: VISITS });
    expect(r.hasData).toBe(false);
    expect(r.visits).toBe(0);
  });

  it("topRegion extracts 구 from addresses", () => {
    const r = buildMonthlyReport({ yyyymm: "2026-05", restaurants: RESTAURANTS, visits: VISITS });
    // a, b are 강남구; c is 송파구 — 강남구 wins (2 vs 1)
    expect(r.topRegion).toBe("강남구");
  });

  it("tierBreakdown counts visited restaurants by tier", () => {
    const r = buildMonthlyReport({ yyyymm: "2026-05", restaurants: RESTAURANTS, visits: VISITS });
    expect(r.tierBreakdown.loved).toBe(2); // a, c
    expect(r.tierBreakdown.ok).toBe(1);     // b
    expect(r.tierBreakdown.meh).toBe(0);
  });
});

describe("monthly-report — activeMonths", () => {
  it("returns months from visits + restaurant creation, most recent first", () => {
    const months = activeMonths(VISITS, RESTAURANTS);
    expect(months[0]).toBe("2026-05");
    expect(months).toContain("2026-04");
  });
});
