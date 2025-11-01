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
    const micDeviceSelect = document.getElementById('settingsMicDevice');
    
    // Audio processing controls (applies to all sources)
    const audioGainSlider = document.getElementById('settingsAudioGain');
    const audioGainValue = document.getElementById('settingsAudioGainValue');
    const audioThresholdSlider = document.getElementById('settingsAudioThreshold');
    const audioThresholdValue = document.getElementById('settingsAudioThresholdValue');
    const audioRatioSlider = document.getElementById('settingsAudioRatio');
    const audioRatioValue = document.getElementById('settingsAudioRatioValue');
    const audioKneeSlider = document.getElementById('settingsAudioKnee');
    const audioKneeValue = document.getElementById('settingsAudioKneeValue');
    const audioAttackSlider = document.getElementById('settingsAudioAttack');
    const audioAttackValue = document.getElementById('settingsAudioAttackValue');
    const audioReleaseSlider = document.getElementById('settingsAudioRelease');
    const audioReleaseValue = document.getElementById('settingsAudioReleaseValue');
    const audioSmoothingSlider = document.getElementById('settingsAudioSmoothing');
    const audioSmoothingValue = document.getElementById('settingsAudioSmoothingValue');
    
    // Setup sidebar navigation
    const navItems = document.querySelectorAll('.settings-nav-item');
    const sectionContents = document.querySelectorAll('.settings-section-content');
    
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetSection = item.dataset.section;
        
        // Remove active from all nav items and contents
        navItems.forEach(nav => nav.classList.remove('active'));
        sectionContents.forEach(content => content.classList.remove('active'));
        
        // Add active to clicked nav item and corresponding content
        item.classList.add('active');
        const targetContent = document.getElementById(`settingsSection${targetSection.charAt(0).toUpperCase() + targetSection.slice(1)}`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });

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

    // Open settings modal with device population
    if (settingsBtn && settingsModal) {
      settingsBtn.addEventListener('click', async () => {
        settingsModal.classList.remove('hidden');
        
        // Populate microphone devices when opening (without requesting permission)
        if (window.VixelAudioMicrophone && micDeviceSelect) {
          try {
            // Don't request permission - just enumerate devices (labels may be empty)
            const devices = await window.VixelAudioMicrophone.getDevices(false);
            const currentDeviceId = window.VixelAudioMicrophone.getCurrentDeviceId();
            micDeviceSelect.innerHTML = '<option value="">Default Device</option>';
            devices.forEach(device => {
              const option = document.createElement('option');
              option.value = device.deviceId;
              // Use label if available, otherwise generic name
              option.textContent = device.label || `Device ${device.deviceId.substring(0, 8)}`;
              micDeviceSelect.appendChild(option);
            });
            // Sync with currently active device (only if mic is active and we have labels)
            if (currentDeviceId && window.VixelAudioMicrophone.isMicrophoneActive()) {
              const option = Array.from(micDeviceSelect.options).find(opt => opt.value === currentDeviceId);
              if (option) {
                micDeviceSelect.value = currentDeviceId;
              }
            }
            
            // Sync audio processor settings (applies to all sources)
            if (window.VixelAudioProcessor) {
              if (audioGainSlider) {
                audioGainSlider.value = window.VixelAudioProcessor.getGain();
                if (audioGainValue) {
                  audioGainValue.textContent = `${Math.round(audioGainSlider.value * 100)}%`;
                }
              }
              if (audioThresholdSlider) {
                audioThresholdSlider.value = window.VixelAudioProcessor.getCompressorThreshold();
                if (audioThresholdValue) {
                  audioThresholdValue.textContent = `${Math.round(audioThresholdSlider.value)} dB`;
                }
              }
              if (audioRatioSlider) {
                audioRatioSlider.value = window.VixelAudioProcessor.getCompressorRatio();
                if (audioRatioValue) {
                  audioRatioValue.textContent = `${audioRatioSlider.value}:1`;
                }
              }
              if (audioKneeSlider) {
                audioKneeSlider.value = window.VixelAudioProcessor.getCompressorKnee();
                if (audioKneeValue) {
                  audioKneeValue.textContent = `${Math.round(audioKneeSlider.value)} dB`;
                }
              }
              if (audioAttackSlider) {
                audioAttackSlider.value = window.VixelAudioProcessor.getCompressorAttack();
                if (audioAttackValue) {
                  audioAttackValue.textContent = `${Math.round(audioAttackSlider.value * 1000)} ms`;
                }
              }
              if (audioReleaseSlider) {
                audioReleaseSlider.value = window.VixelAudioProcessor.getCompressorRelease();
                if (audioReleaseValue) {
                  audioReleaseValue.textContent = `${Math.round(audioReleaseSlider.value * 1000)} ms`;
                }
              }
            }
            
            // Sync smoothing from analyzer
            if (window.VixelAudioAnalyzer && window.VixelAudioAnalyzer.getSmoothing) {
              if (audioSmoothingSlider) {
                audioSmoothingSlider.value = window.VixelAudioAnalyzer.getSmoothing();
                if (audioSmoothingValue) {
                  audioSmoothingValue.textContent = `${Math.round(audioSmoothingSlider.value * 100)}%`;
                }
              }
            }
          } catch (err) {
            console.error('[Settings] Failed to populate devices:', err);
          }
        }
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

    // Audio gain slider handler (applies to all sources)
    if (audioGainSlider && audioGainValue) {
      audioGainSlider.addEventListener('input', () => {
        const value = parseFloat(audioGainSlider.value);
        const percent = Math.round(value * 100);
        audioGainValue.textContent = `${percent}%`;
        
        if (window.VixelAudioProcessor) {
          window.VixelAudioProcessor.setGain(value);
        }
      });
      const initial = parseFloat(audioGainSlider.value);
      audioGainValue.textContent = `${Math.round(initial * 100)}%`;
    }

    // Compressor threshold (applies to all sources)
    if (audioThresholdSlider && audioThresholdValue) {
      audioThresholdSlider.addEventListener('input', () => {
        const value = parseFloat(audioThresholdSlider.value);
        audioThresholdValue.textContent = `${Math.round(value)} dB`;
        if (window.VixelAudioProcessor) {
          window.VixelAudioProcessor.setCompressorThreshold(value);
        }
      });
      const initial = parseFloat(audioThresholdSlider.value);
      audioThresholdValue.textContent = `${Math.round(initial)} dB`;
    }

    // Compressor ratio (applies to all sources)
    if (audioRatioSlider && audioRatioValue) {
      audioRatioSlider.addEventListener('input', () => {
        const value = parseFloat(audioRatioSlider.value);
        audioRatioValue.textContent = `${value}:1`;
        if (window.VixelAudioProcessor) {
          window.VixelAudioProcessor.setCompressorRatio(value);
        }
      });
      const initial = parseFloat(audioRatioSlider.value);
      audioRatioValue.textContent = `${initial}:1`;
    }

    // Compressor knee (applies to all sources)
    if (audioKneeSlider && audioKneeValue) {
      audioKneeSlider.addEventListener('input', () => {
        const value = parseFloat(audioKneeSlider.value);
        audioKneeValue.textContent = `${Math.round(value)} dB`;
        if (window.VixelAudioProcessor) {
          window.VixelAudioProcessor.setCompressorKnee(value);
        }
      });
      const initial = parseFloat(audioKneeSlider.value);
      audioKneeValue.textContent = `${Math.round(initial)} dB`;
    }

    // Compressor attack (applies to all sources)
    if (audioAttackSlider && audioAttackValue) {
      audioAttackSlider.addEventListener('input', () => {
        const value = parseFloat(audioAttackSlider.value);
        const ms = Math.round(value * 1000);
        audioAttackValue.textContent = `${ms} ms`;
        if (window.VixelAudioProcessor) {
          window.VixelAudioProcessor.setCompressorAttack(value);
        }
      });
      const initial = parseFloat(audioAttackSlider.value);
      audioAttackValue.textContent = `${Math.round(initial * 1000)} ms`;
    }

    // Compressor release (applies to all sources)
    if (audioReleaseSlider && audioReleaseValue) {
      audioReleaseSlider.addEventListener('input', () => {
        const value = parseFloat(audioReleaseSlider.value);
        const ms = Math.round(value * 1000);
        audioReleaseValue.textContent = `${ms} ms`;
        if (window.VixelAudioProcessor) {
          window.VixelAudioProcessor.setCompressorRelease(value);
        }
      });
      const initial = parseFloat(audioReleaseSlider.value);
      audioReleaseValue.textContent = `${Math.round(initial * 1000)} ms`;
    }

    // Frequency smoothing (applies to all sources)
    if (audioSmoothingSlider && audioSmoothingValue) {
      audioSmoothingSlider.addEventListener('input', () => {
        const value = parseFloat(audioSmoothingSlider.value);
        const percent = Math.round(value * 100);
        audioSmoothingValue.textContent = `${percent}%`;
        if (window.VixelAudioAnalyzer && window.VixelAudioAnalyzer.setSmoothing) {
          window.VixelAudioAnalyzer.setSmoothing(value);
        }
      });
      const initial = parseFloat(audioSmoothingSlider.value);
      audioSmoothingValue.textContent = `${Math.round(initial * 100)}%`;
    }

    // Microphone device selector handler
    if (micDeviceSelect) {
      micDeviceSelect.addEventListener('change', async () => {
        const deviceId = micDeviceSelect.value || null;
        if (window.VixelAudioMicrophone && window.VixelAudioMicrophone.isMicrophoneActive()) {
          const audioCtx = window.VixelAudio && window.VixelAudio.getAudioContext();
          const analyser = window.VixelAudioAnalyzer && window.VixelAudioAnalyzer.initialize();
          if (audioCtx && analyser) {
            try {
              await window.VixelAudioMicrophone.stop();
              await window.VixelAudioMicrophone.start(audioCtx, analyser.analyser, deviceId);
            } catch (err) {
              console.error('[Settings] Failed to switch device:', err);
            }
          }
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

