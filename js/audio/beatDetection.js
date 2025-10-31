// Beat detection: kick, snare, hi-hat, BPM calculation

window.VixelBeatDetection = (function() {
  const kickDecay = 0.85;
  
  let kick = { level: 0, isHit: false, last: 0 };
  let snare = { level: 0, isHit: false, last: 0 };
  let hihat = { level: 0, isHit: false, last: 0 };
  let beat = { overall: 0, bpm: 120 };
  let beatHistory = [];

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function getKickSensitivity() {
    const el = document.getElementById('kickSens');
    return el ? Number(el.value) : 0.35;
  }

  function detectKick(bands) {
    // Kick/sub-bass: band 0 (20-60Hz) - fundamental frequency of kick
    const kickFreq = bands[0];
    const now = performance.now();
    const dt = Math.min(0.25, (now - kick.last) / 1000);
    kick.last = now;
    const sensitivity = getKickSensitivity();
    const threshold = 0.22 + (1 - sensitivity) * 0.25;
    const hit = kickFreq > threshold;
    kick.level = hit ? 1 : kick.level * Math.pow(kickDecay, dt * 60);
    kick.isHit = hit;
  }

  function detectSnare(bands) {
    // Snare/mid percussion: band 3 (300-600Hz) with some from band 4
    const snareFreq = (bands[3] * 0.7 + bands[4] * 0.3);
    const now = performance.now();
    const dt = Math.min(0.25, (now - snare.last) / 1000);
    snare.last = now;
    const threshold = 0.25;
    const hit = snareFreq > threshold && !kick.isHit;
    snare.level = hit ? 1 : snare.level * Math.pow(kickDecay, dt * 60);
    snare.isHit = hit;
  }

  function detectHihat(bands) {
    // Hi-hats/cymbals: bands 5-7 (bright frequencies)
    const high = (bands[5] * 0.4 + bands[6] * 0.4 + bands[7] * 0.2);
    const now = performance.now();
    const dt = Math.min(0.25, (now - hihat.last) / 1000);
    hihat.last = now;
    const threshold = 0.2;
    const hit = high > threshold;
    hihat.level = hit ? 1 : hihat.level * Math.pow(kickDecay * 0.9, dt * 60);
    hihat.isHit = hit;
  }

  function updateBeatData(bands) {
    detectKick(bands);
    detectSnare(bands);
    detectHihat(bands);
    
    // Combined beat energy (kick + snare + hi-hat)
    beat.overall = clamp((kick.level * 0.5 + snare.level * 0.3 + hihat.level * 0.2), 0, 1);
    
    // Track beat hits for BPM calculation
    if (kick.isHit || snare.isHit) {
      const now = performance.now();
      beatHistory.push(now);
      // Keep only last 8 beats for BPM calculation
      if (beatHistory.length > 8) beatHistory.shift();
      // Calculate BPM from intervals
      if (beatHistory.length >= 4) {
        const intervals = [];
        for (let i = 1; i < beatHistory.length; i++) {
          intervals.push(beatHistory[i] - beatHistory[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        beat.bpm = Math.round(60000 / avgInterval); // convert ms to BPM
        beat.bpm = clamp(beat.bpm, 60, 200); // reasonable range
      }
    }
  }

  function getKick() {
    return { ...kick };
  }

  function getBeat() {
    return {
      overall: beat.overall,
      bpm: beat.bpm,
      kick: { ...kick },
      snare: { ...snare },
      hihat: { ...hihat }
    };
  }

  return {
    updateBeatData,
    getKick,
    getBeat
  };
})();

