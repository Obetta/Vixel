// Audio handling: Web Audio API, FFT to 8 bands, drag-and-drop, kick detection

window.VixelAudio = (function () {
  const NUM_BANDS = 8;
  const DEFAULT_FFT_SIZE = 2048;
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  let audioCtx = null;
  let analyser = null;
  let sourceNode = null;
  let mediaEl = null;
  let freqData = null;
  let isPlaying = false;
  let kick = { level: 0, isHit: false, last: 0 };
  let snare = { level: 0, isHit: false, last: 0 };
  let hihat = { level: 0, isHit: false, last: 0 };
  let beat = { overall: 0, bpm: 120 }; // combined beat energy + BPM
  let beatHistory = []; // timestamps of beat hits for BPM calculation
  let currentFileName = null;

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
    detectSnare(bandGains);
    detectHihat(bandGains);
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

  function detectSnare(bands) {
    // Snare in mid-range (bands 2-4)
    const mid = (bands[2] + bands[3] + bands[4]) / 3;
    const now = performance.now();
    const dt = Math.min(0.25, (now - snare.last) / 1000);
    snare.last = now;
    const threshold = 0.25;
    const hit = mid > threshold && !kick.isHit; // avoid double-trigger with kick
    snare.level = hit ? 1 : snare.level * Math.pow(kickDecay, dt * 60);
    snare.isHit = hit;
  }

  function detectHihat(bands) {
    // Hi-hats in high range (bands 5-7)
    const high = (bands[5] + bands[6] + bands[7]) / 3;
    const now = performance.now();
    const dt = Math.min(0.25, (now - hihat.last) / 1000);
    hihat.last = now;
    const threshold = 0.2;
    const hit = high > threshold;
    hihat.level = hit ? 1 : hihat.level * Math.pow(kickDecay * 0.9, dt * 60); // faster decay
    hihat.isHit = hit;
  }

  function getKickSensitivity() {
    const el = document.getElementById('kickSens');
    return el ? Number(el.value) : 0.35;
  }

  function formatTime(seconds) {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function updateTimeDisplay() {
    if (!mediaEl) return;
    const current = mediaEl.currentTime || 0;
    const duration = mediaEl.duration || 0;
    
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const timeSlider = document.getElementById('timeSlider');
    
    if (currentTimeEl) {
      currentTimeEl.textContent = formatTime(current);
    }
    
    if (durationEl) {
      durationEl.textContent = formatTime(duration);
    }
    
    if (timeSlider && duration > 0) {
      timeSlider.max = duration;
      timeSlider.value = current;
    }
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
      
      // Set up time update listeners
      mediaEl.addEventListener('loadedmetadata', () => {
        updateTimeDisplay();
      });
      
      mediaEl.addEventListener('timeupdate', () => {
        updateTimeDisplay();
      });
      
      mediaEl.addEventListener('ended', () => {
        isPlaying = false;
        updatePlayPauseButton();
      });
    }
    mediaEl.src = URL.createObjectURL(file);
    mediaEl.loop = true;
    
    // Wait for metadata to load
    await new Promise((resolve) => {
      mediaEl.addEventListener('loadedmetadata', resolve, { once: true });
      mediaEl.load();
    });
    
    await mediaEl.play().catch(() => {});
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    sourceNode = audioCtx.createMediaElementSource(mediaEl);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);
    isPlaying = true;
    currentFileName = file.name;
    updateTrackName();
    updatePlayPauseButton();
    updateTimeDisplay();
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
    updatePlayPauseButton();
  }

  function updateTrackName() {
    const trackNameEl = document.getElementById('trackName');
    if (trackNameEl) {
      trackNameEl.textContent = currentFileName || 'No track loaded';
    }
  }

  function updatePlayPauseButton() {
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    if (playIcon && pauseIcon) {
      if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
      } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
      }
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
    
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
      const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
      };
      
      const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
      };
      
      const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) await setFile(file);
      };
      
      dropZone.addEventListener('dragover', handleDragOver);
      dropZone.addEventListener('dragleave', handleDragLeave);
      dropZone.addEventListener('drop', handleDrop);
      
      // Handle click on browse button
      const browseBtn = dropZone.querySelector('.drop-upload-btn');
      if (browseBtn) {
        browseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          input.click();
        });
      }
      
      // Also allow clicking anywhere on the drop zone to trigger file input
      dropZone.addEventListener('click', (e) => {
        // Only trigger if not clicking the button itself
        if (!e.target.closest('.drop-upload-btn')) {
          input.click();
        }
      });
    }

    const btn = document.getElementById('playPauseBtn');
    if (btn) {
      btn.addEventListener('click', async () => {
        ensureContext();
        if (audioCtx.state === 'suspended') await audioCtx.resume();
        togglePlay();
      });
    }
    
    // Time slider seeking
    const timeSlider = document.getElementById('timeSlider');
    if (timeSlider) {
      let isDragging = false;
      
      timeSlider.addEventListener('mousedown', () => {
        isDragging = true;
      });
      
      timeSlider.addEventListener('mouseup', () => {
        if (isDragging && mediaEl && !isNaN(mediaEl.duration) && mediaEl.duration > 0) {
          const seekTime = parseFloat(timeSlider.value);
          if (!isNaN(seekTime)) {
            mediaEl.currentTime = seekTime;
          }
        }
        isDragging = false;
      });
      
      timeSlider.addEventListener('input', () => {
        if (isDragging && mediaEl && !isNaN(mediaEl.duration) && mediaEl.duration > 0) {
          const seekTime = parseFloat(timeSlider.value);
          if (!isNaN(seekTime)) {
            mediaEl.currentTime = seekTime;
          }
        }
      });
      
      // Also handle touch events for mobile
      timeSlider.addEventListener('touchstart', () => {
        isDragging = true;
      });
      
      timeSlider.addEventListener('touchend', () => {
        if (isDragging && mediaEl && !isNaN(mediaEl.duration) && mediaEl.duration > 0) {
          const seekTime = parseFloat(timeSlider.value);
          if (!isNaN(seekTime)) {
            mediaEl.currentTime = seekTime;
          }
        }
        isDragging = false;
      });
      
      // Handle mouse leave while dragging
      timeSlider.addEventListener('mouseleave', () => {
        if (isDragging && mediaEl && !isNaN(mediaEl.duration) && mediaEl.duration > 0) {
          const seekTime = parseFloat(timeSlider.value);
          if (!isNaN(seekTime)) {
            mediaEl.currentTime = seekTime;
          }
        }
        isDragging = false;
      });
    }
    
    updatePlayPauseButton();
  }

  function getBands() {
    return computeBands().slice(0);
  }
  function getKick() { return { ...kick }; }
  function getBeat() {
    return {
      overall: beat.overall,
      kick: { ...kick },
      snare: { ...snare },
      hihat: { ...hihat }
    };
  }

  function init() {
    setupUI();
  }

  return {
    init,
    getBands,
    getKick,
    getBeat,
    isPlaying: () => isPlaying,
    getFileName: () => currentFileName,
    NUM_BANDS
  };
})();


