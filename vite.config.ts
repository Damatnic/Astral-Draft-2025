import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    // Removed duplicate chunk logic to prevent conflicts - using inline logic in build.rollupOptions.output.manualChunks
    
    return {
      base: '/',
      plugins: [
        react(),
        // Copy service worker to dist folder - only during build
        {
          name: 'copy-sw',
          apply: 'build', // Only run during build, not dev
          generateBundle() {
            // Use dynamic import to avoid bundling Node.js modules
            return new Promise((resolve) => {
              import('fs').then(({ copyFileSync, existsSync }) => {
                import('path').then(({ resolve: pathResolve }) => {
                  try {
                    const swPath = pathResolve(process.cwd(), 'sw.js');
                    const distPath = pathResolve(process.cwd(), 'dist/sw.js');
                    
                    if (existsSync(swPath)) {
                      copyFileSync(swPath, distPath);
                      console.log('✓ Service worker copied to dist/sw.js');
                    } else {
                      console.log('ℹ Service worker not found, skipping copy');
                    }
                  } catch (error) {
                    console.warn('⚠ Failed to copy service worker:', error instanceof Error ? error.message : String(error));
                  }
                  resolve();
                }).catch(() => resolve());
              }).catch(() => resolve());
            });
          }
        }
      ],
      define: {
        // Remove API key exposure - should be handled via environment variables at runtime
        // Define global for compatibility
        'global': 'globalThis',
        // Environment-specific flags
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        '__DEV__': JSON.stringify(!isProduction),
        '__PROD__': JSON.stringify(isProduction)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          // Node.js polyfills for browser compatibility
          crypto: 'crypto-browserify',
          stream: 'stream-browserify',
          util: 'util',
          events: 'events',
          // Performance aliases for common paths
          '@components': path.resolve(__dirname, 'components'),
          '@services': path.resolve(__dirname, 'services'),
          '@hooks': path.resolve(__dirname, 'hooks'),
          '@utils': path.resolve(__dirname, 'utils'),
          '@types': path.resolve(__dirname, 'types.ts'),
          // Additional polyfills
          buffer: 'buffer'
        }
      },
      build: {
        // Production build optimizations
        target: isProduction ? 'es2020' : 'esnext',
        minify: isProduction ? 'esbuild' : false,
        cssMinify: isProduction,
        // Source maps for production debugging
        sourcemap: isProduction ? 'hidden' : true,
        // Increase chunk size limit since we're keeping React together
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
          output: {
            // Disable code splitting entirely to fix React context issues
            manualChunks: undefined,
            // Alternative: Put EVERYTHING in a single vendor chunk
            // manualChunks: (id: string) => {
            //   if (id.includes('node_modules')) {
            //     return 'vendor';
            //   }
            // },
            // File naming strategy for caching
            entryFileNames: 'assets/[name]-[hash].js',
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
            // Remove globals configuration - React should be bundled, not external
          },
          // Never externalize React in production - it must be bundled
          external: isProduction ? [] : ['@types/node'],
          onwarn(warning, warn) {
            // Suppress specific warnings during build
            if (warning.code === 'UNRESOLVED_IMPORT') return;
            if (warning.code === 'THIS_IS_UNDEFINED') return;
            if (warning.code === 'CIRCULAR_DEPENDENCY') return;
            warn(warning);
          }
        },
        // Asset optimization
        assetsInlineLimit: 2048, // Reduced for better caching
        // CSS code splitting
        cssCodeSplit: true,
        // Browser compatibility
        modulePreload: { polyfill: true },
        // Report compressed file sizes
        reportCompressedSize: true,
        // Cleanup output directory
        emptyOutDir: true,
        // Additional production optimizations for Netlify
        assetsDir: 'assets',
        // Ensure proper MIME types for all assets
        copyPublicDir: true
      },
      // Critical dependency optimization for React
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-dom/client',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'scheduler',
          'framer-motion',
          'lucide-react',
          'recharts',
          '@dnd-kit/core',
          '@dnd-kit/sortable'
        ],
        // Exclude Node.js types from optimization
        exclude: ['@types/node'],
        // Don't force optimization - let Vite handle it intelligently
        // Ensure proper ESBuild handling of React
        esbuildOptions: {
          target: 'es2020',
          // Preserve React's internal structure
          keepNames: true
        }
      },
      // Public directory configuration
      publicDir: 'public',
      // Enhanced caching strategy
      cacheDir: 'node_modules/.vite',
      // Server configuration
      server: {
        host: true,
        port: 8765,
        strictPort: true,
        open: false,
        // Performance middleware
        cors: true,
        // Development optimizations
        hmr: {
          overlay: !isProduction
        }
      },
      // Preview server configuration
      preview: {
        port: 8766,
        host: true,
        strictPort: true,
        open: false
      },
      // Performance monitoring
      esbuild: {
        // Tree shaking optimizations
        treeShaking: true,
        // Keep console.error and console.warn for production debugging
        drop: isProduction ? ['debugger'] : [],
        pure: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
        // Minify identifiers
        minifyIdentifiers: isProduction,
        // Minify syntax
        minifySyntax: isProduction,
        // Minify whitespace
        minifyWhitespace: isProduction
      },
      // CSS optimization
      css: {
        // CSS modules configuration
        modules: {
          localsConvention: 'camelCase'
        }
      }
    };
});
