// Audio handling: Web Audio API, FFT to 8 bands, drag-and-drop, kick detection

window.VixelAudio = (function () {
  const NUM_BANDS = 8;
  const DEFAULT_FFT_SIZE = 2048;

  let audioCtx = null;
  let analyser = null;
  let sourceNode = null;
  let mediaEl = null;
  let freqData = null;
  let isPlaying = false;
  let kick = { level: 0, isHit: false, last: 0 };

  const bandGains = new Array(NUM_BANDS).fill(0);
  const bandAmps = new Array(NUM_BANDS).fill(0);
  const bandDecay = 0.9; // user-hidden decay
  const kickDecay = 0.85; // user-hidden decay

  function ensureContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = DEFAULT_FFT_SIZE;
      analyser.smoothingTimeConstant = 0.6;
      freqData = new Uint8Array(analyser.frequencyBinCount);
    }
  }

  function bandRanges(sampleRate, fftSize) {
    // Compute 8 roughly logarithmic bands over [20Hz, sampleRate/2]
    const nyquist = sampleRate / 2;
    const edges = [20, 40, 80, 160, 320, 640, 1280, 2560, Math.min(nyquist, 5120)];
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
    detectKick(bandGains);
    return bandAmps;
  }

  function detectKick(bands) {
    // Kick based on first two bands with simple adaptive threshold
    const low = (bands[0] + bands[1] * 0.5);
    const now = performance.now();
    const dt = Math.min(0.25, (now - kick.last) / 1000);
    kick.last = now;
    const sensitivity = getKickSensitivity();
    const threshold = 0.22 + (1 - sensitivity) * 0.25; // 0.22..0.47
    const hit = low > threshold;
    kick.level = hit ? 1 : kick.level * Math.pow(kickDecay, dt * 60);
    kick.isHit = hit;
  }

  function getKickSensitivity() {
    const el = document.getElementById('kickSens');
    return el ? Number(el.value) : 0.35;
  }

  async function setFile(file) {
    ensureContext();
    if (sourceNode) {
      try { sourceNode.disconnect(); } catch (_) {}
      sourceNode = null;
    }
    if (!mediaEl) {
      mediaEl = document.createElement(file.type.startsWith('video/') ? 'video' : 'audio');
      mediaEl.crossOrigin = 'anonymous';
    }
    mediaEl.src = URL.createObjectURL(file);
    mediaEl.loop = true;
    await mediaEl.play().catch(() => {});
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    sourceNode = audioCtx.createMediaElementSource(mediaEl);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);
    isPlaying = true;
  }

  function togglePlay() {
    if (!audioCtx || !mediaEl) return;
    if (isPlaying) {
      mediaEl.pause();
      isPlaying = false;
    } else {
      mediaEl.play();
      isPlaying = true;
    }
  }

  function setupUI() {
    const input = document.getElementById('fileInput');
    if (input) {
      input.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) await setFile(file);
      });
    }
    const drop = document.getElementById('dropZone');
    const stage = document.getElementById('stage');
    const handleDrop = async (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) await setFile(file);
    };
    [drop, stage, document.body].forEach((el) => {
      if (!el) return;
      el.addEventListener('dragover', (e) => { e.preventDefault(); });
      el.addEventListener('drop', handleDrop);
    });

    const btn = document.getElementById('playPauseBtn');
    if (btn) {
      btn.addEventListener('click', async () => {
        ensureContext();
        if (audioCtx.state === 'suspended') await audioCtx.resume();
        togglePlay();
        btn.textContent = isPlaying ? 'Pause' : 'Play';
      });
    }
  }

  function getBands() {
    return computeBands().slice(0);
  }
  function getKick() { return { ...kick }; }

  function init() {
    setupUI();
  }

  return {
    init,
    getBands,
    getKick,
    isPlaying: () => isPlaying,
    NUM_BANDS
  };
})();


