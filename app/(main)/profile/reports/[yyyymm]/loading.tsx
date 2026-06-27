export default function Loading() {
  return (
    <>
      <div style={{ height: 48 }} />
      <div className="px-[18px] pt-2">
        <div className="skeleton" style={{ height: 14, width: 80, borderRadius: 6 }} />
        <div className="skeleton mt-2" style={{ height: 38, width: 220, borderRadius: 10 }} />
      </div>
      <div className="px-[18px] mt-6 space-y-4">
        <div
          className="p-5"
          style={{ borderRadius: 22, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
        >
          <div className="skeleton" style={{ height: 14, width: 100, borderRadius: 6 }} />
          <div className="skeleton mt-3" style={{ height: 42, width: 80, borderRadius: 8 }} />
          <div className="skeleton mt-2" style={{ height: 14, width: "60%", borderRadius: 6 }} />
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="p-4"
            style={{ borderRadius: 18, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
          >
            <div className="skeleton" style={{ height: 16, width: "50%", borderRadius: 6 }} />
            <div className="skeleton mt-2" style={{ height: 12, width: "85%", borderRadius: 6 }} />
            <div className="skeleton mt-1.5" style={{ height: 12, width: "70%", borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </>
  );
}
