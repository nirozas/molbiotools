import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === 'development' ? '.next_dev' : '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  typedRoutes: false,
  // Optimize imports from large packages to reduce bundle size and speed up loading
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
    ],
  },
};

export default nextConfig;
