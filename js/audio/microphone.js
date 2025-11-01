// Live microphone/line-in input support

window.VixelAudioMicrophone = (function() {
  const MIC_FFT_SIZE = 1024; // Lower FFT for latency
  const DEFAULT_GAIN = 0.7; // Lower default to prevent clipping
  const MAX_GAIN = 2.0; // Gain limiter
  const LEVEL_UPDATE_INTERVAL = 50; // ms between level meter updates
  
  let audioCtx = null;
  let analyser = null;
  let streamSource = null;
  let mediaStream = null;
  let isActive = false;
  let currentDeviceId = null;
  let availableDevices = [];
  let levelMeterInterval = null;
  let inputLevel = 0;

  async function requestAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Stop the temporary stream - we'll get a new one with the selected device
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error('[Mic] Failed to request microphone access:', err);
      return false;
    }
  }

  async function getDevices(requestPermission = false) {
    try {
      // Only request permission if explicitly asked (when mic is active)
      if (requestPermission) {
        await requestAccess();
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          // Label will be empty if permission not granted - that's fine for enumeration
          label: device.label || `Microphone ${device.deviceId.substring(0, 8)}`,
          groupId: device.groupId
        }));
    } catch (err) {
      console.error('[Mic] Failed to enumerate devices:', err);
      return [];
    }
  }

  async function start(audioCtxRef, analyserRef, deviceId = null) {
    if (isActive) {
      await stop();
    }

    audioCtx = audioCtxRef;
    analyser = analyserRef;

    try {
      // Configure analyser for low latency
      if (window.VixelAudioAnalyzer && window.VixelAudioAnalyzer.setFFTSize) {
        window.VixelAudioAnalyzer.setFFTSize(MIC_FFT_SIZE);
      } else {
        analyser.fftSize = MIC_FFT_SIZE;
      }
      analyser.smoothingTimeConstant = 0.6;

      // Get stream
      const constraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false // Disable auto gain to prevent clipping
        }
      };

      mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      currentDeviceId = deviceId || mediaStream.getAudioTracks()[0]?.getSettings()?.deviceId;

      // Resume audio context if suspended (required for getUserMedia)
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      // Create source node
      streamSource = audioCtx.createMediaStreamSource(mediaStream);

      // Connect microphone through shared processor if available
      // Otherwise use direct connection
      if (window.VixelAudioProcessor && window.VixelAudioProcessor.getInputNode) {
        const processorInput = window.VixelAudioProcessor.getInputNode();
        streamSource.connect(processorInput);
      } else {
        // Fallback: direct connection
        streamSource.connect(analyser);
      }
      
      // Ensure analyser is connected to destination for monitoring
      // (This won't create duplicate connections - loader might have already connected it)
      try {
        analyser.connect(audioCtx.destination);
      } catch (err) {
        // Already connected, that's fine
      }

      isActive = true;

      // Start level meter
      startLevelMeter();

      // Refresh device list in case permissions changed
      availableDevices = await getDevices();

      return true;
    } catch (err) {
      console.error('[Mic] Failed to start microphone:', err);
      isActive = false;
      throw err;
    }
  }

  async function stop() {
    isActive = false;
    
    // Stop level meter
    stopLevelMeter();

    // Disconnect nodes
    if (streamSource) {
      try {
        streamSource.disconnect();
      } catch (_) {}
      streamSource = null;
    }

    // Stop media stream tracks
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        track.stop();
      });
      mediaStream = null;
    }

    currentDeviceId = null;
  }

  function startLevelMeter() {
    if (levelMeterInterval) return;
    
    // Use time domain data for level metering (waveform amplitude)
    const dataArray = new Uint8Array(analyser.fftSize);
    
    levelMeterInterval = setInterval(() => {
      if (!analyser || !isActive) {
        inputLevel = 0;
        if (window.VixelAudioUI && window.VixelAudioUI.updateMicLevel) {
          window.VixelAudioUI.updateMicLevel(0);
        }
        return;
      }
      
      // Get time domain data (raw waveform)
      analyser.getByteTimeDomainData(dataArray);
      
      // Calculate RMS level from waveform
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        // Convert unsigned byte (0-255) to signed (-128 to 127)
        const sample = (dataArray[i] - 128) / 128;
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      // Normalize to 0-1 range, with some scaling for better visual response
      inputLevel = Math.min(1, rms * 2);
      
      // Update UI if callback exists
      if (window.VixelAudioUI && window.VixelAudioUI.updateMicLevel) {
        window.VixelAudioUI.updateMicLevel(inputLevel);
      }
    }, LEVEL_UPDATE_INTERVAL);
  }

  function stopLevelMeter() {
    if (levelMeterInterval) {
      clearInterval(levelMeterInterval);
      levelMeterInterval = null;
    }
    inputLevel = 0;
    if (window.VixelAudioUI && window.VixelAudioUI.updateMicLevel) {
      window.VixelAudioUI.updateMicLevel(0);
    }
  }


  function getInputLevel() {
    return inputLevel;
  }

  function isMicrophoneActive() {
    return isActive;
  }

  function getCurrentDeviceId() {
    return currentDeviceId;
  }

  async function refreshDevices() {
    availableDevices = await getDevices();
    return availableDevices;
  }

  return {
    requestAccess,
    getDevices,
    start,
    stop,
    getInputLevel,
    isMicrophoneActive,
    getCurrentDeviceId,
    refreshDevices,
    MIC_FFT_SIZE
  };
})();

