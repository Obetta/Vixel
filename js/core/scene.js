// Three.js scene, renderer, world, and lighting setup

window.VixelScene = (function () {
  function setupScene(canvasEl) {
    if (!canvasEl) {
      console.error('Canvas element not found!');
      return null;
    }

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasEl, 
      antialias: true, 
      alpha: false, 
      powerPreference: 'high-performance' 
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.autoClear = false; // keep color buffer for trails fade

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f17);

    // Ensure canvas has dimensions before creating camera
    const width = canvasEl.clientWidth || 800;
    const height = canvasEl.clientHeight || 600;
    renderer.setSize(width, height, false);

    // Lighting
    const hemi = new THREE.HemisphereLight(0xaec6ff, 0x0b0f17, 0.8);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(4, -3, 7);
    scene.add(dir);

    // World group for rotating objects
    const world = new THREE.Group();
    scene.add(world);

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

    return { renderer, scene, world };
  }

  function resize(renderer, camera, canvasEl) {
    if (!canvasEl) return;
    const w = canvasEl.clientWidth || window.innerWidth;
    const h = canvasEl.clientHeight || window.innerHeight;
    if (w === 0 || h === 0) {
      requestAnimationFrame(() => resize(renderer, camera, canvasEl));
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

  function initialRender(renderer, scene, camera) {
    // Initial render to show the scene immediately
    renderer.autoClearColor = true;
    renderer.clear();
    renderer.render(scene, camera);
    renderer.autoClearColor = false; // restore for trails
  }

  return {
    setupScene,
    resize,
    initialRender
  };
})();

