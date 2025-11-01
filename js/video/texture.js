// Video texture management for Three.js scene background

window.VixelVideoTexture = (function() {
  const DEBUG = window.DEBUG || false;
  let videoTexture = null;
  let videoQuad = null;
  let currentVideoElement = null;
  let isVideoMode = false;
  let originalQuadSize = 1.0; // Store original size for scaling

  /**
   * Create a video texture from a video element
   * @param {HTMLVideoElement} videoEl - The video element
   * @returns {THREE.VideoTexture} The video texture
   */
  function createVideoTexture(videoEl) {
    if (!videoEl || !(videoEl instanceof HTMLVideoElement)) {
      console.error('[VideoTexture] Invalid video element provided');
      return null;
    }

    try {
      const texture = new THREE.VideoTexture(videoEl);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat;
      texture.generateMipmaps = false;
      
      if (DEBUG) {
        console.log('[VideoTexture] Created video texture from element');
      }
      
      return texture;
    } catch (error) {
      console.error('[VideoTexture] Failed to create texture:', error);
      return null;
    }
  }

  /**
   * Create a fullscreen quad behind the vector field
   * @param {THREE.VideoTexture} texture - The video texture
   * @param {Object} sceneBounds - Scene bounds for positioning
   * @returns {THREE.Mesh} The video quad mesh
   */
  function createVideoQuad(texture, sceneBounds = { bounds: 9.0 }) {
    if (!texture) {
      console.error('[VideoTexture] Cannot create quad without texture');
      return null;
    }

    try {
      // Create a large quad positioned behind the visualization
      // Make it large enough to always cover the camera view
      const quadSize = sceneBounds.bounds * 2.5; // Large enough to always be visible
      originalQuadSize = quadSize; // Store for scaling
      
      const geometry = new THREE.PlaneGeometry(quadSize, quadSize);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.85, // Slightly transparent for visual blending
        side: THREE.DoubleSide,
        depthWrite: false, // Don't write to depth buffer so it stays behind
        blending: THREE.NormalBlending, // Default blend mode
      });

      const quad = new THREE.Mesh(geometry, material);
      quad.position.z = -sceneBounds.bounds * 0.8; // Behind the visualization
      quad.name = 'vixel-video-quad';
      quad.renderOrder = -1; // Render first, behind everything
      
      if (DEBUG) {
        console.log('[VideoTexture] Created video quad with size:', quadSize);
      }
      
      return quad;
    } catch (error) {
      console.error('[VideoTexture] Failed to create quad:', error);
      return null;
    }
  }

  /**
   * Initialize video texture from a video element
   * @param {HTMLVideoElement} videoEl - The video element
   * @param {Object} sceneBounds - Scene bounds
   * @returns {Object|null} Object with texture and quad, or null on failure
   */
  function initVideoTexture(videoEl, sceneBounds) {
    if (!videoEl) {
      console.error('[VideoTexture] No video element provided');
      return null;
    }

    // Clean up existing video texture if any
    cleanup();

    // Create texture from video element
    const texture = createVideoTexture(videoEl);
    if (!texture) {
      return null;
    }

    videoTexture = texture;
    currentVideoElement = videoEl;

    // Create fullscreen quad
    const quad = createVideoQuad(texture, sceneBounds);
    if (!quad) {
      cleanup();
      return null;
    }

    videoQuad = quad;
    isVideoMode = true;

    if (DEBUG) {
      console.log('[VideoTexture] Video texture initialized successfully');
    }

    return { texture, quad };
  }

  /**
   * Update texture needsUpdate flag each frame (required for video textures)
   */
  function update() {
    if (videoTexture && videoTexture.image && videoTexture.image.videoWidth > 0) {
      videoTexture.needsUpdate = true;
    }
  }

  /**
   * Get the current video quad mesh
   * @returns {THREE.Mesh|null} The video quad
   */
  function getVideoQuad() {
    return videoQuad;
  }

  /**
   * Get the current video texture
   * @returns {THREE.VideoTexture|null} The video texture
   */
  function getVideoTexture() {
    return videoTexture;
  }

  /**
   * Set video quad visibility
   * @param {boolean} visible - Whether to show the video
   */
  function setVisible(visible) {
    if (videoQuad) {
      videoQuad.visible = visible;
    }
  }

  /**
   * Get video quad visibility
   * @returns {boolean} Whether the video is visible
   */
  function isVisible() {
    return videoQuad ? videoQuad.visible : false;
  }

  /**
   * Set video quad opacity
   * @param {number} opacity - Opacity value between 0 and 1
   */
  function setOpacity(opacity) {
    if (videoQuad && videoQuad.material) {
      videoQuad.material.opacity = Math.max(0, Math.min(1, opacity));
    }
  }

  /**
   * Get video quad opacity
   * @returns {number} Current opacity
   */
  function getOpacity() {
    return videoQuad && videoQuad.material ? videoQuad.material.opacity : 0;
  }

  /**
   * Set video quad scale
   * @param {number} scale - Scale value (1.0 = 100%, 0.5 = 50%, 2.0 = 200%, etc.)
   */
  function setScale(scale) {
    if (videoQuad) {
      const clampedScale = Math.max(0.01, Math.min(10, scale)); // Clamp between 1% and 1000%
      videoQuad.scale.set(clampedScale, clampedScale, 1);
    }
  }

  /**
   * Get video quad scale
   * @returns {number} Current scale value
   */
  function getScale() {
    return videoQuad ? videoQuad.scale.x : 1.0;
  }

  /**
   * Set video material blend mode
   * @param {string} blendMode - Blend mode name (Normal, Additive, Multiply, Subtract, Multiply, Screen, etc.)
   */
  function setBlendMode(blendMode) {
    if (!videoQuad || !videoQuad.material) return;

    // Map string names to THREE.js blend mode constants
    const blendModes = {
      'Normal': THREE.NormalBlending,
      'Additive': THREE.AdditiveBlending,
      'Subtract': THREE.SubtractBlending,
      'Multiply': THREE.MultiplyBlending,
      'Screen': THREE.CustomBlending, // Screen requires custom blending
      'Overlay': THREE.CustomBlending,
      'Darken': THREE.CustomBlending,
      'Lighten': THREE.CustomBlending,
      'ColorDodge': THREE.CustomBlending,
      'ColorBurn': THREE.CustomBlending,
      'HardLight': THREE.CustomBlending,
      'SoftLight': THREE.CustomBlending,
      'Difference': THREE.CustomBlending,
      'Exclusion': THREE.CustomBlending
    };

    const mode = blendModes[blendMode] || THREE.NormalBlending;
    videoQuad.material.blending = mode;

    // For Screen blend mode, use custom blending equation
    if (blendMode === 'Screen' && mode === THREE.CustomBlending) {
      videoQuad.material.blendEquation = THREE.AddEquation;
      videoQuad.material.blendSrc = THREE.OneMinusDstColorFactor;
      videoQuad.material.blendDst = THREE.OneFactor;
    } else if (mode === THREE.CustomBlending && blendMode !== 'Screen') {
      // For other custom modes, default to normal blending
      videoQuad.material.blending = THREE.NormalBlending;
    }
  }

  /**
   * Get current blend mode name
   * @returns {string} Current blend mode name
   */
  function getBlendMode() {
    if (!videoQuad || !videoQuad.material) return 'Normal';

    const mode = videoQuad.material.blending;
    const blendModeMap = {
      [THREE.NormalBlending]: 'Normal',
      [THREE.AdditiveBlending]: 'Additive',
      [THREE.SubtractBlending]: 'Subtract',
      [THREE.MultiplyBlending]: 'Multiply'
    };

    // Check for Screen blend mode (custom with specific equation)
    if (mode === THREE.CustomBlending && 
        videoQuad.material.blendSrc === THREE.OneMinusDstColorFactor) {
      return 'Screen';
    }

    return blendModeMap[mode] || 'Normal';
  }

  /**
   * Check if video mode is active
   * @returns {boolean} Whether video mode is active
   */
  function isActive() {
    return isVideoMode;
  }

  /**
   * Clean up video texture resources
   */
  function cleanup() {
    if (videoTexture) {
      try {
        videoTexture.dispose();
      } catch (error) {
        console.error('[VideoTexture] Error disposing texture:', error);
      }
      videoTexture = null;
    }

    if (videoQuad) {
      try {
        videoQuad.geometry.dispose();
        videoQuad.material.dispose();
        if (videoQuad.parent) {
          videoQuad.parent.remove(videoQuad);
        }
      } catch (error) {
        console.error('[VideoTexture] Error disposing quad:', error);
      }
      videoQuad = null;
    }

    currentVideoElement = null;
    isVideoMode = false;

    if (DEBUG) {
      console.log('[VideoTexture] Cleanup complete');
    }
  }

  return {
    initVideoTexture,
    update,
    getVideoQuad,
    getVideoTexture,
    setVisible,
    isVisible,
    setOpacity,
    getOpacity,
    setScale,
    getScale,
    setBlendMode,
    getBlendMode,
    isActive,
    cleanup
  };
})();

