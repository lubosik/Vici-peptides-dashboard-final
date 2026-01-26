/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize images
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },
  // Output mode: 'standalone' for Vercel, remove for Hostinger
  // Hostinger works better without standalone output
  // output: 'standalone', // Commented out for Hostinger compatibility
}

module.exports = nextConfig
