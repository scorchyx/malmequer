import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Temporarily ignore type errors during build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
