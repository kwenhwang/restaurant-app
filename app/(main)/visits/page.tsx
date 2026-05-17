import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Sym from "@/components/ui/Sym";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { SectionHeader, Group } from "@/components/ui/Group";

type Visit = {
  id: string;
  visited_at: string; // ISO date
  memo?: string | null;
  restaurant_id: string;
  restaurant?: { id: string; name: string; category?: string | null } | null;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function fmtMonth(d: Date) {
  const now = new Date();
  if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
    return `${d.getMonth() + 1}월 · 이번 달`;
  }
  return `${d.getMonth() + 1}월`;
}

function groupByMonth(visits: Visit[]) {
  const map = new Map<string, Visit[]>();
  for (const v of visits) {
    const d = new Date(v.visited_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(v);
  }
  return [...map.entries()].map(([key, items]) => {
    const [y, m] = key.split("-").map(Number);
    return { key, date: new Date(y, m - 1, 1), items };
  });
}

export default async function VisitsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: visits } = await supabase
    .from("visits")
    .select("*, restaurant:restaurants(id, name, category)")
    .eq("user_id", user!.id)
    .order("visited_at", { ascending: false });

  const total = visits?.length ?? 0;

  const now = new Date();
  const thisMonth = (visits ?? []).filter((v) => {
    const d = new Date(v.visited_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const groups = groupByMonth((visits ?? []) as Visit[]);

  return (
    <>
      <div style={{ height: 48 }} />

      <LargeTitle title="방문 기록" meta={`지금까지 ${total}번의 식사`} />

      {/* Stat hero */}
      <div className="px-4 pb-1.5">
        <div
          className="rounded-[22px] p-[18px] text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #FF6F3D 0%, #D94A1E 100%)" }}
        >
          <div className="text-[12px] font-semibold opacity-90">이번 달</div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <div
              className="text-[44px] font-extrabold leading-none"
              style={{ letterSpacing: "-1.2px" }}
            >
              {thisMonth}
            </div>
            <div className="text-[16px] font-semibold opacity-90">회</div>
          </div>
          <div className="text-[12px] mt-1 opacity-85">
            계속 기록 중이에요. 천천히, 그러나 꾸준히.
          </div>

          <div
            className="absolute -right-5 -top-5 w-[140px] h-[140px] rounded-full"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
        </div>
      </div>

      {/* Sections */}
      {groups.length > 0 ? (
        groups.map((g) => (
          <section key={g.key} className="px-4 pt-2">
            <SectionHeader>{fmtMonth(g.date)}</SectionHeader>
            <Group>
              {g.items.map((v) => {
                const d = new Date(v.visited_at);
                return (
                  <Link
                    key={v.id}
                    href={`/restaurants/${v.restaurant_id}`}
                    className="flex items-center gap-3.5 px-3.5 py-3"
                  >
                    <div
                      className="w-11 h-11 rounded-[12px] flex flex-col items-center justify-center shrink-0"
                      style={{ background: "var(--bg)" }}
                    >
                      <div
                        className="text-[10px] font-semibold"
                        style={{ color: "var(--text-2)" }}
                      >
                        {WEEKDAYS[d.getDay()]}
                      </div>
                      <div
                        className="text-[17px] font-extrabold leading-none"
                        style={{ letterSpacing: "-0.3px" }}
                      >
                        {d.getDate()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-bold tracking-tight truncate">
                        {v.restaurant?.name ?? "삭제된 가게"}
                      </div>
                      {v.memo && (
                        <div
                          className="text-[13px] mt-0.5 truncate"
                          style={{ color: "var(--text-2)" }}
                        >
                          {v.memo}
                        </div>
                      )}
                    </div>
                    {v.restaurant?.category && (
                      <span
                        className="text-[11px] font-semibold px-2 py-1 rounded-md"
                        style={{ background: "var(--bg)", color: "var(--text-2)" }}
                      >
                        {v.restaurant.category}
                      </span>
                    )}
                  </Link>
                );
              })}
            </Group>
          </section>
        ))
      ) : (
        <div className="flex flex-col items-center text-center py-20 px-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            <Sym name="calendar" size={28} />
          </div>
          <h2 className="text-[17px] font-bold">방문 기록이 없어요</h2>
          <p
            className="text-[14px] mt-1.5 max-w-[260px]"
            style={{ color: "var(--text-2)" }}
          >
            맛집 상세 화면에서 방문을 기록해 보세요.
          </p>
        </div>
      )}
    </>
  );
}
