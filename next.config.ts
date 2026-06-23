import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Legacy static sites kept in the repo are excluded from the Next build.
  outputFileTracingExcludes: {
    "*": ["./r7nttc/**", "./backup-pre-nextjs/**"],
  },
};

export default nextConfig;
