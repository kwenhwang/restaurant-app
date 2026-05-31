import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegisterSW from "@/components/ui/RegisterSW";
import { pretendard, notoSerifKr } from "./fonts";

export const metadata: Metadata = {
  title: "맛집 기록장",
  description: "나만의 미식 지도를 만들어 보세요",
  manifest: "/manifest.json",
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
