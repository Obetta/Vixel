// Audio UI controls and display updates

window.VixelAudioUI = (function() {
  function formatTime(seconds) {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function updateTimeDisplay(mediaEl) {
    if (!mediaEl) return;
    const current = mediaEl.currentTime || 0;
    const duration = mediaEl.duration || 0;
    
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const timeSlider = document.getElementById('timeSlider');
    
    // Header panel elements
    const currentTimeHeader = document.getElementById('currentTimeHeader');
    const durationHeader = document.getElementById('durationHeader');
    const timeSliderHeader = document.getElementById('timeSliderHeader');
    
    if (currentTimeEl) {
      currentTimeEl.textContent = formatTime(current);
    }
    
    if (durationEl) {
      durationEl.textContent = formatTime(duration);
    }
    
    if (timeSlider && duration > 0) {
      timeSlider.max = duration;
      timeSlider.value = current;
    }
    
    // Update nav controls
    const currentTimeNav = document.getElementById('currentTimeNav');
    const durationNav = document.getElementById('durationNav');
    const timeSliderNav = document.getElementById('timeSliderNav');
    
    if (currentTimeNav) {
      currentTimeNav.textContent = formatTime(current);
    }
    
    if (durationNav) {
      durationNav.textContent = formatTime(duration);
    }
    
    if (timeSliderNav && duration > 0) {
      timeSliderNav.max = duration;
      timeSliderNav.value = current;
    }
  }

  function updateTrackName(fileName) {
    const trackNameEl = document.getElementById('trackName');
    const trackNameNav = document.getElementById('trackNameNav');
    
    const displayName = fileName || 'No track loaded';
    
    if (trackNameEl) {
      trackNameEl.textContent = displayName;
    }
    
    if (trackNameNav) {
      trackNameNav.textContent = displayName;
    }
  }

  function updatePlayPauseButton(isPlaying) {
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    if (playIcon && pauseIcon) {
      if (isPlaying) {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
      } else {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
      }
    }
  }

  function setupFileInput(onFileSelected) {
    const input = document.getElementById('fileInput');
    if (!input) return;
    
    // Remove existing listeners if any (prevent duplicates)
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    const fileInput = newInput;
    
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        await onFileSelected(file);
        // Reset input value so same file can be selected again
        e.target.value = '';
      }
    });
    
    return fileInput;
  }

  function setupDropZone(onFileSelected) {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;
    
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    };
    
    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
    };
    
    const handleDrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) await onFileSelected(file);
    };
    
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    
    // Handle click on browse button
    const browseBtn = dropZone.querySelector('.drop-upload-btn');
    if (browseBtn) {
      browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.click();
      });
    }
    
    // Also allow clicking anywhere on the drop zone to trigger file input
    dropZone.addEventListener('click', (e) => {
      // Only trigger if not clicking the button itself or the input
      const fileInput = document.getElementById('fileInput');
      if (!e.target.closest('.drop-upload-btn') && e.target !== fileInput) {
        e.preventDefault();
        if (fileInput) fileInput.click();
      }
    });
  }

  function setupTimeSlider(mediaEl) {
    const timeSlider = document.getElementById('timeSlider');
    if (!timeSlider || !mediaEl) return;
    
    // Prevent duplicate setup
    if (timeSlider.dataset.setupDone) return;
    timeSlider.dataset.setupDone = 'true';
    
    let isDragging = false;
    let wasPlayingBeforeSeek = false;
    
    const seekTo = (value) => {
      if (mediaEl && !isNaN(mediaEl.duration) && mediaEl.duration > 0) {
        const seekTime = parseFloat(value);
        if (!isNaN(seekTime)) {
          mediaEl.currentTime = seekTime;
        }
      }
    };
    
    timeSlider.addEventListener('mousedown', () => {
      isDragging = true;
      // Store playback state before starting to drag
      if (window.VixelAudioPlayer) {
        wasPlayingBeforeSeek = window.VixelAudioPlayer.getPlaying();
      }
    });
    
    timeSlider.addEventListener('mouseup', () => {
      if (isDragging) {
        seekTo(timeSlider.value);
        isDragging = false;
      }
    });
    
    timeSlider.addEventListener('input', () => {
      if (isDragging) seekTo(timeSlider.value);
    });
    
    // Touch events for mobile
    timeSlider.addEventListener('touchstart', () => {
      isDragging = true;
      // Store playback state before starting to drag
      if (window.VixelAudioPlayer) {
        wasPlayingBeforeSeek = window.VixelAudioPlayer.getPlaying();
      }
    });
    
    timeSlider.addEventListener('touchend', () => {
      if (isDragging) {
        seekTo(timeSlider.value);
        isDragging = false;
      }
    });
    
    // Handle mouse leave while dragging
    timeSlider.addEventListener('mouseleave', () => {
      if (isDragging) {
        seekTo(timeSlider.value);
        isDragging = false;
      }
    });
    
    // Restore playback state after seeking completes
    const handleSeekEnd = async () => {
      // Small delay to ensure the seek operation has completed
      if (wasPlayingBeforeSeek && window.VixelAudioPlayer) {
        // Check if playback actually stopped (some browsers may auto-pause on seek)
        const stillPlaying = window.VixelAudioPlayer.getPlaying();
        if (!stillPlaying) {
          // Resume playback by calling the toggle function
          // We need to check if mediaEl is playing, if not, play it
          if (mediaEl && mediaEl.paused) {
            mediaEl.play().catch(err => {
              console.error('[UI] Failed to resume playback after seek:', err);
            });
            window.VixelAudioPlayer.setPlaying(true);
            updatePlayPauseButton(true);
          }
        }
      }
      wasPlayingBeforeSeek = false;
    };
    
    // Listen for seek complete events
    mediaEl.addEventListener('seeked', handleSeekEnd);
  }

  function setupPlayPauseButton(onToggle) {
    const btn = document.getElementById('playPauseBtn');
    if (btn) {
      btn.addEventListener('click', async () => {
        await onToggle();
      });
    }
  }

  function setupLoopToggle(onLoopChange) {
    const loopBtn = document.getElementById('loopBtn');
    if (loopBtn) {
      loopBtn.addEventListener('click', () => {
        const isActive = loopBtn.classList.contains('active');
        if (isActive) {
          loopBtn.classList.remove('active');
        } else {
          loopBtn.classList.add('active');
        }
        if (onLoopChange) onLoopChange(!isActive);
      });
    }
  }

  function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('hidden');
    // Reset progress tracking
    window._lastProgressUpdate = undefined;
  }

  function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // Ensure overlay is hidden on initialization
  function initUI() {
    hideLoadingOverlay();
    // Also reset progress to 0
    const progressFill = document.getElementById('loadingProgressFill');
    const progressText = document.getElementById('loadingProgressText');
    if (progressFill) {
      progressFill.style.setProperty('--progress-width', '0%');
    }
    if (progressText) progressText.textContent = '0%';
  }
  
  // Immediately hide overlay on script load (before DOM ready)
  (function() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.add('hidden');
      });
    } else {
      // DOM already loaded
      const overlay = document.getElementById('loadingOverlay');
      if (overlay) overlay.classList.add('hidden');
    }
  })();

  function updateProgress(percent) {
    const progressFill = document.getElementById('loadingProgressFill');
    const progressText = document.getElementById('loadingProgressText');
    if (progressFill) {
      progressFill.style.setProperty('--progress-width', `${percent}%`);
    }
    if (progressText) progressText.textContent = `${Math.floor(percent)}%`;
  }

  function showError(message) {
    // Hide loading overlay if visible
    hideLoadingOverlay();
    
    // Create or update error message in the drop zone
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;
    
    // Remove existing error message if any
    const existingError = dropZone.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Add to drop zone
    dropZone.appendChild(errorDiv);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.classList.add('error-message-fade-out');
        setTimeout(() => errorDiv.remove(), 300);
      }
    }, 8000);
  }

  async function refreshTrackList() {
    if (!window.VixelAudioStorage) {
      return;
    }
    
    try {
      const tracks = await window.VixelAudioStorage.getAllTracks();
      const section = document.getElementById('recentTracksSection');
      const list = document.getElementById('recentTracksList');
      
      if (!section || !list) {
        return;
      }
      
      // Show/hide section based on whether there are tracks
      if (tracks.length === 0) {
        section.classList.add('hidden');
        return;
      }
      
      section.classList.remove('hidden');
      list.innerHTML = '';
      
      // Add track items
      tracks.forEach(track => {
        const item = document.createElement('div');
        item.className = 'recent-track-item';
        item.dataset.trackId = track.id;
        
        const fileName = document.createElement('div');
        fileName.className = 'recent-track-name';
        fileName.textContent = track.fileName;
        
        const meta = document.createElement('div');
        meta.className = 'recent-track-meta';
        meta.innerHTML = `
          <span class="track-size">${window.VixelAudioStorage.formatFileSize(track.fileSize)}</span>
          <span class="track-time">${window.VixelAudioStorage.formatDate(track.lastLoaded)}</span>
        `;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'recent-track-delete';
        deleteBtn.type = 'button';
        deleteBtn.title = 'Delete this track';
        deleteBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
        
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm(`Delete "${track.fileName}"?`)) {
            try {
              await window.VixelAudioStorage.deleteTrack(track.id);
              refreshTrackList();
            } catch (err) {
              console.error('[UI] Failed to delete track:', err);
              showError('Failed to delete track');
            }
          }
        });
        
        item.appendChild(fileName);
        item.appendChild(meta);
        item.appendChild(deleteBtn);
        
        // Click to load track
        item.addEventListener('click', async (e) => {
          if (e.target.closest('.recent-track-delete')) return;
          
          const onFileSelected = window.__vixelFileSelectedCallback;
          if (!onFileSelected) return;
          
          try {
            const file = await window.VixelAudioStorage.loadTrack(track.id);
            await onFileSelected(file);
          } catch (err) {
            console.error('[UI] Failed to load track:', err);
            showError('Failed to load saved track. It may have been corrupted.');
            // Remove from list if it fails
            refreshTrackList();
          }
        });
        
        list.appendChild(item);
      });
    } catch (err) {
      console.error('[UI] Failed to refresh track list:', err);
    }
  }

  function setupRecentTracks(onFileSelected) {
    // Store callback for use in track items
    window.__vixelFileSelectedCallback = onFileSelected;
    
    // Setup clear button
    const clearBtn = document.getElementById('clearTracksBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        if (!confirm('Clear all saved tracks? This cannot be undone.')) {
          return;
        }
        
        if (!window.VixelAudioStorage) return;
        
        try {
          const tracks = await window.VixelAudioStorage.getAllTracks();
          for (const track of tracks) {
            await window.VixelAudioStorage.deleteTrack(track.id);
          }
          refreshTrackList();
        } catch (err) {
          console.error('[UI] Failed to clear tracks:', err);
          showError('Failed to clear tracks');
        }
      });
    }
    
    // Initial load
    refreshTrackList();
  }

  return {
    initUI,
    updateTimeDisplay,
    updateTrackName,
    updatePlayPauseButton,
    setupFileInput,
    setupDropZone,
    setupTimeSlider,
    setupPlayPauseButton,
    setupLoopToggle,
    showLoadingOverlay,
    hideLoadingOverlay,
    updateProgress,
    showError,
    refreshTrackList,
    setupRecentTracks
  };
})();

