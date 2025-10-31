import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        // Preserve directory structure
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    // Don't inline assets - keep as separate files
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1000
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
