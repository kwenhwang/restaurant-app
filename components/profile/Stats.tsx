// components/profile/Stats.tsx — v3
// Same computations as v2. Re-skinned: serif stat numbers, per-category color
// bars (B2), gold #1 in "가장 자주 간 곳", v3 surfaces.

import { categoryStyle } from "@/lib/category-icons";

interface Restaurant {
  id: string;
  name: string;
  category: string | null;
  rating: number | null;
  is_favorite?: boolean;
}
interface Visit {
  visited_at: string;
  restaurant_id: string;
}
interface Props {
  restaurants: Restaurant[];
  visits: Visit[];
}

export default function Stats({ restaurants, visits }: Props) {
  const total = restaurants.length;
  const visitTotal = visits.length;
  const favorites = restaurants.filter((r) => r.is_favorite).length;
  const avgRating =
    total > 0
      ? restaurants.reduce((sum, r) => sum + (r.rating ?? 0), 0) /
          restaurants.filter((r) => r.rating).length || 0
      : 0;

  const byCategory = new Map<string, number>();
  for (const r of restaurants) {
    const k = r.category ?? "기타";
    byCategory.set(k, (byCategory.get(k) ?? 0) + 1);
  }
  const categoryEntries = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const maxCat = categoryEntries[0]?.[1] ?? 1;

  const monthly = computeMonthly(visits);

  const visitCount = new Map<string, number>();
  for (const v of visits) {
    visitCount.set(v.restaurant_id, (visitCount.get(v.restaurant_id) ?? 0) + 1);
  }
  const topVisited = [...visitCount.entries()]
    .map(([rid, count]) => ({ restaurant: restaurants.find((r) => r.id === rid), count }))
    .filter((x) => x.restaurant)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  if (total === 0) return null;

  return (
    <>
      {/* Summary cards */}
      <div className="px-[18px] pb-1">
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard label="기록한 맛집" value={total} />
          <StatCard label="방문 횟수" value={visitTotal} />
          <StatCard label="즐겨찾기" value={favorites} accent />
          <StatCard label="평균 평점" value={avgRating > 0 ? avgRating.toFixed(1) : "—"} />
        </div>
      </div>

      {/* Monthly chart */}
      {monthly.some((m) => m.count > 0) && (
        <section className="px-[18px] pt-6">
          <SectionTitle>최근 6개월 방문</SectionTitle>
          <div className="rounded-2xl p-4" style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}>
            <MonthlyChart data={monthly} />
          </div>
        </section>
      )}

      {/* Category distribution */}
      {categoryEntries.length > 0 && (
        <section className="px-[18px] pt-6">
          <SectionTitle>카테고리</SectionTitle>
          <div className="rounded-2xl p-4 space-y-3.5" style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}>
            {categoryEntries.map(([cat, count]) => {
              const k = categoryStyle(cat).key;
              return (
                <div key={cat}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-[14px] font-bold flex items-center gap-1.5">
                      <span>{categoryStyle(cat).emoji}</span>{cat}
                    </span>
                    <span className="text-[12px] tabular-nums" style={{ color: "var(--text-2)" }}>
                      {count}곳 · {Math.round((count / total) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-2)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(count / maxCat) * 100}%`, background: `var(--c-${k})` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Top visited */}
      {topVisited.length > 0 && (
        <section className="px-[18px] pt-6">
          <SectionTitle>가장 자주 간 곳</SectionTitle>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}>
            {topVisited.map((x, i) => (
              <div
                key={x.restaurant!.id}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderTop: i > 0 ? "0.5px solid var(--separator)" : "none" }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black tabular-nums"
                  style={{
                    background: i === 0 ? "var(--gold)" : "var(--bg-2)",
                    color: i === 0 ? "#fff" : "var(--text)",
                  }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[15.5px] font-extrabold truncate">{x.restaurant!.name}</div>
                  {x.restaurant!.category && (
                    <div className="text-[12px]" style={{ color: "var(--text-2)" }}>{x.restaurant!.category}</div>
                  )}
                </div>
                <div className="text-[13px] font-extrabold tabular-nums" style={{ color: "var(--accent)" }}>
                  {x.count}회
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-[18px] p-4" style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}>
      <div className="text-[12px] font-bold" style={{ color: "var(--text-2)" }}>{label}</div>
      <div
        className="font-display text-[34px] font-black mt-1 leading-none tabular-nums"
        style={{ letterSpacing: "-1px", color: accent ? "var(--accent)" : "var(--text)" }}
      >
        {value}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display text-[15px] font-extrabold mb-2.5 px-0.5">{children}</h3>;
}

function MonthlyChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-2 h-[100px]">
      {data.map((m) => (
        <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="flex-1 w-full flex items-end">
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: `${(m.count / max) * 100}%`,
                background: m.count > 0 ? "var(--accent)" : "var(--bg-2)",
                minHeight: m.count > 0 ? 4 : 2,
              }}
            />
          </div>
          <div className="text-[10px] font-bold" style={{ color: "var(--text-2)" }}>{m.label}</div>
          <div className="text-[11px] font-extrabold tabular-nums">{m.count}</div>
        </div>
      ))}
    </div>
  );
}

function computeMonthly(visits: { visited_at: string }[]) {
  const now = new Date();
  const months: { label: string; count: number; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: `${d.getMonth() + 1}월`,
      count: 0,
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  for (const v of visits) {
    const d = new Date(v.visited_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const m = months.find((x) => x.key === key);
    if (m) m.count++;
  }
  return months;
}
