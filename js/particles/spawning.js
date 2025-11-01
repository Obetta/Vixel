// Particle spawning and activation logic

window.VixelParticlesSpawning = (function () {
  const { clamp } = window.VixelUtils;

  function shouldSpawn(energy, beatData, t, lastBeatTime) {
    if (energy <= 0.02) return false;
    
    if (beatData && beatData.bpm && beatData.bpm > 60) {
      const bpm = beatData.bpm;
      const beatInterval = 60.0 / bpm; // seconds between beats
      
      // Spawn once per beat interval (cadence)
      if (lastBeatTime === undefined || (t - lastBeatTime) >= beatInterval - 0.05) {
        return true;
      }
      
      // Also spawn immediately when any beat instrument hits
      if (beatData.kick?.isHit || beatData.snare?.isHit || beatData.hihat?.isHit) {
        return true;
      }
    }
    
    return false;
  }

  function updateActiveCount(energy, beatData, t, currentActive, spawnRate, dt, count, lastBeatTime) {
    let newLastBeatTime = lastBeatTime;
    
    if (energy > 0.02) {
      if (beatData && beatData.bpm && beatData.bpm > 60) {
        const bpm = beatData.bpm;
        const beatInterval = 60.0 / bpm;
        let shouldSpawnNow = false;
        
        if (lastBeatTime === undefined || (t - lastBeatTime) >= beatInterval - 0.05) {
          shouldSpawnNow = true;
          newLastBeatTime = t;
        }
        
        if (beatData.kick?.isHit || beatData.snare?.isHit || beatData.hihat?.isHit) {
          shouldSpawnNow = true;
          newLastBeatTime = t; // reset cadence on instrument hit
        }
        
        if (shouldSpawnNow) {
          return {
            active: Math.min(count, currentActive + 1),
            lastBeatTime: newLastBeatTime
          };
        }
      } else {
        // Fallback: use spawnRate if BPM not detected yet
        return {
          active: Math.min(count, currentActive + spawnRate * dt),
          lastBeatTime: newLastBeatTime
        };
      }
    } else {
      // hide when idle
      return {
        active: Math.max(0, currentActive - spawnRate * 1.2 * dt),
        lastBeatTime: newLastBeatTime
      };
    }
    
    return { active: currentActive, lastBeatTime: newLastBeatTime };
  }

  function assignBand(weights) {
    let dom = 0, domVal = -1;
    for (let b = 0; b < 8; b++) {
      const v = weights[b];
      if (v > domVal) { domVal = v; dom = b; }
    }
    return dom;
  }

  return {
    shouldSpawn,
    updateActiveCount,
    assignBand
  };
})();

