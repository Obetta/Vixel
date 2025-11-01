// Keyboard shortcuts modal handler

window.VixelShortcuts = (function() {
  function init() {
    const shortcutsBtn = document.getElementById('shortcutsBtn');
    const shortcutsModal = document.getElementById('shortcutsModal');
    const closeShortcutsModal = document.getElementById('closeShortcutsModal');

    const statsContainer = document.getElementById('vixel-stats');

    if (shortcutsBtn && shortcutsModal) {
      shortcutsBtn.addEventListener('click', () => {
        shortcutsModal.classList.remove('hidden');
        // Hide stats when modal opens
        if (statsContainer) statsContainer.style.display = 'none';
      });
    }

    if (closeShortcutsModal && shortcutsModal) {
      const closeModal = () => {
        shortcutsModal.classList.add('hidden');
        // Restore stats when modal closes (always show)
        if (statsContainer) {
          statsContainer.style.display = 'flex';
        }
      };

      closeShortcutsModal.addEventListener('click', closeModal);

      shortcutsModal.addEventListener('click', (e) => {
        if (e.target === shortcutsModal) {
          closeModal();
        }
      });
    }

    // Close on Escape key (outside conditional to always work)
    if (shortcutsModal) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && shortcutsModal && !shortcutsModal.classList.contains('hidden')) {
          shortcutsModal.classList.add('hidden');
          // Restore stats (always show)
          if (statsContainer) {
            statsContainer.style.display = 'flex';
          }
        }
      });
    }
  }

  return {
    init
  };
})();

