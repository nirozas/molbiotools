import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Using default .next distDir for Vercel compatibility
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
