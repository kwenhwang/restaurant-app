import Sym from "./Sym";

/**
 * Star rating — v3.
 * Adds an accessible label so screen readers announce "5점 만점에 4점" instead
 * of five unlabelled icons. The icons themselves are decorative (aria-hidden).
 */
export default function Stars({
  value = 0,
  size = 13,
}: {
  value?: number;
  size?: number;
}) {
  return (
    <div
      className="inline-flex"
      style={{ gap: 1.5, color: "var(--accent)" }}
      role="img"
      aria-label={`5점 만점에 ${value}점`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{ color: i <= value ? "var(--accent)" : "var(--text-3)" }}
        >
          <Sym name={i <= value ? "star.fill" : "star"} size={size} />
        </span>
      ))}
    </div>
  );
}
