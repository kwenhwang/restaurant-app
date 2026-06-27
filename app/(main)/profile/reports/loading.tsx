export default function Loading() {
  return (
    <>
      <div style={{ height: 48 }} />
      <div className="px-[18px] pt-2">
        <div className="skeleton" style={{ height: 14, width: 110, borderRadius: 6 }} />
        <div className="skeleton mt-2" style={{ height: 36, width: 200, borderRadius: 10 }} />
      </div>
      <div className="px-[18px] mt-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="p-4"
            style={{ borderRadius: 18, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
          >
            <div className="skeleton" style={{ height: 18, width: "45%", borderRadius: 6 }} />
            <div className="skeleton mt-2" style={{ height: 12, width: "75%", borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </>
  );
}
