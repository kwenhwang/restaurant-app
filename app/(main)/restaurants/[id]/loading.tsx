export default function Loading() {
  return (
    <article>
      <div className="skeleton" style={{ height: "58vh", minHeight: 360, maxHeight: 560 }} />
      <div className="px-[18px] -mt-12 relative">
        <div
          className="p-5 space-y-3"
          style={{ borderRadius: 22, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
        >
          <div className="skeleton" style={{ height: 24, width: "65%", borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 14, width: "85%", borderRadius: 6 }} />
          <div className="flex gap-2 mt-2">
            <div className="skeleton" style={{ height: 28, width: 76, borderRadius: 999 }} />
            <div className="skeleton" style={{ height: 28, width: 92, borderRadius: 999 }} />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="p-4"
              style={{ borderRadius: 18, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
            >
              <div className="skeleton" style={{ height: 14, width: 90, borderRadius: 6 }} />
              <div className="skeleton mt-2" style={{ height: 16, width: "80%", borderRadius: 6 }} />
              <div className="skeleton mt-1.5" style={{ height: 14, width: "55%", borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
