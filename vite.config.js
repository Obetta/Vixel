import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild', // esbuild is faster and works well
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        // Preserve directory structure
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      }
    },
    // Inline small assets as base64 (reduces HTTP requests)
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Optimize chunk sizes
    cssCodeSplit: true,
    // Report compressed sizes
    reportCompressedSize: true,
    // Target modern browsers for smaller bundles
    target: 'esnext',
  },
  server: {
    port: 3000
  },
  // Copy public assets
  publicDir: false,
  // Optimize deps for development
  optimizeDeps: {
    exclude: []
  }
});
