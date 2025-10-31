// Three.js loader - moved from inline script for CSP compliance
(function() {
  var cdn = document.createElement('script');
  cdn.src = 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js';
  cdn.crossOrigin = 'anonymous';
  cdn.onload = function() { 
    window.__three_ready = true;
    if (window.__three_initCallback) window.__three_initCallback();
  };
  cdn.onerror = function() {
    console.warn('[Three.js] CDN failed, trying local fallback...');
    var local = document.createElement('script');
    local.src = './lib/three.min.js';
    local.onload = function() {
      window.__three_ready = true;
      if (window.__three_initCallback) window.__three_initCallback();
    };
    local.onerror = function() {
      console.error('[Three.js] Failed to load from both CDN and local fallback. The application may not work correctly.');
      // Show user-friendly error
      if (document.body) {
        var errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = 'Failed to load Three.js library. Please check your internet connection or refresh the page.';
        document.body.appendChild(errorMsg);
        setTimeout(function() { 
          if (errorMsg.parentNode) errorMsg.remove(); 
        }, 10000);
      }
    };
    document.head.appendChild(local);
  };
  document.head.appendChild(cdn);
})();

