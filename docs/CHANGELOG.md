# Changelog

All notable changes to Vixel will be documented in this file.

---

## [0.0.2] - 2025-01-27

### Added
- **Security documentation** (`docs/SECURITY.md`) with comprehensive security policy
- **File size validation** - 500MB default limit to prevent memory exhaustion
- **Security improvements** - Removed `unsafe-inline` from Content Security Policy
- **Init overlay script** - Moved inline script to external file for better CSP compliance
- **Project reorganization** - Moved documentation to `/docs` and HTML pages to `/html`

### Security
- ✅ Fixed CSP `unsafe-inline` vulnerability by externalizing inline script
- ✅ Added file size limits (500MB default, 1GB hard limit)
- ✅ Documented security considerations and reporting process
- ✅ Added security checklist for deployments

### Documentation
- **Consolidated to 4 core docs:** CHANGELOG, CONTRIBUTING, ARCHITECTURE, SECURITY
- Added concise `docs/SECURITY.md` with security policy and best practices
- Added focused `docs/ARCHITECTURE.md` with technical overview
- Streamlined `docs/CONTRIBUTING.md` with development guidelines
- Removed redundant documentation files

### Changed
- **Reorganized project structure** - All documentation now in `/docs` directory
- **Moved HTML pages** - Additional pages now in `/html` directory
- **Consolidated documentation** - From 9 files to 4 focused documents
- Improved file handling with size validation and error messages
- Enhanced security posture through CSP improvements
- Better modularity through clearer separation of concerns
- Updated all cross-references to reflect new directory structure

### Project Organization
- Centralized documentation in `/docs` (4 core documentation files)
- Separated HTML pages into `/html` directory
- Cleaner, more maintainable documentation structure
- Updated README, docs, and HTML references

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