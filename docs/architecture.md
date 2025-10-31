# Vixel Architecture

Technical documentation of the audio → visual pipeline and system design.

---

## Pipeline Overview

1. **Audio Input** - File loading via `<audio>` element → Web Audio API
2. **FFT Analysis** - `AnalyserNode` (2048 samples) → 8 log-spaced frequency bands
3. **Normalization** - Magnitudes normalized (0-1) with peak-hold smoothing
4. **Motion Weighting** - Per-band weight: `pow(f_norm, gamma)` where `gamma` ≈ 1.4
5. **Motion Systems** - Linear drift (X/Y), Perlin oscillation (Z), radial field
6. **Beat Detection** - Low-band threshold detection → size/push pulses
7. **Trails** - Fullscreen fade quad + instanced vector rendering
8. **Color** - Gradient sampled by amplitude
9. **GPU Rendering** - `THREE.InstancedMesh` (single draw call)

---

## Data Flow

```
Audio → AnalyserNode (FFT) → 8 Bands → Normalize → Weight → Motion → Render
```

---

## Module Structure

### Audio Subsystem (`js/audio/` - 9 modules)
- **loader.js** - File loading, validation, drag-and-drop
- **analyzer.js** - FFT → 8-band computation
- **beatDetection.js** - Kick/snare detection, BPM
- **player.js** - Playback control
- **preScanner.js** - Background full-track analysis
- **preScannerWorker.js** - Web Worker for analysis
- **storage.js** - IndexedDB file caching
- **ui.js** - UI controls and feedback
- **index.js** - Orchestrator

### Core Subsystem (`js/core/` - 3 modules)
- **scene.js** - Three.js renderer setup
- **camera.js** - Camera + OrbitControls
- **controls.js** - UI event handlers

### Particles Subsystem (`js/particles/` - 6 modules)
- **geometry.js** - InstancedMesh construction
- **spawning.js** - Particle activation
- **placement.js** - Position calculation
- **motion.js** - Physics simulation (Perlin flow)
- **trails.js** - Trail rendering
- **index.js** - VectorField orchestrator

### Utils Subsystem (`js/utils/` - 5 modules)
- **cleanup.js** - Memory management
- **errorBoundary.js** - Error handling
- **errorTracker.js** - Error logging
- **keyboard.js** - Keyboard shortcuts
- **stats.js** - Performance monitoring

**Total:** 23 modules across 4 subsystems

---

## Architecture Patterns

### Communication
- **Global namespace** - All modules on `window.Vixel*`
- **Explicit orchestrator** - `main.js` coordinates subsystems
- **Event-driven** - Custom events for cross-module communication
- **Cleanup system** - Centralized resource management

### Strengths
- ✅ Clear separation of concerns
- ✅ No circular dependencies
- ✅ Graceful error handling
- ✅ Modular, testable design

### Future Improvements
- Migrate to ES6 modules for tree-shaking
- Add dependency injection for testing
- Consider TypeScript for type safety

---

## Performance

- **Target:** 60 FPS with 1600+ particles
- **GPU:** Single draw call via InstancedMesh
- **Memory:** Proper cleanup, blob URL management
- **Analysis:** 3-4 seconds for 3-minute song
- **Pre-scanning:** Background full-track analysis

---

## Browser Support

- Chrome 90+, Firefox 90+, Safari 14+, Edge 90+
- **Requirements:** Web Audio API, WebGL 2.0, InstancedMesh

---

## Directory Structure

```
Vixel/
├── js/
│   ├── audio/      # Audio analysis & playback (9 modules)
│   ├── core/       # 3D scene management (3 modules)
│   ├── particles/  # Particle system (6 modules)
│   ├── utils/      # Utilities (5 modules)
│   ├── main.js     # App orchestrator
│   └── utils.js    # Shared functions
├── docs/           # Documentation
├── html/           # Additional pages
├── lib/            # Three.js library
├── assets/         # Media files
├── tests/          # Test files
└── index.html      # Entry point
```

---

## Future Enhancements

- Web Workers for pre-scanning ✅
- IndexedDB caching for analysis results
- Live microphone input support
- Video texture support
- ES6 module migration
- TypeScript integration

---

**Last Updated:** 2025-01-27
