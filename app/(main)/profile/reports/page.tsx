import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { activeMonths, buildMonthlyReport } from "@/lib/monthly-report";
import Sym from "@/components/ui/Sym";

export const dynamic = "force-dynamic";

export default async function ReportsIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: restaurants }, { data: visits }, { data: scores }] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, category, address, created_at")
      .eq("user_id", user.id),
    supabase
      .from("visits")
      .select("restaurant_id, visited_at")
      .eq("user_id", user.id),
    supabase
      .from("restaurant_scores")
      .select("restaurant_id, tier")
      .eq("user_id", user.id),
  ]);

  const tierByRid = new Map<string, 0 | 1 | 2>();
  for (const s of scores ?? []) {
    if (s.tier != null) tierByRid.set(s.restaurant_id, s.tier as 0 | 1 | 2);
  }
  const decoratedRestaurants = (restaurants ?? []).map((r) => ({
    ...r,
    tier: tierByRid.get(r.id) ?? null,
  }));

  const months = activeMonths(visits ?? [], decoratedRestaurants);

  // Pre-compute a summary line per month so the index feels alive.
  const summaries = months.slice(0, 24).map((yyyymm) => {
    const report = buildMonthlyReport({
      yyyymm,
      restaurants: decoratedRestaurants,
      visits: visits ?? [],
    });
    return { yyyymm, label: yyyymm.replace("-", "년 ") + "월", report };
  });

  return (
    <div className="pb-24">
      <LargeTitle eyebrow="월간" title="미식 리포트" />

      {summaries.length === 0 ? (
        <div className="px-[18px] mt-3">
          <div
            className="rounded-2xl p-6 text-center text-[14px]"
            style={{ background: "var(--surface)", color: "var(--text-2)" }}
          >
            아직 데이터가 없어요. 가게를 등록하면 매월 리포트가 자동으로 정리돼요.
          </div>
        </div>
      ) : (
        <div className="px-[18px] space-y-3">
          {summaries.map(({ yyyymm, label, report }) => (
            <Link
              key={yyyymm}
              href={`/profile/reports/${yyyymm}`}
              className="block rounded-2xl p-4 transition-transform active:scale-[0.99]"
              style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-[18px] font-extrabold">{label}</div>
                <Sym name="chevron.right" size={16} />
              </div>
              <div className="text-[13px] mt-1.5" style={{ color: "var(--text-2)" }}>
                방문 <strong>{report.visits}</strong>회 · 새 발견{" "}
                <strong>{report.newDiscoveries}</strong>곳
                {report.topRegion ? ` · ${report.topRegion}` : ""}
              </div>
              {report.categoryShare.length > 0 && (
                <div className="text-[18px] mt-2">
                  {report.categoryShare
                    .slice(0, 5)
                    .map((c) => c.emoji)
                    .join(" ")}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      <div className="px-[18px] mt-8 text-center">
        <Link href="/profile" className="text-[12px]" style={{ color: "var(--text-3)" }}>
          ← 프로필로
        </Link>
      </div>
    </div>
  );
}
