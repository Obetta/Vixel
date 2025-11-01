# Vixel Architecture

**Audio → visual pipeline & module structure**

---

## Pipeline

```
File/Mic → Processor → FFT (2048/1024) → 8 Bands → Normalize → Weight → Motion → Render
```

**Steps:** Audio input → Shared processor (gain/compressor) → AnalyserNode → 8 log-spaced bands → Peak-hold smoothing → Motion weighting (gamma≈1.4) → Perlin flow + radial fields → Beat pulses → InstancedMesh render

---

## Modules

### Audio (`js/audio/` - 11)
**loader.js** - File/mic input, validation | **analyzer.js** - FFT→8 bands | **processor.js** - Gain/compressor chain | **microphone.js** - Live input | **beatDetection.js** - Kick/BPM | **player.js** - Playback | **preScanner.js** - Background analysis | **preScannerWorker.js** - Web Worker | **storage.js** - IndexedDB | **ui.js** - Controls | **index.js** - Orchestrator

### Core (`js/core/` - 3)
**scene.js** - Three.js setup | **camera.js** - Camera/OrbitControls | **controls.js** - UI handlers

### Particles (`js/particles/` - 6)
**geometry.js** - InstancedMesh | **spawning.js** - Activation | **placement.js** - Positions | **motion.js** - Perlin physics | **trails.js** - Rendering | **index.js** - VectorField

### Utils (`js/utils/` - 6)
**cleanup.js** - Memory | **errorBoundary.js** - Errors | **errorTracker.js** - Logging | **keyboard.js** - Shortcuts | **shortcuts.js** - Modal UI | **settings.js** - Preferences

### Video (`js/video/` - 3)
**texture.js** - Texture rendering | **recorder.js** - Canvas capture | **controls.js** - Playback

---

## Design

**Communication:** Global namespace (`window.Vixel*`) + orchestrator (`main.js`) + events  
**Benefits:** Clear separation, no circular deps, graceful errors  
**TODO:** ES6 modules, dependency injection, TypeScript

---

## Performance

**Target:** 60 FPS @ 1600 particles | **GPU:** Single draw call | **Memory:** Cleanup + blob URL mgmt | **Analysis:** 3-4s per 3min track | **Browser:** Chrome 90+, FF 90+, Safari 14+, Edge 90+

---

**Last updated:** 2025-01-29