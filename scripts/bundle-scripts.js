#!/usr/bin/env node
/**
 * Bundle script - concatenates all JS files in order for better performance
 * This is a workaround until scripts are converted to ES modules
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Script loading order from index.html
const scriptOrder = [
  'js/three-loader.js',
  'js/init-overlay.js',
  'js/utils.js',
  'js/utils/cleanup.js',
  'js/utils/errorTracker.js',
  'js/utils/errorBoundary.js',
  'js/utils/keyboard.js',
  'js/utils/shortcuts.js',
  'js/utils/settings.js',
  'js/audio/storage.js',
  'js/audio/analyzer.js',
  'js/audio/processor.js',
  'js/audio/loader.js',
  'js/audio/beatDetection.js',
  'js/audio/preScanner.js',
  'js/audio/player.js',
  'js/audio/microphone.js',
  'js/audio/ui.js',
  'js/audio/index.js',
  'js/particles/geometry.js',
  'js/particles/spawning.js',
  'js/particles/placement.js',
  'js/particles/motion.js',
  'js/particles/trails.js',
  'js/particles/index.js',
  'js/core/scene.js',
  'js/core/camera.js',
  'js/core/controls.js',
  'js/video/texture.js',
  'js/video/recorder.js',
  'js/video/controls.js',
  'js/main.js',
];

function bundleScripts() {
  console.log('Bundling scripts...');
  const bundled = scriptOrder
    .map(scriptPath => {
      const fullPath = join(rootDir, scriptPath);
      try {
        const content = readFileSync(fullPath, 'utf-8');
        return `/* ${scriptPath} */\n${content}`;
      } catch (err) {
        console.warn(`Warning: Could not read ${scriptPath}:`, err.message);
        return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');

  const outputPath = join(rootDir, 'dist', 'js', 'bundle.js');
  const distJsDir = join(rootDir, 'dist', 'js');
  
  // Ensure directory exists
  try {
    require('fs').mkdirSync(distJsDir, { recursive: true });
  } catch (e) {}
  
  writeFileSync(outputPath, bundled, 'utf-8');
  console.log(`✓ Bundled ${scriptOrder.length} scripts into dist/js/bundle.js`);
}

bundleScripts();

