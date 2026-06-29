import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { pickRevisitCandidates } from "@/lib/revisit";

// Freeze time for deterministic days_since calculations
const FROZEN = new Date("2026-06-15T00:00:00.000Z");

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FROZEN);
});
afterAll(() => {
  vi.useRealTimers();
});

const old = "2026-04-01"; // ~75 days before
const recent = "2026-06-10"; // 5 days before

describe("revisit — gating", () => {
  it("requires favorite OR tier 0 (좋아함)", () => {
    const out = pickRevisitCandidates(
      [
        { id: "mid", name: "A", tier: 1, last_visit: old },
        { id: "fav", name: "B", tier: 2, is_favorite: true, last_visit: old },
        { id: "love", name: "C", tier: 0, last_visit: old },
      ],
      5,
    );
    const ids = out.map((c) => c.id);
    expect(ids).not.toContain("mid");
    expect(ids).toContain("fav");
    expect(ids).toContain("love");
  });

  it("must be 30+ days since last visit", () => {
    const out = pickRevisitCandidates(
      [
        { id: "fresh", name: "A", tier: 0, last_visit: recent },
        { id: "stale", name: "B", tier: 0, last_visit: old },
      ],
      5,
    );
    expect(out.map((c) => c.id)).toEqual(["stale"]);
  });
});

describe("revisit — scoring", () => {
  it("favorite + tier 0 + months-ago wins over plain tier 0", () => {
    const out = pickRevisitCandidates(
      [
        { id: "elite", name: "A", tier: 0, is_favorite: true, last_visit: old },
        { id: "plain", name: "B", tier: 0, last_visit: old },
      ],
      5,
    );
    expect(out[0].id).toBe("elite");
  });

  it("never-visited treated as 60 days (threshold met)", () => {
    const out = pickRevisitCandidates(
      [{ id: "never", name: "A", tier: 0, last_visit: null }],
      5,
    );
    expect(out).toHaveLength(1);
    expect(out[0].days_since).toBe(60);
  });
});

describe("revisit — wishlist", () => {
  it("wishlist + never visited becomes candidate immediately (no 30-day wait)", () => {
    const out = pickRevisitCandidates(
      [{ id: "w", name: "찜집", tier: null, is_wishlist: true, last_visit: null }],
      5,
    );
    expect(out).toHaveLength(1);
    expect(out[0].is_wishlist).toBe(true);
    expect(out[0].days_since).toBe(9999);
  });

  it("wishlist scores between favorite and plain tier 0", () => {
    const out = pickRevisitCandidates(
      [
        { id: "fav", name: "F", tier: 0, is_favorite: true, last_visit: old },
        { id: "wish", name: "W", tier: null, is_wishlist: true, last_visit: null },
        { id: "rate", name: "R", tier: 0, last_visit: old },
      ],
      5,
    );
    // Favorite (60 + 35 + age) beats wish (45 + 24 cap). Wish beats plain tier 0.
    const ids = out.map((c) => c.id);
    expect(ids[0]).toBe("fav");
    expect(ids).toContain("wish");
  });

  it("non-wishlist non-favorite non-loved excluded", () => {
    const out = pickRevisitCandidates(
      [{ id: "mid", name: "L", tier: 1, last_visit: old }],
      5,
    );
    expect(out).toHaveLength(0);
  });
});

describe("revisit — limit", () => {
  it("returns at most `limit` candidates", () => {
    const rs = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      name: `R${i}`,
      tier: 0 as const,
      last_visit: old,
    }));
    expect(pickRevisitCandidates(rs, 3)).toHaveLength(3);
  });
});
