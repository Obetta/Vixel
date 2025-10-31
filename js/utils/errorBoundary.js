// Global error boundary and error handling middleware

window.VixelErrorBoundary = (function() {
  const DEBUG = window.DEBUG || false;
  let errorHandlers = [];
  let isInitialized = false;

  /**
   * Initialize error boundary
   */
  function init() {
    if (isInitialized) return;
    isInitialized = true;

    // Initialize error tracker if available
    if (window.VixelErrorTracker) {
      window.VixelErrorTracker.init({
        console: true,
        level: 'error'
      });
    }

    // Wrap critical functions
    wrapCriticalFunctions();

    // Setup recovery mechanisms
    setupRecoveryMechanisms();

    if (DEBUG) console.log('[ErrorBoundary] Initialized');
  }

  /**
   * Wrap critical application functions with error handling
   */
  function wrapCriticalFunctions() {
    // Wrap requestAnimationFrame
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      return originalRAF.call(window, function(time) {
        try {
          callback(time);
        } catch (error) {
          handleError(error, {
            context: 'requestAnimationFrame',
            timestamp: time
          });
        }
      });
    };

    // Wrap event listeners at document level
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      const wrappedListener = function(event) {
        try {
          if (typeof listener === 'function') {
            listener.call(this, event);
          } else if (listener && typeof listener.handleEvent === 'function') {
            listener.handleEvent(event);
          }
        } catch (error) {
          handleError(error, {
            context: 'eventListener',
            eventType: type,
            target: event.target ? event.target.tagName : 'unknown'
          });
        }
      };
      return originalAddEventListener.call(this, type, wrappedListener, options);
    };
  }

  /**
   * Setup recovery mechanisms
   */
  function setupRecoveryMechanisms() {
    // Monitor animation loop health
    let lastFrameTime = performance.now();
    let stuckFrames = 0;
    const MAX_STUCK_FRAMES = 60; // ~1 second at 60fps

    function checkAnimationHealth() {
      const now = performance.now();
      const delta = now - lastFrameTime;

      // If no frame update in ~2 seconds, something is stuck
      if (delta > 2000) {
        stuckFrames++;
        if (stuckFrames >= MAX_STUCK_FRAMES) {
          handleError(new Error('Animation loop appears stuck'), {
            context: 'animationHealth',
            stuckFrames,
            lastDelta: delta
          }, 'warn');
          stuckFrames = 0;
        }
      } else {
        stuckFrames = 0;
      }

      lastFrameTime = now;
      requestAnimationFrame(checkAnimationHealth);
    }

    // Start health check
    requestAnimationFrame(checkAnimationHealth);

    // Monitor memory usage if available
    if (performance.memory) {
      setInterval(() => {
        const memory = performance.memory;
        const usedMB = memory.usedJSHeapSize / 1048576;
        const limitMB = memory.jsHeapSizeLimit / 1048576;
        const percentUsed = (usedMB / limitMB) * 100;

        if (percentUsed > 90) {
          handleError(new Error('High memory usage detected'), {
            context: 'memory',
            usedMB: usedMB.toFixed(2),
            limitMB: limitMB.toFixed(2),
            percentUsed: percentUsed.toFixed(2)
          }, 'warn');
        }
      }, 10000); // Check every 10 seconds
    }
  }

  /**
   * Handle an error with recovery strategies
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   * @param {string} level - Error level
   */
  function handleError(error, context = {}, level = 'error') {
    // Track the error
    if (window.VixelErrorTracker) {
      window.VixelErrorTracker.track(error, context, level);
    } else {
      console.error('[ErrorBoundary]', error, context);
    }

    // Show user-friendly error message
    showErrorToUser(error, context);

    // Call registered error handlers
    errorHandlers.forEach(handler => {
      try {
        handler(error, context, level);
      } catch (err) {
        console.error('[ErrorBoundary] Error in handler:', err);
      }
    });

    // Attempt recovery based on error type
    attemptRecovery(error, context);
  }

  /**
   * Show error message to user
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   */
  function showErrorToUser(error, context) {
    // Don't show errors for minor issues
    if (context.context === 'eventListener' && context.eventType === 'error') {
      return; // Resource load errors handled elsewhere
    }

    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'polite');
    
    const message = error.message || 'An error occurred. Please try refreshing the page.';
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.style.opacity = '0';
        errorDiv.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          if (errorDiv.parentNode) {
            errorDiv.remove();
          }
        }, 300);
      }
    }, 5000);
  }

  /**
   * Attempt to recover from error
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   */
  function attemptRecovery(error, context) {
    // Recovery strategies based on error type
    if (error.message && error.message.includes('AudioContext')) {
      // Audio context errors - try to reinitialize
      if (window.VixelAudio && typeof window.VixelAudio.init === 'function') {
        setTimeout(() => {
          try {
            window.VixelAudio.init();
          } catch (err) {
            console.error('[ErrorBoundary] Failed to recover audio:', err);
          }
        }, 1000);
      }
    }

    // Canvas/WebGL errors - might need to recreate renderer
    if (error.message && (error.message.includes('WebGL') || error.message.includes('canvas'))) {
      // This would require more complex recovery - log for now
      console.warn('[ErrorBoundary] WebGL/Canvas error - may require page refresh');
    }
  }

  /**
   * Register an error handler
   * @param {Function} handler - Error handler function
   */
  function onError(handler) {
    if (typeof handler === 'function') {
      errorHandlers.push(handler);
    }
  }

  /**
   * Remove an error handler
   * @param {Function} handler - Error handler function to remove
   */
  function offError(handler) {
    const index = errorHandlers.indexOf(handler);
    if (index > -1) {
      errorHandlers.splice(index, 1);
    }
  }

  /**
   * Safely execute a function with error boundary
   * @param {Function} fn - Function to execute
   * @param {Object} context - Context for error reporting
   * @param {*} defaultValue - Default value if function throws
   * @returns {*} Function result or default value
   */
  function safeExecute(fn, context = {}, defaultValue = null) {
    try {
      return fn();
    } catch (error) {
      handleError(error, context, 'error');
      return defaultValue;
    }
  }

  /**
   * Safely execute an async function with error boundary
   * @param {Function} fn - Async function to execute
   * @param {Object} context - Context for error reporting
   * @param {*} defaultValue - Default value if function throws
   * @returns {Promise<*>} Promise resolving to function result or default value
   */
  async function safeExecuteAsync(fn, context = {}, defaultValue = null) {
    try {
      return await fn();
    } catch (error) {
      handleError(error, context, 'error');
      return defaultValue;
    }
  }

  return {
    init,
    handleError,
    onError,
    offError,
    safeExecute,
    safeExecuteAsync
  };
})();

