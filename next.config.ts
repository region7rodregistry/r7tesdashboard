import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Legacy static sites kept in the repo are excluded from the Next build.
  outputFileTracingExcludes: {
    "*": ["./r7nttc/**", "./backup-pre-nextjs/**"],
  },
  // Client-side Router Cache: reuse an already-rendered route for 5 minutes when
  // navigating back to it (e.g. Statistics -> Registry) instead of re-fetching.
  // Dynamic routes default to 0 (always refetch); this opts them into reuse.
  experimental: {
    staleTimes: { dynamic: 300, static: 300 },
  },
};

export default nextConfig;
