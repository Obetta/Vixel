// Particle field: InstancedMesh points in 3D with motion, trails and color/size modulation

window.VixelField = (function () {
  const { clamp, mapRange, Perlin, createColorLerp } = window.VixelUtils;

  class VectorField {
    constructor(scene, renderer, opts = {}) {
      this.scene = scene;
      this.renderer = renderer;
      this.clock = new THREE.Clock();
      this.perlin = Perlin(2024);
      this.oscIntensity = 0.7;
      this.trailStrength = 0.6;
      this.gamma = 1.4; // internal
      this.noiseAmp = 1.0; // internal, stronger for visible motion
      this.radialAmp = 0.6; // internal
      // bandVisibility removed; all bands contribute
      this.setColorPreset('aurora');

      this.gridSize = 40; // used to derive default count
      this.count = this.gridSize * this.gridSize; // default ~1600 particles
      this.bounds = 9.0; // cube half-extent
      this.drag = 0.94; // velocity damping
      this.positions = null;
      this.velocities = null;
      this.prevPositions = null;
      this.trailGeom = null;
      this.trailLines = null;
      this.edgeGeom = null;
      this.edgeLines = null;
      this.edgeCount = 0;
      this.active = 0; // progressive spawn count
      this.spawnRate = 120; // particles per second baseline
      this.oneByOne = false;
      this._buildInstanced();
      this.active = 0; // restart progressive reveal on density change
      this._buildTrailPass();
    }

    setDensity(n) {
      const size = clamp(Math.floor(n), 10, 100);
      if (size === this.gridSize) return;
      this.gridSize = size;
      this.count = size * size;
      if (this.mesh) {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
      }
      this._buildInstanced();
    }

    setOscillation(v) { this.oscIntensity = clamp(Number(v), 0, 1); }
    setTrailStrength(v) { this.trailStrength = clamp(Number(v), 0, 1); }
    setColorPreset(preset) { this.colorLerp = createColorLerp(preset); }
    getObject3D() { return this.mesh; }
    getTrailsObject3D() { return this.trailLines; }
    setTrailsVisible(v) { if (this.trailLines) this.trailLines.visible = !!v; }
    setSpawnRate(v) { this.spawnRate = Math.max(1, Number(v) || 1); }
    setOneByOne(flag) { this.oneByOne = !!flag; }

    _buildInstanced() {
      const geo = new THREE.OctahedronGeometry(0.06, 0); // small bright point-like shape
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.25, transparent: true });
      this.mesh = new THREE.InstancedMesh(geo, mat, this.count);
      this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.mesh.instanceMatrix.needsUpdate = true;
      this.mesh.castShadow = false;
      this.mesh.receiveShadow = false;
      this.scene.add(this.mesh);
      this._initInstances();
      // Track band assignment per instance (-1 means unassigned)
      this.bandOf = new Int16Array(this.count);
      for (let i = 0; i < this.count; i++) this.bandOf[i] = -1;
    }

    _initInstances() {
      const dummy = new THREE.Object3D();
      const cnt = this.count;
      this.positions = new Float32Array(cnt * 3);
      this.velocities = new Float32Array(cnt * 3);
      this.prevPositions = new Float32Array(cnt * 3);
      // Distribute in a sphere volume
      for (let i = 0; i < cnt; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = (Math.cbrt(Math.random()) * 0.85 + 0.15) * (this.bounds * 0.6);
        const sx = r * Math.sin(phi) * Math.cos(theta);
        const sy = r * Math.sin(phi) * Math.sin(theta);
        const sz = r * Math.cos(phi);
        const j = i * 3;
        this.positions[j] = sx;
        this.positions[j + 1] = sy;
        this.positions[j + 2] = sz;
        this.prevPositions[j] = sx;
        this.prevPositions[j + 1] = sy;
        this.prevPositions[j + 2] = sz;
        this.velocities[j] = 0;
        this.velocities[j + 1] = 0;
        this.velocities[j + 2] = 0;

        dummy.position.set(sx, sy, sz);
        dummy.scale.setScalar(0); // start hidden until activated
        dummy.updateMatrix();
        this.mesh.setMatrixAt(i, dummy.matrix);
      }
      this.mesh.instanceMatrix.needsUpdate = true;

      // Build line segments for trails (prev -> current)
      this.trailGeom = new THREE.BufferGeometry();
      const linePositions = new Float32Array(cnt * 2 * 3);
      this.trailGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      const trailMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
      this.trailLines = new THREE.LineSegments(this.trailGeom, trailMat);
      this.trailLines.visible = true;

      // Permanent edges (node graph): connect sequentially activated nodes
      this.edgeGeom = new THREE.BufferGeometry();
      // Max edges = count - 1 (prev->curr), allocate full
      const edgePos = new Float32Array((cnt - 1) * 2 * 3);
      this.edgeGeom.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
      const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
      this.edgeLines = new THREE.LineSegments(this.edgeGeom, edgeMat);
    }

    _buildTrailPass() {
      const w = this.renderer.domElement.width;
      const h = this.renderer.domElement.height;
      this.trailScene = new THREE.Scene();
      this.trailCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const geo = new THREE.PlaneGeometry(2, 2);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x0b0f17), transparent: true, opacity: 0.08, depthWrite: false, depthTest: false });
      this.fadeQuad = new THREE.Mesh(geo, mat);
      this.trailScene.add(this.fadeQuad);

      this.trailTarget = new THREE.WebGLRenderTarget(w, h, { depthBuffer: true, stencilBuffer: false });
      this.renderer.setRenderTarget(null);
    }

    _resizeTrailTarget() {
      const w = this.renderer.domElement.width;
      const h = this.renderer.domElement.height;
      if (this.trailTarget.width !== w || this.trailTarget.height !== h) {
        this.trailTarget.setSize(w, h);
      }
    }

    update(bands, kick) {
      const dt = this.clock.getDelta();
      const t = this.clock.elapsedTime;
      const dummy = new THREE.Object3D();

      // Compute band weights (internal gamma)
      const weights = bands.map((v) => Math.pow(v, this.gamma));
      const low = (weights[0] + weights[1] * 0.6);
      const mid = (weights[2] + weights[3] + weights[4]) / 3;
      const hi = (weights[5] + weights[6] + weights[7]) / 3;
      const energyRaw = clamp((low + mid + hi) / 3, 0, 1);
      const audioActive = !!(window.VixelAudio && window.VixelAudio.isPlaying && window.VixelAudio.isPlaying());
      const energy = audioActive ? energyRaw : 0;

      // Progressive activation (swarm into view)
      const prevActive = Math.floor(this.active);
      if (energy > 0.02) {
        const rate = this.oneByOne ? 1 : this.spawnRate * (0.3 + energy * 1.7);
        this.active = Math.min(this.count, this.active + rate * dt);
      } else {
        // hide when idle
        this.active = Math.max(0, this.active - this.spawnRate * 1.2 * dt);
      }
      const activeCount = Math.floor(this.active);
      // Assign newly activated particles to perimeter positions and band colors
      if (activeCount > prevActive) {
        for (let i = prevActive; i < activeCount; i++) {
          // Determine dominant visible band now
          let dom = 0, domVal = -1;
          for (let b = 0; b < 8; b++) {
            if (!this.bandVisibility[b]) continue;
            const v = weights[b];
            if (v > domVal) { domVal = v; dom = b; }
          }
          this.bandOf[i] = dom;
          // Place along perimeter of XY plane (z near 0), param based on i
          const u = (i % this.count) / this.count; // 0..1
          const L = this.bounds * 2;
          const perim = 8 * this.bounds; // conceptual perimeter units
          let px = 0, py = 0;
          const seg = Math.floor(u * 4);
          const t = (u * 4) - seg;
          const half = this.bounds;
          if (seg === 0) { px = -half + L * t; py = -half; }
          else if (seg === 1) { px = half; py = -half + L * t; }
          else if (seg === 2) { px = half - L * t; py = half; }
          else { px = -half; py = half - L * t; }
          const j = i * 3;
          const pz = 0;
          this.positions[j] = px; this.positions[j + 1] = py; this.positions[j + 2] = pz;
          this.prevPositions[j] = px; this.prevPositions[j + 1] = py; this.prevPositions[j + 2] = pz;
          this.velocities[j] = 0; this.velocities[j + 1] = 0; this.velocities[j + 2] = 0;
          // Add edge from previous node to this node
          if (i > 0) {
            const k = (i - 1) * 6; // two vertices per edge
            const pj = (i - 1) * 3;
            const posArr = this.edgeGeom.attributes.position.array;
            posArr[k] = this.positions[pj];
            posArr[k + 1] = this.positions[pj + 1];
            posArr[k + 2] = this.positions[pj + 2];
            posArr[k + 3] = this.positions[j];
            posArr[k + 4] = this.positions[j + 1];
            posArr[k + 5] = this.positions[j + 2];
            this.edgeCount = i; // last written edge index
            this.edgeGeom.attributes.position.needsUpdate = true;
          }
        }
      }

      const cnt = this.count;
      const B = this.bounds;
      for (let i = 0; i < cnt; i++) {
        const j = i * 3;
        let x = this.positions[j];
        let y = this.positions[j + 1];
        let z = this.positions[j + 2];
        // Store previous
        this.prevPositions[j] = x; this.prevPositions[j + 1] = y; this.prevPositions[j + 2] = z;

        // Noise flow field (curl-like approximation via gradients)
        const nx = this.perlin.noise3(x * 0.15 + t * 0.25, y * 0.12 - t * 0.22, z * 0.1);
        const ny = this.perlin.noise3(y * 0.16 - t * 0.21, z * 0.14 + t * 0.24, x * 0.11);
        const nz = this.perlin.noise3(z * 0.13 + t * 0.2, x * 0.1 - t * 0.18, y * 0.09);
        const flowBase = this.noiseAmp * this.oscIntensity;
        const flowX = (nx * 2 - 1) * flowBase * (0.2 + mid * 1.2);
        const flowY = (ny * 2 - 1) * flowBase * (0.2 + mid * 1.2);
        let flowZ = (nz * 2 - 1) * flowBase * (0.2 + mid * 1.2);
        // Add explicit vertical drift so particles do not collapse to z≈0
        const verticalDrift = (Math.sin(t * 0.45 + x * 0.7) + Math.cos(t * 0.37 + y * 0.9)) * 0.12 * (0.3 + mid + hi);
        flowZ += verticalDrift;

        // Radial push/pull + kick pulse + mild centering so particles don't live on walls
        const r = Math.max(0.0001, Math.sqrt(x * x + y * y + z * z));
        const rx = (x / r), ry = (y / r), rz = (z / r);
        // Oscillatory radial (in/out) around 0 plus small center spring (-k*r)
        const radial = (this.radialAmp * Math.sin(t * 0.6 + r * 1.6)) - 0.18 * r + kick.level * 0.9 * (0.6 + low);

        // High-frequency spin around Y axis (gives arcs)
        const spin = 0.6 * (0.3 + hi);
        const spinX = -y * spin * 0.02;
        const spinY = x * spin * 0.02;

        // Integrate velocity, scaled by energy so idle is calm/near-still
        // Freeze nodes when one-by-one mode is enabled to create a graph
        const calm = (this.oneByOne ? 0.0 : (audioActive ? (0.05 + energy * 0.95) : 0.0));
        let vx = this.velocities[j] * this.drag + (flowX + rx * radial * 0.02 + spinX) * calm;
        let vy = this.velocities[j + 1] * this.drag + (flowY + ry * radial * 0.02 + spinY) * calm;
        let vz = this.velocities[j + 2] * this.drag + (flowZ + rz * radial * 0.02) * calm;

        // Integrate position then reflect at bounds (prevents teleport streaks)
        x = x + vx;
        y = y + vy;
        z = z + vz;
        const lim = B;
        if (x > lim) { x = lim; vx *= -0.6; }
        if (x < -lim) { x = -lim; vx *= -0.6; }
        if (y > lim) { y = lim; vy *= -0.6; }
        if (y < -lim) { y = -lim; vy *= -0.6; }
        if (z > lim) { z = lim; vz *= -0.6; }
        if (z < -lim) { z = -lim; vz *= -0.6; }

        this.positions[j] = x; this.positions[j + 1] = y; this.positions[j + 2] = z;
        this.velocities[j] = vx; this.velocities[j + 1] = vy; this.velocities[j + 2] = vz;

        dummy.position.set(x, y, z);

        // Color/scale by amplitude at this point
        const ampLocal = clamp(low * 0.9 + mid * 0.7 + hi * 0.5, 0, 1);
        // Color: use band color if assigned, else gradient by amplitude
        let rC, gC, bC;
        const band = this.bandOf[i];
        if (band >= 0) {
          const bandColors = [
            [0.95, 0.35, 0.35], // 1
            [0.98, 0.58, 0.35], // 2
            [0.98, 0.82, 0.35], // 3
            [0.60, 0.90, 0.40], // 4
            [0.35, 0.85, 0.95], // 5
            [0.40, 0.55, 0.98], // 6
            [0.68, 0.42, 0.98], // 7
            [0.90, 0.90, 0.95]  // 8
          ];
          const c = bandColors[band]; rC = c[0]; gC = c[1]; bC = c[2];
        } else {
          const c = this.colorLerp(ampLocal); rC = c[0]; gC = c[1]; bC = c[2];
        }
        this.mesh.setColorAt?.(i, new THREE.Color(rC, gC, bC));
        let s = audioActive ? (0.6 + ampLocal * 1.6 + kick.level * 0.8) : 0.0;
        if (i > activeCount) s = 0; // not yet spawned
        dummy.scale.setScalar(s);

        dummy.updateMatrix();
        this.mesh.setMatrixAt(i, dummy.matrix);
      }
      this.mesh.instanceMatrix.needsUpdate = true;
      this.mesh.instanceColor && (this.mesh.instanceColor.needsUpdate = true);

      // Update line segments positions
      if (this.trailGeom) {
        const arr = this.trailGeom.attributes.position.array;
        for (let i = 0; i < cnt; i++) {
          const j = i * 3;
          const k = i * 6; // two vertices per segment
          // start = previous
          arr[k] = this.prevPositions[j];
          arr[k + 1] = this.prevPositions[j + 1];
          arr[k + 2] = this.prevPositions[j + 2];
          // end = current
          arr[k + 3] = this.positions[j];
          arr[k + 4] = this.positions[j + 1];
          arr[k + 5] = this.positions[j + 2];
        }
        this.trailGeom.attributes.position.needsUpdate = true;
      }
    }

    beginTrails() {
      // Fade the previous frame to create trails
      this._resizeTrailTarget();
      const prevAutoClear = this.renderer.autoClearColor;
      this.renderer.autoClearColor = false;
      const audioActive = !!(window.VixelAudio && window.VixelAudio.isPlaying && window.VixelAudio.isPlaying());
      const opacity = audioActive ? mapRange(this.trailStrength, 0, 1, 0.22, 0.05) : 0.6; // clear quickly when paused
      this.fadeQuad.material.opacity = opacity;
      this.renderer.render(this.trailScene, this.trailCamera);
      // Reset depth so current frame particles are not occluded by previous frame
      this.renderer.clearDepth();
      this.renderer.autoClearColor = prevAutoClear;
    }
  }

  return { VectorField };
})();


