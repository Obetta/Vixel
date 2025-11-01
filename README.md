# Vixel

Audio-reactive 3D vector field visualization powered by Three.js and the Web Audio API.

**Status:** Beta v0.0.2 - Production Ready

---

## Features

- **Real-time FFT audio analysis** - 8-band frequency visualization
- **Background pre-scanning** - Enhanced visualization through full-track analysis
- **Dynamic motion patterns** - Fluid physics with Perlin noise, radial fields, and trails
- **Color & size modulation** - Reactive visuals that respond to music
- **Smart controls** - Keyboard and mouse-friendly interface
- **Beat detection** - Kick/bass detection with visual pulses

---

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd Vixel
   ```

2. **Serve the project** (any static server works)
   ```bash
   # Option 1: Python
   python -m http.server 8000
   
   # Option 2: Node.js
   npx serve .
   
   # Option 3: PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   - Navigate to `http://localhost:8000`
   - Drag and drop an audio file to visualize

### Production

The project is ready to deploy as-is. No build process required - just upload the files to any static hosting service.

---

## Tech Stack

- **Three.js** v0.160.1 - 3D rendering engine
- **Web Audio API** - Real-time audio analysis
- **Vanilla JavaScript** - No frameworks required
- **Modern Browser** - Chrome, Firefox, Safari, Edge

---

## Project Structure

```
Vixel/
├── js/
│   ├── audio/          # Audio analysis & playback (9 modules)
│   │   ├── analyzer.js
│   │   ├── beatDetection.js
│   │   ├── loader.js
│   │   ├── player.js
│   │   ├── preScanner.js
│   │   ├── preScannerWorker.js
│   │   ├── storage.js
│   │   ├── ui.js
│   │   └── index.js
│   ├── core/           # 3D scene management (3 modules)
│   │   ├── camera.js
│   │   ├── controls.js
│   │   └── scene.js
│   ├── particles/      # Particle system (6 modules)
│   │   ├── geometry.js
│   │   ├── motion.js
│   │   ├── placement.js
│   │   ├── spawning.js
│   │   ├── trails.js
│   │   └── index.js
│   ├── utils/          # Utilities (5 modules)
│   │   ├── cleanup.js
│   │   ├── errorBoundary.js
│   │   ├── errorTracker.js
│   │   ├── keyboard.js
│   │   └── stats.js
│   ├── init-overlay.js
│   ├── main.js         # App entry point
│   └── utils.js
├── lib/
│   └── three.min.js    # Three.js library
├── assets/
│   ├── audio/          # Audio samples (optional)
│   └── textures/       # Texture assets (optional)
├── docs/               # Documentation
│   ├── CHANGELOG.md
│   ├── ARCHITECTURE.md
│   ├── CONTRIBUTING.md
│   └── SECURITY.md
├── html/
│   └── tech-stack.html # Tech stack page
├── tests/              # Test files
├── index.html          # Main HTML file
├── package.json
├── vite.config.js
├── vitest.config.js
└── README.md
```

---

## Controls

### Keyboard Shortcuts

- `Space` - Toggle playback
- `←` `→` - Seek through track (when focused on timeline)
- `↑` `↓` - Adjust trail persistence
- `Q` `E` - Adjust oscillation intensity
- `R` - Reset camera spin
- `0` - Reorient camera to default position
- `F` - Toggle fullscreen
- `S` - Toggle performance stats
- `Esc` - Close modals

### Mouse Controls

- **Left drag** - Rotate camera
- **Right drag** - Pan camera
- **Scroll** - Zoom in/out

---

## How It Works

1. **Audio Input** - Load audio/video file via drag-and-drop
2. **FFT Analysis** - Real-time frequency analysis into 8 bands
3. **Pre-Scanning** (Beta) - Background analysis of entire track for enhanced placement
4. **Motion Calculation** - Perlin noise, radial fields, and linear drift
5. **Particle System** - Instanced rendering for efficient GPU usage
6. **Trails** - Fullscreen fade effect for motion trails
7. **Color Modulation** - Dynamic coloring based on amplitude

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed technical documentation.

---

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 90+
- ✅ Safari 14+
- ✅ Edge 90+

Requires Web Audio API and WebGL support.

---

## Performance

- **Target FPS:** 60 FPS with 1600 particles
- **Memory:** < 200MB on mobile devices
- **Load time:** < 2 seconds initial load

Optimized for modern GPUs with InstancedMesh rendering.

---

## License

MIT License - See [LICENSE](./LICENSE) for details.

---

## Documentation

- **[CHANGELOG.md](./docs/CHANGELOG.md)** - Version history and release notes
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Technical architecture and implementation details
- **[CONTRIBUTING.md](./docs/CONTRIBUTING.md)** - Development setup and contribution guidelines
- **[SECURITY.md](./docs/SECURITY.md)** - Security policy and vulnerability reporting

---

## Status

**Beta v0.0.2** - Production Ready

All critical features implemented and tested. Modular architecture with comprehensive error handling and security improvements. Ready for deployment.

**Recent Updates:**
- ✅ Enhanced security with CSP improvements and file size validation
- ✅ Consolidated documentation to 4 focused files
- ✅ Reorganized project structure for better maintainability
- ✅ Improved file handling with validation and error messages

See [CHANGELOG.md](./docs/CHANGELOG.md) for detailed version history.

