// Particle field: Main orchestrator combining geometry, spawning, placement, motion, and trails

window.VixelField = (function () {
  const { clamp, mapRange, Perlin, createColorLerp } = window.VixelUtils;
  const Geometry = window.VixelParticlesGeometry;
  const Spawning = window.VixelParticlesSpawning;
  const Placement = window.VixelParticlesPlacement;
  const Motion = window.VixelParticlesMotion;
  const Trails = window.VixelParticlesTrails;

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
      this.spawnTimes = null;
      this.trailGeom = null;
      this.trailLines = null;
      this.edgeGeom = null;
      this.edgeLines = null;
      this.edgeCount = 0;
      this.active = 0; // progressive spawn count
      this.spawnRate = 120; // particles per second baseline
      this.nodeLifetime = 15; // How long before nodes fade (seconds)
      this.oneByOne = false; // SWARM MODE - particles move and flow
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
        if (this.mesh.parent) {
          this.mesh.parent.remove(this.mesh);
        }
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.mesh = null;
      }
      // Rebuild edge geometry
      if (this.edgeLines) {
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
    setTrailThickness(v) { 
      const thickness = Math.max(1, Math.min(10, Number(v) || 2));
      if (this.trailLines && this.trailLines.material) {
        this.trailLines.material.linewidth = thickness;
      }
    }
    setColorPreset(preset) {
      this._prevColorLerp = this.colorLerp || createColorLerp(preset);
      this.colorLerp = createColorLerp(preset);
      this._colorBlendT = 0;
    }
    resetForNewTrack() {
      this.active = 0;
      this.edgeCount = 0;
      this._lastBeatTime = undefined;
      this.clock = new THREE.Clock();
      if (this.spawnTimes) {
        for (let i = 0; i < this.count; i++) {
          this.spawnTimes[i] = -1;
        }
      }
      // Re-initialize positions to random sphere distribution
      const dummy = new THREE.Object3D();
      for (let i = 0; i < this.count; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = (Math.cbrt(Math.random()) * 0.85 + 0.15) * (this.bounds * 0.6);
        const j = i * 3;
        this.positions[j] = r * Math.sin(phi) * Math.cos(theta);
        this.positions[j + 1] = r * Math.sin(phi) * Math.sin(theta);
        this.positions[j + 2] = r * Math.cos(phi);
        this.prevPositions[j] = this.positions[j];
        this.prevPositions[j + 1] = this.positions[j + 1];
        this.prevPositions[j + 2] = this.positions[j + 2];
        this.velocities[j] = 0;
        this.velocities[j + 1] = 0;
        this.velocities[j + 2] = 0;
      }
    }
    getObject3D() { return this.mesh; }
    getTrailsObject3D() { return this.trailLines; }
    setTrailsVisible(v) { if (this.trailLines) this.trailLines.visible = !!v; }
    setSpawnRate(v) { this._targetSpawnRate = Math.max(1, Number(v) || 1); }
    setOneByOne(flag) { this.oneByOne = !!flag; }

    _buildInstanced() {
      this.mesh = Geometry.buildInstancedMesh(this.count);
      const buffers = Geometry.initializePositions(this.mesh, this.count, this.bounds);
      this.positions = buffers.positions;
      this.velocities = buffers.velocities;
      this.prevPositions = buffers.prevPositions;
      this.spawnTimes = buffers.spawnTimes;
      
      // Track band assignment per instance (-1 means unassigned)
      this.bandOf = new Int16Array(this.count);
      for (let i = 0; i < this.count; i++) this.bandOf[i] = -1;
      
      // Build trail and edge geometries
      const trailData = Geometry.buildTrailGeometry(this.count);
      this.trailGeom = trailData.trailGeom;
      this.trailLines = trailData.trailLines;
      
      const edgeData = Geometry.buildEdgeGeometry(this.count);
      this.edgeGeom = edgeData.edgeGeom;
      this.edgeLines = edgeData.edgeLines;
    }

    _buildTrailPass() {
      const trailData = Trails.buildTrailPass(this.renderer);
      this.trailScene = trailData.trailScene;
      this.trailCamera = trailData.trailCamera;
      this.fadeQuad = trailData.fadeQuad;
      this.trailTarget = trailData.trailTarget;
      this.trailScene.userData.trailTarget = trailData.trailTarget; // Store for resize
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

      // Check if audio is active
      const audioActive = !!(window.VixelAudio && window.VixelAudio.isPlaying && window.VixelAudio.isPlaying());

      // Compute band weights (internal gamma)
      const weights = bands.map((v) => Math.pow(v, this.gamma));
      const low = (weights[0] + weights[1] * 0.6);
      const mid = (weights[2] + weights[3] + weights[4]) / 3;
      const hi = (weights[5] + weights[6] + weights[7]) / 3;
      const energyRaw = clamp((low + mid + hi) / 3, 0, 1);
      const energy = audioActive ? energyRaw : 0;

      // Get beat data and pre-scanned data
      const beatData = window.VixelAudio && window.VixelAudio.getBeat ? window.VixelAudio.getBeat() : null;
      const preScanData = window.VixelAudio && window.VixelAudio.getPreScanData ? window.VixelAudio.getPreScanData() : null;

      // Progressive activation - sync to BPM cadence + beat hits
      const prevActive = Math.floor(this.active);
      
      // In swarm mode, instantiate all particles when audio is playing
      if (!this.oneByOne) {
        this.active = audioActive ? this.count : 0;
      } else {
        const activeUpdate = Spawning.updateActiveCount(energy, beatData, t, this.active, this.spawnRate, dt, this.count, this._lastBeatTime);
        this.active = activeUpdate.active;
        this._lastBeatTime = activeUpdate.lastBeatTime;
      }
      const activeCount = Math.floor(this.active);

      // In swarm mode, just record spawn times; skip placement (use random initial positions)
      if (!this.oneByOne && activeCount > prevActive) {
        for (let i = prevActive; i < activeCount; i++) {
          if (this.spawnTimes) {
            this.spawnTimes[i] = t;
          }
        }
      }
      
      // Assign newly activated particles using audio analysis (graph mode only)
      if (this.oneByOne && activeCount > prevActive) {
        for (let i = prevActive; i < activeCount; i++) {
          // Record spawn time
          if (this.spawnTimes) {
            this.spawnTimes[i] = t;
          }
          
          // Determine dominant band for color assignment
          this.bandOf[i] = Spawning.assignBand(weights);
          
          // Calculate position based on audio
          const pos = Placement.calculatePosition(i, this.count, weights, energy, beatData, preScanData, this.bounds);
          const j = i * 3;
          this.positions[j] = pos.x;
          this.positions[j + 1] = pos.y;
          this.positions[j + 2] = pos.z;
          this.prevPositions[j] = pos.x;
          this.prevPositions[j + 1] = pos.y;
          this.prevPositions[j + 2] = pos.z;
          this.velocities[j] = 0;
          this.velocities[j + 1] = 0;
          this.velocities[j + 2] = 0;
          
          // Add edge from previous node to this node (graph structure)
          if (i > 0) {
            Trails.updateEdgeGeometry(this.edgeGeom, this.positions, i, this.bounds);
            this.edgeCount = i;
          }
        }
      }

      // Update particle motion and rendering
      for (let i = 0; i < this.count; i++) {
        const j = i * 3;
        
        // In one-by-one mode, freeze all active graph nodes (they don't move)
        if (this.oneByOne && i < activeCount) {
          dummy.position.set(this.positions[j], this.positions[j + 1], this.positions[j + 2]);
          this.mesh.setColorAt?.(i, new THREE.Color(1, 1, 1));
          
          const s = Motion.calculateScale(i, activeCount, this.spawnTimes, t, this.nodeLifetime, weights, kick, audioActive, energy, true);
          dummy.scale.setScalar(s);
          dummy.updateMatrix();
          this.mesh.setMatrixAt(i, dummy.matrix);
          continue; // Skip motion update for graph nodes
        }
        
        // For inactive or swarm mode: apply motion
        const finalPos = Motion.updateMotion(
          i, this.positions, this.velocities, this.prevPositions,
          this.perlin, t, this.oscIntensity, this.noiseAmp, this.radialAmp,
          this.bounds, this.drag, weights, kick, audioActive, energy,
          this.spawnTimes, this.nodeLifetime
        );
        
        dummy.position.set(finalPos.x, finalPos.y, finalPos.z);
        this.mesh.setColorAt?.(i, new THREE.Color(1, 1, 1));
        
        const s = Motion.calculateScale(i, activeCount, this.spawnTimes, t, this.nodeLifetime, weights, kick, audioActive, energy, false);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        this.mesh.setMatrixAt(i, dummy.matrix);
      }
      
      this.mesh.instanceMatrix.needsUpdate = true;
      this.mesh.instanceColor && (this.mesh.instanceColor.needsUpdate = true);

      // Update trail geometry
      if (this.trailGeom && !this.oneByOne) {
        Trails.updateTrailGeometry(this.trailGeom, this.positions, this.prevPositions, activeCount, this.count, this.oneByOne);
        if (this.edgeLines) this.edgeLines.visible = false;
      } else if (this.trailLines) {
        this.trailLines.visible = false;
        if (this.edgeLines) this.edgeLines.visible = true;
      }
    }

    beginTrails() {
      Trails.beginTrails(this.renderer, this.trailScene, this.trailCamera, this.fadeQuad, this.trailTarget, this.trailStrength);
    }
  }

  return { VectorField };
})();

