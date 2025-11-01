// Settings modal handler and configuration management

window.VixelSettings = (function() {
  const DEBUG = window.DEBUG || false;
  
  // Default settings
  let settings = {
    recordingBitrate: 2500000, // 2.5 Mbps
    recordingFPS: 30
  };

  function init() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsModal = document.getElementById('closeSettingsModal');
    const bitrateSlider = document.getElementById('settingsRecordingBitrate');
    const bitrateValue = document.getElementById('settingsBitrateValue');
    const fpsSelect = document.getElementById('settingsRecordingFPS');

    // Load settings from localStorage
    loadSettings();

    // Initialize UI with current settings
    if (bitrateSlider) {
      bitrateSlider.value = settings.recordingBitrate;
      updateBitrateDisplay();
    }
    if (fpsSelect) {
      fpsSelect.value = settings.recordingFPS;
    }

    // Open settings modal
    if (settingsBtn && settingsModal) {
      settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
      });
    }

    // Close settings modal
    if (closeSettingsModal && settingsModal) {
      const closeModal = () => {
        settingsModal.classList.add('hidden');
      };

      closeSettingsModal.addEventListener('click', closeModal);

      settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
          closeModal();
        }
      });
    }

    // Close on Escape key
    if (settingsModal) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsModal && !settingsModal.classList.contains('hidden')) {
          settingsModal.classList.add('hidden');
        }
      });
    }

    // Bitrate slider handler
    if (bitrateSlider) {
      bitrateSlider.addEventListener('input', () => {
        settings.recordingBitrate = parseInt(bitrateSlider.value);
        updateBitrateDisplay();
        saveSettings();
      });
    }

    // FPS select handler
    if (fpsSelect) {
      fpsSelect.addEventListener('change', () => {
        settings.recordingFPS = parseInt(fpsSelect.value);
        saveSettings();
        
        if (DEBUG) {
          console.log('[Settings] Recording FPS changed to:', settings.recordingFPS);
        }
      });
    }

    function updateBitrateDisplay() {
      if (bitrateValue) {
        const mbps = (settings.recordingBitrate / 1000000).toFixed(1);
        bitrateValue.textContent = `${mbps} Mbps`;
      }
    }
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem('vixel-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        settings = { ...settings, ...parsed };
        
        if (DEBUG) {
          console.log('[Settings] Loaded settings:', settings);
        }
      }
    } catch (error) {
      console.warn('[Settings] Failed to load settings:', error);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem('vixel-settings', JSON.stringify(settings));
      
      if (DEBUG) {
        console.log('[Settings] Saved settings:', settings);
      }
    } catch (error) {
      console.warn('[Settings] Failed to save settings:', error);
    }
  }

  function getSettings() {
    return { ...settings };
  }

  function getRecordingBitrate() {
    return settings.recordingBitrate;
  }

  function getRecordingFPS() {
    return settings.recordingFPS;
  }

  return {
    init,
    getSettings,
    getRecordingBitrate,
    getRecordingFPS
  };
})();

