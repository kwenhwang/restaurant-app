export default function Loading() {
  return (
    <>
      <div style={{ height: 48 }} />
      <div className="px-[18px] pt-2">
        <div className="skeleton" style={{ height: 14, width: 110, borderRadius: 6 }} />
        <div className="skeleton mt-2" style={{ height: 36, width: 180, borderRadius: 10 }} />
      </div>
      <div className="px-[18px] mt-6 grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="overflow-hidden"
            style={{ borderRadius: 18, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
          >
            <div className="skeleton" style={{ aspectRatio: "1/1" }} />
            <div className="p-3 space-y-1.5">
              <div className="skeleton" style={{ height: 16, width: "70%", borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 12, width: "40%", borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
