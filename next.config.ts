import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next_webpack",
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
