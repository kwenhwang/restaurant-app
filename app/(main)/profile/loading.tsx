export default function Loading() {
  return (
    <>
      <div style={{ height: 48 }} />
      <div className="px-[18px] pt-2">
        <div className="skeleton" style={{ height: 14, width: 70, borderRadius: 6 }} />
        <div className="skeleton mt-2" style={{ height: 36, width: 160, borderRadius: 10 }} />
      </div>
      <div className="px-[18px] mt-6">
        <div
          className="p-4 flex items-center gap-3"
          style={{ borderRadius: 18, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
        >
          <div className="skeleton shrink-0" style={{ width: 56, height: 56, borderRadius: 999 }} />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton" style={{ height: 18, width: "55%", borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 12, width: "40%", borderRadius: 6 }} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="p-3"
              style={{ borderRadius: 14, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
            >
              <div className="skeleton" style={{ height: 24, width: "60%", borderRadius: 6 }} />
              <div className="skeleton mt-1.5" style={{ height: 12, width: "80%", borderRadius: 6 }} />
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 48, borderRadius: 14 }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
