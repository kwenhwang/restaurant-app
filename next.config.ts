import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sword33.duckdns.org",
        pathname: "/minio/**",
      },
    ],
  },
};

export default nextConfig;
