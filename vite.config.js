import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
    // Inline small assets as base64
    assetsInlineLimit: 8192,
    // Disable source maps for production
    sourcemap: false,
    // CSS optimization
    cssCodeSplit: false, // Single CSS file is better when scripts aren't bundled
    cssMinify: true,
    // Report compressed sizes
    reportCompressedSize: true,
    // Target modern browsers
    target: 'esnext',
  },
  server: {
    port: 3000
  },
  publicDir: false,
});
