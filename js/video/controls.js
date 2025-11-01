// Video-specific controls: scrubbing, frame stepping, segment analysis

window.VixelVideoControls = (function() {
  const DEBUG = window.DEBUG || false;
  
  let mediaEl = null;
  let isVideoFile = false;
  let frameRate = 1.0;
  let isFrameStepMode = false;
  let isLoopSegment = false;
  let segmentStart = 0;
  let segmentEnd = 100;
  let currentFrame = 0;
  let videoFPS = 30; // Default, will be detected
  let frameDuration = 0;
  
  // Store the original playbackRate
  let originalPlaybackRate = 1.0;
  
  function formatFrameTimestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(3, '0')}`;
  }
  
  function updateFrameDisplay() {
    if (!mediaEl || !isVideoFile) return;
    
    const currentTime = mediaEl.currentTime || 0;
    const frameNum = Math.floor(currentTime * videoFPS);
    currentFrame = frameNum; // Update the current frame
    
    const frameNumberEl = document.getElementById('frameNumber');
    const frameTimestampEl = document.getElementById('frameTimestamp');
    
    if (frameNumberEl) frameNumberEl.textContent = frameNum;
    if (frameTimestampEl) frameTimestampEl.textContent = formatFrameTimestamp(currentTime);
  }
  
  function setupControls(videoElement, isVideo) {
    mediaEl = videoElement;
    isVideoFile = isVideo;
    
    // Show/hide video controls section
    const controlsSection = document.getElementById('videoControlsSection');
    if (controlsSection) {
      if (isVideo) {
        controlsSection.classList.remove('hidden');
        // Detect video FPS if available
        if (mediaEl && mediaEl.videoWidth) {
          // Try to get frame rate from video metadata
          // Most browsers don't expose this directly, so we use a default
          videoFPS = 30;
          frameDuration = 1 / videoFPS;
        }
      } else {
        controlsSection.classList.add('hidden');
        return; // Don't set up controls for audio files
      }
    }
    
    // Setup frame rate control
    const frameRateSlider = document.getElementById('frameRate');
    const frameRateValue = document.getElementById('frameRateValue');
    if (frameRateSlider && frameRateValue) {
      frameRateSlider.addEventListener('input', (e) => {
        frameRate = parseFloat(e.target.value);
        frameRateValue.textContent = `${frameRate}x`;
        
        // Apply playback rate
        if (mediaEl && !isFrameStepMode) {
          mediaEl.playbackRate = frameRate;
          originalPlaybackRate = frameRate;
        }
      });
      
      // Initialize
      frameRate = parseFloat(frameRateSlider.value);
      frameRateValue.textContent = `${frameRate}x`;
    }
    
    // Setup frame step mode
    const frameStepCheckbox = document.getElementById('frameStepMode');
    if (frameStepCheckbox) {
      frameStepCheckbox.addEventListener('change', (e) => {
        isFrameStepMode = e.target.checked;
        
        if (isFrameStepMode) {
          // Pause and allow manual stepping
          if (mediaEl) {
            mediaEl.pause();
            if (window.VixelAudioPlayer) {
              window.VixelAudioPlayer.setPlaying(false);
            }
          }
        } else {
          // Resume normal playback
          if (mediaEl && window.VixelAudioPlayer && window.VixelAudioPlayer.getPlaying()) {
            mediaEl.play();
          }
        }
      });
    }
    
    // Setup loop segment
    const loopSegmentCheckbox = document.getElementById('loopSegment');
    const segmentLoopControls = document.getElementById('segmentLoopControls');
    const segmentEndControls = document.getElementById('segmentEndControls');
    const segmentStartSlider = document.getElementById('segmentStart');
    const segmentStartValue = document.getElementById('segmentStartValue');
    const segmentEndSlider = document.getElementById('segmentEnd');
    const segmentEndValue = document.getElementById('segmentEndValue');
    
    if (loopSegmentCheckbox && segmentLoopControls && segmentEndControls) {
      loopSegmentCheckbox.addEventListener('change', (e) => {
        isLoopSegment = e.target.checked;
        
        if (isLoopSegment) {
          segmentLoopControls.classList.add('show');
          segmentEndControls.classList.add('show');
        } else {
          segmentLoopControls.classList.remove('show');
          segmentEndControls.classList.remove('show');
        }
      });
    }
    
    // Setup segment sliders
    if (segmentStartSlider && segmentStartValue && mediaEl && mediaEl.duration) {
      segmentStartSlider.max = mediaEl.duration;
      segmentStartSlider.addEventListener('input', (e) => {
        segmentStart = parseFloat(e.target.value);
        segmentStartValue.textContent = formatTime(segmentStart);
      });
    }
    
    if (segmentEndSlider && segmentEndValue && mediaEl && mediaEl.duration) {
      segmentEndSlider.max = mediaEl.duration;
      segmentEndSlider.value = mediaEl.duration;
      segmentEndValue.textContent = formatTime(mediaEl.duration);
      segmentEndSlider.addEventListener('input', (e) => {
        segmentEnd = parseFloat(e.target.value);
        segmentEndValue.textContent = formatTime(segmentEnd);
      });
    }
    
    // Setup frame navigation buttons
    const frameBackBtn = document.getElementById('frameBackBtn');
    const frameForwardBtn = document.getElementById('frameForwardBtn');
    
    if (frameBackBtn) {
      frameBackBtn.addEventListener('click', () => {
        if (!mediaEl) return;
        
        if (isFrameStepMode && frameDuration > 0) {
          // Step back one frame
          mediaEl.currentTime = Math.max(0, mediaEl.currentTime - frameDuration);
        } else {
          // Jump back 1 second
          mediaEl.currentTime = Math.max(0, mediaEl.currentTime - 1);
        }
        updateFrameDisplay();
      });
    }
    
    if (frameForwardBtn) {
      frameForwardBtn.addEventListener('click', () => {
        if (!mediaEl) return;
        
        if (isFrameStepMode && frameDuration > 0) {
          // Step forward one frame
          const maxTime = mediaEl.duration || 0;
          mediaEl.currentTime = Math.min(maxTime, mediaEl.currentTime + frameDuration);
        } else {
          // Jump forward 1 second
          const maxTime = mediaEl.duration || 0;
          mediaEl.currentTime = Math.min(maxTime, mediaEl.currentTime + 1);
        }
        updateFrameDisplay();
      });
    }
    
    // Update frame display on time updates
    if (mediaEl) {
      mediaEl.addEventListener('timeupdate', updateFrameDisplay);
      mediaEl.addEventListener('loadedmetadata', () => {
        // Update segment slider max values
        if (segmentStartSlider) segmentStartSlider.max = mediaEl.duration;
        if (segmentEndSlider) {
          segmentEndSlider.max = mediaEl.duration;
          segmentEndSlider.value = mediaEl.duration;
          if (segmentEndValue) segmentEndValue.textContent = formatTime(mediaEl.duration);
          segmentEnd = mediaEl.duration;
        }
      });
    }
    
    // Initialize display
    updateFrameDisplay();
    
    // Setup video opacity control
    const videoOpacitySlider = document.getElementById('videoOpacity');
    const videoOpacityValue = document.getElementById('videoOpacityValue');
    if (videoOpacitySlider && videoOpacityValue && window.VixelVideoTexture) {
      videoOpacitySlider.addEventListener('input', (e) => {
        const opacity = parseFloat(e.target.value) / 100; // Convert percentage to 0-1
        videoOpacityValue.textContent = `${Math.round(e.target.value)}%`;
        window.VixelVideoTexture.setOpacity(opacity);
      });
      
      // Initialize with current opacity (if video texture exists)
      const currentOpacity = window.VixelVideoTexture.getOpacity();
      const opacityPercent = Math.round(currentOpacity * 100);
      videoOpacitySlider.value = opacityPercent || 85;
      videoOpacityValue.textContent = `${opacityPercent || 85}%`;
    }
    
    // Setup video scale control
    const videoScaleSlider = document.getElementById('videoScale');
    const videoScaleValue = document.getElementById('videoScaleValue');
    if (videoScaleSlider && videoScaleValue && window.VixelVideoTexture) {
      videoScaleSlider.addEventListener('input', (e) => {
        const scale = parseFloat(e.target.value) / 100; // Convert percentage to scale value
        videoScaleValue.textContent = `${Math.round(e.target.value)}%`;
        window.VixelVideoTexture.setScale(scale);
      });
      
      // Initialize with current scale (default to 100%)
      const currentScale = window.VixelVideoTexture.getScale();
      const scalePercent = Math.round(currentScale * 100);
      videoScaleSlider.value = scalePercent || 100;
      videoScaleValue.textContent = `${scalePercent || 100}%`;
    }
    
    // Setup video blend mode control
    const videoBlendModeSelect = document.getElementById('videoBlendMode');
    if (videoBlendModeSelect && window.VixelVideoTexture) {
      videoBlendModeSelect.addEventListener('change', (e) => {
        const blendMode = e.target.value;
        window.VixelVideoTexture.setBlendMode(blendMode);
      });
      
      // Initialize with current blend mode (default to Normal)
      const currentBlendMode = window.VixelVideoTexture.getBlendMode();
      videoBlendModeSelect.value = currentBlendMode || 'Normal';
    }
  }
  
  function formatTime(seconds) {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Handle segment looping
  function checkSegmentLoop() {
    if (!mediaEl || !isLoopSegment) return;
    
    const currentTime = mediaEl.currentTime;
    if (currentTime >= segmentEnd) {
      mediaEl.currentTime = segmentStart;
    }
  }
  
  // Integrate with audio player for segment looping
  function integrateWithPlayer() {
    if (!mediaEl) return;
    
    // Check for segment end during playback
    mediaEl.addEventListener('timeupdate', () => {
      if (isLoopSegment) {
        checkSegmentLoop();
      }
    });
  }
  
  function getFrameRate() {
    return frameRate;
  }
  
  function getCurrentFrame() {
    return currentFrame;
  }
  
  function isInFrameStepMode() {
    return isFrameStepMode;
  }
  
  function cleanup() {
    mediaEl = null;
    isVideoFile = false;
    frameRate = 1.0;
    isFrameStepMode = false;
    isLoopSegment = false;
  }
  
  // Get current timestamp in seconds for beat-sync effects
  function getCurrentTimestamp() {
    if (!mediaEl) return 0;
    return mediaEl.currentTime || 0;
  }
  
  // Get the current frame number (absolute frame count)
  function getCurrentFrameNumber() {
    if (!mediaEl || !isVideoFile) return 0;
    return Math.floor(mediaEl.currentTime * videoFPS);
  }
  
  // Check if we're at a specific frame
  function isAtFrame(frameNum) {
    const currentFrame = getCurrentFrameNumber();
    const delta = Math.abs(currentFrame - frameNum);
    // Allow small tolerance (within 1 frame)
    return delta <= 1;
  }
  
  // Get frame timestamp from frame number
  function frameToTimestamp(frameNum) {
    if (!mediaEl || !isVideoFile || videoFPS === 0) return 0;
    return frameNum / videoFPS;
  }
  
  return {
    setupControls,
    integrateWithPlayer,
    getFrameRate,
    getCurrentFrame,
    isInFrameStepMode,
    updateFrameDisplay,
    getCurrentTimestamp,
    getCurrentFrameNumber,
    isAtFrame,
    frameToTimestamp,
    cleanup
  };
})();

