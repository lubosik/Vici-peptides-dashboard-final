/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure dynamic routes work properly
  experimental: {
    // Allow dynamic routes to be generated on-demand
  },
  // Ensure all routes are properly handled
  async rewrites() {
    return []
  },
}

module.exports = nextConfig
