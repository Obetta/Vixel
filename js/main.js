// App entry: Three.js setup, controls wiring, render loop

(function () {
  const { VectorField } = window.VixelField;

  let renderer, scene, camera, field;
  let canvasEl, world;
  let spin = { x: 0.0, y: 0.0, z: 0.0 };
  let orbit = { enabled: true, dragging: false, lastX: 0, lastY: 0, phi: Math.PI / 4, theta: Math.PI / 4 };
  let camRadius = 10.0;

  // Helper function to update camera position from spherical coordinates
  function updateCameraPosition() {
    const x = camRadius * Math.sin(orbit.phi) * Math.cos(orbit.theta);
    const y = camRadius * Math.sin(orbit.phi) * Math.sin(orbit.theta);
    const z = camRadius * Math.cos(orbit.phi);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
  }

  function setupThree() {
    canvasEl = document.getElementById('stage');
    if (!canvasEl) {
      console.error('Canvas element not found!');
      return;
    }
    
    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.autoClear = false; // keep color buffer for trails fade
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f17);

    // Ensure canvas has dimensions before creating camera
    const width = canvasEl.clientWidth || 800;
    const height = canvasEl.clientHeight || 600;
    renderer.setSize(width, height, false);
    camera = new THREE.PerspectiveCamera(55, width / height || 1, 0.1, 100);
    // Isometric view with Z up - matching the desired screenshot
    camera.up.set(0, 0, 1);
    // Initialize camera position using spherical coordinates
    updateCameraPosition();

    const hemi = new THREE.HemisphereLight(0xaec6ff, 0x0b0f17, 0.8);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(4, -3, 7);
    scene.add(dir);

    world = new THREE.Group();
    scene.add(world);

    field = new VectorField(scene, renderer);
    // Attach field mesh to world so we can rotate independently
    world.add(field.getObject3D());
    const trailsObj = field.getTrailsObject3D && field.getTrailsObject3D();
    if (trailsObj) world.add(trailsObj);
    if (field.edgeLines) world.add(field.edgeLines);

    // Reference plane/grid and axes
    const grid = new THREE.GridHelper(18, 24, 0x324155, 0x243041);
    grid.material.transparent = true;
    grid.material.opacity = 0.35;
    grid.rotation.x = Math.PI / 2; // XY plane at z=0
    grid.position.z = 0;
    grid.name = 'vixel-grid-plane';
    world.add(grid);

    const axes = new THREE.AxesHelper(4.5);
    axes.name = 'vixel-axes-helper';
    world.add(axes);

    // Perpendicular plane (YZ), visible by default
    const grid2 = new THREE.GridHelper(18, 24, 0x324155, 0x243041);
    grid2.material.transparent = true;
    grid2.material.opacity = 0.25;
    grid2.rotation.z = Math.PI / 2; // YZ plane at x=0
    grid2.position.x = 0;
    grid2.name = 'vixel-grid-plane-2';
    grid2.visible = true;
    world.add(grid2);
    
    // Initial render to show the scene immediately
    // Since autoClear is false, we need to manually clear before first render
    renderer.autoClearColor = true;
    renderer.clear();
    renderer.render(scene, camera);
    renderer.autoClearColor = false; // restore for trails
  }

  function resize() {
    if (!canvasEl) return;
    const w = canvasEl.clientWidth || window.innerWidth;
    const h = canvasEl.clientHeight || window.innerHeight;
    if (w === 0 || h === 0) {
      // Canvas not sized yet, try again on next frame
      requestAnimationFrame(resize);
      return;
    }
    if (renderer) {
      renderer.setSize(w, h, false);
    }
    if (camera && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  // Band visibility removed; particles are colored by originating band automatically

  // Helper function to update value displays
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

  function setupControls() {
    const density = document.getElementById('density');
    const spawnRate = document.getElementById('spawnRate');
    const pathStep = document.getElementById('pathStep');
    const osc = document.getElementById('osc');
    const trails = document.getElementById('trails');
    const preset = document.getElementById('colorPreset');
    const kickSens = document.getElementById('kickSens');
    // band visibility UI removed
    const mouseOrbit = document.getElementById('mouseOrbit');
    const showPlane = document.getElementById('showPlane');
    const showPlane2 = document.getElementById('showPlane2');
    const showAxes = document.getElementById('showAxes');
    const showTrails = document.getElementById('showTrails');
    const spinX = document.getElementById('spinX');
    const spinY = document.getElementById('spinY');
    const spinZ = document.getElementById('spinZ');
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');

    if (density) {
      density.addEventListener('input', () => {
        const val = Number(density.value);
        updateValueDisplay('densityValue', val, 0);
        field.setDensity(val);
        // Re-add mesh and edges to world after density change
        if (world) {
          const mesh = field.getObject3D();
          if (mesh && !mesh.parent) {
            world.add(mesh);
          }
          if (field.edgeLines && !field.edgeLines.parent) {
            world.add(field.edgeLines);
          }
        }
      });
    }
    if (spawnRate) {
      spawnRate.addEventListener('input', () => {
        const val = Number(spawnRate.value);
        updateValueDisplay('spawnRateValue', val, 0);
        field.setSpawnRate(val);
      });
    }
    if (pathStep) {
      pathStep.addEventListener('input', () => {
        const val = Number(pathStep.value);
        updateValueDisplay('pathStepValue', val, 2);
        // Note: setPathStep not currently implemented in VectorField
      });
    }
    if (osc) {
      osc.addEventListener('input', () => {
        const val = Number(osc.value);
        updateValueDisplay('oscValue', val, 2);
        field.setOscillation(val);
      });
    }
    if (trails) {
      trails.addEventListener('input', () => {
        const val = Number(trails.value);
        updateValueDisplay('trailsValue', val, 2);
        field.setTrailStrength(val);
      });
    }
    if (kickSens) {
      kickSens.addEventListener('input', () => {
        const val = Number(kickSens.value);
        updateValueDisplay('kickSensValue', val, 2);
      });
    }
    if (preset) preset.addEventListener('change', () => field.setColorPreset(preset.value));
    if (mouseOrbit) mouseOrbit.addEventListener('change', () => { orbit.enabled = mouseOrbit.checked; });
    if (showPlane) showPlane.addEventListener('change', () => {
      const plane = world.getObjectByName('vixel-grid-plane');
      if (plane) plane.visible = showPlane.checked;
    });
    if (showTrails) showTrails.addEventListener('change', () => field.setTrailsVisible(showTrails.checked));
    if (showAxes) showAxes.addEventListener('change', () => {
      const axes = world.getObjectByName('vixel-axes-helper');
      if (axes) axes.visible = showAxes.checked;
      // UI legend mirrors the toggle
      const legend = document.querySelector('.axis-legend');
      if (legend) legend.style.display = showAxes.checked ? 'flex' : 'none';
    });
    if (showPlane2) showPlane2.addEventListener('change', () => {
      const plane2 = world.getObjectByName('vixel-grid-plane-2');
      if (plane2) plane2.visible = showPlane2.checked;
    });
    if (spinX) {
      spinX.addEventListener('input', () => {
        const val = Number(spinX.value);
        updateValueDisplay('spinXValue', val, 2);
        spin.x = val * 0.5;
      });
    }
    if (spinY) {
      spinY.addEventListener('input', () => {
        const val = Number(spinY.value);
        updateValueDisplay('spinYValue', val, 2);
        spin.y = val * 0.5;
      });
    }
    if (spinZ) {
      spinZ.addEventListener('input', () => {
        const val = Number(spinZ.value);
        updateValueDisplay('spinZValue', val, 2);
        spin.z = val * 0.5;
      });
    }
    const applyZoom = (delta) => {
      if (!camera) return;
      camRadius = Math.max(3, Math.min(40, camRadius * (1 + delta)));
      updateCameraPosition();
    };
    if (zoomIn) zoomIn.addEventListener('click', () => applyZoom(-0.1));
    if (zoomOut) zoomOut.addEventListener('click', () => applyZoom(0.1));
    if (canvasEl) {
      canvasEl.addEventListener('wheel', (e) => { 
        e.preventDefault(); 
        applyZoom(e.deltaY > 0 ? 0.1 : -0.1); 
      }, { passive: false });
    }

    // Initialize defaults and value displays
    if (density) {
      const val = Number(density.value);
      updateValueDisplay('densityValue', val, 0);
      field.setDensity(val);
    }
    if (spawnRate) {
      const val = Number(spawnRate.value);
      updateValueDisplay('spawnRateValue', val, 0);
      field.setSpawnRate(val);
    }
    if (pathStep) {
      const val = Number(pathStep.value);
      updateValueDisplay('pathStepValue', val, 2);
      // Note: setPathStep not currently implemented in VectorField
    }
    if (osc) {
      const val = Number(osc.value);
      updateValueDisplay('oscValue', val, 2);
      field.setOscillation(val);
    }
    if (trails) {
      const val = Number(trails.value);
      updateValueDisplay('trailsValue', val, 2);
      field.setTrailStrength(val);
    }
    if (kickSens) {
      const val = Number(kickSens.value);
      updateValueDisplay('kickSensValue', val, 2);
    }
    if (preset) field.setColorPreset(preset.value);
    if (spinX) {
      const val = Number(spinX.value);
      updateValueDisplay('spinXValue', val, 2);
      spin.x = val * 0.5;
    }
    if (spinY) {
      const val = Number(spinY.value);
      updateValueDisplay('spinYValue', val, 2);
      spin.y = val * 0.5;
    }
    if (spinZ) {
      const val = Number(spinZ.value);
      updateValueDisplay('spinZValue', val, 2);
      spin.z = val * 0.5;
    }
    if (showTrails) field.setTrailsVisible(showTrails.checked);
    if (showPlane) {
      const plane = world.getObjectByName('vixel-grid-plane');
      if (plane) plane.visible = showPlane.checked;
    }
    if (showPlane2) {
      const plane2 = world.getObjectByName('vixel-grid-plane-2');
      if (plane2) plane2.visible = showPlane2.checked;
    }
    if (showAxes) {
      const axes = world.getObjectByName('vixel-axes-helper');
      if (axes) axes.visible = showAxes.checked;
      const legend = document.querySelector('.axis-legend');
      if (legend) legend.style.display = showAxes.checked ? 'flex' : 'none';
    }

    // Mouse orbit events - orbit camera around origin
    if (!canvasEl) {
      console.error('Canvas element not found for mouse orbit');
    } else {
      canvasEl.addEventListener('pointerdown', (e) => {
        if (!orbit.enabled || !camera) return;
        e.preventDefault();
        orbit.dragging = true; 
        orbit.lastX = e.clientX;
        orbit.lastY = e.clientY;
        canvasEl.style.cursor = 'grabbing';
      });
      window.addEventListener('pointermove', (e) => {
        if (!orbit.dragging || !orbit.enabled || !camera) return;
        e.preventDefault();
        const dx = (e.clientX - orbit.lastX) * 0.005; // horizontal rotation (theta)
        const dy = (e.clientY - orbit.lastY) * 0.005; // vertical rotation (phi)
        orbit.lastX = e.clientX; 
        orbit.lastY = e.clientY;
        
        orbit.theta -= dx; // rotate around Z-axis
        orbit.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbit.phi - dy)); // clamp vertical angle
        
        updateCameraPosition();
      });
      window.addEventListener('pointerup', (e) => { 
        orbit.dragging = false; 
        if (canvasEl) canvasEl.style.cursor = 'grab';
      });
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    
    // Safety check: ensure scene is initialized
    if (!scene || !camera || !renderer || !field) return;
    
    const dt = 1 / 60;
    const bands = window.VixelAudio.getBands();
    const kick = window.VixelAudio.getKick();
    field.beginTrails();
    field.update(bands, kick);

    // Auto spin
    if (spin.x || spin.y || spin.z) {
      world.rotation.x += spin.x * dt;
      world.rotation.y += spin.y * dt;
      world.rotation.z += spin.z * dt;
    }

    // Camera orbit is handled in real-time in pointermove, no momentum needed

    // Update camera position display
    if (camera) {
      const pos = camera.position;
      const posDisplay = document.getElementById('cameraPosition');
      if (posDisplay) {
        posDisplay.textContent = `X: ${pos.x.toFixed(2)}, Y: ${pos.y.toFixed(2)}, Z: ${pos.z.toFixed(2)}`;
      }
    }

    renderer.render(scene, camera);
  }

  function init() {
    // Wait for Three.js to be loaded before initializing
    if (typeof THREE === 'undefined' || !window.__three_ready) {
      window.__three_initCallback = init;
      return;
    }
    
    window.VixelAudio.init();
    setupThree();
    setupControls();
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


