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
  it("requires favorite OR rating >= 4", () => {
    const out = pickRevisitCandidates(
      [
        { id: "low", name: "A", rating: 3, last_visit: old },
        { id: "fav", name: "B", rating: 2, is_favorite: true, last_visit: old },
        { id: "high", name: "C", rating: 4, last_visit: old },
      ],
      5,
    );
    const ids = out.map((c) => c.id);
    expect(ids).not.toContain("low");
    expect(ids).toContain("fav");
    expect(ids).toContain("high");
  });

  it("must be 30+ days since last visit", () => {
    const out = pickRevisitCandidates(
      [
        { id: "fresh", name: "A", rating: 5, last_visit: recent },
        { id: "stale", name: "B", rating: 5, last_visit: old },
      ],
      5,
    );
    expect(out.map((c) => c.id)).toEqual(["stale"]);
  });
});

describe("revisit — scoring", () => {
  it("favorite + 5★ + months-ago wins over plain 4★", () => {
    const out = pickRevisitCandidates(
      [
        { id: "elite", name: "A", rating: 5, is_favorite: true, last_visit: old },
        { id: "plain", name: "B", rating: 4, last_visit: old },
      ],
      5,
    );
    expect(out[0].id).toBe("elite");
  });

  it("never-visited treated as 60 days (threshold met)", () => {
    const out = pickRevisitCandidates(
      [{ id: "never", name: "A", rating: 5, last_visit: null }],
      5,
    );
    expect(out).toHaveLength(1);
    expect(out[0].days_since).toBe(60);
  });
});

describe("revisit — limit", () => {
  it("returns at most `limit` candidates", () => {
    const rs = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      name: `R${i}`,
      rating: 5,
      last_visit: old,
    }));
    expect(pickRevisitCandidates(rs, 3)).toHaveLength(3);
  });
});
