// components/restaurants/RestaurantCardSkeleton.tsx — v3 (E2)
// Matches the photo-forward RestaurantCard footprint.

export default function RestaurantCardSkeleton() {
  return (
    <div className="overflow-hidden" style={{ borderRadius: "var(--r-card)", background: "var(--surface)", boxShadow: "var(--shadow-1)" }}>
      <div className="skeleton" style={{ height: 190 }} />
      <div className="px-3.5 pt-3 pb-3.5">
        <div className="skeleton" style={{ height: 19, width: "55%", borderRadius: 7 }} />
        <div className="flex gap-2 mt-2.5">
          <div className="skeleton" style={{ height: 22, width: 64, borderRadius: 999 }} />
          <div className="skeleton" style={{ height: 22, width: 80, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}
