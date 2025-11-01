// Keyboard navigation support for accessibility

window.VixelKeyboard = (function() {
  /**
   * Setup keyboard navigation for controls
   */
  let listenerAttached = false;
  
  function init() {
    if (listenerAttached) {
      return;
    }
    listenerAttached = true;
    // Spacebar to play/pause
    document.addEventListener('keydown', (e) => {
      // Don't interfere with typing in text inputs or modals
      // BUT allow shortcuts for range inputs (sliders)
      if (e.target.tagName === 'INPUT' && e.target.type !== 'range') {
        return;
      }
      if (e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      // Spacebar - play/pause
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
          playPauseBtn.click();
        }
        return;
      }

      // R - Reset camera spin (only without modifier keys)
      if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const resetBtn = document.getElementById('resetSpinBtn');
        if (resetBtn) {
          resetBtn.click();
        }
        return;
      }

      // 0 - Reorient scene/camera to default position
      if (e.key === '0' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (typeof window.reorientScene === 'function') {
          window.reorientScene();
        }
        return;
      }

      // F - Toggle fullscreen (only without modifier keys)
      if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen();
        }
        return;
      }

      // Arrow keys for control adjustments
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        
        const timeSlider = document.getElementById('timeSlider');
        const isOnTimeline = timeSlider && document.activeElement === timeSlider;
        
        // Left/Right on timeline = seek through track
        if (isOnTimeline && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
          const currentValue = parseFloat(timeSlider.value) || 0;
          const step = parseFloat(timeSlider.step) || 1;
          const min = parseFloat(timeSlider.min) || 0;
          const max = parseFloat(timeSlider.max) || 100;
          
          if (e.key === 'ArrowLeft') {
            timeSlider.value = Math.max(min, currentValue - step);
          } else {
            timeSlider.value = Math.min(max, currentValue + step);
          }
          
          timeSlider.dispatchEvent(new Event('input'));
          return;
        }

        // Up/Down = adjust trail persistence
        if (e.key === 'ArrowUp') {
          adjustSlider('trails', -0.01);
          return;
        }
        
        if (e.key === 'ArrowDown') {
          adjustSlider('trails', 0.01);
          return;
        }
      }

      // Q/E - Adjust oscillation (only without modifier keys)
      if ((e.key === 'q' || e.key === 'Q') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        adjustSlider('osc', -0.01);
        return;
      }

      if ((e.key === 'e' || e.key === 'E') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        adjustSlider('osc', 0.01);
        return;
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
   * Helper to adjust slider values
   */
  function adjustSlider(sliderId, delta) {
    const slider = document.getElementById(sliderId);
    if (slider) {
      const currentValue = parseFloat(slider.value) || 0;
      const step = parseFloat(slider.step) || 0.01;
      const min = parseFloat(slider.min) || 0;
      const max = parseFloat(slider.max) || 1;
      
      const newValue = Math.max(min, Math.min(max, currentValue - (delta * step)));
      slider.value = newValue;
      slider.dispatchEvent(new Event('input'));
    }
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

