export default function Loading() {
  return (
    <div className="fixed inset-0">
      <div className="skeleton w-full h-full" />
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold"
        style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)", color: "var(--text-2)" }}
      >
        지도를 불러오는 중…
      </div>
    </div>
  );
}
