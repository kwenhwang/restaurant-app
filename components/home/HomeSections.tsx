// components/home/HomeSections.tsx — v3 (A3)
// Editorial section rails shown on the home feed when no filter is active:
//   🔥 자주 가는 곳 · 💛 즐겨찾기 · 🆕 최근 추가  (가까운 가게 optional via `nearby`)

import { ReactNode } from "react";
import RestaurantMiniCard from "@/components/restaurants/RestaurantMiniCard";
import type { RestaurantItem } from "@/components/home/HomeFilters";

function EditorialHeader({
  index,
  emoji,
  title,
  sub,
}: {
  index: number;
  emoji?: string;
  title: string;
  sub?: ReactNode;
}) {
  return (
    <div className="flex items-end gap-2.5 px-[18px] mb-3">
      <span
        className="font-display font-black tabular-nums leading-[0.8]"
        style={{
          fontSize: `calc(20px + 18 * var(--ed) * 1px)`,
          color: "var(--text-3)",
          letterSpacing: "-1px",
        }}
      >
        {String(index).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-[21px] font-extrabold flex items-center gap-1.5">
          {emoji && <span>{emoji}</span>}
          {title}
        </h2>
        {sub && <div className="text-[12.5px] mt-0.5" style={{ color: "var(--text-2)" }}>{sub}</div>}
      </div>
    </div>
  );
}

function Rail({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar px-[18px]" style={{ scrollSnapType: "x mandatory" }}>
      {children}
    </div>
  );
}

export default function HomeSections({
  restaurants,
  nearby,
}: {
  restaurants: RestaurantItem[];
  nearby?: RestaurantItem[];
}) {
  const frequent = [...restaurants]
    .filter((r) => (r.visit_count ?? 0) > 0)
    .sort((a, b) => (b.visit_count ?? 0) - (a.visit_count ?? 0))
    .slice(0, 6);
  const favorites = restaurants.filter((r) => r.is_favorite);

  let idx = 0;

  return (
    <div className="flex flex-col gap-7 pb-1">
      {frequent.length > 0 && (
        <section>
          <EditorialHeader index={++idx} emoji="🔥" title="자주 가는 곳" sub="발걸음이 잦은 단골" />
          <Rail>
            {frequent.map((r) => (
              <RestaurantMiniCard key={r.id} restaurant={r} sub={`${r.visit_count}회 방문 · ${r.category ?? ""}`} />
            ))}
          </Rail>
        </section>
      )}

      {favorites.length > 0 && (
        <section>
          <EditorialHeader index={++idx} emoji="💛" title="즐겨찾기" sub="마음에 콕 담아둔 곳" />
          <Rail>
            {favorites.map((r) => (
              <RestaurantMiniCard
                key={r.id}
                restaurant={r}
                sub={`${r.rating ? `★ ${r.rating}.0` : ""} · ${r.category ?? ""}`}
              />
            ))}
          </Rail>
        </section>
      )}

      {nearby && nearby.length > 0 && (
        <section>
          <EditorialHeader index={++idx} emoji="📍" title="가까운 가게" sub="지금 위치에서 가까운 순" />
          <Rail>
            {nearby.map((r) => (
              <RestaurantMiniCard key={r.id} restaurant={r} sub={r.category ?? ""} />
            ))}
          </Rail>
        </section>
      )}
    </div>
  );
}
