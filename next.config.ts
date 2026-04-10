import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.VERCEL ? '.next' : '.next_temp',
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
