# Deployment

GitHub Pages deployment guide.

---

## Current Setup

**Auto-deploy on push to `main`**  
**URL:** `https://obetta.github.io/Vixel/`  
**Branch:** `gh-pages` (auto-created)  
**Build:** `./dist`

---

## Initial Setup

1. **Workflow exists:** `.github/workflows/deploy.yml` ✅
2. **Run manually:** Actions → Run workflow → `gh-pages` created
3. **Configure Pages:** Settings → Pages → `gh-pages` branch → `/ (root)`
4. **Verify:** Site live at URL above

---

## Deployment Options

### Auto-Deploy (Current) ✅
```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```
**Use:** Active development | **Pros:** Always current | **Cons:** Uses Actions minutes

### Manual Only
```yaml
on:
  workflow_dispatch:
```
**Use:** Production releases | **Pros:** Control + saves minutes | **Cons:** Remember to trigger

### Tags/Releases
```yaml
on:
  push:
    tags: ['v*']
  release:
    types: [published]
```
**Use:** Versioned deploys | **Pros:** Release history | **Cons:** More steps

### Path-Based
```yaml
on:
  push:
    branches: [main]
    paths: ['js/**', 'style.css', 'index.html']
```
**Use:** Skip docs-only changes | **Pros:** Only deploy relevant | **Cons:** Complex config

---

## Custom Domain

1. **GitHub:** Settings → Pages → custom domain
2. **DNS:** CNAME `@` → `obetta.github.io` OR A records (GitHub IPs)
3. **HTTPS:** Auto-enabled by GitHub
4. **Propagation:** Wait up to 48h

---

## Config

- **Build:** `npm run build` | **Output:** `./dist` | **Node:** 20

---

## Troubleshooting

**"Write access denied"** → Ensure `contents: write` permission in workflow  
**"gh-pages not found"** → Run workflow manually first  
**Site not updating** → Check workflow ran, clear cache, verify settings  
**Build fails** → Check `package.json` scripts, dependencies, logs

---

**Last updated:** 2025-01-29