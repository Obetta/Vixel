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

      // Targets for smooth transitions (UI changes ease toward these)
      this._targetOsc = this.oscIntensity;
      this._targetTrails = this.trailStrength;
      this._targetSpawnRate = 120;
      this._prevColorLerp = null;
      this._colorBlendT = 1; // 0..1 crossfade progress

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
      this.lastSpawnPos = new THREE.Vector3(0, 0, 0);
      this.active = 0; // progressive spawn count
      this.spawnRate = 120; // particles per second baseline
      this.oneByOne = true; // always on, creates graph
      this._lastBeatTime = undefined; // track BPM cadence
      this._buildInstanced();
      this.active = 0; // restart progressive reveal on density change
      this._buildTrailPass();
    }

    setDensity(n) {
      const size = clamp(Math.floor(n), 10, 100);
      if (size === this.gridSize) return;
      this.gridSize = size;
      this.count = size * size;
      // Reset properly on density change
      this.active = 0;
      this.edgeCount = 0;
      if (this.mesh) {
        // Remove from whatever parent it's in (world or scene)
        if (this.mesh.parent) {
          this.mesh.parent.remove(this.mesh);
        }
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.mesh = null;
      }
      // Rebuild edge geometry
      if (this.edgeLines) {
        // Remove from whatever parent it's in (world or scene)
        if (this.edgeLines.parent) {
          this.edgeLines.parent.remove(this.edgeLines);
        }
        this.edgeLines.geometry.dispose();
        this.edgeLines.material.dispose();
        this.edgeGeom = null;
        this.edgeLines = null;
      }
      this._buildInstanced();
    }

    setOscillation(v) { this._targetOsc = clamp(Number(v), 0, 1); }
    setTrailStrength(v) { this._targetTrails = clamp(Number(v), 0, 1); }
    setColorPreset(preset) {
      this._prevColorLerp = this.colorLerp || createColorLerp(preset);
      this.colorLerp = createColorLerp(preset);
      this._colorBlendT = 0;
    }
    getObject3D() { return this.mesh; }
    getTrailsObject3D() { return this.trailLines; }
    setTrailsVisible(v) { if (this.trailLines) this.trailLines.visible = !!v; }
    setSpawnRate(v) { this._targetSpawnRate = Math.max(1, Number(v) || 1); }
    setOneByOne(flag) { this.oneByOne = !!flag; }

    _buildInstanced() {
      const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08); // white squares
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.5, transparent: false });
      this.mesh = new THREE.InstancedMesh(geo, mat, this.count);
      this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.mesh.instanceMatrix.needsUpdate = true;
      this.mesh.castShadow = false;
      this.mesh.receiveShadow = false;
      // Don't add to scene here - let main.js add to world via getObject3D()
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
      const edgeColors = new Float32Array((cnt - 1) * 2 * 3);
      this.edgeGeom.setAttribute('color', new THREE.BufferAttribute(edgeColors, 3));
      const edgeMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85 });
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

      // Smoothly move live parameters toward targets
      const smooth = (cur, tgt, halfLifeSec) => tgt + (cur - tgt) * Math.pow(0.5, dt / halfLifeSec);
      this.oscIntensity = smooth(this.oscIntensity, this._targetOsc, 0.25);
      this.trailStrength = smooth(this.trailStrength, this._targetTrails, 0.25);
      this.spawnRate = smooth(this.spawnRate, this._targetSpawnRate, 0.35);
      if (this._prevColorLerp && this._colorBlendT < 1) {
        this._colorBlendT = Math.min(1, this._colorBlendT + dt / 0.35);
        if (this._colorBlendT >= 1) this._prevColorLerp = null;
      }

      // Compute band weights (internal gamma)
      const weights = bands.map((v) => Math.pow(v, this.gamma));
      const low = (weights[0] + weights[1] * 0.6);
      const mid = (weights[2] + weights[3] + weights[4]) / 3;
      const hi = (weights[5] + weights[6] + weights[7]) / 3;
      const energyRaw = clamp((low + mid + hi) / 3, 0, 1);
      const audioActive = !!(window.VixelAudio && window.VixelAudio.isPlaying && window.VixelAudio.isPlaying());
      const energy = audioActive ? energyRaw : 0;

      // Get beat data for audio-driven placement
      const beatData = window.VixelAudio && window.VixelAudio.getBeat ? window.VixelAudio.getBeat() : null;
      const beatEnergy = beatData ? beatData.overall : 0;

      // Progressive activation - sync to BPM cadence + beat hits
      const prevActive = Math.floor(this.active);
      let shouldSpawn = false;
      
      if (energy > 0.02) {
        if (beatData && beatData.bpm && beatData.bpm > 60) {
          // Base spawn rate follows BPM cadence (60/BPM = seconds per beat)
          const bpm = beatData.bpm;
          const beatInterval = 60.0 / bpm; // seconds between beats
          // Spawn once per beat interval (cadence)
          if (this._lastBeatTime === undefined || (t - this._lastBeatTime) >= beatInterval - 0.05) {
            shouldSpawn = true;
            this._lastBeatTime = t;
          }
          // Also spawn immediately when any beat instrument hits
          if (beatData.kick?.isHit || beatData.snare?.isHit || beatData.hihat?.isHit) {
            shouldSpawn = true;
            this._lastBeatTime = t; // reset cadence on instrument hit
          }
          if (shouldSpawn) {
            // Spawn one node per beat hit or cadence tick
            this.active = Math.min(this.count, this.active + 1);
          }
        } else {
          // Fallback: use spawnRate if BPM not detected yet
          this.active = Math.min(this.count, this.active + this.spawnRate * dt);
        }
      } else {
        // hide when idle
        this.active = Math.max(0, this.active - this.spawnRate * 1.2 * dt);
      }
      const activeCount = Math.floor(this.active);
      // Assign newly activated particles using audio analysis
      if (activeCount > prevActive) {
        for (let i = prevActive; i < activeCount; i++) {
          // Determine dominant band for color assignment
          let dom = 0, domVal = -1;
          for (let b = 0; b < 8; b++) {
            const v = weights[b];
            if (v > domVal) { domVal = v; dom = b; }
          }
          this.bandOf[i] = dom;
          // Audio-driven placement: position based on which instrument/band triggered spawn
          const half = this.bounds;
          let px, py, pz;
          
          if (beatData) {
            // Position based on which instrument hit
            if (beatData.kick?.isHit) {
              // Kick/bass: negative X (left side)
              px = mapRange(weights[0], 0, 1, -half * 0.8, -half * 0.3);
              py = mapRange(weights[1], 0, 1, -half * 0.5, half * 0.5);
              pz = mapRange(beatData.kick.level, 0, 1, -half * 0.5, half * 0.3);
            } else if (beatData.snare?.isHit) {
              // Snare: positive X (right side)
              px = mapRange(weights[3], 0, 1, half * 0.3, half * 0.8);
              py = mapRange(weights[2], 0, 1, -half * 0.5, half * 0.5);
              pz = mapRange(beatData.snare.level, 0, 1, -half * 0.3, half * 0.5);
            } else if (beatData.hihat?.isHit) {
              // Hi-hat: upper Z
              px = mapRange(weights[6] - weights[5], -1, 1, -half * 0.5, half * 0.5);
              py = mapRange(weights[7], 0, 1, -half * 0.5, half * 0.5);
              pz = mapRange(beatData.hihat.level, 0, 1, half * 0.4, half * 0.9);
            } else {
              // BPM cadence spawn (no instrument hit): use frequency analysis
              const bassX = (weights[0] + weights[1]) / 2;
              const trebleX = (weights[6] + weights[7]) / 2;
              px = mapRange(bassX - trebleX, -1, 1, -half, half);
              const midY = (weights[2] + weights[3] + weights[4]) / 3;
              py = mapRange(midY, 0, 1, -half, half);
              pz = mapRange(energy, 0, 1, -half * 0.5, half * 0.5);
            }
          } else {
            // Fallback: frequency-based placement
            px = mapRange(weights[0] - weights[7], -1, 1, -half, half);
            py = mapRange((weights[2] + weights[3] + weights[4]) / 3, 0, 1, -half, half);
            pz = mapRange(energy, 0, 1, -half, half);
          }
          // Add small noise for natural variation
          const noiseScale = 0.12;
          const pxFinal = clamp(px + (Math.random() - 0.5) * noiseScale * half, -half, half);
          const pyFinal = clamp(py + (Math.random() - 0.5) * noiseScale * half, -half, half);
          const pzFinal = clamp(pz + (Math.random() - 0.5) * noiseScale * half, -half, half);
          const j = i * 3;
          this.positions[j] = pxFinal; this.positions[j + 1] = pyFinal; this.positions[j + 2] = pzFinal;
          this.prevPositions[j] = pxFinal; this.prevPositions[j + 1] = pyFinal; this.prevPositions[j + 2] = pzFinal;
          this.velocities[j] = 0; this.velocities[j + 1] = 0; this.velocities[j + 2] = 0;
          // Add edge from previous node to this node (graph structure)
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
            // White edges
            const colArr = this.edgeGeom.attributes.color.array;
            colArr[k] = 1; colArr[k + 1] = 1; colArr[k + 2] = 1;
            colArr[k + 3] = 1; colArr[k + 4] = 1; colArr[k + 5] = 1;
            this.edgeCount = i;
            this.edgeGeom.attributes.position.needsUpdate = true;
            this.edgeGeom.attributes.color.needsUpdate = true;
          }
        }
      }

      const cnt = this.count;
      const B = this.bounds;
      for (let i = 0; i < cnt; i++) {
        const j = i * 3;
        // In one-by-one mode, freeze all active graph nodes (they don't move)
        if (this.oneByOne && i < activeCount) {
          dummy.position.set(this.positions[j], this.positions[j + 1], this.positions[j + 2]);
          // White nodes
          this.mesh.setColorAt?.(i, new THREE.Color(1, 1, 1));
          const s = audioActive ? 0.8 : 0.8;
          dummy.scale.setScalar(s);
          dummy.updateMatrix();
          this.mesh.setMatrixAt(i, dummy.matrix);
          continue; // Skip motion update for graph nodes
        }
        // For inactive or swarm mode: apply motion
        let x = this.positions[j];
        let y = this.positions[j + 1];
        let z = this.positions[j + 2];
        this.prevPositions[j] = x; this.prevPositions[j + 1] = y; this.prevPositions[j + 2] = z;

        const nx = this.perlin.noise3(x * 0.15 + t * 0.25, y * 0.12 - t * 0.22, z * 0.1);
        const ny = this.perlin.noise3(y * 0.16 - t * 0.21, z * 0.14 + t * 0.24, x * 0.11);
        const nz = this.perlin.noise3(z * 0.13 + t * 0.2, x * 0.1 - t * 0.18, y * 0.09);
        const flowBase = this.noiseAmp * this.oscIntensity;
        const flowX = (nx * 2 - 1) * flowBase * (0.2 + mid * 1.2);
        const flowY = (ny * 2 - 1) * flowBase * (0.2 + mid * 1.2);
        let flowZ = (nz * 2 - 1) * flowBase * (0.2 + mid * 1.2);
        const verticalDrift = (Math.sin(t * 0.45 + x * 0.7) + Math.cos(t * 0.37 + y * 0.9)) * 0.12 * (0.3 + mid + hi);
        flowZ += verticalDrift;

        const r = Math.max(0.0001, Math.sqrt(x * x + y * y + z * z));
        const rx = (x / r), ry = (y / r), rz = (z / r);
        const radial = (this.radialAmp * Math.sin(t * 0.6 + r * 1.6)) - 0.18 * r + kick.level * 0.9 * (0.6 + low);

        const spin = 0.6 * (0.3 + hi);
        const spinX = -y * spin * 0.02;
        const spinY = x * spin * 0.02;

        const calm = audioActive ? (0.05 + energy * 0.95) : 0.0;
        let vx = this.velocities[j] * this.drag + (flowX + rx * radial * 0.02 + spinX) * calm;
        let vy = this.velocities[j + 1] * this.drag + (flowY + ry * radial * 0.02 + spinY) * calm;
        let vz = this.velocities[j + 2] * this.drag + (flowZ + rz * radial * 0.02) * calm;

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

        // White nodes
        this.mesh.setColorAt?.(i, new THREE.Color(1, 1, 1));
        const ampLocal = clamp(low * 0.9 + mid * 0.7 + hi * 0.5, 0, 1);
        let s = audioActive ? (0.6 + ampLocal * 1.6 + kick.level * 0.8) : 0.0;
        if (i > activeCount) s = 0; // not yet spawned
        dummy.scale.setScalar(s);

        dummy.updateMatrix();
        this.mesh.setMatrixAt(i, dummy.matrix);
      }
      this.mesh.instanceMatrix.needsUpdate = true;
      this.mesh.instanceColor && (this.mesh.instanceColor.needsUpdate = true);

      // Update line segments positions (only for non-graph nodes, graph uses permanent edges)
      if (this.trailGeom && !this.oneByOne) {
        const arr = this.trailGeom.attributes.position.array;
        for (let i = activeCount; i < cnt; i++) {
          const j = i * 3;
          const k = i * 6; // two vertices per segment
          arr[k] = this.prevPositions[j];
          arr[k + 1] = this.prevPositions[j + 1];
          arr[k + 2] = this.prevPositions[j + 2];
          arr[k + 3] = this.positions[j];
          arr[k + 4] = this.positions[j + 1];
          arr[k + 5] = this.positions[j + 2];
        }
        this.trailGeom.attributes.position.needsUpdate = true;
      } else if (this.trailLines) {
        // Hide motion blur trails when in graph mode
        this.trailLines.visible = false;
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


