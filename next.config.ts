import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === 'development' ? '.next_dev' : '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  typedRoutes: false,
};

export default nextConfig;
