// lib/tier.ts — Beli-style 3-tier 시스템 (대결 평가에서 결정)
// 0 = 좋아함, 1 = 괜찮음, 2 = 별로

export type Tier = 0 | 1 | 2 | null | undefined;

export interface TierMeta {
  label: string;
  emoji: string;
  // Card·badge용
  fg: string;
  bg: string;
  // 마커·강조용 단색
  solid: string;
}

const META: Record<0 | 1 | 2, TierMeta> = {
  0: {
    label: "좋아함",
    emoji: "😍",
    fg: "#0F6F3C",
    bg: "rgba(46, 196, 122, 0.16)",
    solid: "#27A862",
  },
  1: {
    label: "괜찮음",
    emoji: "🙂",
    fg: "#7A6B3F",
    bg: "rgba(212, 175, 55, 0.16)",
    solid: "#B89B4A",
  },
  2: {
    label: "별로",
    emoji: "😐",
    fg: "#8B5050",
    bg: "rgba(229, 72, 77, 0.14)",
    solid: "#C26565",
  },
};

export function tierMeta(t: Tier): TierMeta | null {
  if (t == null) return null;
  return META[t];
}

// 정렬·랭킹용 가중치 (낮을수록 좋아함)
export function tierWeight(t: Tier): number {
  if (t == null) return 1.5;
  return t;
}
