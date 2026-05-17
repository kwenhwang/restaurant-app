/**
 * Friendly emoji + soft gradient for each category.
 * Used as visual placeholders when a restaurant has no photo.
 */

interface CategoryStyle {
  emoji: string;
  gradient: string; // CSS gradient
}

const STYLES: Record<string, CategoryStyle> = {
  한식: {
    emoji: "🍚",
    gradient: "linear-gradient(135deg, #FFE3D3 0%, #FFB58A 100%)",
  },
  중식: {
    emoji: "🥟",
    gradient: "linear-gradient(135deg, #FFD9D9 0%, #E87A7A 100%)",
  },
  일식: {
    emoji: "🍣",
    gradient: "linear-gradient(135deg, #FFE5EC 0%, #F49EB1 100%)",
  },
  양식: {
    emoji: "🍝",
    gradient: "linear-gradient(135deg, #FFEACC 0%, #F4B97A 100%)",
  },
  카페: {
    emoji: "☕️",
    gradient: "linear-gradient(135deg, #F5E6D3 0%, #C9A07A 100%)",
  },
  술집: {
    emoji: "🍺",
    gradient: "linear-gradient(135deg, #FFF3CD 0%, #E0B848 100%)",
  },
  디저트: {
    emoji: "🍰",
    gradient: "linear-gradient(135deg, #FFE0EC 0%, #E89BBC 100%)",
  },
  기타: {
    emoji: "🍽️",
    gradient: "linear-gradient(135deg, #EAEAF0 0%, #A8A8B8 100%)",
  },
};

const FALLBACK = STYLES["기타"];

export function categoryStyle(category?: string | null): CategoryStyle {
  if (!category) return FALLBACK;
  return STYLES[category] ?? FALLBACK;
}
