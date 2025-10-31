// Camera setup and orbit controls

window.VixelCamera = (function () {
  const DEBUG = window.DEBUG || false;
  function createCamera(canvasEl, orbit) {
    const width = canvasEl.clientWidth || 800;
    const height = canvasEl.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(55, width / height || 1, 0.1, 100);
    // Isometric view with Z up
    camera.up.set(0, 0, 1);
    return camera;
  }

  function updateCameraPosition(camera, camRadius, orbit, suppressLog = false) {
    if (!camera) {
      console.warn('[Camera] updateCameraPosition called but camera is not defined');
      return;
    }
    const x = camRadius * Math.sin(orbit.phi) * Math.cos(orbit.theta);
    const y = camRadius * Math.sin(orbit.phi) * Math.sin(orbit.theta);
    const z = camRadius * Math.cos(orbit.phi);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    if (!suppressLog && DEBUG) {
      console.log('[Camera] Position updated:', {
        x: x.toFixed(2),
        y: y.toFixed(2),
        z: z.toFixed(2),
        radius: camRadius.toFixed(2),
        phi: (orbit.phi * 180 / Math.PI).toFixed(1) + '°',
        theta: (orbit.theta * 180 / Math.PI).toFixed(1) + '°'
      });
    }
  }

  function setupOrbitControls(canvasEl, camera, orbit, camRadius, updateCameraPositionFn) {
    if (!canvasEl) {
      console.error('[Orbit] Canvas element not found for mouse orbit');
      return;
    }

    if (DEBUG) console.log('[Orbit] Setting up orbit controls on canvas');
    
    const pointerDownHandler = (e) => {
      if (DEBUG) {
        console.log('[Orbit] Pointer down:', { 
          cameraExists: !!camera, 
          x: e.clientX, 
          y: e.clientY 
        });
      }
      if (!camera) {
        console.error('[Orbit] Camera not available!');
        return;
      }
      e.preventDefault();
      orbit.dragging = true; 
      orbit.lastX = e.clientX;
      orbit.lastY = e.clientY;
      canvasEl.style.cursor = 'grabbing';
      if (DEBUG) console.log('[Orbit] Drag started');
    };

    const pointerMoveHandler = (e) => {
      if (!orbit.dragging) return;
      if (!camera) {
        console.error('[Orbit] Camera not available during move!');
        return;
      }
      e.preventDefault();
      const dx = (e.clientX - orbit.lastX) * 0.005; // horizontal rotation (theta)
      const dy = (e.clientY - orbit.lastY) * 0.005; // vertical rotation (phi)
      orbit.lastX = e.clientX; 
      orbit.lastY = e.clientY;
      
      orbit.theta -= dx; // rotate around Z-axis
      orbit.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbit.phi - dy)); // clamp vertical angle
      
      // Only log every 10th move to reduce verbosity
      if (DEBUG) {
        if (!orbit._moveLogCounter) orbit._moveLogCounter = 0;
        orbit._moveLogCounter++;
        if (orbit._moveLogCounter % 10 === 0) {
          console.log('[Orbit] Move:', {
            dx: dx.toFixed(4),
            dy: dy.toFixed(4),
            theta: (orbit.theta * 180 / Math.PI).toFixed(1) + '°',
            phi: (orbit.phi * 180 / Math.PI).toFixed(1) + '°'
          });
        }
      }
      
      updateCameraPositionFn(true); // Suppress logging during dragging
    };

    const pointerUpHandler = (e) => { 
      if (orbit.dragging && DEBUG) {
        console.log('[Orbit] Pointer up - drag ended');
      }
      orbit.dragging = false; 
      if (canvasEl) canvasEl.style.cursor = 'grab';
    };

    if (window.VixelCleanup) {
      window.VixelCleanup.addEventListener(canvasEl, 'pointerdown', pointerDownHandler);
      window.VixelCleanup.addEventListener(window, 'pointermove', pointerMoveHandler);
      window.VixelCleanup.addEventListener(window, 'pointerup', pointerUpHandler);
    } else {
      canvasEl.addEventListener('pointerdown', pointerDownHandler);
      window.addEventListener('pointermove', pointerMoveHandler);
      window.addEventListener('pointerup', pointerUpHandler);
    }

    if (DEBUG) console.log('[Orbit] Event listeners attached');
  }

  function setupZoom(canvasEl, camera, camRadiusObj, orbit, updateCameraPositionFn) {
    const applyZoom = (delta, source = 'unknown') => {
      if (DEBUG) {
        console.log('[Zoom] Zoom event:', { delta, source, cameraExists: !!camera, currentRadius: camRadiusObj.value });
      }
      if (!camera) {
        console.error('[Zoom] Camera not available!');
        return;
      }
      const oldRadius = camRadiusObj.value;
      camRadiusObj.value = Math.max(3, Math.min(40, camRadiusObj.value * (1 + delta)));
      if (DEBUG) {
        console.log('[Zoom] Radius changed:', { old: oldRadius.toFixed(2), new: camRadiusObj.value.toFixed(2), delta });
      }
      updateCameraPositionFn(false);
      return camRadiusObj.value;
    };

    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    
    if (zoomIn) {
      zoomIn.addEventListener('click', () => {
        if (DEBUG) console.log('[Zoom] Zoom In button clicked');
        return applyZoom(-0.1, 'zoomInButton');
      });
    } else {
      if (DEBUG) console.warn('[Zoom] zoomIn button not found');
    }
    
    if (zoomOut) {
      zoomOut.addEventListener('click', () => {
        if (DEBUG) console.log('[Zoom] Zoom Out button clicked');
        applyZoom(0.1, 'zoomOutButton');
      });
    } else {
      if (DEBUG) console.warn('[Zoom] zoomOut button not found');
    }

    if (canvasEl) {
      canvasEl.addEventListener('wheel', (e) => { 
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.1 : -0.1;
        if (DEBUG) {
          console.log('[Zoom] Mouse wheel:', { deltaY: e.deltaY, calculatedDelta: delta });
        }
        applyZoom(delta, 'mouseWheel'); 
      }, { passive: false });
      if (DEBUG) console.log('[Zoom] Wheel event listener attached to canvas');
    } else {
      if (DEBUG) console.error('[Zoom] Canvas element not found for wheel event');
    }
  }

  return {
    createCamera,
    updateCameraPosition,
    setupOrbitControls,
    setupZoom
  };
})();

