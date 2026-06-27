export default function Loading() {
  return (
    <>
      <div style={{ height: 48 }} />
      <div className="px-[18px] pt-2">
        <div className="skeleton" style={{ height: 14, width: 90, borderRadius: 6 }} />
        <div className="skeleton mt-2" style={{ height: 36, width: 200, borderRadius: 10 }} />
      </div>
      <div className="px-[18px] mt-6 space-y-5">
        {[0, 1, 2].map((g) => (
          <div key={g}>
            <div className="skeleton" style={{ height: 16, width: 80, borderRadius: 6 }} />
            <div className="mt-3 space-y-2.5">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl flex items-center gap-3 p-3"
                  style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
                >
                  <div className="skeleton shrink-0" style={{ width: 56, height: 56, borderRadius: 14 }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton" style={{ height: 16, width: "60%", borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 12, width: "40%", borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
