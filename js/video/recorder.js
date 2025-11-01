// Video recording functionality with MediaRecorder API
// Supports canvas capture + audio track mixing

window.VixelRecorder = (function() {
  const DEBUG = window.DEBUG || false;
  let mediaRecorder = null;
  let recordedChunks = [];
  let canvasStream = null;
  let audioStream = null;
  let combinedStream = null;
  let isRecording = false;
  let recordingStartTime = 0;
  let currentMimeType = null;

  /**
   * Start recording the canvas with optional audio
   * @param {HTMLCanvasElement} canvas - The canvas element to record
   * @param {HTMLAudioElement|HTMLVideoElement} mediaElement - Audio/video element for audio track
   * @param {Object} options - Recording options
   * @returns {Promise<boolean>} Success status
   */
  async function startRecording(canvas, mediaElement, options = {}) {
    const {
      includeAudio = true,
      videoBitrate = 2500000, // 2.5 Mbps
      targetFPS = 30,
      mimeType = 'video/webm;codecs=vp9,opus'
    } = options;

    if (!canvas) {
      console.error('[Recorder] No canvas provided');
      return false;
    }

    if (isRecording) {
      console.warn('[Recorder] Already recording, stop current recording first');
      return false;
    }

    try {
      recordedChunks = [];

      // Capture canvas as video stream with target FPS
      canvasStream = canvas.captureStream(targetFPS);

      if (DEBUG) {
        console.log('[Recorder] Canvas stream created with FPS:', canvasStream.getVideoTracks()[0]?.getSettings()?.frameRate);
      }

      // Get audio track if requested and available
      if (includeAudio && mediaElement) {
        // Try to get existing AudioContext from VixelAudio
        const audioContext = window.VixelAudio?.getAudioContext();
        
        if (!audioContext) {
          console.warn('[Recorder] No AudioContext available');
          audioStream = null;
        } else {
          try {
            // Get the existing source node from the loader
            const existingSource = window.VixelAudioLoader?.getSourceNode();
            
            if (!existingSource) {
              console.warn('[Recorder] No audio source node available');
              audioStream = null;
            } else {
              // Create a MediaStreamDestination to capture audio
              const destination = audioContext.createMediaStreamDestination();
              
              // Connect the existing source to our destination for recording
              existingSource.connect(destination);
              
              audioStream = destination.stream;
              
              if (DEBUG) {
                console.log('[Recorder] Audio stream created from existing source');
              }
            }
          } catch (audioError) {
            console.warn('[Recorder] Could not create audio stream:', audioError);
            audioStream = null;
          }
        }
      }

      // Combine video and audio tracks
      if (audioStream && audioStream.getAudioTracks().length > 0) {
        combinedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioStream.getAudioTracks()
        ]);
        
        if (DEBUG) {
          console.log('[Recorder] Combined stream with audio track');
        }
      } else {
        combinedStream = canvasStream;
        
        if (DEBUG) {
          console.log('[Recorder] Using canvas stream only (no audio)');
        }
      }

      // Create MediaRecorder with format detection
      const availableMimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4;codecs=h264,aac',
        'video/mp4;codecs=h264',
        'video/mp4'
      ];

      let selectedMimeType = mimeType;
      
      // If "auto" or not supported, find best available
      if (!selectedMimeType || selectedMimeType === 'auto' || !MediaRecorder.isTypeSupported(selectedMimeType)) {
        selectedMimeType = availableMimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
        if (DEBUG) {
          console.log(`[Recorder] Detected supported format: ${selectedMimeType}`);
        }
      }
      
      if (DEBUG && mimeType && mimeType !== 'auto' && mimeType !== selectedMimeType) {
        console.warn(`[Recorder] Requested MIME type not supported, using: ${selectedMimeType}`);
      }

      currentMimeType = selectedMimeType;

      mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: videoBitrate
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data);
          if (DEBUG) {
            console.log('[Recorder] Received chunk:', event.data.size, 'bytes');
          }
        }
      };

      // onstop will be set by stopRecording() to handle the blob creation

      mediaRecorder.onerror = (event) => {
        console.error('[Recorder] MediaRecorder error:', event.error);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      isRecording = true;
      recordingStartTime = Date.now();

      if (DEBUG) {
        console.log('[Recorder] Started recording with MIME type:', selectedMimeType);
      }

      return true;

    } catch (error) {
      console.error('[Recorder] Failed to start recording:', error);
      
      // Clean up on error
      if (canvasStream) {
        canvasStream.getTracks().forEach(track => track.stop());
        canvasStream = null;
      }
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
      }
      
      isRecording = false;
      return false;
    }
  }

  /**
   * Stop recording
   * @returns {Promise<Blob|null>} The recorded video blob, or null on failure
   */
  async function stopRecording() {
    if (!isRecording || !mediaRecorder) {
      console.warn('[Recorder] Not currently recording');
      return null;
    }

    try {
      // Capture mimeType before stopping
      const mimeType = mediaRecorder.mimeType;
      
      return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
          if (recordedChunks.length === 0) {
            console.warn('[Recorder] No recorded data');
            resolve(null);
            return;
          }

          const blob = new Blob(recordedChunks, { type: mimeType });
          
          if (DEBUG) {
            console.log('[Recorder] Created blob:', blob.size, 'bytes, type:', blob.type);
          }
          
          recordedChunks = [];
          isRecording = false;
          
          // Clean up streams
          if (canvasStream) {
            canvasStream.getTracks().forEach(track => track.stop());
            canvasStream = null;
          }
          if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
          }
          combinedStream = null;
          mediaRecorder = null;

          resolve(blob);
        };

        mediaRecorder.stop();
      });
    } catch (error) {
      console.error('[Recorder] Failed to stop recording:', error);
      isRecording = false;
      mediaRecorder = null;
      return null;
    }
  }

  /**
   * Download the recorded video
   * @param {Blob} blob - The video blob
   * @param {string} filename - Download filename (without extension)
   * @param {boolean} showSaveDialog - Whether to show save dialog (if supported)
   */
  async function downloadRecording(blob, filename = 'vixel-recording', showSaveDialog = true) {
    if (!blob) {
      console.error('[Recorder] No blob to download');
      return;
    }

    // Determine file extension and type based on MIME type
    let fileExt = 'webm';
    let acceptTypes = [{ description: 'Video File', accept: { 'video/*': ['.webm', '.mp4'] } }];
    
    if (currentMimeType) {
      if (currentMimeType.includes('mp4')) {
        fileExt = 'mp4';
        acceptTypes = [{ description: 'MP4 Video File', accept: { 'video/mp4': ['.mp4'] } }];
      } else {
        fileExt = 'webm';
        acceptTypes = [{ description: 'WebM Video File', accept: { 'video/webm': ['.webm'] } }];
      }
    }

    try {
      // Try to use File System Access API if available and user wants dialog
      if (showSaveDialog && 'showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: `${filename}.${fileExt}`,
            types: acceptTypes
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          
          if (DEBUG) {
            console.log('[Recorder] File saved via File System Access API:', filename);
          }
          return;
        } catch (saveError) {
          // User canceled or error occurred, fall back to download
          if (saveError.name !== 'AbortError') {
            console.warn('[Recorder] File System Access API failed, using download:', saveError);
          } else {
            // User canceled - don't download
            if (DEBUG) {
              console.log('[Recorder] User canceled save dialog');
            }
            return;
          }
        }
      }

      // Fallback: Use traditional download method
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${fileExt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      if (DEBUG) {
        console.log('[Recorder] Download initiated for:', filename);
      }
    } catch (error) {
      console.error('[Recorder] Failed to download recording:', error);
    }
  }

  /**
   * Check if currently recording
   * @returns {boolean} Recording status
   */
  function isCurrentlyRecording() {
    return isRecording;
  }

  /**
   * Get recording duration in seconds
   * @returns {number} Duration in seconds
   */
  function getRecordingDuration() {
    if (!isRecording) return 0;
    return (Date.now() - recordingStartTime) / 1000;
  }

  /**
   * Clean up resources
   */
  function cleanup() {
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
    }
    
    if (canvasStream) {
      canvasStream.getTracks().forEach(track => track.stop());
    }
    
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    
    recordedChunks = [];
    mediaRecorder = null;
    canvasStream = null;
    audioStream = null;
    combinedStream = null;
    isRecording = false;
    
    if (DEBUG) {
      console.log('[Recorder] Cleanup complete');
    }
  }

  return {
    startRecording,
    stopRecording,
    downloadRecording,
    isCurrentlyRecording,
    getRecordingDuration,
    cleanup
  };
})();

