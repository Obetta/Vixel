# Changelog

All notable changes to Vixel will be documented in this file.

---

## [Unreleased] - In Development

### Added
- **Live microphone/line-in input** (`js/audio/microphone.js`) - Real-time audio input support
  - `getUserMedia()` microphone access with device selection
  - `MediaStreamAudioSourceNode` integration with shared audio processor
  - Microphone toggle button with active state indicator
  - Input device selector (enumerates available microphones/line-in devices)
  - Real-time input level meter with color-coded visualization
  - Low-latency FFT size (1024) for live input
  - Pre-scanning automatically skipped for live input
  - Device enumeration without permission request (only requests when mic starts)
- **Shared audio processing chain** (`js/audio/processor.js`) - Unified audio processing for all sources
  - Compressor/limiter applies to both microphone and file playback
  - Gain control, threshold, ratio, knee, attack, release settings
  - Configurable frequency smoothing
  - Real-time parameter adjustment via settings
- **Enhanced settings system** (`js/utils/settings.js`) - Cursor-style settings interface
  - Left sidebar navigation with section icons
  - Consolidated Input settings (device, gain, compressor/limiter, smoothing)
  - Recording settings (bitrate, FPS, format)
  - Settings modal no longer triggers microphone access on open
  - Settings apply to all audio sources (mic + files)
- **Video file support** - Full video texture rendering and controls
  - Video file loading with audio extraction for visualization
  - Fullscreen video texture background behind particle field
  - Video opacity, scale, and blend mode controls
  - Frame-by-frame stepping and scrubbing
  - Segment looping with custom start/end points
  - Frame rate multiplier control (0.25x to 2x)
  - Video controls UI section (automatically shown for video files)
  - Frame number and timestamp display
- **Video recording** (`js/video/recorder.js`) - Record the visualization to video with audio
  - Canvas + audio capture using MediaRecorder API
  - Multiple codec support (VP9, VP8, H.264)
  - Recording UI with live duration indicator
  - Grid visibility toggle for recordings
  - File System Access API save dialog with download fallback
- **Track panel collapse** - Collapsible right navigation panel
  - Centered track controls in top nav when panel collapsed
  - Sync between main and collapsed nav controls
  - Conditional visualization graying when audio panel collapsed

### Changed
- Enhanced audio loader for video file handling
- Improved controls system for video-specific features
- Updated main render loop for video texture updates
- Performance stats moved to dedicated bottom section in left nav
- Recording format selector with auto-detection
- Video controls hidden by default, shown for video files
- **Analyzer supports configurable FFT size** - 1024 for microphone (low latency), 2048 for files (higher resolution)
- **Settings UI redesigned** - Cursor-style left sidebar navigation replaces top tabs
- **Audio processing unified** - Compressor/limiter settings apply to all audio sources via shared processor
- **Microphone integration** - All audio sources route through shared processing chain

### Fixed
- Video texture cleanup on file change
- Audio context exposure for recording
- Media element type detection for video vs audio files
- **Settings modal no longer triggers microphone access** - Device enumeration happens without requesting permission when opening settings
- **Microphone level meter fixed** - Now uses time-domain data instead of frequency data for accurate level detection

---

## [0.0.3] - 2025-01-28

### Added
- **Video recording** (`js/video/recorder.js`) - Record the visualization to video with audio
- **Recording UI** - Record/Stop buttons with live duration indicator
- **Grid toggle for recording** - Control whether grid/axes appear in the recording
- **Save location dialog** - Choose where to save in modern browsers (File System Access API)
- **MediaRecorder integration** - Canvas + audio capture using Web APIs

### Technical
- MediaRecorder API for canvas + audio recording
- Audio routing from existing AudioContext via MediaStreamDestination
- 30 FPS canvas capture at 2.5 Mbps bitrate
- WebM codec with VP9/VP8 fallback
- Grid visibility management during recording
- File System Access API with fallback to auto-download

---

## [0.0.2] - 2025-01-27

### Added
- **Security documentation** (`SECURITY.md`) with comprehensive security policy
- **Modularity assessment** (`MODULARITY.md`) with architecture analysis and improvement roadmap
- **File size validation** - 500MB default limit to prevent memory exhaustion
- **Security improvements** - Removed `unsafe-inline` from Content Security Policy
- **Init overlay script** - Moved inline script to external file for better CSP compliance

### Security
- ✅ Fixed CSP `unsafe-inline` vulnerability by externalizing inline script
- ✅ Added file size limits (500MB default, 1GB hard limit)
- ✅ Documented security considerations and reporting process
- ✅ Added security checklist for deployments

### Documentation
- Added `SECURITY.md` with security policy, best practices, and vulnerability reporting
- Added `MODULARITY.md` with architecture assessment and improvement recommendations
- Documented file handling security measures
- Added privacy considerations section

### Changed
- Improved file handling with size validation and error messages
- Enhanced security posture through CSP improvements
- Better modularity through clearer separation of concerns

---

## [0.0.1] - 2025-10-29

### Added
- Core visualization engine with Three.js integration
- Real-time FFT audio analysis and 8-band frequency distribution
- Dynamic particle system with instanced rendering
- Beat detection and color modulation
- Motion trails and Perlin noise-based movement
- Keyboard/mouse controls and drag-and-drop file loading
- Loading UI with progress indicators
- Comprehensive error handling and graceful degradation
- Modular architecture (19 modules across audio, core, and particle subsystems)

### Changed
- Refactored codebase from monolithic structure to modular architecture
- Improved code organization and separation of concerns

### Fixed
- Production blockers resolved
- Debug logging properly gated
- Offline mode with Three.js fallback chain
- Silent failures now show user-friendly messages

---

**Note:** Versions are beta until v1.0.0 stable release.