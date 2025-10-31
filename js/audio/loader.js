// Audio file loading and media element management

window.VixelAudioLoader = (function() {
  const DEBUG = window.DEBUG || false;
  let mediaEl = null;
  let sourceNode = null;
  let currentObjectURL = null;
  let currentFileName = null;

  // File size limits (configurable)
  const MAX_FILE_SIZE_MB = 500; // 500MB default limit
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  function createMediaElement(fileType) {
    const element = document.createElement(fileType.startsWith('video/') ? 'video' : 'audio');
    element.crossOrigin = 'anonymous';
    return element;
  }

  async function loadFile(file, audioCtx, analyser, enablePreScan = true) {
    try {
      // Validate file exists
      if (!file || !file.type) {
        throw new Error('Invalid file. Please select an audio or video file.');
      }
      
      // Validate file type
      const isAudio = file.type.startsWith('audio/');
      const isVideo = file.type.startsWith('video/');
      if (!isAudio && !isVideo) {
        throw new Error('Unsupported file type. Please select an audio or video file.');
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        throw new Error(`File too large (${fileSizeMB}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      }
      
      // Additional sanity check for extremely large files
      if (file.size > 1024 * 1024 * 1024) { // 1GB
        throw new Error('File size exceeds reasonable limits. Please use a smaller file.');
      }
      
      // Show loading overlay
      if (window.VixelAudioUI && window.VixelAudioUI.showLoadingOverlay) {
        window.VixelAudioUI.showLoadingOverlay();
      }
      
      // Clean up previous file
      if (sourceNode) {
        try { 
          sourceNode.disconnect(); 
        } catch (_) {}
        sourceNode = null;
      }
      
      // Revoke old blob URL to prevent memory leaks
      if (currentObjectURL) {
        try {
          if (window.VixelCleanup) {
            // Let cleanup utility handle it
            window.VixelCleanup.trackBlobURL(currentObjectURL);
          }
          URL.revokeObjectURL(currentObjectURL);
        } catch (_) {}
        currentObjectURL = null;
      }
      
      // Always create a new media element - can only create MediaElementAudioSourceNode once per element
      if (mediaEl) {
        mediaEl.pause();
        mediaEl.src = '';
      }
      mediaEl = createMediaElement(file.type);
      
      // Set up error handlers
      mediaEl.addEventListener('error', (e) => {
        const errorMessage = mediaEl.error 
          ? `Failed to load media: ${getMediaErrorMessage(mediaEl.error)}`
          : 'Failed to load media file. Please try another file.';
        if (window.VixelAudioUI && window.VixelAudioUI.showError) {
          window.VixelAudioUI.showError(errorMessage);
        }
        console.error('[Audio] Media element error:', mediaEl.error);
      });
      
      // Set up time update listeners
      mediaEl.addEventListener('loadedmetadata', () => {
        if (window.VixelAudioUI) window.VixelAudioUI.updateTimeDisplay(mediaEl);
      });
      
      mediaEl.addEventListener('timeupdate', () => {
        if (window.VixelAudioUI) window.VixelAudioUI.updateTimeDisplay(mediaEl);
      });
      
      mediaEl.addEventListener('ended', () => {
        if (window.VixelAudioPlayer) window.VixelAudioPlayer.setPlaying(false);
        if (window.VixelAudioUI) window.VixelAudioUI.updatePlayPauseButton(false);
      });
      
      // Set up time slider controls
      if (window.VixelAudioUI && window.VixelAudioUI.setupTimeSlider) {
        window.VixelAudioUI.setupTimeSlider(mediaEl);
      }
      
      // Create new blob URL and track it
      currentObjectURL = URL.createObjectURL(file);
      if (window.VixelCleanup) {
        window.VixelCleanup.trackBlobURL(currentObjectURL);
      }
      mediaEl.src = currentObjectURL;
      // Set loop from toggle (default to unchecked)
      const loopToggle = document.getElementById('loopToggle');
      mediaEl.loop = loopToggle ? loopToggle.checked : false;
      
      // Wait for metadata to load with timeout
      await Promise.race([
        new Promise((resolve) => {
          mediaEl.addEventListener('loadedmetadata', resolve, { once: true });
          mediaEl.load();
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout loading media file. The file may be corrupted or too large.')), 30000);
        })
      ]);
      
      // Don't start playback yet - wait for pre-scan
      if (audioCtx.state === 'suspended') {
        try {
          await audioCtx.resume();
        } catch (err) {
          throw new Error('Audio context failed to resume. Please interact with the page first.');
        }
      }
      
      try {
        sourceNode = audioCtx.createMediaElementSource(mediaEl);
        sourceNode.connect(analyser);
        analyser.connect(audioCtx.destination);
      } catch (err) {
        throw new Error('Failed to connect audio source. Please try another file.');
      }
      
      currentFileName = file.name;
      
      // Pre-scan in background (blocking until complete)
      if (enablePreScan && window.VixelAudioPreScanner) {
        try {
          // Check if we already have pre-scanned data for this file in this session
          const fileKey = `${file.name}_${file.size}_${file.lastModified}`;
          if (window.__vixelPreScanCache && window.__vixelPreScanCache[fileKey]) {
            // Use cached pre-scan data
            const cachedData = window.__vixelPreScanCache[fileKey];
            window.__vixelPreScanData = cachedData;
            
            // Notify that pre-scanned data is ready
            const event = new CustomEvent('vixelPreScanComplete', { 
              detail: { preScanData: cachedData } 
            });
            window.dispatchEvent(event);
          } else {
            // Run new pre-scan
            const preScanData = await window.VixelAudioPreScanner.preScanAudio(
              file,
              (progress) => {
                // Update progress
                if (window.VixelAudioUI && window.VixelAudioUI.updateProgress) {
                  window.VixelAudioUI.updateProgress(progress);
                }
              }
            );
            
            // Cache the pre-scan data
            if (!window.__vixelPreScanCache) {
              window.__vixelPreScanCache = {};
            }
            window.__vixelPreScanCache[fileKey] = preScanData;
            
            // Pre-scan complete - store for playback
            window.__vixelPreScanData = preScanData;
            
            // Notify that pre-scanned data is ready
            const event = new CustomEvent('vixelPreScanComplete', { 
              detail: { preScanData } 
            });
            window.dispatchEvent(event);
          }
        } catch (err) {
          // Pre-scan failure is not critical, continue without pre-scan data
        }
      }
      
      // Hide loading overlay
      if (window.VixelAudioUI && window.VixelAudioUI.hideLoadingOverlay) {
        window.VixelAudioUI.hideLoadingOverlay();
      }
      
      // Don't auto-start playback - wait for user to click play
      // User will manually trigger playback
      
      // Notify other modules
      if (window.VixelAudioUI) {
        window.VixelAudioUI.updateTrackName(currentFileName);
        window.VixelAudioUI.updatePlayPauseButton(false); // Show play button
        window.VixelAudioUI.updateTimeDisplay(mediaEl);
      }
      
      // Save track to storage for persistence
      if (window.VixelAudioStorage) {
        try {
          await window.VixelAudioStorage.saveTrack(file);
          // Refresh track list UI if it exists
          if (window.VixelAudioUI && window.VixelAudioUI.refreshTrackList) {
            await window.VixelAudioUI.refreshTrackList();
          }
        } catch (err) {
          // Log but don't fail - storage is optional
          console.error('[Audio] Failed to save track to storage:', err);
        }
      }

      // Notify field to reset for new track
      const event = new CustomEvent('vixelNewTrack', { 
        detail: { fileName: file.name } 
      });
      window.dispatchEvent(event);
    } catch (error) {
      // Hide loading overlay
      if (window.VixelAudioUI && window.VixelAudioUI.hideLoadingOverlay) {
        window.VixelAudioUI.hideLoadingOverlay();
      }
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Failed to load file. Please try another file.';
      if (window.VixelAudioUI && window.VixelAudioUI.showError) {
        window.VixelAudioUI.showError(errorMessage);
      }
      
      // Log error for debugging
      console.error('[Audio] Load error:', error);
      
      // Re-throw to allow caller to handle if needed
      throw error;
    }
  }
  
  function getMediaErrorMessage(error) {
    if (!error) return 'Unknown error';
    const errorCodes = {
      1: 'Media aborted',
      2: 'Network error loading media',
      3: 'Media decoding error',
      4: 'Media source not supported'
    };
    return errorCodes[error.code] || `Error code: ${error.code}`;
  }

  function getMediaElement() {
    return mediaEl;
  }

  function getSourceNode() {
    return sourceNode;
  }

  function getCurrentTime() {
    if (!mediaEl) return 0;
    return mediaEl.currentTime || 0;
  }

  function getFileName() {
    return currentFileName;
  }

  return {
    loadFile,
    getMediaElement,
    getSourceNode,
    getCurrentTime,
    getFileName
  };
})();

