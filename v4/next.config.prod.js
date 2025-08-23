/** @type {import('next').NextConfig} */
/**
 * Astral Draft v4 - Production Next.js Configuration
 * Enhanced configuration for production deployment
 */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  // Core settings
  reactStrictMode: true,
  swcMinify: true,
  
  // Production optimizations
  experimental: {
    typedRoutes: true,
    serverComponentsExternalPackages: [
      '@prisma/client', 
      'bcryptjs',
      '@node-rs/bcrypt',
      'sharp',
      'canvas'
    ],
    optimizeCss: true,
    optimizeServerReact: true,
    gzipSize: true,
    esmExternals: 'loose',
    scrollRestoration: true,
    largePageDataBytes: 128 * 1000, // 128KB
  },

  // Build configuration
  eslint: {
    dirs: ['src'],
    ignoreDuringBuilds: false,
  },
  
  typescript: {
    tsconfigPath: './tsconfig.json',
    ignoreBuildErrors: false,
  },

  // Image optimization for production
  images: {
    // Production CDN domains
    domains: [
      process.env.CDN_URL?.replace('https://', ''),
      process.env.CDN_IMAGES_URL?.replace('https://', ''),
      'assets.nfl.com',
      'a.espncdn.com',
      's.yimg.com',
      'sleepercdn.com',
      'fantasy.nfl.com',
      'static.nfl.com',
      'www.gravatar.com',
      'avatars.githubusercontent.com',
      'images.unsplash.com',
    ].filter(Boolean),
    
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.espncdn.com',
      },
      {
        protocol: 'https',
        hostname: '**.nfl.com',
      },
      {
        protocol: 'https',
        hostname: '**.sleepercdn.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
      },
    ],
    
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year cache
    dangerouslyAllowSVG: false, // Disabled for security in production
    unoptimized: false,
    
    // Loader configuration for CDN
    loader: process.env.CDN_IMAGES_URL ? 'custom' : 'default',
    path: process.env.CDN_IMAGES_URL || '',
  },

  // Security headers for production
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google-analytics.com https://www.googletagmanager.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' wss: https://api.sportsdata.io https://api.openai.com https://generativelanguage.googleapis.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests",
          ].join('; '),
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()',
        },
        {
          key: 'Cross-Origin-Embedder-Policy',
          value: 'require-corp',
        },
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin',
        },
        {
          key: 'Cross-Origin-Resource-Policy',
          value: 'cross-origin',
        },
      ],
    },
    // Cache headers for static assets
    {
      source: '/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/_next/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    // API headers
    {
      source: '/api/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, must-revalidate',
        },
      ],
    },
  ],

  // Redirects for production
  redirects: async () => [
    {
      source: '/app/:path*',
      destination: '/:path*',
      permanent: true,
    },
    {
      source: '/dashboard',
      destination: '/',
      permanent: false,
    },
  ],

  // Rewrites for API proxy (if needed)
  rewrites: async () => [
    {
      source: '/api/proxy/:path*',
      destination: '/api/:path*',
    },
  ],

  // Enhanced webpack configuration for production
  webpack: (config, { dev, isServer, webpack, buildId }) => {
    // Production-only optimizations
    if (!dev) {
      // Enhanced compression and minification
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        concatenateModules: true,
        nodeEnv: 'production',
        
        // Advanced split chunks strategy
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          enforceSizeThreshold: 50000,
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
              enforce: true,
            },
            // Framework chunks
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
            // Next.js chunks
            nextjs: {
              test: /[\\/]node_modules[\\/]next[\\/]/,
              name: 'nextjs',
              chunks: 'all',
              priority: 15,
              enforce: true,
            },
            // UI Library chunks
            ui: {
              test: /[\\/](src[\\/]components[\\/]ui|node_modules[\\/]@headlessui|node_modules[\\/]@heroicons)[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 10,
              enforce: true,
            },
            // Feature-specific chunks
            oracle: {
              test: /[\\/]src[\\/].*oracle.*[\\/]/,
              name: 'oracle',
              chunks: 'all',
              priority: 8,
              enforce: true,
            },
            draft: {
              test: /[\\/]src[\\/].*draft.*[\\/]/,
              name: 'draft',
              chunks: 'all',
              priority: 8,
              enforce: true,
            },
            fantasy: {
              test: /[\\/]src[\\/].*fantasy.*[\\/]/,
              name: 'fantasy',
              chunks: 'all',
              priority: 8,
              enforce: true,
            },
            // Utility libraries
            utils: {
              test: /[\\/]node_modules[\\/](lodash|moment|date-fns|ramda|zod)[\\/]/,
              name: 'utils',
              chunks: 'all',
              priority: 6,
              enforce: true,
            },
            // Database and API
            database: {
              test: /[\\/]node_modules[\\/](@prisma|prisma|@trpc|trpc)[\\/]/,
              name: 'database',
              chunks: 'all',
              priority: 6,
              enforce: true,
            },
            // Charts and visualization
            charts: {
              test: /[\\/]node_modules[\\/](chart\.js|recharts|d3|victory)[\\/]/,
              name: 'charts',
              chunks: 'all',
              priority: 5,
              enforce: true,
            },
          },
        },
        
        // Module IDs for better caching
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
        
        // Runtime chunk optimization
        runtimeChunk: {
          name: 'runtime',
        },
      }

      // Enhanced Terser configuration
      config.optimization.minimizer?.forEach(plugin => {
        if (plugin.constructor.name === 'TerserPlugin') {
          plugin.options.terserOptions = {
            ...plugin.options.terserOptions,
            compress: {
              ...plugin.options.terserOptions?.compress,
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
              passes: 3,
              arguments: true,
              booleans_as_integers: true,
              hoist_funs: true,
              hoist_props: true,
              hoist_vars: true,
              inline: 3,
              join_vars: true,
              loops: true,
              negate_iife: true,
              properties: true,
              reduce_vars: true,
              sequences: true,
              side_effects: true,
              switches: true,
              top_retain: null,
              typeofs: true,
              unused: true,
            },
            mangle: {
              safari10: true,
              properties: {
                regex: /^_/,
              },
            },
            format: {
              comments: false,
            },
          }
          plugin.options.parallel = true
          plugin.options.extractComments = false
        }
      })

      // Production compression plugins
      const CompressionPlugin = require('compression-webpack-plugin')
      const BrotliPlugin = require('brotli-webpack-plugin')
      
      config.plugins.push(
        // Gzip compression
        new CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg|json|xml|txt)$/,
          threshold: 8192,
          minRatio: 0.8,
          filename: '[path][base].gz',
        }),
        // Brotli compression
        new BrotliPlugin({
          asset: '[path][base].br',
          test: /\.(js|css|html|svg|json|xml|txt)$/,
          threshold: 10240,
          minRatio: 0.8,
        })
      )

      // Service Worker plugin for PWA
      if (!isServer) {
        const { InjectManifest } = require('workbox-webpack-plugin')
        config.plugins.push(
          new InjectManifest({
            swSrc: './src/lib/sw.ts',
            swDest: '../public/sw.js',
            exclude: [/\.map$/, /manifest$/, /\.htaccess$/],
            manifestTransforms: [
              // Transform function for better caching
              (manifestEntries) => {
                const manifest = manifestEntries.map(entry => {
                  if (entry.url.startsWith('/_next/static/')) {
                    return {
                      ...entry,
                      revision: null,
                    }
                  }
                  return entry
                })
                return { manifest }
              },
            ],
          })
        )
      }
    }

    // Module resolution improvements
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
      '@/components': require('path').resolve(__dirname, 'src/components'),
      '@/lib': require('path').resolve(__dirname, 'src/lib'),
      '@/utils': require('path').resolve(__dirname, 'src/utils'),
      '@/server': require('path').resolve(__dirname, 'src/server'),
      '@/styles': require('path').resolve(__dirname, 'src/styles'),
      '@/types': require('path').resolve(__dirname, 'src/types'),
      '@/hooks': require('path').resolve(__dirname, 'src/hooks'),
    }

    // Client-side polyfill fallbacks
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util'),
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser'),
      }
      
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        }),
        new webpack.DefinePlugin({
          'process.env.BUILD_ID': JSON.stringify(buildId),
          'process.env.BUILD_DATE': JSON.stringify(new Date().toISOString()),
        })
      )
    }

    // Performance hints
    config.performance = {
      hints: 'error',
      maxEntrypointSize: 512000, // 512KB
      maxAssetSize: 512000, // 512KB
    }

    // Ignore specific warnings in production
    config.ignoreWarnings = [
      {
        module: /node_modules/,
        message: /Critical dependency/,
      },
    ]

    return config
  },

  // Output configuration for production
  output: 'standalone',
  distDir: '.next',
  generateEtags: true,
  poweredByHeader: false,
  compress: true,
  
  // HTTP configuration
  httpAgentOptions: {
    keepAlive: true,
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 60000,
    freeSocketTimeout: 30000,
  },

  // Environment variables to expose to client
  env: {
    BUILD_VERSION: process.env.BUILD_VERSION || 'v4.0.0',
    BUILD_DATE: process.env.BUILD_DATE || new Date().toISOString(),
    DEPLOYMENT_ENVIRONMENT: process.env.DEPLOYMENT_ENVIRONMENT || 'production',
  },

  // Production-specific configuration
  productionBrowserSourceMaps: false,
  optimizeFonts: true,
  trailingSlash: false,
  
  // Asset prefix for CDN
  assetPrefix: process.env.CDN_URL || '',
  
  // Custom server configuration
  serverRuntimeConfig: {
    // Server-only config
    secret: process.env.NEXTAUTH_SECRET,
  },
  
  publicRuntimeConfig: {
    // Client and server config
    apiUrl: process.env.NEXTAUTH_URL,
    cdnUrl: process.env.CDN_URL,
  },
}

module.exports = withBundleAnalyzer(nextConfig)