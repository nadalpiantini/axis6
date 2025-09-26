/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // TypeScript configuration - TEMPORARILY DISABLED for development
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ESLint configuration - TEMPORARILY DISABLED for development
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Webpack configuration to fix chunk loading issues
  webpack: (config, { isServer }) => {
    // Fix for dynamic imports
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    return config
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nvpnhqhjttgwfwvkgmpk.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
}

export default nextConfig
