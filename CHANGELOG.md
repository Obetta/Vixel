# Changelog

All notable changes to Vixel will be documented in this file.

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