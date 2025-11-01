// Memory leak prevention and cleanup utilities

window.VixelCleanup = (function() {
  const cleanupTasks = [];
  let isCleaningUp = false;

  /**
   * Register a cleanup task
   * @param {Function} cleanupFn - Function to call during cleanup
   * @returns {Function} Unregister function
   */
  function register(cleanupFn) {
    if (typeof cleanupFn !== 'function') {
      console.warn('[Cleanup] Invalid cleanup function');
      return () => {};
    }
    
    cleanupTasks.push(cleanupFn);
    
    // Return unregister function
    return () => {
      const index = cleanupTasks.indexOf(cleanupFn);
      if (index > -1) {
        cleanupTasks.splice(index, 1);
      }
    };
  }

  /**
   * Execute all cleanup tasks
   */
  function cleanup() {
    if (isCleaningUp) return;
    isCleaningUp = true;

    while (cleanupTasks.length > 0) {
      const task = cleanupTasks.shift();
      try {
        task();
      } catch (error) {
        console.error('[Cleanup] Error in cleanup task:', error);
      }
    }

    isCleaningUp = false;
  }

  /**
   * Wrapper for addEventListener that auto-removes on cleanup
   * @param {EventTarget} target - Target element
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @param {Object} options - Event listener options
   * @returns {Function} Remove function
   */
  function addEventListener(target, event, handler, options = {}) {
    if (!target || typeof target.addEventListener !== 'function') {
      console.warn('[Cleanup] Invalid target for addEventListener');
      return () => {};
    }

    target.addEventListener(event, handler, options);

    // Register cleanup
    const unregister = register(() => {
      try {
        target.removeEventListener(event, handler, options);
      } catch (error) {
        console.warn('[Cleanup] Failed to remove event listener:', error);
      }
    });

    // Return remove function
    return () => {
      unregister();
      try {
        target.removeEventListener(event, handler, options);
      } catch (error) {
        console.warn('[Cleanup] Failed to remove event listener:', error);
      }
    };
  }

  /**
   * Wrapper for setTimeout that auto-clears on cleanup
   * @param {Function} fn - Function to execute
   * @param {number} delay - Delay in milliseconds
   * @returns {number} Timeout ID
   */
  function setTimeout(fn, delay) {
    const id = window.setTimeout(fn, delay);
    
    register(() => {
      window.clearTimeout(id);
    });

    return id;
  }

  /**
   * Wrapper for setInterval that auto-clears on cleanup
   * @param {Function} fn - Function to execute
   * @param {number} delay - Delay in milliseconds
   * @returns {number} Interval ID
   */
  function setInterval(fn, delay) {
    const id = window.setInterval(fn, delay);
    
    register(() => {
      window.clearInterval(id);
    });

    return id;
  }

  /**
   * Track and revoke blob URL on cleanup
   * @param {string} url - Blob URL
   */
  function trackBlobURL(url) {
    if (typeof url !== 'string' || !url.startsWith('blob:')) {
      return;
    }

    register(() => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('[Cleanup] Failed to revoke blob URL:', error);
      }
    });
  }

  /**
   * Track requestAnimationFrame for cleanup
   * @param {number} id - Animation frame ID
   */
  function trackAnimationFrame(id) {
    register(() => {
      try {
        window.cancelAnimationFrame(id);
      } catch (error) {
        console.warn('[Cleanup] Failed to cancel animation frame:', error);
      }
    });
  }

  return {
    register,
    cleanup,
    addEventListener,
    setTimeout,
    setInterval,
    trackBlobURL,
    trackAnimationFrame
  };
})();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    window.VixelCleanup.cleanup();
  });
}

