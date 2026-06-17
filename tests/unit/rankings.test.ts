import { describe, it, expect } from "vitest";
import { score, rankAll, rankAllByElo, percentile, rankTone } from "@/lib/rankings";

describe("rankings — score", () => {
  it("rating × 20 + min(visits, 10) × 2", () => {
    expect(score({ rating: 5, visit_count: 3 })).toBe(106);
    expect(score({ rating: 4, visit_count: 0 })).toBe(80);
    expect(score({ rating: null, visit_count: 5 })).toBe(10);
    // visit cap at 10
    expect(score({ rating: 0, visit_count: 100 })).toBe(20);
  });
});

describe("rankings — rankAll", () => {
  it("sorts by score desc, then visits, then created_at asc", () => {
    const m = rankAll([
      { id: "a", rating: 3, visit_count: 5 }, // 70
      { id: "b", rating: 5, visit_count: 0 }, // 100
      { id: "c", rating: 4, visit_count: 5 }, // 90
    ]);
    expect(m.get("b")).toBe(1);
    expect(m.get("c")).toBe(2);
    expect(m.get("a")).toBe(3);
  });

  it("tie-break by visit count", () => {
    const m = rankAll([
      { id: "a", rating: 4, visit_count: 1 }, // 82
      { id: "b", rating: 4, visit_count: 5 }, // 90
    ]);
    expect(m.get("b")).toBe(1);
    expect(m.get("a")).toBe(2);
  });
});

describe("rankings — rankAllByElo", () => {
  it("Elo entries outrank legacy entries", () => {
    const elo = new Map<string, number>([
      ["a", 1500],
      ["c", 1200],
    ]);
    const m = rankAllByElo(
      [
        { id: "a", rating: 1, visit_count: 0 }, // low legacy
        { id: "b", rating: 5, visit_count: 10 }, // top legacy
        { id: "c", rating: 3, visit_count: 0 },
      ],
      elo,
    );
    // a (Elo 1500) > c (Elo 1200) > b (no Elo, legacy fallback)
    expect(m.get("a")).toBe(1);
    expect(m.get("c")).toBe(2);
    expect(m.get("b")).toBe(3);
  });

  it("within Elo entries, higher Elo wins", () => {
    const elo = new Map<string, number>([
      ["a", 1000],
      ["b", 1500],
    ]);
    const m = rankAllByElo(
      [
        { id: "a", rating: 5, visit_count: 10 },
        { id: "b", rating: 1, visit_count: 0 },
      ],
      elo,
    );
    expect(m.get("b")).toBe(1);
    expect(m.get("a")).toBe(2);
  });

  it("all-null falls back to legacy formula", () => {
    const m = rankAllByElo(
      [
        { id: "a", rating: 5, visit_count: 0 },
        { id: "b", rating: 3, visit_count: 0 },
      ],
      new Map(),
    );
    expect(m.get("a")).toBe(1);
    expect(m.get("b")).toBe(2);
  });
});

describe("rankings — percentile & rankTone", () => {
  it("percentile: rank 1 of N gives 100%", () => {
    expect(percentile(1, 10)).toBe(100);
    expect(percentile(10, 10)).toBe(0);
    expect(percentile(1, 1)).toBe(100);
  });

  it("rankTone: top 3 gold, top 10 accent, else null", () => {
    expect(rankTone(1)).toBe("gold");
    expect(rankTone(3)).toBe("gold");
    expect(rankTone(4)).toBe("accent");
    expect(rankTone(10)).toBe("accent");
    expect(rankTone(11)).toBeNull();
  });
});
