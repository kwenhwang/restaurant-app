/**
 * Friendly emoji + gradient + color key for each category. (v3)
 * - `emoji` + `gradient`: photo-placeholder when a restaurant has no image.
 * - `key`: maps to the `--c-<key>` / `--c-<key>-soft` token families in
 *   globals.css, so badges/chips/borders share one consistent category color.
 *
 * Back-compatible: `categoryStyle(c).emoji` / `.gradient` work as before.
 */

interface CategoryStyle {
  emoji: string;
  gradient: string;
  /** token key — use as `var(--c-${key})` and `var(--c-${key}-soft)` */
  key: "han" | "jung" | "il" | "yang" | "cafe" | "sul" | "des" | "etc";
}

const STYLES: Record<string, CategoryStyle> = {
  한식:   { emoji: "🍚", key: "han",  gradient: "linear-gradient(150deg,#FFE3D0 0%,#F58A5A 60%,#E8552E 100%)" },
  중식:   { emoji: "🥟", key: "jung", gradient: "linear-gradient(150deg,#FFD9D9 0%,#E87A7A 55%,#D23A47 100%)" },
  일식:   { emoji: "🍣", key: "il",   gradient: "linear-gradient(150deg,#FFE5EC 0%,#F49EB1 55%,#D45C86 100%)" },
  양식:   { emoji: "🍝", key: "yang", gradient: "linear-gradient(150deg,#FFEACC 0%,#F0BE78 55%,#C7892B 100%)" },
  카페:   { emoji: "☕️", key: "cafe", gradient: "linear-gradient(150deg,#F2E5D5 0%,#C9A07A 55%,#8A6A4A 100%)" },
  술집:   { emoji: "🍺", key: "sul",  gradient: "linear-gradient(150deg,#FFF3CD 0%,#E5C24E 55%,#B98A1E 100%)" },
  디저트: { emoji: "🍰", key: "des",  gradient: "linear-gradient(150deg,#FFE0EC 0%,#EC9BC6 55%,#C65C97 100%)" },
  기타:   { emoji: "🍽️", key: "etc",  gradient: "linear-gradient(150deg,#ECECEF 0%,#B6BAC4 55%,#6B7280 100%)" },
};

const FALLBACK = STYLES["기타"];

export function categoryStyle(category?: string | null): CategoryStyle {
  if (!category) return FALLBACK;
  return STYLES[category] ?? FALLBACK;
}

/** Convenience accessors for the token-driven category color. */
export function categoryColor(category?: string | null): string {
  return `var(--c-${categoryStyle(category).key})`;
}
export function categoryColorSoft(category?: string | null): string {
  return `var(--c-${categoryStyle(category).key}-soft)`;
}
