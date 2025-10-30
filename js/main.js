// App entry: Three.js setup, controls wiring, render loop

(function () {
  const { VectorField } = window.VixelField;

  let renderer, scene, camera, field;
  let canvasEl, world;
  let spin = { x: 0.0, y: 0.0, z: 0.0 };
  let orbit = { enabled: true, dragging: false, lastX: 0, lastY: 0, velX: 0, velY: 0, damp: 0.92 };
  let camRadius = 10.0;

  function setupThree() {
    canvasEl = document.getElementById('stage');
    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.autoClear = false; // keep color buffer for trails fade
    resize();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f17);

    camera = new THREE.PerspectiveCamera(55, canvasEl.clientWidth / canvasEl.clientHeight, 0.1, 100);
    camera.position.set(0, -7.2, 6.4);
    camera.lookAt(0, 0, 0);
    camRadius = camera.position.length();

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

    // Perpendicular plane (YZ), hidden by default
    const grid2 = new THREE.GridHelper(18, 24, 0x324155, 0x243041);
    grid2.material.transparent = true;
    grid2.material.opacity = 0.25;
    grid2.rotation.z = Math.PI / 2; // YZ plane at x=0
    grid2.position.x = 0;
    grid2.name = 'vixel-grid-plane-2';
    grid2.visible = false;
    world.add(grid2);
  }

  function resize() {
    const w = canvasEl?.clientWidth || window.innerWidth;
    const h = canvasEl?.clientHeight || window.innerHeight;
    renderer?.setSize(w, h, false);
    if (camera) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  // Band visibility removed; particles are colored by originating band automatically

  function setupControls() {
    const density = document.getElementById('density');
    const oneByOne = document.getElementById('oneByOne');
    const spawnRate = document.getElementById('spawnRate');
    const osc = document.getElementById('osc');
    const trails = document.getElementById('trails');
    const preset = document.getElementById('colorPreset');
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

    if (density) density.addEventListener('input', () => field.setDensity(Number(density.value)));
    if (oneByOne) oneByOne.addEventListener('change', () => field.setOneByOne(oneByOne.checked));
    if (spawnRate) spawnRate.addEventListener('input', () => field.setSpawnRate(Number(spawnRate.value)));
    if (osc) osc.addEventListener('input', () => field.setOscillation(Number(osc.value)));
    if (trails) trails.addEventListener('input', () => field.setTrailStrength(Number(trails.value)));
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
    if (spinX) spinX.addEventListener('input', () => { spin.x = Number(spinX.value) * 0.5; });
    if (spinY) spinY.addEventListener('input', () => { spin.y = Number(spinY.value) * 0.5; });
    if (spinZ) spinZ.addEventListener('input', () => { spin.z = Number(spinZ.value) * 0.5; });
    const applyZoom = (delta) => {
      camRadius = Math.max(3, Math.min(40, camRadius * (1 + delta)));
      const dir = camera.position.clone().normalize();
      camera.position.copy(dir.multiplyScalar(camRadius));
      camera.updateProjectionMatrix();
    };
    if (zoomIn) zoomIn.addEventListener('click', () => applyZoom(-0.1));
    if (zoomOut) zoomOut.addEventListener('click', () => applyZoom(0.1));
    canvasEl.addEventListener('wheel', (e) => { e.preventDefault(); applyZoom(e.deltaY > 0 ? 0.1 : -0.1); }, { passive: false });

    // Initialize defaults
    if (density) field.setDensity(Number(density.value));
    if (oneByOne) field.setOneByOne(oneByOne.checked);
    if (spawnRate) field.setSpawnRate(Number(spawnRate.value));
    if (osc) field.setOscillation(Number(osc.value));
    if (trails) field.setTrailStrength(Number(trails.value));
    if (preset) field.setColorPreset(preset.value);
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

    // Mouse orbit events
    canvasEl.addEventListener('pointerdown', (e) => {
      if (!orbit.enabled) return;
      orbit.dragging = true; orbit.lastX = e.clientX; orbit.lastY = e.clientY;
    });
    window.addEventListener('pointermove', (e) => {
      if (!orbit.dragging || !orbit.enabled) return;
      const dx = e.clientX - orbit.lastX; const dy = e.clientY - orbit.lastY;
      orbit.lastX = e.clientX; orbit.lastY = e.clientY;
      orbit.velY += dx * 0.002; // yaw
      orbit.velX += dy * 0.002; // pitch
    });
    window.addEventListener('pointerup', () => { orbit.dragging = false; });
  }

  function animate() {
    requestAnimationFrame(animate);
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

    // Mouse momentum
    if (orbit.enabled) {
      world.rotation.x += orbit.velX;
      world.rotation.y += orbit.velY;
      orbit.velX *= orbit.damp;
      orbit.velY *= orbit.damp;
    }

    renderer.render(scene, camera);
  }

  function init() {
    window.VixelAudio.init();
    setupThree();
    setupControls();
    animate();
  }

  window.addEventListener('resize', resize);
  window.addEventListener('load', init);
})();


