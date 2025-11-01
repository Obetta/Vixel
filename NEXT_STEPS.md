# Next Steps

Roadmap and improvements for Vixel.

---

## Quick Wins

### 1. ES6 Module Migration ⚙️
- Convert global namespace to ES6 modules
- Use Vite bundler for tree-shaking
- Better IDE support, cleaner imports
- **Impact:** Code quality, maintainability

### 2. IndexedDB Caching 📦
- Cache pre-scan results in IndexedDB
- Skip re-analysis on re-upload
- Faster track switching
- **Impact:** Performance, UX

### 3. TypeScript Migration 🔷
- Add type definitions
- Gradual migration (JS → .ts)
- Better refactoring, fewer bugs
- **Impact:** Code safety, dev experience

---

## Architecture

### Dependency Injection 🧩
- Explicit module dependencies
- Easier testing, mocking
- Replace global `window.*` access
- **Modules:** Start with audio subsystem

### Configuration Module ⚙️
- Centralized settings
- Runtime tuning without rebuild
- `VixelConfig` namespace
- **Settings:** FFT size, limits, flags

---

## Features

### Beat Sync Enhancements 🎵
- Use video timestamps for cue triggers
- Enhanced onset detection
- Multi-band gates for live input
- **Impact:** More responsive visuals

### Advanced Video Controls 🎬
- Opacity/scale UI controls
- Blend mode options (multiply, overlay, etc.)
- Subtitle file parsing (optional)
- **Impact:** More creative control

### Presets System 🎨
- Save/load visual presets
- Share configurations
- Quick switching between styles
- **Storage:** IndexedDB or localStorage

---

## Testing & Quality

### Test Coverage 📊
- More unit tests for audio subsystem
- Integration tests for full pipeline
- Visual regression tests (optional)
- **Target:** 80%+ coverage

### Performance Profiling 🔬
- Bundle size analysis
- Memory leak detection
- FPS monitoring dashboard
- **Tools:** Lighthouse, Chrome DevTools

---

## Documentation

### API Docs 📚
- JSDoc for all public functions
- Usage examples per module
- Architecture diagrams (optional)
- **Tool:** Generate from JSDoc

### Developer Guide 🛠
- Setup instructions
- Module creation guidelines
- Testing strategy
- **Audience:** Contributors

---

## Prioritized Roadmap

**Next Sprint:**
1. Configuration module
2. IndexedDB caching
3. More tests

**Next Quarter:**
1. ES6 module migration
2. Dependency injection
3. TypeScript setup

**Future:**
1. Presets system
2. Advanced video features
3. Performance dashboards

---

**Last updated:** 2025-01-29
