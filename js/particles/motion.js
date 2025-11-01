// Physics and motion simulation for particles

window.VixelParticlesMotion = (function () {
  const { clamp } = window.VixelUtils;

  function updateMotion(i, positions, velocities, prevPositions, perlin, t, oscIntensity, noiseAmp, radialAmp, bounds, drag, weights, kick, audioActive, energy, spawnTimes, nodeLifetime) {
    const j = i * 3;
    let x = positions[j];
    let y = positions[j + 1];
    let z = positions[j + 2];
    
    // Check if particle needs re-spawn in swarm mode
    if (spawnTimes && spawnTimes[i] >= 0) {
      const age = t - spawnTimes[i];
      if (age > nodeLifetime) {
        // Re-spawn this particle at a new random position
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = (Math.cbrt(Math.random()) * 0.85 + 0.15) * (bounds * 0.6);
        positions[j] = r * Math.sin(phi) * Math.cos(theta);
        positions[j + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[j + 2] = r * Math.cos(phi);
        velocities[j] = 0;
        velocities[j + 1] = 0;
        velocities[j + 2] = 0;
        spawnTimes[i] = t;
        // Update x, y, z to use the re-spawned position
        x = positions[j];
        y = positions[j + 1];
        z = positions[j + 2];
      }
    }
    
    // Save previous position
    prevPositions[j] = x;
    prevPositions[j + 1] = y;
    prevPositions[j + 2] = z;

    // Perlin noise for flow field
    const nx = perlin.noise3(x * 0.15 + t * 0.25, y * 0.12 - t * 0.22, z * 0.1);
    const ny = perlin.noise3(y * 0.16 - t * 0.21, z * 0.14 + t * 0.24, x * 0.11);
    const nz = perlin.noise3(z * 0.13 + t * 0.2, x * 0.1 - t * 0.18, y * 0.09);
    
    const mid = (weights[2] + weights[3] + weights[4]) / 3;
    const hi = (weights[5] + weights[6] + weights[7]) / 3;
    const low = (weights[0] + weights[1] * 0.6);
    
    const flowBase = noiseAmp * oscIntensity;
    const flowX = (nx * 2 - 1) * flowBase * (0.2 + mid * 1.2);
    const flowY = (ny * 2 - 1) * flowBase * (0.2 + mid * 1.2);
    let flowZ = (nz * 2 - 1) * flowBase * (0.2 + mid * 1.2);
    
    // Vertical drift
    const verticalDrift = (Math.sin(t * 0.45 + x * 0.7) + Math.cos(t * 0.37 + y * 0.9)) * 0.12 * (0.3 + mid + hi);
    flowZ += verticalDrift;

    // Radial force
    const r = Math.max(0.0001, Math.sqrt(x * x + y * y + z * z));
    const rx = (x / r), ry = (y / r), rz = (z / r);
    const radial = (radialAmp * Math.sin(t * 0.6 + r * 1.6)) - 0.18 * r + kick.level * 0.9 * (0.6 + low);

    // Spin force
    const spin = 0.6 * (0.3 + hi);
    const spinX = -y * spin * 0.02;
    const spinY = x * spin * 0.02;

    // Apply forces
    const calm = audioActive ? (0.05 + energy * 0.95) : 0.0;
    let vx = velocities[j] * drag + (flowX + rx * radial * 0.02 + spinX) * calm;
    let vy = velocities[j + 1] * drag + (flowY + ry * radial * 0.02 + spinY) * calm;
    let vz = velocities[j + 2] * drag + (flowZ + rz * radial * 0.02) * calm;

    // Update position
    x = x + vx;
    y = y + vy;
    z = z + vz;
    
    // Boundary collision
    const lim = bounds;
    if (x > lim) { x = lim; vx *= -0.6; }
    if (x < -lim) { x = -lim; vx *= -0.6; }
    if (y > lim) { y = lim; vy *= -0.6; }
    if (y < -lim) { y = -lim; vy *= -0.6; }
    if (z > lim) { z = lim; vz *= -0.6; }
    if (z < -lim) { z = -lim; vz *= -0.6; }

    // Store updated values
    positions[j] = x;
    positions[j + 1] = y;
    positions[j + 2] = z;
    velocities[j] = vx;
    velocities[j + 1] = vy;
    velocities[j + 2] = vz;
    
    return { x, y, z };
  }

  function calculateScale(i, activeCount, spawnTimes, t, nodeLifetime, weights, kick, audioActive, energy, oneByOne) {
    const low = (weights[0] + weights[1] * 0.6);
    const mid = (weights[2] + weights[3] + weights[4]) / 3;
    const hi = (weights[5] + weights[6] + weights[7]) / 3;
    
    if (i > activeCount) return 0; // not yet spawned
    
    let s;
    
    if (oneByOne) {
      // Static nodes in graph mode
      s = 0.8;
      if (spawnTimes && spawnTimes[i] >= 0) {
        const age = t - spawnTimes[i];
        if (age > nodeLifetime) {
          s = 0; // Fully decayed
        } else {
          const fadeStart = nodeLifetime * 0.7; // Start fading at 70% of lifetime
          if (age > fadeStart) {
            const fadeProgress = (age - fadeStart) / (nodeLifetime - fadeStart);
            s = 0.8 * (1 - fadeProgress);
          }
        }
      }
    } else {
      // Swarm mode: audio-reactive scaling
      const ampLocal = clamp(low * 0.9 + mid * 0.7 + hi * 0.5, 0, 1);
      s = audioActive ? (0.6 + ampLocal * 1.6 + kick.level * 0.8) : 0.0;
      
      // Apply decay in swarm mode too
      if (spawnTimes && spawnTimes[i] >= 0) {
        const age = t - spawnTimes[i];
        if (age > nodeLifetime) {
          s = 0; // Fully decayed
        } else {
          const fadeStart = nodeLifetime * 0.7; // Start fading at 70% of lifetime
          if (age > fadeStart) {
            const fadeProgress = (age - fadeStart) / (nodeLifetime - fadeStart);
            s *= (1 - fadeProgress); // Apply fade to existing scale
          }
        }
      }
    }
    
    return s;
  }

  return {
    updateMotion,
    calculateScale
  };
})();

