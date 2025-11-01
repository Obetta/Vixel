// UI controls wiring and event handlers

window.VixelControls = (function () {
  function updateValueDisplay(id, value, decimals = 2) {
    const display = document.getElementById(id);
    if (display) {
      if (decimals === 0) {
        display.textContent = Math.round(value);
      } else {
        display.textContent = value.toFixed(decimals);
      }
      return true;
    }
    return false;
  }

  function setupControls(field, world, spin, orbit) {
    const osc = document.getElementById('osc');
    const trails = document.getElementById('trails');
    const trailThickness = document.getElementById('trailThickness');
    const showPlane = document.getElementById('showPlane');
    const showPlane2 = document.getElementById('showPlane2');
    const showAxes = document.getElementById('showAxes');
    const showTrails = document.getElementById('showTrails');
    const showVideo = document.getElementById('showVideo');
    const spinX = document.getElementById('spinX');
    const spinY = document.getElementById('spinY');
    const spinZ = document.getElementById('spinZ');
    const resetSpinBtn = document.getElementById('resetSpinBtn');

    // Oscillation control
    if (osc) {
      osc.addEventListener('input', () => {
        const val = Number(osc.value);
        updateValueDisplay('oscValue', val, 2);
        field.setOscillation(val);
      });
      const val = Number(osc.value);
      updateValueDisplay('oscValue', val, 2);
      field.setOscillation(val);
    }

    // Trail strength control
    if (trails) {
      trails.addEventListener('input', () => {
        const val = Number(trails.value);
        const display = document.getElementById('trailsValue');
        if (display) display.textContent = `${Math.round(val * 100)}%`;
        field.setTrailStrength(val);
      });
      const val = Number(trails.value);
      const display = document.getElementById('trailsValue');
      if (display) display.textContent = `${Math.round(val * 100)}%`;
      field.setTrailStrength(val);
    }

    // Trail thickness control
    if (trailThickness) {
      trailThickness.addEventListener('input', () => {
        const val = Number(trailThickness.value);
        updateValueDisplay('trailThicknessValue', val, 0);
        field.setTrailThickness(val);
      });
      const val = Number(trailThickness.value);
      updateValueDisplay('trailThicknessValue', val, 0);
      field.setTrailThickness(val);
    }

    // Plane visibility toggles
    if (showPlane) {
      showPlane.addEventListener('change', () => {
        const plane = world.getObjectByName('vixel-grid-plane');
        if (plane) plane.visible = showPlane.checked;
      });
      const plane = world.getObjectByName('vixel-grid-plane');
      if (plane) plane.visible = showPlane.checked;
    }

    if (showPlane2) {
      showPlane2.addEventListener('change', () => {
        const plane2 = world.getObjectByName('vixel-grid-plane-2');
        if (plane2) plane2.visible = showPlane2.checked;
      });
      const plane2 = world.getObjectByName('vixel-grid-plane-2');
      if (plane2) plane2.visible = showPlane2.checked;
    }

    // Axes visibility toggle
    if (showAxes) {
      showAxes.addEventListener('change', () => {
        const axes = world.getObjectByName('vixel-axes-helper');
        if (axes) axes.visible = showAxes.checked;
        const legend = document.querySelector('.axis-legend');
        if (legend) legend.style.display = showAxes.checked ? 'flex' : 'none';
      });
      const axes = world.getObjectByName('vixel-axes-helper');
      if (axes) axes.visible = showAxes.checked;
      const legend = document.querySelector('.axis-legend');
      if (legend) legend.style.display = showAxes.checked ? 'flex' : 'none';
    }

    // Trails visibility toggle
    if (showTrails) {
      showTrails.addEventListener('change', () => field.setTrailsVisible(showTrails.checked));
      field.setTrailsVisible(showTrails.checked);
    }

    // Video visibility toggle
    if (showVideo) {
      showVideo.addEventListener('change', () => {
        if (window.VixelVideoTexture) {
          window.VixelVideoTexture.setVisible(showVideo.checked);
        }
      });
      // Initial state - hidden by default
      if (window.VixelVideoTexture) {
        window.VixelVideoTexture.setVisible(showVideo.checked);
      }
    }

    // Stats are always visible in the right panel now
    if (typeof window.toggleStatsDisplay === 'function') {
      window.toggleStatsDisplay(true);
    }

    // Auto spin controls
    if (spinX) {
      spinX.addEventListener('input', () => {
        const val = Number(spinX.value);
        updateValueDisplay('spinXValue', val, 2);
        spin.x = val * 0.5;
      });
      const val = Number(spinX.value);
      updateValueDisplay('spinXValue', val, 2);
      spin.x = val * 0.5;
    }

    if (spinY) {
      spinY.addEventListener('input', () => {
        const val = Number(spinY.value);
        updateValueDisplay('spinYValue', val, 2);
        spin.y = val * 0.5;
      });
      const val = Number(spinY.value);
      updateValueDisplay('spinYValue', val, 2);
      spin.y = val * 0.5;
    }

    if (spinZ) {
      spinZ.addEventListener('input', () => {
        const val = Number(spinZ.value);
        updateValueDisplay('spinZValue', val, 2);
        spin.z = val * 0.5;
      });
      const val = Number(spinZ.value);
      updateValueDisplay('spinZValue', val, 2);
      spin.z = val * 0.5;
    }

    // Reset auto spin button
    if (resetSpinBtn) {
      resetSpinBtn.addEventListener('click', () => {
        if (spinX) {
          spinX.value = '0';
          spinX.dispatchEvent(new Event('input'));
        }
        if (spinY) {
          spinY.value = '0';
          spinY.dispatchEvent(new Event('input'));
        }
        if (spinZ) {
          spinZ.value = '0';
          spinZ.dispatchEvent(new Event('input'));
        }
      });
    }

    // Recording controls
    setupRecordingControls(field, world);
  }

  function setupRecordingControls(field, world) {
    const recordBtn = document.getElementById('recordBtn');
    const stopRecordBtn = document.getElementById('stopRecordBtn');
    const recordingStatus = document.getElementById('recordingStatus');
    const recordingTime = document.getElementById('recordingTime');
    const recordingIncludeGrid = document.getElementById('recordingIncludeGrid');
    const recordingFormat = document.getElementById('recordingFormat');
    
    let recordingInterval = null;
    let originalGridVisibility = {};
    
    if (!recordBtn || !stopRecordBtn) return;
    
    // Setup format selector display update
    if (recordingFormat) {
      recordingFormat.addEventListener('change', () => {
        const formatValue = document.getElementById('recordingFormatValue');
        if (formatValue) {
          const selectedOption = recordingFormat.options[recordingFormat.selectedIndex];
          formatValue.textContent = selectedOption.textContent.replace(/\(.*?\)/g, '').trim();
        }
      });
    }

    recordBtn.addEventListener('click', async () => {
      if (!window.VixelRecorder) {
        console.error('[Recording] VixelRecorder not available');
        return;
      }

      // Get canvas
      const canvas = document.getElementById('stage');
      if (!canvas) {
        console.error('[Recording] Canvas not found');
        return;
      }

      // Get media element for audio
      const mediaElement = window.VixelAudioLoader?.getMediaElement();
      
      // Store original visibility states
      const grid1 = world.getObjectByName('vixel-grid-plane');
      const grid2 = world.getObjectByName('vixel-grid-plane-2');
      const axes = world.getObjectByName('vixel-axes-helper');
      
      if (grid1) originalGridVisibility.grid1 = grid1.visible;
      if (grid2) originalGridVisibility.grid2 = grid2.visible;
      if (axes) originalGridVisibility.axes = axes.visible;

      // Apply recording visibility settings
      const includeGrid = recordingIncludeGrid?.checked ?? true;
      if (grid1) grid1.visible = includeGrid;
      if (grid2) grid2.visible = includeGrid;
      if (axes) axes.visible = includeGrid;

      // Determine MIME type based on format selection
      let mimeType = 'auto';
      if (recordingFormat) {
        switch(recordingFormat.value) {
          case 'webm-vp9':
            mimeType = 'video/webm;codecs=vp9,opus';
            break;
          case 'webm-vp8':
            mimeType = 'video/webm;codecs=vp8,opus';
            break;
          case 'mp4-h264':
            mimeType = 'video/mp4;codecs=h264,aac';
            break;
          case 'auto':
          default:
            mimeType = 'auto';
            break;
        }
      }

      // Get settings
      const bitrate = window.VixelSettings ? window.VixelSettings.getRecordingBitrate() : 2500000;
      const fps = window.VixelSettings ? window.VixelSettings.getRecordingFPS() : 30;

      // Start recording
      const success = await window.VixelRecorder.startRecording(canvas, mediaElement, {
        includeAudio: true,
        videoBitrate: bitrate,
        targetFPS: fps,
        mimeType: mimeType
      });

      if (success) {
        // Update UI
        recordBtn.classList.add('hidden');
        stopRecordBtn.classList.remove('hidden');
        recordingStatus?.classList.remove('hidden');
        
        // Update time every second
        recordingInterval = setInterval(() => {
          const duration = window.VixelRecorder.getRecordingDuration();
          const minutes = Math.floor(duration / 60);
          const seconds = Math.floor(duration % 60);
          if (recordingTime) {
            recordingTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          }
        }, 1000);
      } else {
        // Restore original visibility on failure
        if (grid1) grid1.visible = originalGridVisibility.grid1;
        if (grid2) grid2.visible = originalGridVisibility.grid2;
        if (axes) axes.visible = originalGridVisibility.axes;
      }
    });

    stopRecordBtn.addEventListener('click', async () => {
      if (!window.VixelRecorder) return;

      // Stop recording
      const blob = await window.VixelRecorder.stopRecording();

      // Restore original visibility states
      const grid1 = world.getObjectByName('vixel-grid-plane');
      const grid2 = world.getObjectByName('vixel-grid-plane-2');
      const axes = world.getObjectByName('vixel-axes-helper');
      
      if (grid1) grid1.visible = originalGridVisibility.grid1;
      if (grid2) grid2.visible = originalGridVisibility.grid2;
      if (axes) axes.visible = originalGridVisibility.axes;

      // Clear interval
      if (recordingInterval) {
        clearInterval(recordingInterval);
        recordingInterval = null;
      }

      // Update UI
      recordBtn.classList.remove('hidden');
      stopRecordBtn.classList.add('hidden');
      recordingStatus?.classList.add('hidden');

      // Download the recording
      if (blob) {
        const filename = `vixel-recording-${Date.now()}`;
        const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        console.log(`[Recording] Video ready: ${fileSizeMB} MB`);
        console.log(`[Recording] Format: WebM with ${blob.type.includes('vp9') ? 'VP9' : 'VP8'} video codec`);
        
        await window.VixelRecorder.downloadRecording(blob, filename);
      }
    });
  }

  function updateCameraPositionDisplay(camera) {
    if (camera) {
      const pos = camera.position;
      const posDisplay = document.getElementById('cameraPosition');
      if (posDisplay) {
        posDisplay.textContent = `X: ${pos.x.toFixed(2)}, Y: ${pos.y.toFixed(2)}, Z: ${pos.z.toFixed(2)}`;
      }
    }
  }

  return {
    setupControls,
    updateValueDisplay,
    updateCameraPositionDisplay
  };
})();

