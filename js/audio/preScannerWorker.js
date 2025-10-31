// Web Worker for audio pre-scanning
// This runs in a separate thread to avoid blocking the main UI

const ANALYSIS_FPS = 30;
const NUM_BANDS = 8;

// Listen for messages from main thread
self.onmessage = function(e) {
  const { audioFile, command } = e.data;

  if (command === 'preScan') {
    preScanAudio(audioFile.arrayBuffer)
      .then(result => {
        self.postMessage({ 
          type: 'success', 
          data: result 
        });
      })
      .catch(error => {
        self.postMessage({ 
          type: 'error', 
          error: {
            message: error.message || 'Unknown error',
            stack: error.stack
          }
        });
      });
  } else if (command === 'progress') {
    // Progress updates are handled during scanning
  }
};

async function preScanAudio(arrayBuffer) {
  const startTime = performance.now();
  
  try {
    // Decode audio file - arrayBuffer is already provided
    const audioContext = new (self.AudioContext || self.webkitAudioContext)();
    let audioBuffer;
    
    try {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (decodeError) {
      throw new Error('Failed to decode audio file. The file may be corrupted or in an unsupported format.');
    }
    
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    const numChannels = audioBuffer.numberOfChannels;
    const totalFrames = Math.floor(duration * ANALYSIS_FPS);
    
    // Use OfflineAudioContext with chunked processing for real FFT analysis
    const offlineContext = new OfflineAudioContext(
      numChannels,
      sampleRate * duration,
      sampleRate
    );
    
    // Create source from audio buffer
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Create analyser for FFT
    const analyser = offlineContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.6;
    const fftSize = analyser.fftSize;
    
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
    
    // Render offline (processes entire file in one go)
    const renderedBuffer = await offlineContext.startRendering();
    const channelData = renderedBuffer.getChannelData(0);
    
    // Analyze the rendered buffer frame by frame with proper FFT
    const frameInterval = 1.0 / ANALYSIS_FPS;
    const frequencyMap = [];
    const beatTimes = [];
    
    let peakEnergy = 0;
    let totalEnergy = 0;
    let minEnergy = Infinity;
    
    // Send initial progress
    self.postMessage({ type: 'progress', progress: 0 });
    
    for (let frame = 0; frame < totalFrames; frame++) {
      const time = frame * frameInterval;
      const sampleStart = Math.floor(time * sampleRate);
      const sampleCount = Math.floor(frameInterval * sampleRate);
      
      // Send progress updates
      if (frame % 10 === 0 || frame === totalFrames - 1) {
        const progress = (frame / totalFrames) * 100;
        self.postMessage({ type: 'progress', progress });
      }
      
      // Extract sample chunk
      const chunk = channelData.slice(sampleStart, sampleStart + sampleCount);
      
      // Analyze chunk using manual FFT approximation
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
      
      // Detect beats - kick drum in low frequencies
      if (bands[0] > 0.25) {
        beatTimes.push(time);
      }
    }
    
    // Calculate precise BPM from beat times
    let bpm = 120; // default
    if (beatTimes.length >= 4) {
      const intervals = [];
      for (let i = 1; i < beatTimes.length; i++) {
        intervals.push(beatTimes[i] - beatTimes[i - 1]);
      }
      // Remove outliers using IQR
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
      analysisTime: analysisTime / 1000 // in seconds
    };
  } catch (error) {
    if (error.message) {
      throw error;
    }
    throw new Error(`Audio pre-scan failed: ${error.message || 'Unknown error'}`);
  }
}

// FFT-based chunk analysis using windowed FFT
function analyzeChunkFFT(chunk, sampleRate, ranges, fftSize) {
  const bands = new Array(NUM_BANDS).fill(0);
  
  // Use windowed FFT approximation (simplified but effective)
  // Apply Hann window to reduce spectral leakage
  const windowed = new Float32Array(chunk.length);
  for (let i = 0; i < chunk.length; i++) {
    const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / chunk.length);
    windowed[i] = chunk[i] * window;
  }
  
  // Simple FFT approximation using autocorrelation and frequency detection
  const nyquist = sampleRate / 2;
  
  // Compute magnitude spectrum using autocorrelation
  const spectrum = new Float32Array(ranges.length);
  for (let b = 0; b < NUM_BANDS; b++) {
    const [loBin, hiBin] = ranges[b];
    let sum = 0;
    let count = 0;
    
    // Sample frequency domain using DFT approximation
    for (let bin = loBin; bin <= hiBin; bin++) {
      const freq = bin * nyquist / (fftSize / 2);
      // Use Goertzel-like algorithm for specific frequency
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
  
  // Normalize to 0-1 range
  const maxVal = Math.max(...spectrum);
  for (let i = 0; i < NUM_BANDS; i++) {
    bands[i] = maxVal > 0 ? Math.min(spectrum[i] / maxVal, 1) : 0;
  }
  
  return bands;
}

