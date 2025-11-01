# Vixel

**Audio-reactive 3D vector field visualization** powered by Three.js and the Web Audio API.

Transform your music into mesmerizing 3D particle animations with real-time frequency analysis, dynamic motion patterns, and responsive visual effects.

---

## ✨ Features

- **Real-time FFT analysis** - 8-band frequency visualization
- **Dynamic motion** - Perlin noise, radial fields, and fluid trails
- **Beat detection** - Visual pulses synchronized to kick/bass
- **Background pre-scanning** - Enhanced placement through full-track analysis
- **Responsive visuals** - Color and size modulation driven by audio amplitude
- **Intuitive controls** - Keyboard shortcuts and mouse navigation

---

## 🚀 Quick Start

1. **Clone and serve**
   ```bash
   git clone [your-repo-url]
   cd Vixel
   python -m http.server 8000  # or: npx serve .
   ```

2. **Open** `http://localhost:8000` in your browser

3. **Drag & drop** an audio or video file to visualize

No build process required. Deploy as-is to any static hosting service.

---

## 🎮 Controls

**Keyboard:**
- `Space` - Play/pause
- `←` `→` - Seek (when timeline focused)
- `↑` `↓` - Trail persistence
- `Q` `E` - Oscillation intensity
- `R` - Reset camera spin | `0` - Default camera
- `F` - Fullscreen

**Mouse:**
- Left drag - Rotate | Right drag - Pan | Scroll - Zoom

---

## 🛠 Tech Stack

- **Three.js** v0.160.1 - 3D rendering
- **Web Audio API** - Real-time analysis
- **Vanilla JavaScript** - Zero dependencies
- **WebGL** - GPU-accelerated rendering

---

## 📊 Performance

- **60 FPS** with 1600 particles
- **< 200MB** memory on mobile
- **< 2s** initial load time

Optimized with InstancedMesh rendering for modern GPUs.

---

## 🌐 Browser Support

Chrome 90+ | Firefox 90+ | Safari 14+ | Edge 90+

Requires Web Audio API and WebGL.

---

## 📚 Documentation

- [Architecture](./docs/ARCHITECTURE.md) - Technical details
- [Changelog](./docs/CHANGELOG.md) - Version history
- [Contributing](./docs/CONTRIBUTING.md) - Development guide
- [Security](./docs/SECURITY.md) - Security policy

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.

