export default function Loading() {
  return (
    <main className="pb-32 px-4 max-w-screen-sm mx-auto">
      <div className="flex items-center justify-between pt-4 pb-3">
        <div className="space-y-1.5">
          <div className="h-7 w-16 rounded-md animate-pulse" style={{ background: "var(--bg)" }} />
          <div className="h-4 w-32 rounded-md animate-pulse" style={{ background: "var(--bg)" }} />
        </div>
        <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: "var(--bg)" }} />
      </div>
      <div className="h-14 rounded-2xl animate-pulse mb-4" style={{ background: "var(--bg)" }} />
      <div className="grid grid-cols-1 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl animate-pulse"
            style={{ background: "var(--bg)", height: 280 }}
          />
        ))}
      </div>
    </main>
  );
}
