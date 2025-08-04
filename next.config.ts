import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Disable TypeScript and ESLint errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Suppress source map warnings
  productionBrowserSourceMaps: false,
  
  experimental: {
    // Disable source maps for server components in development
    serverSourceMaps: false,
  },
  
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'storage.googleapis.com',
      'lh3.googleusercontent.com', // For user avatars
      'avatars.githubusercontent.com'
    ],
    unoptimized: process.env.NODE_ENV === 'development'
  },
  
  // Handle subdomain routing
  async rewrites() {
    return [
      // API routes
      {
        source: '/api/:path*',
        destination: '/api/:path*'
      },
      // Admin routes for subdomains
      {
        source: '/admin/:path*',
        destination: '/admin/:path*'
      }
    ]
  },
  
  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Webpack configuration for better performance
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Completely disable source-map-loader for @google-cloud modules
    config.module.rules = config.module.rules.map(rule => {
      if (rule.loader === 'source-map-loader') {
        return {
          ...rule,
          exclude: [
            ...(rule.exclude || []),
            /@google-cloud/,
            /firestore/,
            /@firebase/,
            /firebase-admin/,
          ],
        }
      }
      return rule
    })
    
    // Add more comprehensive ignore warnings
    config.ignoreWarnings = [
      { module: /@google-cloud/ },
      { module: /firestore/ },
      { module: /@firebase/ },
      { module: /firebase-admin/ },
      { message: /Failed to parse source map/ },
      { message: /Invalid source map/ },
    ]
    
    return config
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}

export default nextConfig