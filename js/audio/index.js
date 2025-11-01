// Main audio module - orchestrates all audio subsystems

window.VixelAudio = (function() {
  let audioCtx = null;
  let analyser = null;

  async function init() {
    // Ensure UI is properly initialized (hide any stuck overlays)
    if (window.VixelAudioUI && window.VixelAudioUI.initUI) {
      window.VixelAudioUI.initUI();
    }
    
    // Initialize analyzer
    const { audioCtx: ctx, analyser: anal } = window.VixelAudioAnalyzer.initialize();
    audioCtx = ctx;
    analyser = anal;
    
    // Initialize shared audio processor (compressor/limiter for all sources)
    if (window.VixelAudioProcessor) {
      window.VixelAudioProcessor.initialize(audioCtx, analyser);
      
      // Apply initial settings from HTML defaults
      const audioGainSlider = document.getElementById('settingsAudioGain');
      const audioThresholdSlider = document.getElementById('settingsAudioThreshold');
      const audioRatioSlider = document.getElementById('settingsAudioRatio');
      const audioKneeSlider = document.getElementById('settingsAudioKnee');
      const audioAttackSlider = document.getElementById('settingsAudioAttack');
      const audioReleaseSlider = document.getElementById('settingsAudioRelease');
      const audioSmoothingSlider = document.getElementById('settingsAudioSmoothing');
      
      if (audioGainSlider) {
        window.VixelAudioProcessor.setGain(parseFloat(audioGainSlider.value));
      }
      if (audioThresholdSlider) {
        window.VixelAudioProcessor.setCompressorThreshold(parseFloat(audioThresholdSlider.value));
      }
      if (audioRatioSlider) {
        window.VixelAudioProcessor.setCompressorRatio(parseFloat(audioRatioSlider.value));
      }
      if (audioKneeSlider) {
        window.VixelAudioProcessor.setCompressorKnee(parseFloat(audioKneeSlider.value));
      }
      if (audioAttackSlider) {
        window.VixelAudioProcessor.setCompressorAttack(parseFloat(audioAttackSlider.value));
      }
      if (audioReleaseSlider) {
        window.VixelAudioProcessor.setCompressorRelease(parseFloat(audioReleaseSlider.value));
      }
      if (audioSmoothingSlider && window.VixelAudioAnalyzer) {
        window.VixelAudioAnalyzer.setSmoothing(parseFloat(audioSmoothingSlider.value));
      }
    }

    // Setup UI with callbacks - always enable pre-scan
    const loadFileCallback = async (file) => {
      // Stop microphone if active
      if (window.VixelAudioMicrophone && window.VixelAudioMicrophone.isMicrophoneActive()) {
        await window.VixelAudioMicrophone.stop();
        if (window.VixelAudioUI && window.VixelAudioUI.updateMicToggleButton) {
          window.VixelAudioUI.updateMicToggleButton(false);
        }
        // Restore default FFT size for file playback
        if (window.VixelAudioAnalyzer && window.VixelAudioAnalyzer.setFFTSize) {
          window.VixelAudioAnalyzer.setFFTSize(window.VixelAudioAnalyzer.DEFAULT_FFT_SIZE);
        }
      }
      await window.VixelAudioLoader.loadFile(file, audioCtx, analyser, true);
    };
    
    window.VixelAudioUI.setupFileInput(loadFileCallback);
    window.VixelAudioUI.setupDropZone(loadFileCallback);
    
    // Setup recent tracks list
    if (window.VixelAudioUI.setupRecentTracks) {
      window.VixelAudioUI.setupRecentTracks(loadFileCallback);
    }

    window.VixelAudioUI.setupPlayPauseButton(async () => {
      const mediaEl = window.VixelAudioLoader.getMediaElement();
      await window.VixelAudioPlayer.toggle(audioCtx, mediaEl);
    });

    window.VixelAudioUI.setupLoopToggle((isLooping) => {
      const mediaEl = window.VixelAudioLoader.getMediaElement();
      if (mediaEl) {
        mediaEl.loop = isLooping;
      }
    });

    // Setup microphone controls
    if (window.VixelAudioMicrophone && window.VixelAudioUI.setupMicrophoneControls) {
      const handleMicToggle = async () => {
        const isActive = window.VixelAudioMicrophone.isMicrophoneActive();
        
        if (isActive) {
          // Stop microphone
          await window.VixelAudioMicrophone.stop();
          
          // Restore default FFT size for file playback
          if (window.VixelAudioAnalyzer && window.VixelAudioAnalyzer.setFFTSize) {
            window.VixelAudioAnalyzer.setFFTSize(window.VixelAudioAnalyzer.DEFAULT_FFT_SIZE);
          }
          
          if (window.VixelAudioUI && window.VixelAudioUI.updateMicToggleButton) {
            window.VixelAudioUI.updateMicToggleButton(false);
          }
        } else {
          // Stop file playback if active
          const mediaEl = window.VixelAudioLoader.getMediaElement();
          if (mediaEl && !mediaEl.paused) {
            mediaEl.pause();
            if (window.VixelAudioPlayer) {
              window.VixelAudioPlayer.setPlaying(false);
            }
            if (window.VixelAudioUI) {
              window.VixelAudioUI.updatePlayPauseButton(false);
            }
          }
          
          try {
            // Request access first
            const hasAccess = await window.VixelAudioMicrophone.requestAccess();
            if (!hasAccess) {
              if (window.VixelAudioUI && window.VixelAudioUI.showError) {
                window.VixelAudioUI.showError('Microphone access denied. Please allow microphone access and try again.');
              }
              return;
            }
            
            // Get selected device from settings
            const settingsMicDevice = document.getElementById('settingsMicDevice');
            const deviceId = settingsMicDevice && settingsMicDevice.value ? settingsMicDevice.value : null;
            
            // Start microphone (settings are applied via shared processor)
            await window.VixelAudioMicrophone.start(audioCtx, analyser, deviceId);
            
            if (window.VixelAudioUI && window.VixelAudioUI.updateMicToggleButton) {
              window.VixelAudioUI.updateMicToggleButton(true);
            }
            
            // Populate devices if not already done
            await window.VixelAudioUI.populateMicDevices();
          } catch (err) {
            console.error('[Audio] Failed to start microphone:', err);
            if (window.VixelAudioUI && window.VixelAudioUI.showError) {
              window.VixelAudioUI.showError('Failed to start microphone: ' + (err.message || 'Unknown error'));
            }
          }
        }
      };
      
      // Only setup toggle button - device and gain are in settings modal
      window.VixelAudioUI.setupMicrophoneControls(handleMicToggle, null, null);
    }

    // Note: setupTimeSlider is called in loader.js when mediaEl is created

    window.VixelAudioUI.updatePlayPauseButton(false);
  }

  function getBands() {
    // Compute bands first (updates internal state)
    const bands = window.VixelAudioAnalyzer.computeBands();
    // Update beat detection with computed bands
    window.VixelBeatDetection.updateBeatData(bands);
    return bands.slice(0);
  }

  function getKick() {
    return window.VixelBeatDetection.getKick();
  }

  function getBeat() {
    return window.VixelBeatDetection.getBeat();
  }

  function getFrequencyDistribution() {
    return window.VixelAudioAnalyzer.getFrequencyDistribution();
  }

  function isPlaying() {
    return window.VixelAudioPlayer.getPlaying();
  }

  function getFileName() {
    return window.VixelAudioLoader.getFileName();
  }

  function getCurrentTime() {
    return window.VixelAudioLoader.getCurrentTime();
  }

  function getPreScanData() {
    return window.__vixelPreScanData || null;
  }

  function hasPreScanData() {
    return !!window.__vixelPreScanData;
  }

  function getAudioContext() {
    return audioCtx;
  }

  return {
    init,
    getBands,
    getKick,
    getBeat,
    getFrequencyDistribution,
    isPlaying,
    getFileName,
    getCurrentTime,
    getPreScanData,
    hasPreScanData,
    getAudioContext,
    NUM_BANDS: window.VixelAudioAnalyzer.NUM_BANDS
  };
})();

