# Contributing

**Setup & guidelines for developers**

---

## Setup

```bash
git clone [repo-url]
cd Vixel
python -m http.server 8000  # or: npx serve .
open http://localhost:8000
```

**Architecture:** 28 modules across 5 subsystems | Global namespace `window.Vixel*` | See [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Guidelines

- ✅ Single responsibility per module
- ✅ `DEBUG` flag for console logs
- ✅ Comprehensive error handling
- ✅ Memory cleanup on unload
- ✅ Clean, readable code

---

## Contributing

### Issues
1. Check existing issues
2. Include reproduction steps
3. Add browser/environment info

### Pull Requests
1. Fork & create feature branch
2. Keep changes focused
3. Update docs, add tests
4. Submit PR with clear description

### Testing
```bash
npm test              # Run tests
npm run test:coverage # Check coverage
npm run build        # Production build
```

---

## Security

**Features:** CSP (no unsafe-inline), file validation (audio/*, video/* only), size limits (500MB default, 1GB max), client-side only processing, blob URL cleanup  
**Practices:** Validate all input, avoid eval()/Function(), revoke URLs, minimal deps, trusted CDNs  
**Reporting:** Email security issues with description, steps, impact

---

## Deployment Checklist

**Before deploy:** Run `npm audit`, test file handling, verify CSP, check memory cleanup, no console errors  
**In production:** Monitor memory usage, watch error logs, keep deps updated

---

**Last updated:** 2025-01-29