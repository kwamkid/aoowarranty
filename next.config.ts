import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
    
    // Fix for Firebase Admin SDK source maps
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/@google-cloud/,
      use: {
        loader: 'source-map-loader',
      },
      enforce: 'pre',
    })
    
    // Ignore source map warnings for specific modules
    config.ignoreWarnings = [
      {
        module: /@google-cloud/,
        message: /Failed to parse source map/,
      },
      {
        module: /firestore/,
        message: /Invalid source map/,
      },
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