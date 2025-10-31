# Security Policy

## Overview
Vixel is a client-side browser application for audio-reactive 3D visualization. This document outlines security considerations, best practices, and reporting guidelines.

## Security Features

### Content Security Policy (CSP)
- **Current Status:** Configured with minimal `unsafe-inline` usage in HTML
- **Recommendation:** Move inline scripts to external files for better security

### File Handling
- **File Types:** Restricted to audio/* and video/* files via HTML accept attribute
- **Validation:** Client-side type checking before processing
- **Storage:** Uses browser IndexedDB for local file caching
- **Blob URLs:** Properly revoked to prevent memory leaks

### Memory Management
- **Cleanup System:** Comprehensive cleanup utilities in `js/utils/cleanup.js`
- **Blob URL Tracking:** Automatic revocation on cleanup
- **Event Listener Management:** Auto-cleanup on page unload

### Error Handling
- **Global Error Boundary:** Catches and logs errors gracefully
- **No Sensitive Data Exposure:** Error messages don't expose system information
- **User-Friendly Messages:** Clear, actionable error messages

## Known Limitations

### 1. Unsafe Inline Scripts
**Issue:** CSP includes `'unsafe-inline'` for script execution  
**Impact:** Medium - Potential XSS vector  
**Mitigation:** 
- Inline script is minimal (only for loading overlay)
- All other JavaScript is external
- **Plan:** Extract inline script to external file

### 2. No File Size Limits
**Issue:** Unlimited file upload sizes  
**Impact:** Low-Medium - Potential memory exhaustion  
**Mitigation:**
- Client-side rendering limitation naturally caps memory
- Modern browsers have memory limits
- **Plan:** Add configurable file size limits

### 3. No Server-Side Validation
**Issue:** All validation is client-side  
**Impact:** Low - This is a client-only application  
**Mitigation:**
- No server interaction occurs
- Files never leave the user's browser
- **Note:** This is by design for privacy

### 4. External CDN Dependency
**Issue:** Loads Stats.js from jsdelivr.net CDN  
**Impact:** Low - Potential supply chain attack  
**Mitigation:**
- Uses reputable CDN (jsdelivr.net)
- Subresource Integrity (SRI) could be added
- **Plan:** Add SRI hashes or bundle locally

## Security Best Practices for Contributors

### Code Security
1. **Validate all user input** - Even in client-side code
2. **Never trust user data** - Sanitize filenames, URLs
3. **Avoid eval() and Function()** - Don't dynamically execute code
4. **Limit global variables** - Use namespaced objects
5. **Revoke blob URLs** - Prevent memory leaks

### Dependencies
1. **Keep dependencies minimal** - Current: Only Stats.js
2. **Regularly update dependencies** - Check for vulnerabilities
3. **Use known CDNs** - Prefer jsdelivr, cdnjs, unpkg
4. **Consider SRI** - Add integrity hashes for CDN resources

### File Handling
1. **Validate file types** - Use both accept attribute and runtime checks
2. **Check file size** - Add reasonable limits
3. **Handle errors gracefully** - Don't expose internal errors
4. **Clear resources** - Always revoke object URLs

## Reporting Security Issues

### What to Report
- XSS vulnerabilities
- File upload exploits
- Memory/DoS vulnerabilities
- CSP bypasses
- Dependency vulnerabilities

### How to Report
1. **Email:** [Your security email]
2. **Subject:** [SECURITY] Vixel - [Brief description]
3. **Include:**
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Process
1. **Acknowledge** - Within 48 hours
2. **Investigate** - Within 1 week
3. **Fix** - Based on severity
4. **Disclose** - Coordinated disclosure timeline

## Security Checklist for Deployments

### Before Deploying
- [ ] Run `npm audit` for dependency vulnerabilities
- [ ] Test file upload with malicious-looking filenames
- [ ] Verify CSP headers work correctly
- [ ] Check blob URL cleanup (memory profiling)
- [ ] Test error handling with corrupted files
- [ ] Verify no console errors in production

### In Production
- [ ] Monitor for unusual memory usage
- [ ] Watch for error spikes in logs
- [ ] Keep dependencies updated
- [ ] Review CSP reports (if configured)

## Browser Security Considerations

### Web Audio API
- Requires user interaction to activate (browser security)
- Sandboxed from system audio (cannot access microphone without permission)

### WebGL
- GPU memory isolation
- No file system access
- Process isolation

### IndexedDB
- Origin-specific storage
- User-controlled (can clear data)
- No cross-site access

## Privacy Considerations

### Data Collection
- **No data collection** - No analytics, tracking, or external calls
- **No data transmission** - All processing is local
- **No cookies** - Only IndexedDB for file caching

### User Data
- Files stored only in user's browser
- No cloud storage or server uploads
- User controls data lifecycle (can clear storage)

## Future Security Enhancements

### Short-term
- [ ] Remove `unsafe-inline` from CSP
- [ ] Add file size validation
- [ ] Add Subresource Integrity (SRI) for CDN resources
- [ ] Add configurable security policies

### Long-term
- [ ] Integrate automated security scanning
- [ ] Add penetration testing
- [ ] Implement web worker isolation for file processing
- [ ] Add optional security audit logging

## Compliance

### GDPR
- **Status:** Not applicable (no personal data collection)
- **Reason:** Client-side only, no data transmission

### COPPA
- **Status:** Not applicable (not targeting children)
- **Reason:** General audience, no user accounts

### Accessibility
- **WCAG Compliance:** Basic keyboard navigation and ARIA labels
- **Known Issues:** Some visual-only features may not be screen-reader accessible

## Additional Resources

- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [OWASP Web Application Security](https://owasp.org/www-project-web-security/)
- [Content Security Policy Reference](https://content-security-policy.com/)

---

**Last Updated:** 2025-01-27  
**Security Contact:** [Your contact information]

