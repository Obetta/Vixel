// Immediately hide loading overlay to prevent stuck state
(function() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      var overlay = document.getElementById('loadingOverlay');
      if (overlay) overlay.classList.add('hidden');
    });
  } else {
    var overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
  }
})();

