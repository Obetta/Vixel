// Particle position calculation based on audio analysis

window.VixelParticlesPlacement = (function () {
  const { clamp, mapRange } = window.VixelUtils;

  function calculatePlacementPreScanned(i, count, preScanData, bounds) {
    const half = bounds;
    // Map node index to a time in the pre-scanned frequency map
    const nodeTime = (i / count) * preScanData.duration;
    const preScanTime = nodeTime % preScanData.duration;
    // Find the closest frame in the frequency map
    const fps = 30; // ANALYSIS_FPS from preScanner
    const frameIndex = Math.floor(preScanTime * fps) % preScanData.frequencyMap.length;
    const frame = preScanData.frequencyMap[frameIndex];
    
    if (!frame || !frame.bands) {
      return null; // Fallback needed
    }
    
    const preScanWeights = frame.bands;
    
    // X: overall spectral tilt (low vs high)
    const spectralCentroid = (
      preScanWeights[0] * 40 +   // Sub-bass
      preScanWeights[1] * 100 +  // Bass
      preScanWeights[2] * 225 +  // Low-mid
      preScanWeights[3] * 450 +  // Mid
      preScanWeights[4] * 900 +  // Upper-mid
      preScanWeights[5] * 1800 + // High
      preScanWeights[6] * 3600 + // Very high
      preScanWeights[7] * 7200   // Ultra high
    ) / (preScanWeights[0] + preScanWeights[1] + preScanWeights[2] + preScanWeights[3] + 
         preScanWeights[4] + preScanWeights[5] + preScanWeights[6] + preScanWeights[7] + 0.001);
    const px = mapRange(Math.log10(spectralCentroid + 1), 1.5, 4, -half, half);
    
    // Y: energy distribution balance
    const lowEnergy = preScanWeights[0] + preScanWeights[1];
    const midEnergy = preScanWeights[2] + preScanWeights[3] + preScanWeights[4];
    const highEnergy = preScanWeights[5] + preScanWeights[6] + preScanWeights[7];
    const balance = (highEnergy - lowEnergy) / (highEnergy + midEnergy + lowEnergy + 0.001);
    const py = mapRange(balance, -1, 1, -half, half);
    
    // Z: overall energy/intensity
    const pz = mapRange(frame.energy, 0, 1, -half * 0.5, half * 0.5);
    
    return { px, py, pz };
  }

  function calculatePlacementBeatBased(beatData, weights, energy, bounds) {
    const half = bounds;
    let px, py, pz;
    
    if (beatData.kick?.isHit) {
      // Kick/bass: negative X (left side), full z range
      px = mapRange(weights[0], 0, 1, -half * 0.8, -half * 0.3);
      py = mapRange(weights[1], 0, 1, -half * 0.5, half * 0.5);
      pz = mapRange(beatData.kick.level, 0, 1, -half, half);
    } else if (beatData.snare?.isHit) {
      // Snare: positive X (right side), full z range
      px = mapRange(weights[3], 0, 1, half * 0.3, half * 0.8);
      py = mapRange(weights[2], 0, 1, -half * 0.5, half * 0.5);
      pz = mapRange(beatData.snare.level, 0, 1, -half, half);
    } else if (beatData.hihat?.isHit) {
      // Hi-hat: full z range
      px = mapRange(weights[6] - weights[5], -1, 1, -half * 0.5, half * 0.5);
      py = mapRange(weights[7], 0, 1, -half * 0.5, half * 0.5);
      pz = mapRange(beatData.hihat.level, 0, 1, -half, half);
    } else {
      // BPM cadence spawn (no instrument hit): use frequency analysis, full z range
      const bassX = (weights[0] + weights[1]) / 2;
      const trebleX = (weights[6] + weights[7]) / 2;
      px = mapRange(bassX - trebleX, -1, 1, -half, half);
      const midY = (weights[2] + weights[3] + weights[4]) / 3;
      py = mapRange(midY, 0, 1, -half, half);
      pz = mapRange(energy, 0, 1, -half, half);
    }
    
    return { px, py, pz };
  }

  function calculatePlacementFallback(weights, energy, bounds) {
    const half = bounds;
    const px = mapRange(weights[0] - weights[7], -1, 1, -half, half);
    const py = mapRange((weights[2] + weights[3] + weights[4]) / 3, 0, 1, -half, half);
    const pz = mapRange(energy, 0, 1, -half, half);
    return { px, py, pz };
  }

  function calculatePosition(i, count, weights, energy, beatData, preScanData, bounds) {
    let pos;
    
    // Use pre-scanned data if available for better spatial distribution
    if (preScanData && preScanData.frequencyMap && preScanData.frequencyMap.length > 0) {
      pos = calculatePlacementPreScanned(i, count, preScanData, bounds);
      if (!pos) {
        // Fallback to real-time placement if frame data missing
        pos = calculatePlacementFallback(weights, energy, bounds);
      }
    } else if (beatData) {
      // Position based on which instrument hit (real-time mode)
      pos = calculatePlacementBeatBased(beatData, weights, energy, bounds);
    } else {
      // Fallback: frequency-based placement
      pos = calculatePlacementFallback(weights, energy, bounds);
    }
    
    // Add small noise for natural variation
    const noiseScale = 0.12;
    const pxFinal = clamp(pos.px + (Math.random() - 0.5) * noiseScale * bounds, -bounds, bounds);
    const pyFinal = clamp(pos.py + (Math.random() - 0.5) * noiseScale * bounds, -bounds, bounds);
    const pzFinal = clamp(pos.pz + (Math.random() - 0.5) * noiseScale * bounds, -bounds, bounds);
    
    return { x: pxFinal, y: pyFinal, z: pzFinal };
  }

  return {
    calculatePosition
  };
})();

