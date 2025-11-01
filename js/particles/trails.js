// Trail rendering and fade pass

window.VixelParticlesTrails = (function () {
  const { mapRange } = window.VixelUtils;

  function buildTrailPass(renderer) {
    const w = renderer.domElement.width;
    const h = renderer.domElement.height;
    const trailScene = new THREE.Scene();
    const trailCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.MeshBasicMaterial({ 
      color: new THREE.Color(0x0b0f17), 
      transparent: true, 
      opacity: 0.08, 
      depthWrite: false, 
      depthTest: false 
    });
    const fadeQuad = new THREE.Mesh(geo, mat);
    trailScene.add(fadeQuad);

    const trailTarget = new THREE.WebGLRenderTarget(w, h, { depthBuffer: true, stencilBuffer: false });
    renderer.setRenderTarget(null);
    
    return { trailScene, trailCamera, fadeQuad, trailTarget };
  }

  function resizeTrailTarget(trailTarget, renderer) {
    const w = renderer.domElement.width;
    const h = renderer.domElement.height;
    if (trailTarget.width !== w || trailTarget.height !== h) {
      trailTarget.setSize(w, h);
    }
  }

  function beginTrails(renderer, trailScene, trailCamera, fadeQuad, trailTarget, trailStrength) {
    // Fade the previous frame to create trails
    resizeTrailTarget(trailTarget, renderer);
    const prevAutoClear = renderer.autoClearColor;
    renderer.autoClearColor = false;
    const audioActive = !!(window.VixelAudio && window.VixelAudio.isPlaying && window.VixelAudio.isPlaying());
    const opacity = audioActive ? mapRange(trailStrength, 0, 1, 0.22, 0.05) : 0.6; // clear quickly when paused
    fadeQuad.material.opacity = opacity;
    renderer.render(trailScene, trailCamera);
    // Reset depth so current frame particles are not occluded by previous frame
    renderer.clearDepth();
    renderer.autoClearColor = prevAutoClear;
  }

  function updateTrailGeometry(trailGeom, positions, prevPositions, activeCount, count, oneByOne) {
    if (!trailGeom || oneByOne) return; // No trails in graph mode
    
    const arr = trailGeom.attributes.position.array;
    // In swarm mode, update trails for all moving particles (but hide inactive ones)
    for (let i = 0; i < count; i++) {
      const j = i * 3;
      const k = i * 6; // two vertices per segment
      // For inactive particles, draw degenerate lines (zero length) to hide them
      if (i >= activeCount) {
        arr[k] = positions[j];
        arr[k + 1] = positions[j + 1];
        arr[k + 2] = positions[j + 2];
        arr[k + 3] = positions[j];
        arr[k + 4] = positions[j + 1];
        arr[k + 5] = positions[j + 2];
      } else {
        arr[k] = prevPositions[j];
        arr[k + 1] = prevPositions[j + 1];
        arr[k + 2] = prevPositions[j + 2];
        arr[k + 3] = positions[j];
        arr[k + 4] = positions[j + 1];
        arr[k + 5] = positions[j + 2];
      }
    }
    trailGeom.attributes.position.needsUpdate = true;
  }

  function updateEdgeGeometry(edgeGeom, positions, i, bounds) {
    if (i === 0) return; // First node has no edge
    
    const k = (i - 1) * 6; // two vertices per edge
    const pj = (i - 1) * 3;
    const j = i * 3;
    const posArr = edgeGeom.attributes.position.array;
    
    posArr[k] = positions[pj];
    posArr[k + 1] = positions[pj + 1];
    posArr[k + 2] = positions[pj + 2];
    posArr[k + 3] = positions[j];
    posArr[k + 4] = positions[j + 1];
    posArr[k + 5] = positions[j + 2];
    
    // White edges
    const colArr = edgeGeom.attributes.color.array;
    colArr[k] = 1; colArr[k + 1] = 1; colArr[k + 2] = 1;
    colArr[k + 3] = 1; colArr[k + 4] = 1; colArr[k + 5] = 1;
    
    edgeGeom.attributes.position.needsUpdate = true;
    edgeGeom.attributes.color.needsUpdate = true;
  }

  return {
    buildTrailPass,
    resizeTrailTarget,
    beginTrails,
    updateTrailGeometry,
    updateEdgeGeometry
  };
})();

