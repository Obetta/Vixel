// Error tracking service for observability
// Supports optional external service integration (Sentry, etc.)

window.VixelErrorTracker = (function() {
  const DEBUG = window.DEBUG || false;
  let errorLog = [];
  const MAX_LOG_SIZE = 100;
  let isEnabled = true;

  // Configuration for external services
  let config = {
    sentry: {
      enabled: false,
      dsn: null
    },
    console: {
      enabled: true,
      level: 'error' // 'error', 'warn', 'info', 'debug'
    },
    custom: {
      enabled: false,
      endpoint: null,
      headers: {}
    }
  };

  /**
   * Initialize error tracking
   * @param {Object} options - Configuration options
   */
  function init(options = {}) {
    if (options.sentry && options.sentry.dsn) {
      config.sentry = { ...config.sentry, ...options.sentry };
      // Load Sentry SDK dynamically if needed
      // This would require adding Sentry as a dependency
      if (DEBUG) console.log('[ErrorTracker] Sentry enabled');
    }

    if (options.custom && options.custom.endpoint) {
      config.custom = { ...config.custom, ...options.custom };
      if (DEBUG) console.log('[ErrorTracker] Custom endpoint enabled');
    }

    if (options.console !== undefined) {
      config.console.enabled = options.console;
    }

    if (options.level) {
      config.console.level = options.level;
    }

    setupGlobalHandlers();
  }

  /**
   * Track an error
   * @param {Error|string} error - Error object or message
   * @param {Object} context - Additional context
   * @param {string} level - Error level: 'error', 'warn', 'info'
   */
  function track(error, context = {}, level = 'error') {
    if (!isEnabled) return;

    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      level,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Add to local log
    errorLog.push(errorInfo);
    if (errorLog.length > MAX_LOG_SIZE) {
      errorLog.shift();
    }

    // Console logging
    if (config.console.enabled) {
      const consoleLevel = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info';
      if (consoleLevel === 'error') {
        console.error('[ErrorTracker]', errorInfo);
      } else if (consoleLevel === 'warn') {
        console.warn('[ErrorTracker]', errorInfo);
      } else {
        console.info('[ErrorTracker]', errorInfo);
      }
    }

    // Send to Sentry if enabled
    if (config.sentry.enabled && window.Sentry) {
      try {
        window.Sentry.captureException(error instanceof Error ? error : new Error(errorInfo.message), {
          level: level === 'error' ? 'error' : level === 'warn' ? 'warning' : 'info',
          contexts: {
            custom: context
          }
        });
      } catch (err) {
        console.warn('[ErrorTracker] Failed to send to Sentry:', err);
      }
    }

    // Send to custom endpoint
    if (config.custom.enabled && config.custom.endpoint) {
      try {
        fetch(config.custom.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...config.custom.headers
          },
          body: JSON.stringify(errorInfo)
        }).catch(err => {
          if (DEBUG) console.warn('[ErrorTracker] Failed to send to custom endpoint:', err);
        });
      } catch (err) {
        if (DEBUG) console.warn('[ErrorTracker] Failed to send to custom endpoint:', err);
      }
    }
  }

  /**
   * Setup global error handlers
   */
  function setupGlobalHandlers() {
    // Unhandled errors
    window.addEventListener('error', (event) => {
      track(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, 'error');
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      track(event.reason, {
        promiseRejection: true
      }, 'error');
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        track(`Resource load error: ${event.target.tagName}`, {
          src: event.target.src || event.target.href,
          tagName: event.target.tagName
        }, 'warn');
      }
    }, true);
  }

  /**
   * Get error log
   * @returns {Array} Array of error objects
   */
  function getErrorLog() {
    return [...errorLog];
  }

  /**
   * Clear error log
   */
  function clearLog() {
    errorLog = [];
  }

  /**
   * Enable/disable error tracking
   * @param {boolean} enabled
   */
  function setEnabled(enabled) {
    isEnabled = enabled;
  }

  /**
   * Wraps a function with error tracking
   * @param {Function} fn - Function to wrap
   * @param {string} name - Function name for context
   * @returns {Function} Wrapped function
   */
  function wrap(fn, name = 'anonymous') {
    return function(...args) {
      try {
        return fn.apply(this, args);
      } catch (error) {
        track(error, { function: name, args: args.length }, 'error');
        throw error;
      }
    };
  }

  /**
   * Wraps an async function with error tracking
   * @param {Function} fn - Async function to wrap
   * @param {string} name - Function name for context
   * @returns {Function} Wrapped async function
   */
  function wrapAsync(fn, name = 'anonymous') {
    return async function(...args) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        track(error, { function: name, async: true, args: args.length }, 'error');
        throw error;
      }
    };
  }

  return {
    init,
    track,
    getErrorLog,
    clearLog,
    setEnabled,
    wrap,
    wrapAsync
  };
})();

