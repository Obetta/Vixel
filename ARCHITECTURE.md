# Vixel Architecture

Technical documentation of the audio → visual pipeline.

---

## Pipeline

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

### Audio (`js/audio/`)
- **loader.js** - File loading, drag-and-drop
- **analyzer.js** - FFT → 8-band computation
- **beatDetection.js** - Kick/snare detection, BPM
- **player.js** - Playback control
- **ui.js** - UI controls
- **preScanner.js** - Background full-track analysis
- **index.js** - Orchestrator

### Core (`js/core/`)
- **scene.js** - Three.js renderer setup
- **camera.js** - Camera + OrbitControls
- **controls.js** - UI event handlers

### Particles (`js/particles/`)
- **geometry.js** - InstancedMesh construction
- **spawning.js** - Particle activation
- **placement.js** - Position calculation
- **motion.js** - Physics simulation (Perlin flow)
- **trails.js** - Trail rendering
- **index.js** - VectorField orchestrator

---

## Pre-Scanning

Background analysis of full track:
- Maps frequency spectrum over time
- Improves BPM accuracy
- Enables better node placement
- Phase 1: Background processing (✅ Complete)
- Phase 2: IndexedDB caching (🔄 Next)

---

## Performance

- **Target:** 60 FPS with 1600+ particles
- **GPU:** Single draw call via InstancedMesh
- **Memory:** Proper cleanup, blob URL management
- **Analysis:** 3-4 seconds for 3-minute song

---

## Browser Support

- Chrome 90+, Firefox 90+, Safari 14+, Edge 90+
- Requires: Web Audio API, WebGL 2.0, InstancedMesh

---

## Security Considerations

### Content Security Policy (CSP)
- Strict CSP with no `unsafe-inline` scripts
- External scripts only from trusted CDNs
- Blob URLs properly managed and revoked

### File Handling
- File type validation (audio/*, video/* only)
- File size limits (500MB default, 1GB maximum)
- Client-side only processing (no server uploads)
- Proper error handling and user feedback

### Memory Management
- Comprehensive cleanup on page unload
- Blob URL tracking and automatic revocation
- Event listener cleanup
- Animation frame cancellation

See `SECURITY.md` for detailed security documentation.

## Modularity

### Current Architecture
- **3 subsystems:** Audio, Core, Particles
- **23 modules** with clear responsibilities
- Global namespace pattern for browser compatibility
- Dependency order management via HTML script loading

### Strengths
- Clear separation of concerns
- No circular dependencies
- Graceful error handling
- Independent module evolution

### Improvement Opportunities
- Migrate to ES6 modules for better tree-shaking
- Add dependency injection for testing
- Implement configuration module
- Consider TypeScript for type safety

See `MODULARITY.md` for detailed architecture assessment.

## Future Enhancements

- Web Workers for pre-scanning
- IndexedDB caching for analysis results
- Live microphone input support
- Video texture support
- ES6 module migration
- TypeScript integration

---

*For implementation details, see source code in `js/` modules.*  
*For security information, see `SECURITY.md`.*  
*For modularity assessment, see `MODULARITY.md`.*
