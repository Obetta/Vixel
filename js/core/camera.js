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
      return;
    }
    const x = camRadius * Math.sin(orbit.phi) * Math.cos(orbit.theta);
    const y = camRadius * Math.sin(orbit.phi) * Math.sin(orbit.theta);
    const z = camRadius * Math.cos(orbit.phi);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
  }

  function setupOrbitControls(canvasEl, camera, orbit, camRadius, updateCameraPositionFn) {
    if (!canvasEl) {
      console.error('[Orbit] Canvas element not found for mouse orbit');
      return;
    }
    
    const pointerDownHandler = (e) => {
      if (!camera) {
        return;
      }
      e.preventDefault();
      orbit.dragging = true; 
      orbit.lastX = e.clientX;
      orbit.lastY = e.clientY;
      canvasEl.style.cursor = 'grabbing';
    };

    const pointerMoveHandler = (e) => {
      if (!orbit.dragging) return;
      if (!camera) {
        return;
      }
      e.preventDefault();
      const dx = (e.clientX - orbit.lastX) * 0.005; // horizontal rotation (theta)
      const dy = (e.clientY - orbit.lastY) * 0.005; // vertical rotation (phi)
      orbit.lastX = e.clientX; 
      orbit.lastY = e.clientY;
      
      orbit.theta -= dx; // rotate around Z-axis
      orbit.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbit.phi - dy)); // clamp vertical angle
      
      updateCameraPositionFn(true);
    };

    const pointerUpHandler = (e) => { 
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
  }

  function setupZoom(canvasEl, camera, camRadiusObj, orbit, updateCameraPositionFn) {
    const applyZoom = (delta, source = 'unknown') => {
      if (!camera) {
        return;
      }
      camRadiusObj.value = Math.max(3, Math.min(40, camRadiusObj.value * (1 + delta)));
      updateCameraPositionFn(false);
      return camRadiusObj.value;
    };

    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    
    if (zoomIn) {
      zoomIn.addEventListener('click', () => {
        return applyZoom(-0.1, 'zoomInButton');
      });
    }
    
    if (zoomOut) {
      zoomOut.addEventListener('click', () => {
        applyZoom(0.1, 'zoomOutButton');
      });
    }

    if (canvasEl) {
      canvasEl.addEventListener('wheel', (e) => { 
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.1 : -0.1;
        applyZoom(delta, 'mouseWheel'); 
      }, { passive: false });
    }
  }

  return {
    createCamera,
    updateCameraPosition,
    setupOrbitControls,
    setupZoom
  };
})();

