// App entry: Main orchestrator for render loop and initialization

(function () {
  const DEBUG = window.DEBUG || false;
  const { VectorField } = window.VixelField;
  const Scene = window.VixelScene;
  const Camera = window.VixelCamera;
  const Controls = window.VixelControls;

  let renderer, scene, camera, field;
  let canvasEl, world;
  let spin = { x: 0.0, y: 0.0, z: 0.0 };
  let orbit = { enabled: true, dragging: false, lastX: 0, lastY: 0, phi: Math.PI / 4, theta: Math.PI / 4 };
  let camRadius = { value: 10.0 }; // Use object to allow mutation from zoom handlers
  let stats = null;
  let statsFps = null;
  let statsMs = null;
  let statsMb = null;
  let statsContainer = null;

  function setupThree() {
    canvasEl = document.getElementById('stage');
    const sceneData = Scene.setupScene(canvasEl);
    if (!sceneData) return;
    
    renderer = sceneData.renderer;
    scene = sceneData.scene;
    world = sceneData.world;

    camera = Camera.createCamera(canvasEl, orbit);
    
    // Bind updateCameraPosition with current scope
    const updateCam = () => Camera.updateCameraPosition(camera, camRadius.value, orbit, true);
    updateCam();

    field = new VectorField(scene, renderer);
    world.add(field.getObject3D());
    const trailsObj = field.getTrailsObject3D && field.getTrailsObject3D();
    if (trailsObj) world.add(trailsObj);
    if (field.edgeLines) world.add(field.edgeLines);

    Scene.initialRender(renderer, scene, camera);
    
    // Setup camera controls with bound update function
    Camera.setupOrbitControls(canvasEl, camera, orbit, camRadius.value, updateCam);
    Camera.setupZoom(canvasEl, camera, camRadius, orbit, updateCam);
  }

  function resize() {
    Scene.resize(renderer, camera, canvasEl);
  }

  function setupControls() {
    Controls.setupControls(field, world, spin, orbit);
  }

  function animate() {
    requestAnimationFrame(animate);
    
    try {
      if (stats) stats.begin();
      if (statsFps) statsFps.begin();
      if (statsMs) statsMs.begin();
      if (statsMb) statsMb.begin();
      
      // Safety check: ensure scene is initialized
      if (!scene || !camera || !renderer || !field) {
        if (stats) stats.end();
        if (statsFps) statsFps.end();
        if (statsMs) statsMs.end();
        if (statsMb) statsMb.end();
        return;
      }
      
      const dt = 1 / 60;
      
      // Check if track panel is collapsed - if so, use gray/zero bands
      const trackPanel = document.getElementById('trackInfoPanel');
      const isTrackCollapsed = !trackPanel || !trackPanel.classList.contains('active');
      
      let bands, kick;
      if (isTrackCollapsed) {
        // Gray out visualization when collapsed
        bands = new Array(8).fill(0);
        kick = 0;
      } else {
        bands = window.VixelAudio ? window.VixelAudio.getBands() : new Array(8).fill(0);
        kick = window.VixelAudio ? window.VixelAudio.getKick() : 0;
      }
      
      // Update field before trail rendering to ensure geometry is ready
      if (field && typeof field.update === 'function') {
        field.update(bands, kick);
        if (typeof field.beginTrails === 'function') {
          field.beginTrails();
        }
      }

      // Update video texture if active
      if (window.VixelVideoTexture && window.VixelVideoTexture.update) {
        window.VixelVideoTexture.update();
      }
      
      // Update video frame display if active
      if (window.VixelVideoControls && window.VixelVideoControls.updateFrameDisplay) {
        window.VixelVideoControls.updateFrameDisplay();
      }

      // Auto spin
      if (spin.x || spin.y || spin.z) {
        world.rotation.x += spin.x * dt;
        world.rotation.y += spin.y * dt;
        world.rotation.z += spin.z * dt;
      }

      // Update camera position display
      if (Controls && typeof Controls.updateCameraPositionDisplay === 'function') {
        Controls.updateCameraPositionDisplay(camera);
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
      
      if (stats) stats.end();
      if (statsFps) statsFps.end();
      if (statsMs) statsMs.end();
      if (statsMb) statsMb.end();
    } catch (error) {
      // Error boundary will handle this, but ensure stats cleanup
      if (stats) stats.end();
      if (statsFps) statsFps.end();
      if (statsMs) statsMs.end();
      if (statsMb) statsMb.end();
      
      if (window.VixelErrorBoundary) {
        window.VixelErrorBoundary.handleError(error, { context: 'animation loop' }, 'error');
      } else {
        console.error('[Animation] Error:', error);
      }
    }
  }

  function createCustomStatsDisplay() {
    if (typeof Stats === 'undefined') return;

    // Find the stats container in the left panel
    const statsContainerEl = document.getElementById('vixel-stats-container');
    if (!statsContainerEl) return;

    // Create container
    statsContainer = document.createElement('div');
    statsContainer.id = 'vixel-stats';
    // No inline styles needed - CSS handles layout with !important flags
    
    // Add "PERFORMANCE" title inside the bubble
    const titleEl = document.createElement('div');
    titleEl.className = 'stats-title';
    titleEl.textContent = 'PERFORMANCE';
    statsContainer.appendChild(titleEl);

    // Create three Stats instances, one for each panel
    statsFps = new Stats();
    statsFps.showPanel(0); // FPS panel
    statsFps.dom.style.position = 'relative';
    statsFps.dom.style.margin = '0';
    statsFps.dom.style.pointerEvents = 'none'; // Disable click-to-cycle since we show all panels
    statsFps.dom.style.cursor = 'default'; // Remove pointer cursor
    
    statsMs = new Stats();
    statsMs.showPanel(1); // MS panel
    statsMs.dom.style.position = 'relative';
    statsMs.dom.style.margin = '0';
    statsMs.dom.style.pointerEvents = 'none'; // Disable click-to-cycle since we show all panels
    statsMs.dom.style.cursor = 'default'; // Remove pointer cursor
    
    statsMb = new Stats();
    statsMb.showPanel(2); // MB panel
    statsMb.dom.style.position = 'relative';
    statsMb.dom.style.margin = '0';
    statsMb.dom.style.pointerEvents = 'none'; // Disable click-to-cycle since we show all panels
    statsMb.dom.style.cursor = 'default'; // Remove pointer cursor

    // Wrap each stat with a label and container
    const createStatWrapper = (statDom, label) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'stat-item';
      const labelEl = document.createElement('div');
      labelEl.className = 'stat-label';
      labelEl.textContent = label;
      wrapper.appendChild(labelEl);
      wrapper.appendChild(statDom);
      return wrapper;
    };
    
    // Create a row container for the three stats
    const statsRow = document.createElement('div');
    statsRow.className = 'stats-row';
    statsRow.appendChild(createStatWrapper(statsFps.dom, 'Framerate'));
    statsRow.appendChild(createStatWrapper(statsMs.dom, 'Latency'));
    statsRow.appendChild(createStatWrapper(statsMb.dom, 'Memory'));
    
    statsContainer.appendChild(statsRow);
    
    // Append to the right panel container
    statsContainerEl.appendChild(statsContainer);
  }

  // No longer needed - Stats.js handles its own rendering

  window.toggleStatsDisplay = function(show) {
    if (statsContainer) {
      // Stats are always visible in the right panel, but this function
      // is kept for compatibility with modal/show-hide scenarios
      statsContainer.style.display = show ? 'flex' : 'none';
    }
  };

  function init() {
    // Immediately ensure loading overlay is hidden
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
    
    // Initialize error boundary first
    if (window.VixelErrorBoundary) {
      window.VixelErrorBoundary.init();
    }

    // Wait for Three.js to be loaded before initializing
    if (typeof THREE === 'undefined' || !window.__three_ready) {
      window.__three_initCallback = init;
      return;
    }

    // Initialize keyboard navigation (after Three.js check)
    if (window.VixelKeyboard) {
      window.VixelKeyboard.init();
    }

    // Initialize shortcuts modal (after Three.js check)
    if (window.VixelShortcuts) {
      window.VixelShortcuts.init();
    }

    // Initialize settings (after Three.js check)
    if (window.VixelSettings) {
      window.VixelSettings.init();
    }
    
    // Setup performance monitoring with error handling
    if (typeof Stats !== 'undefined') {
      try {
        // Keep original stats for backward compatibility
        stats = new Stats();
        stats.dom.style.display = 'none';
      } catch (error) {
        if (window.VixelErrorBoundary) {
          window.VixelErrorBoundary.handleError(error, { context: 'Stats initialization' }, 'warn');
        }
      }
    }
    createCustomStatsDisplay();
    
    // Initialize audio with error handling
    if (window.VixelErrorBoundary) {
      window.VixelErrorBoundary.safeExecute(() => {
        window.VixelAudio.init();
      }, { context: 'Audio initialization' });
    } else {
      window.VixelAudio.init();
    }

    setupThree();
    setupControls();
    setupTrackToggle();
    
    // Listen for new track events to reset field
    const newTrackHandler = () => {
      if (field && field.resetForNewTrack) {
        field.resetForNewTrack();
      }
      
      // Handle video texture for video files
      if (window.VixelVideoTexture && window.VixelAudioLoader && window.VixelAudioLoader.isVideoFile) {
        const isVideo = window.VixelAudioLoader.isVideoFile();
        if (isVideo) {
          const videoEl = window.VixelAudioLoader.getMediaElement();
          if (videoEl && field) {
            const videoData = window.VixelVideoTexture.initVideoTexture(videoEl, { bounds: field.bounds });
            if (videoData && videoData.quad && scene) {
              scene.add(videoData.quad);
            }
          }
        } else {
          // Not a video - cleanup any existing video texture
          if (window.VixelVideoTexture) {
            window.VixelVideoTexture.cleanup();
          }
        }
      }
    };
    
    if (window.VixelCleanup) {
      window.VixelCleanup.addEventListener(window, 'vixelNewTrack', newTrackHandler);
    } else {
      window.addEventListener('vixelNewTrack', newTrackHandler);
    }
    
    animate();
  }

  function setupTrackToggle() {
    const trackToggleBtn = document.getElementById('trackToggleBtn');
    const rightNav = document.querySelector('.right-nav');
    
    if (!trackToggleBtn || !rightNav) return;
    
    // Sync nav controls with main controls
    function syncNavControls() {
      const trackName = document.getElementById('trackName');
      const trackNameNav = document.getElementById('trackNameNav');
      const currentTime = document.getElementById('currentTime');
      const currentTimeNav = document.getElementById('currentTimeNav');
      const duration = document.getElementById('duration');
      const durationNav = document.getElementById('durationNav');
      const timeSlider = document.getElementById('timeSlider');
      const timeSliderNav = document.getElementById('timeSliderNav');
      const playPauseBtn = document.getElementById('playPauseBtn');
      const playPauseBtnNavCenter = document.getElementById('playPauseBtnNavCenter');
      const loopBtn = document.getElementById('loopBtn');
      const loopBtnNavCenter = document.getElementById('loopBtnNavCenter');
      const playIcon = document.getElementById('playIcon');
      const playIconNavCenter = document.getElementById('playIconNavCenter');
      const pauseIcon = document.getElementById('pauseIcon');
      const pauseIconNavCenter = document.getElementById('pauseIconNavCenter');
      
      // Sync track name
      if (trackName && trackNameNav) {
        trackNameNav.textContent = trackName.textContent;
      }
      
      // Sync time displays
      if (currentTime && currentTimeNav) {
        currentTimeNav.textContent = currentTime.textContent;
      }
      if (duration && durationNav) {
        durationNav.textContent = duration.textContent;
      }
      
      // Sync slider
      if (timeSlider && timeSliderNav) {
        timeSliderNav.max = timeSlider.max;
        timeSliderNav.value = timeSlider.value;
      }
      
      // Sync play/pause state for centered nav buttons
      if (playIcon && pauseIcon) {
        const isPlaying = pauseIcon.classList.contains('hidden');
        
        if (playIconNavCenter && pauseIconNavCenter) {
          if (isPlaying) {
            playIconNavCenter.classList.remove('hidden');
            pauseIconNavCenter.classList.add('hidden');
          } else {
            playIconNavCenter.classList.add('hidden');
            pauseIconNavCenter.classList.remove('hidden');
          }
        }
      }
      
      // Sync loop state for centered nav
      if (loopBtn && loopBtnNavCenter) {
        if (loopBtn.classList.contains('active')) {
          loopBtnNavCenter.classList.add('active');
        } else {
          loopBtnNavCenter.classList.remove('active');
        }
      }
    }
    
    // Set up event listeners for nav controls
    const playPauseBtnNavCenter = document.getElementById('playPauseBtnNavCenter');
    const loopBtnNavCenter = document.getElementById('loopBtnNavCenter');
    const timeSliderNav = document.getElementById('timeSliderNav');
    const timeSlider = document.getElementById('timeSlider');
    
    if (playPauseBtnNavCenter) {
      playPauseBtnNavCenter.addEventListener('click', () => {
        const original = document.getElementById('playPauseBtn');
        if (original) original.click();
        syncNavControls();
      });
    }
    
    if (loopBtnNavCenter) {
      loopBtnNavCenter.addEventListener('click', () => {
        const original = document.getElementById('loopBtn');
        if (original) original.click();
        syncNavControls();
      });
    }
    
    if (timeSliderNav && timeSlider) {
      timeSliderNav.addEventListener('input', (e) => {
        timeSlider.value = e.target.value;
        timeSlider.dispatchEvent(new Event('input'));
        syncNavControls();
      });
      
      timeSlider.addEventListener('input', (e) => {
        timeSliderNav.value = e.target.value;
        syncNavControls();
      });
    }
    
    // Sync periodically when nav is collapsed
    let syncInterval = null;
    const observeNav = () => {
      const isCollapsed = rightNav.classList.contains('collapsed');
      if (isCollapsed) {
        syncNavControls();
        if (!syncInterval) {
          syncInterval = setInterval(syncNavControls, 100);
        }
      } else {
        if (syncInterval) {
          clearInterval(syncInterval);
          syncInterval = null;
        }
      }
    };
    
    // Toggle nav collapse
    trackToggleBtn.addEventListener('click', () => {
      const isCollapsed = rightNav.classList.contains('collapsed');
      if (isCollapsed) {
        rightNav.classList.remove('collapsed');
        trackToggleBtn.classList.remove('active');
        document.body.classList.remove('right-nav-collapsed');
      } else {
        rightNav.classList.add('collapsed');
        trackToggleBtn.classList.add('active');
        document.body.classList.add('right-nav-collapsed');
      }
      observeNav();
    });
    
    // Set initial state
    if (rightNav.classList.contains('collapsed')) {
      document.body.classList.add('right-nav-collapsed');
    }
    
    // Initial sync
    observeNav();
    
    // Also sync when main controls update
    if (timeSlider) {
      timeSlider.addEventListener('input', syncNavControls);
    }
  }

  // Expose reorient function globally
  window.reorientScene = function() {
    if (!camera) return;
    
    // Reset camera orbit to default values
    orbit.phi = Math.PI / 4;
    orbit.theta = Math.PI / 4;
    camRadius.value = 10.0;
    
    // Reset world rotation
    if (world) {
      world.rotation.x = 0;
      world.rotation.y = 0;
      world.rotation.z = 0;
    }
    
    // Reset spin values
    spin.x = 0.0;
    spin.y = 0.0;
    spin.z = 0.0;
    
    // Update spin UI sliders
    const spinX = document.getElementById('spinX');
    const spinY = document.getElementById('spinY');
    const spinZ = document.getElementById('spinZ');
    if (spinX) {
      spinX.value = 0;
      spinX.dispatchEvent(new Event('input'));
    }
    if (spinY) {
      spinY.value = 0;
      spinY.dispatchEvent(new Event('input'));
    }
    if (spinZ) {
      spinZ.value = 0;
      spinZ.dispatchEvent(new Event('input'));
    }
    
    // Update camera position
    Camera.updateCameraPosition(camera, camRadius.value, orbit, true);
  };

  window.addEventListener('resize', resize);
  window.addEventListener('load', function() {
    // Check if Three.js is already loaded, otherwise wait for callback
    if (typeof THREE !== 'undefined' && window.__three_ready) {
      init();
    } else {
      window.__three_initCallback = init;
    }
  });
})();
