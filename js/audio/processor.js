// Shared audio processing chain (compressor/limiter/EQ) for all audio sources

window.VixelAudioProcessor = (function() {
  let audioCtx = null;
  let compressorNode = null;
  let gainNode = null;
  let analyserInput = null; // Node that feeds into analyser
  
  const DEFAULT_GAIN = 1.0;
  const DEFAULT_THRESHOLD = -12;
  const DEFAULT_RATIO = 20;
  const DEFAULT_KNEE = 0;
  const DEFAULT_ATTACK = 0.001;
  const DEFAULT_RELEASE = 0.1;

  function initialize(audioCtxRef, analyserRef) {
    audioCtx = audioCtxRef;
    
    // Create gain node
    gainNode = audioCtx.createGain();
    gainNode.gain.value = DEFAULT_GAIN;

    // Create dynamics compressor as limiter
    compressorNode = audioCtx.createDynamicsCompressor();
    compressorNode.threshold.value = DEFAULT_THRESHOLD;
    compressorNode.knee.value = DEFAULT_KNEE;
    compressorNode.ratio.value = DEFAULT_RATIO;
    compressorNode.attack.value = DEFAULT_ATTACK;
    compressorNode.release.value = DEFAULT_RELEASE;

    // Connect: gain -> compressor -> analyser
    gainNode.connect(compressorNode);
    compressorNode.connect(analyserRef);
    
    analyserInput = gainNode; // This is the entry point for all audio sources
    
    return {
      inputNode: analyserInput,
      gainNode,
      compressorNode
    };
  }

  function setGain(value) {
    const clamped = Math.max(0, Math.min(2, value));
    if (gainNode) {
      gainNode.gain.value = clamped;
    }
    return clamped;
  }

  function getGain() {
    return gainNode ? gainNode.gain.value : DEFAULT_GAIN;
  }

  function setCompressorThreshold(value) {
    if (compressorNode) {
      compressorNode.threshold.value = value;
    }
  }

  function getCompressorThreshold() {
    return compressorNode ? compressorNode.threshold.value : DEFAULT_THRESHOLD;
  }

  function setCompressorRatio(value) {
    if (compressorNode) {
      compressorNode.ratio.value = value;
    }
  }

  function getCompressorRatio() {
    return compressorNode ? compressorNode.ratio.value : DEFAULT_RATIO;
  }

  function setCompressorKnee(value) {
    if (compressorNode) {
      compressorNode.knee.value = value;
    }
  }

  function getCompressorKnee() {
    return compressorNode ? compressorNode.knee.value : DEFAULT_KNEE;
  }

  function setCompressorAttack(value) {
    if (compressorNode) {
      compressorNode.attack.value = value;
    }
  }

  function getCompressorAttack() {
    return compressorNode ? compressorNode.attack.value : DEFAULT_ATTACK;
  }

  function setCompressorRelease(value) {
    if (compressorNode) {
      compressorNode.release.value = value;
    }
  }

  function getCompressorRelease() {
    return compressorNode ? compressorNode.release.value : DEFAULT_RELEASE;
  }

  function getInputNode() {
    return analyserInput;
  }

  return {
    initialize,
    setGain,
    getGain,
    setCompressorThreshold,
    getCompressorThreshold,
    setCompressorRatio,
    getCompressorRatio,
    setCompressorKnee,
    getCompressorKnee,
    setCompressorAttack,
    getCompressorAttack,
    setCompressorRelease,
    getCompressorRelease,
    getInputNode
  };
})();

