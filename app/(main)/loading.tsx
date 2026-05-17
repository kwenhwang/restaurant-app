export default function Loading() {
  return (
    <>
      <div style={{ height: 48 }} />
      <div className="px-4 pt-3">
        <div
          className="h-9 w-32 rounded-md"
          style={{ background: "var(--bg)" }}
        />
        <div
          className="h-4 w-48 rounded-md mt-2"
          style={{ background: "var(--bg)" }}
        />
      </div>
      <div className="px-4 mt-4 space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl h-[68px]"
            style={{ background: "var(--bg)" }}
          />
        ))}
      </div>
    </>
  );
}
