# Contributing to Vixel

---

## Quick Start

```bash
git clone [your-repo-url]
cd Vixel
python -m http.server 8000  # or: npx serve .
open http://localhost:8000
```

---

## Development

### Setup
- 23 modules across 4 subsystems (audio, core, particles, utils)
- Global namespace pattern: `window.VixelModuleName`
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for details

### Guidelines
- ✅ Keep modules focused, single responsibility
- ✅ Use DEBUG flag for console.log statements
- ✅ Comprehensive error handling
- ✅ Proper memory cleanup
- ✅ Clean, readable, well-documented code

---

## Contributing

### Issues
1. Check existing issues
2. Include reproduction steps
3. Provide browser/environment details

### Pull Requests
1. Fork and create feature branch
2. Make focused changes
3. Update docs, add tests
4. Submit PR with clear description

### Testing
```bash
npm test                # Run tests
npm run test:coverage   # Check coverage
npm run build          # Build for production
```

---

## Reference

- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Security:** [SECURITY.md](./SECURITY.md)
- **General:** [README.md](../README.md)

**Last Updated:** 2025-01-27
