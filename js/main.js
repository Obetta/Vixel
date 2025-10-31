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
      const bands = window.VixelAudio ? window.VixelAudio.getBands() : new Array(8).fill(0);
      const kick = window.VixelAudio ? window.VixelAudio.getKick() : 0;
      
      // Update field before trail rendering to ensure geometry is ready
      if (field && typeof field.update === 'function') {
        field.update(bands, kick);
        if (typeof field.beginTrails === 'function') {
          field.beginTrails();
        }
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

    // Create container
    statsContainer = document.createElement('div');
    statsContainer.id = 'vixel-stats';
    statsContainer.style.cssText = `
      position: fixed;
      top: 56px;
      right: 326px;
      z-index: 10000;
      display: none;
      flex-direction: column;
      gap: 2px;
    `;

    // Create three Stats instances, one for each panel
    statsFps = new Stats();
    statsFps.showPanel(0); // FPS panel
    statsFps.dom.style.position = 'relative';
    statsFps.dom.style.margin = '0';
    
    statsMs = new Stats();
    statsMs.showPanel(1); // MS panel
    statsMs.dom.style.position = 'relative';
    statsMs.dom.style.margin = '0';
    
    statsMb = new Stats();
    statsMb.showPanel(2); // MB panel
    statsMb.dom.style.position = 'relative';
    statsMb.dom.style.margin = '0';

    // Append all three Stats widgets to container
    statsContainer.appendChild(statsFps.dom);
    statsContainer.appendChild(statsMs.dom);
    statsContainer.appendChild(statsMb.dom);
    
    document.body.appendChild(statsContainer);
  }

  // No longer needed - Stats.js handles its own rendering

  window.toggleStatsDisplay = function(show) {
    if (statsContainer) {
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
    
    // Listen for new track events to reset field
    const newTrackHandler = () => {
      if (field && field.resetForNewTrack) {
        field.resetForNewTrack();
      }
    };
    
    if (window.VixelCleanup) {
      window.VixelCleanup.addEventListener(window, 'vixelNewTrack', newTrackHandler);
    } else {
      window.addEventListener('vixelNewTrack', newTrackHandler);
    }
    
    animate();
  }

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
