import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegisterSW from "@/components/ui/RegisterSW";
import { pretendard, notoSerifKr } from "./fonts";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatlog.duckdns.org";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "eatlog — 나만의 미식 일지",
  description: "사진 한 장으로 시작하는 맛집 기록 · AI가 정리해주는 메뉴와 블로그 후기",
  manifest: "/manifest.json",
  openGraph: {
    siteName: "eatlog",
    locale: "ko_KR",
    type: "website",
  },
  verification: {
    // Set via env once you've registered with the consoles.
    // Naver: https://searchadvisor.naver.com  → 사이트 등록 → 메타 태그 인증
    // Google: https://search.google.com/search-console  → 속성 추가 → HTML 태그
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION
      ? { "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION }
      : undefined,
  },
  applicationName: "맛집",
  appleWebApp: {
    capable: true,
    title: "맛집",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // NOTE (a11y): maximumScale / user-scalable removed — never block pinch-zoom.
  // Users with low vision must be able to zoom (WCAG 1.4.4).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F1EA" },
    { media: "(prefers-color-scheme: dark)", color: "#0C0B0A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`h-full antialiased ${pretendard.variable} ${notoSerifKr.variable}`}
    >
      <head>
        {/* Warm the TLS+TCP connection to hosts we'll definitely hit on most
            routes (images via MinIO, Kakao Maps SDK). Saves ~150-300 ms on
            cold mobile loads. */}
        <link rel="preconnect" href="https://sword33.duckdns.org" crossOrigin="" />
        <link rel="dns-prefetch" href="https://dapi.kakao.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem("theme");
                if (t === "dark" || t === "light") {
                  document.documentElement.setAttribute("data-theme", t);
                }
              } catch (e) {}
              window.__deferredInstall = null;
              window.addEventListener("beforeinstallprompt", function (e) {
                e.preventDefault();
                window.__deferredInstall = e;
                window.dispatchEvent(new Event("pwa-installable"));
              });
              window.addEventListener("appinstalled", function () {
                window.__deferredInstall = null;
                window.dispatchEvent(new Event("pwa-installed"));
              });
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-bg text-text">
        {/* Skip link (a11y) — first focusable element */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:font-bold"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          본문으로 건너뛰기
        </a>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
