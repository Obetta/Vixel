# Deployment Guide

GitHub Pages deployment configuration and options for Vixel.

---

## 🚀 Current Setup

**Status:** Auto-deploy on every push to `main` branch

- **Workflow:** `.github/workflows/deploy.yml`
- **Deployment Branch:** `gh-pages` (created automatically)
- **Site URL:** `https://obetta.github.io/Vixel/`
- **Build Output:** `./dist` directory

---

## 📋 Setup Checklist

### Initial Setup

- [x] Create GitHub Actions workflow file
- [ ] Push workflow to repository
- [ ] Run workflow manually (Actions tab → Run workflow)
- [ ] Wait for `gh-pages` branch to be created
- [ ] Configure GitHub Pages settings:
  - [ ] Go to Settings → Pages
  - [ ] Select `gh-pages` branch
  - [ ] Select `/ (root)` folder
  - [ ] Click Save
- [ ] Verify site is live at `https://obetta.github.io/Vixel/`

### Custom Domain (Optional)

- [ ] Purchase domain (e.g., `vixel.io`, `vixel.dev`)
- [ ] Configure DNS records:
  - [ ] Add CNAME record: `@` → `obetta.github.io`
  - [ ] Or A records with GitHub IPs
- [ ] Add custom domain in GitHub Settings → Pages
- [ ] Update workflow `cname` setting if needed
- [ ] Wait for DNS propagation (up to 48 hours)
- [ ] Enable HTTPS (GitHub does this automatically)

---

## ⚙️ Deployment Options

### Option 1: Auto-Deploy (Current) ✅

**Trigger:** Every push to `main` branch

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:  # Also allows manual trigger
```

**Pros:**
- ✅ Always up-to-date
- ✅ No manual steps
- ✅ Great for active development

**Cons:**
- Uses GitHub Actions minutes on every push
- No control over when deployments happen

---

### Option 2: Manual Deploy Only

**Trigger:** Only when manually triggered

```yaml
on:
  workflow_dispatch:
```

**Pros:**
- ✅ Full control over deployments
- ✅ Saves GitHub Actions minutes
- ✅ Good for production releases

**Cons:**
- Requires manual trigger each time
- Easy to forget to deploy

**To deploy:**
1. Go to Actions tab
2. Select "Deploy to GitHub Pages"
3. Click "Run workflow"
4. Select branch and click "Run workflow"

---

### Option 3: Deploy on Tags/Releases

**Trigger:** Only when creating git tags or GitHub releases

```yaml
on:
  push:
    tags:
      - 'v*'  # Deploy on version tags like v1.0.0
  release:
    types: [published]
```

**Pros:**
- ✅ Versioned deployments
- ✅ Production-ready workflow
- ✅ Clear release history

**Cons:**
- Requires tag/release creation
- More steps for updates

**To deploy:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

### Option 4: Deploy on Specific Path Changes

**Trigger:** Only when specific files/directories change

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'js/**'
      - 'style.css'
      - 'index.html'
      - 'package.json'
```

**Pros:**
- ✅ Only deploys when relevant files change
- ✅ Skips deployment for docs-only changes

**Cons:**
- More complex configuration
- Easy to miss important changes

---

## 🔧 Configuration

### Workflow File Location
`.github/workflows/deploy.yml`

### Build Command
```bash
npm run build
```

### Output Directory
`./dist`

### Node Version
Node.js 20 (configured in workflow)

---

## 🌐 Custom Domain Setup

### Step 1: Configure in GitHub

1. Go to repository Settings → Pages
2. Enter your custom domain (e.g., `vixel.io`)
3. GitHub will create a `CNAME` file automatically

### Step 2: Configure DNS

**Option A: CNAME (Recommended)**
```
Type: CNAME
Name: @ (or www)
Value: obetta.github.io
TTL: 3600
```

**Option B: A Records**
```
Type: A
Name: @
Value: 185.199.108.153
        185.199.109.153
        185.199.110.153
        185.199.111.153
TTL: 3600
```

### Step 3: Update Workflow (if needed)

If using custom domain, the workflow should preserve CNAME:

```yaml
- name: Deploy
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./dist
    cname: true  # Preserves CNAME file
```

---

## 🔍 Troubleshooting

### Issue: "Write access to repository not granted"

**Solution:** Ensure workflow has `contents: write` permission:
```yaml
permissions:
  contents: write
```

### Issue: "gh-pages branch not found"

**Solution:** 
1. Run workflow manually from Actions tab
2. Wait for first deployment to complete
3. Branch will be created automatically

### Issue: "Git error exit code 128"

**Solution:**
- Ensure `fetch-depth: 0` in checkout step
- Check that GITHUB_TOKEN has write permissions

### Issue: Site not updating

**Solution:**
1. Check workflow ran successfully
2. Verify GitHub Pages is set to `gh-pages` branch
3. Clear browser cache
4. Check for build errors in workflow logs

### Issue: Build fails

**Solution:**
- Check `package.json` has correct build script
- Verify all dependencies are in `package.json`
- Check workflow logs for specific error

---

## 📝 Deployment Best Practices

1. **Test locally first:** Run `npm run build` locally before pushing
2. **Check workflow logs:** Always verify deployment succeeded
3. **Version tags:** Use semantic versioning for releases (v1.0.0)
4. **Monitor Actions:** Watch for failed deployments
5. **Custom domain:** Use HTTPS (GitHub provides automatically)

---

## 🔗 Useful Links

- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

## 📊 Current Workflow Summary

```yaml
Trigger: Push to main + Manual
Build: npm ci → npm run build
Deploy: peaceiris/actions-gh-pages@v3
Branch: gh-pages (auto-created)
URL: https://obetta.github.io/Vixel/
Status: ✅ Configured
```

---

**Last Updated:** 2024

