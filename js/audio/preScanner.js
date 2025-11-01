// Pre-scan entire audio file for frequency analysis, beat detection, and spatial mapping

window.VixelAudioPreScanner = (function() {
  const ANALYSIS_FPS = 30;
  const NUM_BANDS = 8;

  /**
   * Pre-scan audio file (uses OfflineAudioContext, so doesn't block UI)
   * @param {File} audioFile - Audio file to scan
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Pre-scan data
   */
  async function preScanAudio(audioFile, onProgress) {
    const startTime = performance.now();

    const arrayBuffer = await audioFile.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    const numChannels = audioBuffer.numberOfChannels;
    const totalFrames = Math.floor(duration * ANALYSIS_FPS);

    // Use OfflineAudioContext for accurate FFT analysis
    const offlineContext = new OfflineAudioContext(
      numChannels,
      sampleRate * duration,
      sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    const analyser = offlineContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.6;
    const fftSize = analyser.fftSize;
    const freqData = new Uint8Array(analyser.frequencyBinCount);

    // Calculate band ranges
    const nyquist = sampleRate / 2;
    const edges = [20, 60, 150, 300, 600, 1200, 2400, 4800, Math.min(nyquist, 9600)];
    const hzPerBin = nyquist / (fftSize / 2);
    const ranges = [];
    for (let i = 0; i < NUM_BANDS; i++) {
      const lo = Math.floor(edges[i] / hzPerBin);
      const hi = Math.min(Math.floor(edges[i + 1] / hzPerBin), analyser.frequencyBinCount - 1);
      ranges.push([lo, Math.max(lo + 1, hi)]);
    }

    source.connect(analyser);
    analyser.connect(offlineContext.destination);
    source.start(0);

    const renderedBuffer = await offlineContext.startRendering();
    const channelData = renderedBuffer.getChannelData(0);

    const frameInterval = 1.0 / ANALYSIS_FPS;
    const frequencyMap = [];
    const beatTimes = [];

    let peakEnergy = 0;
    let totalEnergy = 0;
    let minEnergy = Infinity;

    if (onProgress) {
      onProgress(0);
    }

    for (let frame = 0; frame < totalFrames; frame++) {
      const time = frame * frameInterval;
      const sampleStart = Math.floor(time * sampleRate);
      const sampleCount = Math.floor(frameInterval * sampleRate);

      if (onProgress && (frame % 10 === 0 || frame === totalFrames - 1)) {
        onProgress((frame / totalFrames) * 100);
        if (frame % 50 === 0) await new Promise(resolve => setTimeout(resolve, 0));
      }

      const chunk = channelData.slice(sampleStart, sampleStart + sampleCount);
      const bands = analyzeChunkFFT(chunk, sampleRate, ranges, fftSize);

      const energy = bands.reduce((sum, b) => sum + b, 0) / NUM_BANDS;
      peakEnergy = Math.max(peakEnergy, energy);
      minEnergy = Math.min(minEnergy, energy);
      totalEnergy += energy;

      frequencyMap.push({
        time,
        bands: bands.slice(),
        energy
      });

      if (bands[0] > 0.25) {
        beatTimes.push(time);
      }
    }

    let bpm = 120;
    if (beatTimes.length >= 4) {
      const intervals = [];
      for (let i = 1; i < beatTimes.length; i++) {
        intervals.push(beatTimes[i] - beatTimes[i - 1]);
      }
      const sorted = intervals.sort((a, b) => a - b);
      const q1Index = Math.floor(sorted.length * 0.25);
      const q3Index = Math.floor(sorted.length * 0.75);
      const q1 = sorted[q1Index];
      const q3 = sorted[q3Index];
      const iqr = q3 - q1;
      const valid = intervals.filter(interval =>
        interval >= q1 - 1.5 * iqr && interval <= q3 + 1.5 * iqr
      );
      if (valid.length > 0) {
        const avgInterval = valid.reduce((a, b) => a + b, 0) / valid.length;
        bpm = Math.round(60 / avgInterval);
        bpm = Math.max(60, Math.min(200, bpm));
      }
    }

    const avgEnergy = totalEnergy / totalFrames;
    const analysisTime = performance.now() - startTime;

    if (onProgress) {
      onProgress(100);
    }

    return {
      duration,
      bpm,
      beats: beatTimes,
      frequencyMap,
      dynamicRange: {
        min: minEnergy,
        max: peakEnergy,
        avg: avgEnergy
      },
      sampleRate,
      analysisTime: analysisTime / 1000
    };
  }

  // FFT-based chunk analysis
  function analyzeChunkFFT(chunk, sampleRate, ranges, fftSize) {
    const bands = new Array(NUM_BANDS).fill(0);
    
    const windowed = new Float32Array(chunk.length);
    for (let i = 0; i < chunk.length; i++) {
      const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / chunk.length);
      windowed[i] = chunk[i] * window;
    }
    
    const nyquist = sampleRate / 2;
    const spectrum = new Float32Array(ranges.length);
    for (let b = 0; b < NUM_BANDS; b++) {
      const [loBin, hiBin] = ranges[b];
      let sum = 0;
      let count = 0;
      
      for (let bin = loBin; bin <= hiBin; bin++) {
        const freq = bin * nyquist / (fftSize / 2);
        const k = 2 * Math.PI * freq / sampleRate;
        let real = 0, imag = 0;
        for (let n = 0; n < windowed.length; n++) {
          const cos = Math.cos(k * n);
          const sin = Math.sin(k * n);
          real += windowed[n] * cos;
          imag += windowed[n] * sin;
        }
        const magnitude = Math.sqrt(real * real + imag * imag);
        sum += magnitude;
        count++;
      }
      
      if (count > 0) {
        spectrum[b] = sum / count;
      }
    }
    
    const maxVal = Math.max(...spectrum);
    for (let i = 0; i < NUM_BANDS; i++) {
      bands[i] = maxVal > 0 ? Math.min(spectrum[i] / maxVal, 1) : 0;
    }
    
    return bands;
  }

  return {
    preScanAudio
  };
})();
