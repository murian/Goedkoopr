/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack configuration for Next.js 16+
  turbopack: {
    rules: {
      '*.node': ['file'],
    },
  },
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for better-sqlite3
    if (isServer) {
      config.externals.push('better-sqlite3')
    }
    return config
  },
  // Externals for server-side native modules
  serverExternalPackages: ['better-sqlite3'],
}

module.exports = nextConfig
