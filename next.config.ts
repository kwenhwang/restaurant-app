import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "geolocation=(self), microphone=(self), camera=(self), payment=()",
  },
  // CSP: allow self + Kakao Maps + MinIO image host + Sentry + Gemini
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://dapi.kakao.com https://t1.daumcdn.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://sword33.duckdns.org https://*.daumcdn.net https://t1.daumcdn.net",
      "font-src 'self' data:",
      "connect-src 'self' https://sword33.duckdns.org https://dapi.kakao.com https://generativelanguage.googleapis.com https://*.ingest.sentry.io",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sword33.duckdns.org",
        pathname: "/minio/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Only run Sentry build steps when DSN is configured.
  silent: !process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Source map upload requires an auth token; skip for now.
  widenClientFileUpload: true,
  disableLogger: true,
  // Tunnel requests through our own domain to avoid ad-blocker false positives.
  tunnelRoute: "/monitoring",
});
