// Geometry building: InstancedMesh, trails, and edge lines

window.VixelParticlesGeometry = (function () {
  function buildInstancedMesh(count) {
    const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08); // white squares
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.5, transparent: false });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
  }

  function initializePositions(mesh, count, bounds) {
    const dummy = new THREE.Object3D();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const prevPositions = new Float32Array(count * 3);
    const spawnTimes = new Float32Array(count);
    
    // Initialize spawn times to -1 (not spawned yet)
    for (let i = 0; i < count; i++) spawnTimes[i] = -1;
    
    // Distribute in a sphere volume
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = (Math.cbrt(Math.random()) * 0.85 + 0.15) * (bounds * 0.6);
      const sx = r * Math.sin(phi) * Math.cos(theta);
      const sy = r * Math.sin(phi) * Math.sin(theta);
      const sz = r * Math.cos(phi);
      const j = i * 3;
      
      positions[j] = sx;
      positions[j + 1] = sy;
      positions[j + 2] = sz;
      prevPositions[j] = sx;
      prevPositions[j + 1] = sy;
      prevPositions[j + 2] = sz;
      velocities[j] = 0;
      velocities[j + 1] = 0;
      velocities[j + 2] = 0;

      dummy.position.set(sx, sy, sz);
      dummy.scale.setScalar(0); // start hidden until activated
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    
    return { positions, velocities, prevPositions, spawnTimes };
  }

  function buildTrailGeometry(count) {
    const trailGeom = new THREE.BufferGeometry();
    const linePositions = new Float32Array(count * 2 * 3);
    trailGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const trailMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, linewidth: 2 });
    const trailLines = new THREE.LineSegments(trailGeom, trailMat);
    trailLines.visible = true;
    return { trailGeom, trailLines };
  }

  function buildEdgeGeometry(count) {
    const edgeGeom = new THREE.BufferGeometry();
    // Max edges = count - 1 (prev->curr), allocate full
    const edgePos = new Float32Array((count - 1) * 2 * 3);
    edgeGeom.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
    const edgeColors = new Float32Array((count - 1) * 2 * 3);
    edgeGeom.setAttribute('color', new THREE.BufferAttribute(edgeColors, 3));
    const edgeMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85 });
    const edgeLines = new THREE.LineSegments(edgeGeom, edgeMat);
    return { edgeGeom, edgeLines };
  }

  return {
    buildInstancedMesh,
    initializePositions,
    buildTrailGeometry,
    buildEdgeGeometry
  };
})();

