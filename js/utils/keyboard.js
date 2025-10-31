// Keyboard navigation support for accessibility

window.VixelKeyboard = (function() {
  /**
   * Setup keyboard navigation for controls
   */
  function init() {
    // Spacebar to play/pause
    document.addEventListener('keydown', (e) => {
      // Don't interfere with typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      // Spacebar - play/pause
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
          playPauseBtn.click();
        }
      }

      // Arrow keys for seeking (when focused on time slider or canvas)
      const timeSlider = document.getElementById('timeSlider');
      if (timeSlider && (document.activeElement === timeSlider || document.activeElement.id === 'stage')) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          if (document.activeElement !== timeSlider) {
            timeSlider.focus();
          }
          e.preventDefault();
          const currentValue = parseFloat(timeSlider.value) || 0;
          const step = parseFloat(timeSlider.step) || 1;
          const min = parseFloat(timeSlider.min) || 0;
          const max = parseFloat(timeSlider.max) || 100;
          
          if (e.key === 'ArrowLeft') {
            timeSlider.value = Math.max(min, currentValue - step);
          } else {
            timeSlider.value = Math.min(max, currentValue + step);
          }
          
          // Trigger input event to update playback
          timeSlider.dispatchEvent(new Event('input'));
        }
      }

      // Number keys for quick control adjustments
      if (e.key >= '1' && e.key <= '9') {
        // Can be extended for keyboard shortcuts
      }
    });

    // Make range inputs keyboard accessible
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    rangeInputs.forEach(input => {
      // Ensure range inputs are focusable and announce changes
      input.setAttribute('tabindex', '0');
      
      input.addEventListener('input', () => {
        // Update aria-valuenow
        input.setAttribute('aria-valuenow', input.value);
        
        // Announce value changes for screen readers
        const label = input.getAttribute('aria-label') || input.id;
        const valueDisplay = document.getElementById(input.id + 'Value');
        if (valueDisplay) {
          valueDisplay.setAttribute('aria-live', 'polite');
        }
      });
    });

    // Make buttons keyboard accessible
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      if (!button.hasAttribute('tabindex') && button.tabIndex === -1) {
        button.setAttribute('tabindex', '0');
      }
    });

    // Ensure file input is accessible
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.setAttribute('aria-label', 'Select audio or video file');
    }

    // Focus management for better keyboard navigation
    setupFocusManagement();
  }

  /**
   * Setup focus management for better navigation
   */
  function setupFocusManagement() {
    // Trap focus within modals/overlays when they're open
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      // Focus management can be added here when needed
    }

    // Skip to main content link (can be added to HTML if needed)
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 0;
      background: var(--accent);
      color: var(--bg0);
      padding: 8px 16px;
      text-decoration: none;
      z-index: 10000;
      transition: top 0.3s;
    `;
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '0';
    });
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    if (document.body) {
      document.body.insertBefore(skipLink, document.body.firstChild);
    }
  }

  return {
    init
  };
})();

