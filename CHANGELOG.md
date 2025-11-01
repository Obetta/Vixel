# Changelog

---

## [Unreleased] - In Progress

### Added
- **Live microphone input** - Real-time audio input, device selection, level meter
- **Shared audio processing** - Compressor/limiter chain for all sources
- **Video support** - Video texture background, frame stepping, segment looping, recording
- **Cursor-style settings** - Left sidebar nav, consolidated controls

### Changed
- Configurable FFT size (1024 mic, 2048 files) | Settings UI redesign | Unified audio processing

### Fixed
- Settings modal mic access | Level meter accuracy

---

## [0.0.2] - 2025-01-27

### Added
- **Security docs** | **File size limits** (500MB default) | **CSP hardening** (no unsafe-inline) | **Project reorganization** (docs → `/docs`)

### Security
- Fixed CSP vulnerability | Added file size limits | Security policy docs

### Changed
- Reorganized structure | Consolidated docs (9 → 4) | Updated references

---

## [0.0.1] - 2025-10-29

### Added
- **Core engine** - Three.js + FFT analysis + 8-band frequency | **Particles** - InstancedMesh, Perlin motion, trails | **Beat detection** | **Controls** - Keyboard/mouse, drag-drop | **Modular architecture** - 19 modules

### Fixed
- Production blockers | Debug logging | Offline mode | Silent failures

---

**Note:** Beta until v1.0.0 stable release.