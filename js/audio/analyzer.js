// FFT frequency analysis and band computation

window.VixelAudioAnalyzer = (function() {
  const NUM_BANDS = 8;
  const DEFAULT_FFT_SIZE = 2048;
  
  let audioCtx = null;
  let analyser = null;
  let freqData = null;
  
  const bandGains = new Array(NUM_BANDS).fill(0);
  const bandAmps = new Array(NUM_BANDS).fill(0);
  const bandDecay = 0.9; // peak-hold decay

  function initialize(sampleRate) {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = DEFAULT_FFT_SIZE;
      analyser.smoothingTimeConstant = 0.6;
      freqData = new Uint8Array(analyser.frequencyBinCount);
    }
    return { audioCtx, analyser };
  }

  function setFFTSize(fftSize) {
    if (!analyser) return;
    analyser.fftSize = fftSize;
    freqData = new Uint8Array(analyser.frequencyBinCount);
  }

  function getFFTSize() {
    return analyser ? analyser.fftSize : DEFAULT_FFT_SIZE;
  }

  function setSmoothing(value) {
    if (analyser) {
      analyser.smoothingTimeConstant = value;
    }
  }

  function getSmoothing() {
    return analyser ? analyser.smoothingTimeConstant : 0.6;
  }

  function bandRanges(sampleRate, fftSize) {
    // Compute 8 frequency bands mapping to musical elements:
    // Band 0: Sub-bass (20-60Hz) - Kick drum fundamental
    // Band 1: Bass (60-150Hz) - Bass synths, kick harmonics
    // Band 2: Low-mid (150-300Hz) - Bass, lower pads
    // Band 3: Mid (300-600Hz) - Snare, synths, lead lower harmonics
    // Band 4: Upper-mid (600-1200Hz) - Lead, bells, synths
    // Band 5: High (1200-2400Hz) - Hi-hats, cymbals, bright synths
    // Band 6: Very high (2400-4800Hz) - Hi-hats, bells, bright pads
    // Band 7: Ultra high (4800Hz+) - Cymbals, air, sparkle
    const nyquist = sampleRate / 2;
    const edges = [20, 60, 150, 300, 600, 1200, 2400, 4800, Math.min(nyquist, 9600)];
    const hzPerBin = nyquist / (fftSize / 2);
    const ranges = [];
    for (let i = 0; i < NUM_BANDS; i++) {
      const lo = Math.floor(edges[i] / hzPerBin);
      const hi = Math.min(Math.floor(edges[i + 1] / hzPerBin), analyser.frequencyBinCount - 1);
      ranges.push([lo, Math.max(lo + 1, hi)]);
    }
    return ranges;
  }

  function computeBands() {
    if (!analyser) return bandAmps;
    analyser.getByteFrequencyData(freqData);
    const ranges = bandRanges(audioCtx.sampleRate, analyser.fftSize);
    
    for (let i = 0; i < NUM_BANDS; i++) {
      const [lo, hi] = ranges[i];
      let sum = 0;
      for (let b = lo; b <= hi; b++) sum += freqData[b];
      const avg = sum / (hi - lo + 1);
      // Normalize 0..1
      const norm = avg / 255;
      bandGains[i] = norm;
      // Peak-hold with decay for stability
      bandAmps[i] = Math.max(norm, bandAmps[i] * bandDecay);
    }
    
    return bandAmps;
  }

  function getFrequencyDistribution() {
    return {
      subBass: bandAmps[0],      // Kick fundamental
      bass: bandAmps[1],          // Bass synths, kick harmonics
      lowMid: bandAmps[2],        // Bass, lower pads
      mid: bandAmps[3],           // Snare, synths, lead lower
      upperMid: bandAmps[4],      // Lead, bells, synths
      high: bandAmps[5],          // Hi-hats, bright synths
      veryHigh: bandAmps[6],      // Hi-hats, bells, bright pads
      ultraHigh: bandAmps[7]      // Cymbals, sparkle
    };
  }

  function getBands() {
    return computeBands().slice(0);
  }

  return {
    initialize,
    setFFTSize,
    getFFTSize,
    setSmoothing,
    getSmoothing,
    computeBands,
    getBands,
    getFrequencyDistribution,
    NUM_BANDS,
    DEFAULT_FFT_SIZE
  };
})();

