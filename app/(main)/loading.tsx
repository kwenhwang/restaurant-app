// app/(main)/loading.tsx — v3 (E2)
// Consistent skeleton for the home feed: large title, hero, card list.

import RestaurantCardSkeleton from "@/components/restaurants/RestaurantCardSkeleton";

export default function Loading() {
  return (
    <>
      <div style={{ height: 48 }} />
      <div className="px-[18px] pt-2">
        <div className="skeleton" style={{ height: 14, width: 120, borderRadius: 6 }} />
        <div className="skeleton mt-2" style={{ height: 38, width: 160, borderRadius: 10 }} />
      </div>
      <div className="px-[18px] mt-5">
        <div className="skeleton" style={{ height: 232, borderRadius: "var(--r-card)" }} />
      </div>
      <div className="px-[18px] mt-6 flex flex-col gap-3.5">
        {[0, 1, 2].map((i) => (
          <RestaurantCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
