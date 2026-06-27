/**
 * Tactile feedback for key actions (toggle, save, pick).
 * No-op on SSR, browsers without the Vibration API (iOS Safari being the obvious one
 * outside an installed PWA), and when the user has set `prefers-reduced-motion`.
 */
export type HapticKind = "light" | "medium" | "success" | "error";

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 10,
  medium: 18,
  success: [12, 30, 18],
  error: [40, 30, 40],
};

export function haptic(kind: HapticKind = "light"): void {
  if (typeof navigator === "undefined" || typeof window === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  navigator.vibrate(PATTERNS[kind]);
}
