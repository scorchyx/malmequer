import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  // Enable build caching
  turbopack: {
    // Enable Turbopack caching
  },
  // Configure caching directory
  distDir: '.next',
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dt1d75zg0/**',
      },
    ],
    qualities: [75, 85],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 80, 96, 128, 256],
  },
}

export default nextConfig
