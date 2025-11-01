import { defineConfig } from 'vite';
import { resolve } from 'path';
import { cpSync, existsSync } from 'fs';

export default defineConfig({
  base: './',
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
  publicDir: 'public',
  plugins: [
    {
      name: 'copy-static-assets',
      closeBundle() {
        // Copy lib directory
        const distLib = resolve(__dirname, 'dist', 'lib');
        cpSync(resolve(__dirname, 'lib'), distLib, { recursive: true });
        
        // Copy js directory
        const distJs = resolve(__dirname, 'dist', 'js');
        cpSync(resolve(__dirname, 'js'), distJs, { recursive: true });
        
        // Copy html directory if it exists
        const srcHtml = resolve(__dirname, 'html');
        if (existsSync(srcHtml)) {
          const distHtml = resolve(__dirname, 'dist', 'html');
          cpSync(srcHtml, distHtml, { recursive: true });
        }
      }
    }
  ],
});
