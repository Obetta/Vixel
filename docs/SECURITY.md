# Security Policy

Client-side audio-reactive 3D visualization with security best practices.

---

## Security Features

### Content Security Policy (CSP)
- ✅ Strict CSP with no `unsafe-inline` scripts
- ✅ External scripts only from trusted CDNs
- ✅ Blob URLs properly managed and revoked

### File Handling
- ✅ File type validation (audio/*, video/* only)
- ✅ File size limits (500MB default, 1GB maximum)
- ✅ Client-side only processing (no server uploads)
- ✅ Proper error handling and user feedback

### Memory Management
- ✅ Comprehensive cleanup on page unload
- ✅ Blob URL tracking and automatic revocation
- ✅ Event listener cleanup
- ✅ Animation frame cancellation

### Error Handling
- ✅ Global error boundary with graceful degradation
- ✅ No sensitive data exposure in errors
- ✅ User-friendly error messages

---

## Security Best Practices

### Code Security
1. **Validate all user input** - Even in client-side code
2. **Never trust user data** - Sanitize filenames, URLs
3. **Avoid eval() and Function()** - Don't dynamically execute code
4. **Limit global variables** - Use namespaced objects (`window.Vixel*`)
5. **Revoke blob URLs** - Prevent memory leaks

### Dependencies
1. **Keep dependencies minimal** - Current: Only Stats.js
2. **Regularly update dependencies** - Check for vulnerabilities
3. **Use known CDNs** - Prefer jsdelivr, cdnjs, unpkg
4. **Consider SRI** - Add integrity hashes for CDN resources

### File Handling
1. **Validate file types** - Use both HTML accept and runtime checks
2. **Check file size** - Reasonable limits (500MB default)
3. **Handle errors gracefully** - Don't expose internal errors
4. **Clear resources** - Always revoke object URLs

---

## Deployment Checklist

### Before Deploying
- [ ] Run `npm audit` for dependency vulnerabilities
- [ ] Test file upload with malicious filenames
- [ ] Verify CSP headers work correctly
- [ ] Check blob URL cleanup (memory profiling)
- [ ] Test error handling with corrupted files
- [ ] Verify no console errors in production

### In Production
- [ ] Monitor for unusual memory usage
- [ ] Watch for error spikes in logs
- [ ] Keep dependencies updated
- [ ] Review CSP reports (if configured)

---

## Browser Security

### Web Audio API
- Requires user interaction to activate
- Sandboxed from system audio
- Cannot access microphone without permission

### WebGL
- GPU memory isolation
- No file system access
- Process isolation

### IndexedDB
- Origin-specific storage
- User-controlled data
- No cross-site access

---

## Privacy

### Data Collection
- **No data collection** - No analytics, tracking, or external calls
- **No data transmission** - All processing is local
- **No cookies** - Only IndexedDB for file caching

### User Data
- Files stored only in user's browser
- No cloud storage or server uploads
- User controls data lifecycle

---

## Reporting Security Issues

### What to Report
- XSS vulnerabilities
- File upload exploits
- Memory/DoS vulnerabilities
- CSP bypasses
- Dependency vulnerabilities

### How to Report
1. **Email:** [Security Contact]
2. **Subject:** `[SECURITY] Vixel - [Brief description]`
3. **Include:**
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Process
1. **Acknowledge** - Within 48 hours
2. **Investigate** - Within 1 week
3. **Fix** - Based on severity
4. **Disclose** - Coordinated disclosure

---

## Compliance

### GDPR
- **Status:** Not applicable (no personal data collection)
- **Reason:** Client-side only, no data transmission

### COPPA
- **Status:** Not applicable (not targeting children)
- **Reason:** General audience, no user accounts

### Accessibility
- **WCAG Compliance:** Basic keyboard navigation and ARIA labels
- Some visual-only features may not be screen-reader accessible

---

## Additional Resources

- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [OWASP Web Application Security](https://owasp.org/www-project-web-security/)
- [Content Security Policy Reference](https://content-security-policy.com/)

---

**Last Updated:** 2025-01-27
