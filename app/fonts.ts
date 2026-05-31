// app/fonts.ts — v3 self-hosted fonts (no external CSS @import, no CSP changes)
//
// next/font downloads & self-hosts the files at build time, emits size-adjust
// fallback metrics (no layout shift), and exposes CSS variables we hand to the
// design tokens. Pretendard isn't on Google Fonts, so it's loaded as a local
// variable font — drop the .woff2 in app/fonts/ (see README §2a).

import localFont from "next/font/local";
import { Noto_Serif_KR } from "next/font/google";

/** Body — Pretendard Variable (self-hosted local file). */
export const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920", // variable range
  variable: "--font-pretendard",
  fallback: [
    "Apple SD Gothic Neo",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "system-ui",
    "sans-serif",
  ],
});

/** Display — Noto Serif KR (self-hosted via next/font/google). */
export const notoSerifKr = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
  display: "swap",
  variable: "--font-noto-serif-kr",
  fallback: ["Pretendard", "serif"],
});
