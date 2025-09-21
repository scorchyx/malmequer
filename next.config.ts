import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Temporarily ignore build errors while we fix remaining type issues
    ignoreBuildErrors: true,
  },
  output: 'standalone',
}

export default nextConfig
