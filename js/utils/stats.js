// Performance monitoring with stats.js
// Toggle with query param: ?stats=false

export function createStats(show = true) {
  // Dynamic import to avoid issues if stats.js not installed
  const Stats = window.Stats || (() => {
    console.warn('stats.js not loaded. Performance monitoring disabled.');
    return null;
  })();
  
  if (!Stats) return null;
  
  const stats = new Stats();
  stats.showPanel(0); // FPS panel
  stats.dom.style.position = 'absolute';
  stats.dom.style.top = '0px';
  stats.dom.style.left = '0px';
  stats.dom.style.zIndex = '10000';
  if (show) document.body.appendChild(stats.dom);
  return stats;
}

// Toggle with query param: ?stats=false
export function shouldShowStats() {
  const params = new URLSearchParams(window.location.search);
  return params.get('stats') !== 'false';
}

