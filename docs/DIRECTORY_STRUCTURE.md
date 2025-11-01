# Directory Structure

This document describes the organization of the Vixel project files.

## Root Directory

```
Vixel/
├── index.html              # Main application entry point
├── style.css               # Global styles
├── package.json            # Project dependencies and scripts
├── vite.config.js          # Vite build configuration
├── vitest.config.js        # Vitest test configuration
├── lighthouserc.json       # Lighthouse CI configuration
├── LICENSE                 # MIT License
├── README.md               # Project overview and quick start
└── .gitignore              # Git ignore rules
```

## Core Directories

### `/js` - JavaScript Source Code
All application logic organized by subsystem.

```
js/
├── main.js                 # Application orchestrator
├── init-overlay.js         # Loading overlay initialization
├── utils.js                # Shared utility functions
├── three-loader.js         # Three.js loading wrapper
├── audio/                  # Audio subsystem (11 modules)
│   ├── index.js           # Audio orchestrator
│   ├── loader.js          # File loading and validation
│   ├── analyzer.js        # FFT analysis (configurable FFT size)
│   ├── processor.js       # Shared audio processing chain (compressor/limiter)
│   ├── microphone.js      # Live microphone/line-in input support
│   ├── beatDetection.js   # Beat/kick detection
│   ├── player.js          # Playback control
│   ├── preScanner.js      # Background analysis
│   ├── preScannerWorker.js # Web Worker for pre-scanning
│   ├── storage.js         # IndexedDB storage
│   └── ui.js              # Audio UI management
├── core/                   # 3D scene management (3 modules)
│   ├── scene.js           # Three.js scene setup
│   ├── camera.js          # Camera and controls
│   └── controls.js        # UI event handlers
├── particles/              # Particle system (6 modules)
│   ├── index.js           # VectorField orchestrator
│   ├── geometry.js        # InstancedMesh construction
│   ├── spawning.js        # Particle activation
│   ├── placement.js       # Position calculation
│   ├── motion.js          # Physics simulation
│   └── trails.js          # Trail rendering
├── utils/                  # Cross-cutting utilities (6 modules)
    ├── cleanup.js         # Memory management
    ├── errorBoundary.js   # Error handling
    ├── errorTracker.js    # Error logging
    ├── keyboard.js        # Keyboard shortcuts
    ├── shortcuts.js       # Keyboard shortcuts modal
    └── settings.js        # User preferences storage with Cursor-style navigation
└── video/                  # Video subsystem (3 modules)
    ├── texture.js         # Video texture rendering
    ├── recorder.js        # Canvas recording
    └── controls.js        # Video playback controls
```

**Total:** 28 JavaScript modules

### `/docs` - Documentation
All project documentation organized in one place.

```
docs/
├── ARCHITECTURE.md         # Technical architecture
├── CHANGELOG.md            # Version history
├── CONTRIBUTING.md         # Contribution guidelines
├── DEPLOYMENT.md           # Deployment procedures
├── MODULARITY.md           # Modularity assessment
├── PRODUCTION_ASSESSMENT.md # Production readiness
├── SECURITY.md             # Security policy
├── DIRECTORY_STRUCTURE.md  # This file
└── ASSESSMENT_SUMMARY.md   # Codebase assessment
```

### `/html` - Additional HTML Pages
Supplementary HTML files.

```
html/
└── tech-stack.html         # Technology stack showcase page
```

### `/lib` - Third-party Libraries
External dependencies bundled with the project.

```
lib/
└── three.min.js            # Three.js v0.160.1 (minified)
```

### `/assets` - Static Assets
Media files and resources.

```
assets/
├── audio/                  # Audio sample files (optional)
│   └── .gitkeep
└── textures/               # Texture assets (optional)
    └── .gitkeep
```

### `/tests` - Test Files
Unit and integration tests.

```
tests/
├── setup.js               # Test configuration
├── audio.test.js          # Audio subsystem tests
├── core.test.js           # Core subsystem tests
├── cleanup.test.js        # Cleanup utility tests
├── errorHandling.test.js  # Error handling tests
└── utils.test.js          # Utility function tests
```

### `/dist` - Build Output
Production build artifacts (generated, not in version control).

```
dist/
├── index.html             # Built HTML
├── index.css              # Built styles
└── [js files]             # Bundled JavaScript
```

### `/node_modules` - Dependencies
npm-installed packages (not in version control).

## Directory Organization Principles

### 1. Separation by Concern
- **Audio subsystem** - All audio-related functionality
- **Core subsystem** - 3D rendering and scene management
- **Particles subsystem** - Visualization system
- **Video subsystem** - Video texture rendering and recording
- **Utils subsystem** - Shared utilities

### 2. Clear Ownership
- Each directory has a single, well-defined purpose
- No duplicate or ambiguous responsibilities
- Easy to locate specific functionality

### 3. Scalability
- Modular structure allows easy addition of new features
- New modules fit naturally into existing subsystems
- Consistent naming conventions

### 4. Documentation Proximity
- All documentation in `/docs`
- Easy to find and maintain
- Clear cross-references

## File Naming Conventions

### JavaScript Files
- **PascalCase** for module exports (`VixelAudioLoader`)
- **camelCase** for file names (`audioLoader.js`)
- **Descriptive** names that indicate purpose

### Documentation Files
- **UPPERCASE** for consistency (`ARCHITECTURE.md`)
- **Descriptive** names (`SECURITY.md`, `CHANGELOG.md`)
- **Markdown** format (.md)

### Configuration Files
- **lowercase** with dots (`package.json`, `vite.config.js`)
- **Standard** names for ecosystem tools

## Path Guidelines

### Absolute Paths
Root directory serves as the base for all paths.

### Relative Paths
- From HTML: Use relative paths (`./js/main.js`)
- From docs: Cross-reference with `./` (`./ARCHITECTURE.md`)
- From JS: Use relative paths for imports

### Public Assets
- CSS: Linked from root (`./style.css`)
- JS: Loaded from `/js` directories
- Images: Stored in `/assets` directories

## Future Organization

### Potential Additions
```
scripts/           # Build and deployment scripts
config/            # Configuration files
examples/          # Usage examples
benchmarks/        # Performance benchmarks
```

### Migration Considerations
When adding new directories:
1. Document purpose in this file
2. Update README project structure
3. Add appropriate .gitignore rules
4. Update build configuration if needed

## Import/Reference Conventions

### JavaScript Modules
```javascript
// Local modules
const { VectorField } = window.VixelField;
const Scene = window.VixelScene;

// Utils
const { clamp, mapRange } = window.VixelUtils;
```

### HTML References
```html
<!-- Local scripts -->
<script src="./js/main.js"></script>

<!-- External libraries -->
<script src="./lib/three.min.js"></script>

<!-- Documentation links -->
<a href="./docs/ARCHITECTURE.md">Architecture</a>
```

### Cross-Document References
```markdown
<!-- From docs to docs -->
See [ARCHITECTURE.md](./ARCHITECTURE.md)

<!-- From root to docs -->
See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
```

## Build Process

### Development
```bash
npm run dev      # Start Vite dev server
```

### Production
```bash
npm run build    # Build to /dist
npm run preview  # Preview build
```

### Testing
```bash
npm test         # Run tests
npm run test:coverage  # Coverage report
```

---

**Last Updated:** 2025-01-28  
**Maintainer:** Development Team

