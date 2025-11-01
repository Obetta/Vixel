import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild', // esbuild is fast and works well for production
    // esbuild minification is enabled by default with good defaults
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        // Optimize chunk names for better caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Manual chunk splitting for better caching and parallel loading
        manualChunks: (id) => {
          // Split vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('three')) {
              return 'vendor-three';
            }
            if (id.includes('stats.js')) {
              return 'vendor-stats';
            }
            return 'vendor';
          }
          // Split large feature modules
          if (id.includes('/js/audio/')) {
            return 'audio';
          }
          if (id.includes('/js/particles/')) {
            return 'particles';
          }
          if (id.includes('/js/video/')) {
            return 'video';
          }
        },
      }
    },
    // Inline small assets as base64 (reduces HTTP requests)
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
    // Disable source maps for smaller bundle
    sourcemap: false,
    // Optimize chunk sizes
    cssCodeSplit: true,
    // Report compressed sizes
    reportCompressedSize: true,
    // Target modern browsers for smaller bundles
    target: 'esnext',
    // Enable compression
    cssMinify: true,
    // Enable module preload
    modulePreload: true,
  },
  server: {
    port: 3000
  },
  // Copy public assets (manifest.json, etc.)
  publicDir: 'public',
  // Optimize deps for development
  optimizeDeps: {
    exclude: [],
    include: ['stats.js'], // Pre-bundle stats.js
  }
});
