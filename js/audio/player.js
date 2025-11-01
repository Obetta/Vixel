// Audio playback control

window.VixelAudioPlayer = (function() {
  let isPlaying = false;
  let audioCtx = null;

  function setPlaying(value) {
    isPlaying = value;
  }

  function getPlaying() {
    return isPlaying;
  }

  async function toggle(audioCtxRef, mediaEl) {
    if (!audioCtxRef || !mediaEl) return;
    audioCtx = audioCtxRef;
    
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    
    if (isPlaying) {
      mediaEl.pause();
      isPlaying = false;
    } else {
      mediaEl.play();
      isPlaying = true;
    }
    
    if (window.VixelAudioUI) {
      window.VixelAudioUI.updatePlayPauseButton(isPlaying);
    }
  }

  return {
    setPlaying,
    getPlaying,
    toggle
  };
})();

