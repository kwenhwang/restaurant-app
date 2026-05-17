import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegisterSW from "@/components/ui/RegisterSW";

export const metadata: Metadata = {
  title: "맛집 기록장",
  description: "나만의 미식 지도를 만들어 보세요",
  manifest: "/manifest.json",
  applicationName: "맛집",
  appleWebApp: {
    capable: true,
    title: "맛집",
    statusBarStyle: "default",
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
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FF6F3D",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-bg text-text">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
