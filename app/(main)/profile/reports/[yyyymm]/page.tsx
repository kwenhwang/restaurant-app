import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LargeTitle } from "@/components/ui/LargeTitle";
import Sym from "@/components/ui/Sym";
import { buildMonthlyReport, activeMonths } from "@/lib/monthly-report";
import { categoryStyle } from "@/lib/category-icons";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ yyyymm: string }>;
}

function isValidYyyymm(s: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

function adj(yyyymm: string, delta: number): string {
  const [y, m] = yyyymm.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function MonthlyReportPage({ params }: Props) {
  const { yyyymm } = await params;
  if (!isValidYyyymm(yyyymm)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: restaurants }, { data: visits }] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, category, address, rating, created_at")
      .eq("user_id", user.id),
    supabase
      .from("visits")
      .select("restaurant_id, visited_at")
      .eq("user_id", user.id),
  ]);

  const report = buildMonthlyReport({
    yyyymm,
    restaurants: restaurants ?? [],
    visits: visits ?? [],
  });

  const months = new Set(activeMonths(visits ?? [], restaurants ?? []));
  const prev = adj(yyyymm, -1);
  const next = adj(yyyymm, 1);
  const hasPrev = months.has(prev);
  const hasNext = months.has(next);

  const totalShare = report.categoryShare.reduce((s, c) => s + c.count, 0) || 1;

  return (
    <div className="pb-24">
      <LargeTitle eyebrow={`${yyyymm.replace("-", "년 ")}월`} title="미식 리포트" />

      <div className="px-[18px] flex items-center justify-between text-[13px] mb-3" style={{ color: "var(--text-2)" }}>
        {hasPrev ? (
          <Link href={`/profile/reports/${prev}`} className="font-semibold inline-flex items-center gap-1">
            <Sym name="chevron.left" size={14} /> 지난 달
          </Link>
        ) : <span />}
        <Link href="/profile/reports" className="font-semibold">목록</Link>
        {hasNext ? (
          <Link href={`/profile/reports/${next}`} className="font-semibold inline-flex items-center gap-1">
            다음 달 <Sym name="chevron.right" size={14} />
          </Link>
        ) : <span />}
      </div>

      {!report.hasData ? (
        <div className="px-[18px]">
          <div
            className="rounded-2xl p-6 text-center text-[14px]"
            style={{ background: "var(--surface)", color: "var(--text-2)" }}
          >
            이번 달엔 활동이 없어요. 다른 달을 살펴보세요.
          </div>
        </div>
      ) : (
        <>
          {/* Headline stat band */}
          <section className="px-[18px]">
            <div
              className="rounded-3xl p-6 text-white"
              style={{
                background:
                  "linear-gradient(160deg, var(--accent) 0%, var(--accent-press) 100%)",
                boxShadow: "0 18px 40px color-mix(in srgb, var(--accent) 32%, transparent)",
              }}
            >
              <div className="text-[13px] font-bold opacity-90">{report.monthLabel} 한눈에</div>
              <div className="font-display text-[44px] font-black leading-none mt-1">
                방문 {report.visits}회
              </div>
              <div className="text-[14px] mt-1.5 opacity-95">
                새 발견 <strong>{report.newDiscoveries}</strong>곳 · 재방문{" "}
                <strong>{report.revisits}</strong>회
                {report.topRegion ? <> · {report.topRegion}</> : null}
              </div>
            </div>
          </section>

          {/* Mini grid */}
          <section className="px-[18px] mt-4 grid grid-cols-3 gap-3">
            <StatTile label="평균 평점" value={report.averageRating != null ? `${report.averageRating}` : "—"} unit={report.averageRating != null ? "/5" : ""} />
            <StatTile label="최장 연속" value={report.longestStreak.toString()} unit="일" />
            <StatTile label="다녀온 곳" value={report.uniqueRestaurants.toString()} unit="곳" />
          </section>

          {/* Category share */}
          {report.categoryShare.length > 0 && (
            <section className="px-[18px] mt-6">
              <h2 className="font-display text-[18px] font-extrabold mb-2.5 px-0.5">카테고리 분포</h2>
              <div
                className="rounded-2xl p-4 space-y-2.5"
                style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
              >
                {report.categoryShare.slice(0, 6).map((c) => {
                  const pct = Math.round((c.count / totalShare) * 100);
                  const s = categoryStyle(c.category);
                  return (
                    <div key={c.category} className="flex items-center gap-3">
                      <span className="text-[20px] w-7 shrink-0 text-center">{c.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-[14px] font-semibold truncate">{c.category}</span>
                          <span className="text-[12px] tabular-nums" style={{ color: "var(--text-2)" }}>
                            {c.count}곳 · {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full mt-1" style={{ background: "var(--bg)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: `var(--c-${s.key})` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Top visited */}
          {report.topVisited.length > 0 && (
            <section className="px-[18px] mt-6">
              <h2 className="font-display text-[18px] font-extrabold mb-2.5 px-0.5">자주 간 곳</h2>
              <div
                className="rounded-2xl divide-y"
                style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
              >
                {report.topVisited.map((r, i) => (
                  <Link
                    key={r.id}
                    href={`/restaurants/${r.id}`}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <span
                      className="font-display text-[22px] font-black tabular-nums shrink-0"
                      style={{ color: i === 0 ? "var(--gold)" : "var(--text-2)", width: 28 }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-[15px] font-extrabold truncate">
                        {r.name}
                      </div>
                      <div className="text-[12px]" style={{ color: "var(--text-2)" }}>
                        {r.category ?? "기타"} · {r.visits}회
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Favorites — new discoveries rated 5★ */}
          {report.favorites.length > 0 && (
            <section className="px-[18px] mt-6">
              <h2 className="font-display text-[18px] font-extrabold mb-2.5 px-0.5">
                ⭐ 이번 달 최애
              </h2>
              <div className="flex flex-wrap gap-2">
                {report.favorites.map((r) => (
                  <Link
                    key={r.id}
                    href={`/restaurants/${r.id}`}
                    className="text-[13px] font-bold px-3 py-2 rounded-full"
                    style={{ background: "var(--accent-soft)", color: "var(--accent-press)" }}
                  >
                    {r.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Footer note */}
          <p className="px-[18px] mt-8 text-[11.5px]" style={{ color: "var(--text-3)" }}>
            화면을 스크린샷으로 저장해 카톡에 공유할 수 있어요. (공개 공유 링크는 곧 추가될 예정)
          </p>
        </>
      )}
    </div>
  );
}

function StatTile({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div
      className="rounded-2xl p-3 text-center"
      style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
    >
      <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>
        {label}
      </div>
      <div className="font-display text-[24px] font-black mt-1 tabular-nums leading-none">
        {value}
        {unit && (
          <span className="text-[14px] font-bold ml-0.5" style={{ color: "var(--text-2)" }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
