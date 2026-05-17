import Sym from "./Sym";

export default function Stars({
  value = 0,
  size = 13,
}: { value?: number; size?: number }) {
  return (
    <div className="inline-flex" style={{ gap: 1.5, color: "var(--accent)" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= value ? "var(--accent)" : "var(--text-3)" }}>
          <Sym name={i <= value ? "star.fill" : "star"} size={size} />
        </span>
      ))}
    </div>
  );
}
