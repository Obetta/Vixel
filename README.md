# Vixel

Audio-reactive 3D vector field visualization. Real-time frequency analysis → particle animations.

**Tech:** Three.js + Web Audio API | **Modules:** 28 across 5 subsystems | **Performance:** 60 FPS @ 1600 particles

---

## Quick Start

```bash
git clone [repo-url]
cd Vixel
python -m http.server 8000  # or: npx serve .
open http://localhost:8000
```

Drag & drop audio/video OR click "Start Microphone" → visualize immediately.

---

## Controls

**Keyboard:** `Space` play/pause | `←→` seek | `↑↓` trails | `Q/E` oscillation | `R` reset cam | `F` fullscreen  
**Mouse:** Left drag rotate | Right drag pan | Scroll zoom  
**Recording:** Click Record → Stop → Download WebM  
**Microphone:** Start button → Settings for device/gain/compressor

---

## Dev Docs

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Pipeline, modules, data flow
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - GitHub Pages setup
- **[NEXT_STEPS.md](./NEXT_STEPS.md)** - Roadmap & improvements

---

**License:** MIT

