// components/restaurants/CategoryPlaceholder.tsx — v3
// Elevated "no photo" placeholder. Shown whenever a restaurant has no image.
//
// Design: "plated" treatment — a warm radial-light category gradient + film
// grain (.ph-grain, in globals.css) + the category emoji served on a soft
// translucent GLASS DISC (a blend of the explored 접시/Plated and 글래스/Glass
// directions). Kills the flat-gradient look and reads as "food on a dish".
//
// Pure presentational (no client hooks) → safe in Server Components.
// `size` controls emoji + disc scale; pass "thumb" for tiles ≤ ~90px to drop
// the disc and keep it clean.

import { categoryStyle } from "@/lib/category-icons";

type Size = "hero" | "card" | "thumb";

const EMOJI: Record<Size, number> = { hero: 96, card: 60, thumb: 34 };

/** Pull the 3 stop colors out of a category gradient string. */
function stops(category?: string | null): [string, string, string] {
  const g = categoryStyle(category).gradient;
  const m = g.match(/#[0-9A-Fa-f]{6}/g) ?? ["#ccc", "#999", "#666"];
  return [m[0], m[1] ?? m[0], m[2] ?? m[1] ?? m[0]];
}

export default function CategoryPlaceholder({
  category,
  size = "card",
}: {
  category?: string | null;
  size?: Size;
}) {
  const s = categoryStyle(category);
  const [c1, c2, c3] = stops(category);
  const e = EMOJI[size];
  const disc = Math.round(e * 1.66);
  const small = size === "thumb";

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 grid place-items-center"
      style={{
        background: `radial-gradient(120% 100% at 28% 18%, ${c1} 0%, ${c2} 48%, ${c3} 100%)`,
      }}
    >
      {/* light source */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(58% 58% at 30% 22%, rgba(255,255,255,0.40), transparent 60%)" }}
      />
      {/* film grain */}
      <div className="ph-grain" />

      {small ? (
        <span style={{ fontSize: e, filter: "drop-shadow(0 5px 10px rgba(0,0,0,0.22))" }}>{s.emoji}</span>
      ) : (
        // glass dish
        <div
          className="relative grid place-items-center"
          style={{
            width: disc,
            height: disc,
            borderRadius: "50%",
            background:
              "radial-gradient(60% 60% at 38% 30%, rgba(255,255,255,0.30), rgba(255,255,255,0.12) 70%)",
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
            border: "1px solid rgba(255,255,255,0.34)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 0 0 6px rgba(255,255,255,0.06), 0 8px 20px rgba(0,0,0,0.14)",
          }}
        >
          <span style={{ fontSize: e, filter: "drop-shadow(0 5px 10px rgba(0,0,0,0.22))" }}>{s.emoji}</span>
        </div>
      )}
    </div>
  );
}
