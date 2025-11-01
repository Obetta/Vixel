import { defineConfig } from 'vite';
import { resolve } from 'path';
import { cpSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

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
      name: 'bundle-scripts',
      buildStart() {
        // Run bundle script before build
        console.log('Running bundle script...');
        execSync('node scripts/bundle-scripts.js', { stdio: 'inherit' });
      }
    },
    {
      name: 'replace-script-tags',
      transformIndexHtml(html) {
        // Replace all individual script tags (from utils.js to main.js) with bundled script
        return html.replace(
          /<script src="\.\/js\/utils\.js"[\s\S]*?<script src="\.\/js\/main\.js" defer><\/script>/,
          '<script src="./js/bundle.js" defer></script>'
        );
      }
    },
    {
      name: 'copy-static-assets',
      closeBundle() {
        // Copy lib directory
        const distLib = resolve(__dirname, 'dist', 'lib');
        cpSync(resolve(__dirname, 'lib'), distLib, { recursive: true });
        
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
