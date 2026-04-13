import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: '.next_webpack',
  typescript: {
    ignoreBuildErrors: true,
  },
  typedRoutes: false,
};

export default nextConfig;
