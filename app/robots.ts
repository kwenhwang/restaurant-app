import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatlog.duckdns.org";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Allow public landing + share + legal pages; block auth/api/internal.
        allow: ["/", "/place/", "/c/", "/r/", "/legal/", "/billing/upgrade"],
        disallow: [
          "/api/",
          "/auth/",
          "/profile",
          "/profile/",
          "/visits",
          "/restaurants/",
          "/capture",
          "/import",
          "/collections",
          "/share-receive",
        ],
      },
      // Explicitly welcome Naver and Google bots
      { userAgent: "NaverBot", allow: ["/", "/place/", "/c/", "/r/"] },
      { userAgent: "Yeti", allow: ["/", "/place/", "/c/", "/r/"] }, // Naver's main crawler
      { userAgent: "Googlebot", allow: ["/", "/place/", "/c/", "/r/"] },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
