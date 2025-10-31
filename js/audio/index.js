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

    // Setup UI with callbacks - always enable pre-scan
    const loadFileCallback = async (file) => {
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
    NUM_BANDS: window.VixelAudioAnalyzer.NUM_BANDS
  };
})();

