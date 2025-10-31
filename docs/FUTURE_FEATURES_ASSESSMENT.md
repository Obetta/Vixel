# Future Features Assessment

## Summary

### 1. Live Input (Microphone / Line-In)

**Requirements:**
- Capture live audio input via `navigator.mediaDevices.getUserMedia({ audio: true })`
- Create `MediaStreamAudioSourceNode` and connect to existing `AnalyserNode`
- Optimize for low latency: lower FFT sizes (e.g., 1024), tune smoothing
- WebRTC constraints for echo cancellation and noise suppression
- UX components: microphone toggle, input device selector, level meter
- Safety: gain clamping, limiter for live signal
- Future enhancements: onset detection, multi-band gates

### 2. Video Support

**Requirements:**
- **Video texture background:** Create hidden `<video>` element → `THREE.VideoTexture` → fullscreen quad behind vector field
- User controls: toggle/scale/luma-blend video backdrop
- **Audio extraction without playback:** Muted video playback with audio routed to Web Audio
- Scrubbing controls for analyzing video segments
- **Beat-synced effects:** Read frame timestamps/subtitles to cue visual changes
- Performance: `playsInline`, reasonable resolutions, hardware-accelerated decoding
- Pause rendering when tab is hidden

---

## Current Implementation Assessment

### ✅ Already Implemented

#### Video Support (Partial)
- **File acceptance:** `index.html` line 202 accepts both `audio/*` and `video/*` files
- **Audio extraction:** `js/audio/loader.js` line 15 creates `<video>` element for video files
- **Audio processing:** Video files are handled identically to audio files - audio track is extracted and routed through Web Audio API
- **Pre-scanning:** Video files can be pre-scanned for frequency analysis (same as audio files)

### ❌ Not Implemented

#### Live Input (Microphone / Line-In)
- **No `getUserMedia` calls:** No microphone access implementation
- **No `MediaStreamAudioSourceNode`:** Only `MediaElementAudioSourceNode` is used (line 138 in `loader.js`)
- **No device selection:** No input device enumeration or selection UI
- **No level meter:** No visual feedback for live input levels
- **No microphone toggle:** No UI control for enabling/disabling live input
- **FFT size fixed:** Current FFT size is 2048 (in `analyzer.js` line 19), not optimized for live input latency

#### Video Support (Missing Features)
- **No video texture rendering:** Video is never rendered as a background texture
- **No `VideoTexture`:** Three.js VideoTexture not created or used
- **No video controls:** No UI for toggling/controlling video display
- **No muted playback mode:** Video always plays normally when loaded
- **No scrubbing controls:** No frame-by-frame or segment analysis features
- **No metadata extraction:** No reading of frame timestamps or subtitle data
- **Video always visible:** If video element exists, it's hidden but audio still plays

---

## Implementation Gaps

### Live Input Gap Analysis

1. **Core Audio Pipeline** ❌
   - Need: `MediaStreamAudioSourceNode` creation and connection
   - Current: Only `MediaElementAudioSourceNode` exists
   - Impact: **Critical** - Core functionality missing

2. **Permissions & Setup** ❌
   - Need: `getUserMedia()` call with error handling
   - Current: No permission requests
   - Impact: **Critical** - Cannot access microphone

3. **Latency Optimization** ⚠️
   - Need: Lower FFT size (1024) for live input mode
   - Current: Fixed 2048 FFT size
   - Impact: **Medium** - Higher latency for live input

4. **User Interface** ❌
   - Need: Microphone toggle, device selector, level meter
   - Current: No UI components
   - Impact: **High** - Poor user experience

5. **Safety Features** ❌
   - Need: Gain clamping, limiter
   - Current: No protection against loud signals
   - Impact: **Medium** - Potential audio distortion

### Video Support Gap Analysis

1. **Video Texture Rendering** ❌
   - Need: `THREE.VideoTexture` + fullscreen quad in scene
   - Current: Video element exists but is hidden, texture never created
   - Impact: **Critical** - Main feature missing

2. **Video Controls UI** ❌
   - Need: Toggle, scale, blend mode controls
   - Current: No video-specific UI
   - Impact: **High** - Users cannot control video display

3. **Muted Playback Mode** ⚠️
   - Need: Video playback without visual display but with audio analysis
   - Current: Video would play normally if shown, but it's hidden anyway
   - Impact: **Low** - Workaround exists but not intentional

4. **Video Scrubbing** ❌
   - Need: Frame-by-frame or segment analysis
   - Current: Standard playback controls only
   - Impact: **Medium** - Advanced feature missing

5. **Metadata Integration** ❌
   - Need: Frame timestamp/subtitle reading
   - Current: No metadata extraction
   - Impact: **Low** - Nice-to-have feature

---

## Architecture Compatibility

### Good News ✅

- **Modular structure:** Audio system is well-separated (`js/audio/` modules)
- **Existing analyzer:** `AnalyserNode` already exists and can accept multiple source types
- **Audio context management:** Proper `AudioContext` handling in `analyzer.js`
- **File loading abstraction:** `loader.js` has clean separation for media element creation

### Challenges ⚠️

- **Single source limitation:** Current design assumes one source at a time
- **No source switching logic:** Would need to add logic to switch between file and live input
- **FFT size is global:** Current implementation has fixed FFT size per `AnalyserNode`
- **Pre-scanning dependency:** Pre-scanner assumes file input (would need modification for live input)
- **No scene integration:** Video texture would need integration with `js/core/scene.js` or `js/particles/`

---

## Recommendations

### Priority 1: Video Texture Background (Easier)
- **Effort:** Medium
- **Dependencies:** Three.js VideoTexture, scene integration
- **Risk:** Low - additive feature, doesn't break existing functionality
- **Impact:** High - Visible feature improvement

### Priority 2: Live Input (Harder)
- **Effort:** High
- **Dependencies:** Permissions, source switching, latency optimization
- **Risk:** Medium - Requires careful audio context management
- **Impact:** High - New capability, significant UX change

### Priority 3: Video Enhancements (Nice-to-have)
- **Effort:** Low-Medium (per feature)
- **Dependencies:** Video texture implementation
- **Risk:** Low
- **Impact:** Medium - Advanced features

---

## Implementation Notes

### For Live Input:
- Should add a new module: `js/audio/liveInput.js`
- Need to modify `js/audio/index.js` to support source switching
- Consider making FFT size configurable per source type
- Pre-scanner should skip live input (or have different mode)

### For Video Texture:
- Add video texture creation in `loader.js` or new `js/video/texture.js`
- Integrate with `js/core/scene.js` to add video quad to scene graph
- Add video controls to `js/audio/ui.js` or separate `js/video/ui.js`
- Ensure video texture updates each frame (needs `requestAnimationFrame` sync)

