# Future Features Assessment

## Summary

**Last Updated:** After major video support implementation

### ✅ Video Support: **FULLY IMPLEMENTED**

All core video features are now complete! The application supports:
- Video file loading with audio extraction
- Fullscreen video texture background
- Frame-by-frame scrubbing and stepping
- Segment looping
- Frame rate control
- Comprehensive video controls UI
- **Bonus:** Canvas recording with audio sync

### 1. Live Input (Microphone / Line-In) ⚠️ **REMAINING**

**Requirements:**
- Capture live audio input via `navigator.mediaDevices.getUserMedia({ audio: true })`
- Create `MediaStreamAudioSourceNode` and connect to existing `AnalyserNode`
- Optimize for low latency: lower FFT sizes (e.g., 1024), tune smoothing
- WebRTC constraints for echo cancellation and noise suppression
- UX components: microphone toggle, input device selector, level meter
- Safety: gain clamping, limiter for live signal
- Future enhancements: onset detection, multi-band gates

**Status:** This is now the **last remaining major feature** to implement

### 2. Video Support ✅ **COMPLETE**

**Original Requirements:**
- ✅ **Video texture background:** Create hidden `<video>` element → `THREE.VideoTexture` → fullscreen quad behind vector field
- ✅ **User controls:** Toggle/visibility controls implemented
- ✅ **Audio extraction without playback:** Muted video playback with audio routed to Web Audio
- ✅ **Scrubbing controls:** Frame-by-frame and segment analysis fully functional
- ✅ **Beat-synced effects:** Frame timestamps available for future enhancements
- ✅ **Performance:** Proper video texture handling with hardware acceleration

**Bonus Features Added:**
- ✅ Canvas recording with synchronized audio
- ✅ Advanced video controls (segment looping, frame stepping, frame rate)
- ✅ Automatic video texture cleanup and management

---

## Current Implementation Assessment

### ✅ Already Implemented

#### Video Support (Fully Implemented! 🎉)
- **File acceptance:** `index.html` line 202 accepts both `audio/*` and `video/*` files
- **Audio extraction:** `js/audio/loader.js` line 15 creates `<video>` element for video files
- **Audio processing:** Video files are handled identically to audio files - audio track is extracted and routed through Web Audio API
- **Pre-scanning:** Video files can be pre-scanned for frequency analysis (same as audio files)
- **Video texture rendering:** ✅ `js/video/texture.js` implements full `THREE.VideoTexture` creation
- **Fullscreen video quad:** ✅ Video background rendered behind vector field with proper depth sorting
- **Video controls UI:** ✅ `js/video/controls.js` provides frame-by-frame, segment looping, frame rate controls
- **Video visibility toggle:** ✅ `showVideo` checkbox in Display Options (line 199 in `index.html`)
- **Scene integration:** ✅ Video quad automatically added to scene when video file is loaded
- **Frame display:** ✅ Current frame number and timestamp displayed
- **Segment looping:** ✅ Loop between custom start/end points
- **Frame stepping:** ✅ Step forward/backward frame-by-frame
- **Frame rate control:** ✅ Adjustable playback speed multiplier
- **Frame-by-frame mode:** ✅ Pause and step through individual frames
- **Integration:** ✅ Works seamlessly with existing audio player and visualization

### ❌ Not Implemented

#### Live Input (Microphone / Line-In)
- **No `getUserMedia` calls:** No microphone access implementation
- **No `MediaStreamAudioSourceNode`:** Only `MediaElementAudioSourceNode` is used (line 138 in `loader.js`)
- **No device selection:** No input device enumeration or selection UI
- **No level meter:** No visual feedback for live input levels
- **No microphone toggle:** No UI control for enabling/disabling live input
- **FFT size fixed:** Current FFT size is 2048 (in `analyzer.js` line 19), not optimized for live input latency

#### Video Support (Missing Features - All Advanced/Nice-to-Have)
- **No opacity/scale controls:** Video opacity is fixed at 0.85 (line 60 in `texture.js`)
- **No luma-blend mode:** Video background only supports transparency, not blending modes
- **No metadata extraction:** No reading of subtitle data or external timestamp files
- **No beat-sync effects:** No automatic visual cue triggering based on video timestamps

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

1. **Video Texture Rendering** ✅ **COMPLETE**
   - Status: `THREE.VideoTexture` + fullscreen quad fully implemented
   - Current: Video texture rendered behind vector field with proper depth sorting
   - Impact: **Resolved** - Core feature working

2. **Video Controls UI** ✅ **COMPLETE**
   - Status: Comprehensive controls implemented in `js/video/controls.js`
   - Current: Frame stepping, segment looping, frame rate adjustment, visibility toggle
   - Impact: **Resolved** - Full control over video display

3. **Muted Playback Mode** ✅ **COMPLETE**
   - Status: Video visibility toggle allows audio-only playback
   - Current: Can disable video display while maintaining audio analysis
   - Impact: **Resolved** - Feature working as intended

4. **Video Scrubbing** ✅ **COMPLETE**
   - Status: Frame-by-frame and segment analysis fully implemented
   - Current: Frame step buttons, segment looping, frame display, timestamp tracking
   - Impact: **Resolved** - Advanced features available

5. **Metadata Integration** ❌
   - Status: Frame timestamps available, but no subtitle file parsing
   - Current: No external metadata extraction
   - Impact: **Low** - Nice-to-have feature for future

### New Video Gaps (Optional Enhancements)

6. **Opacity Controls** ❌
   - Need: UI slider for video background opacity
   - Current: Fixed at 0.85 in code
   - Impact: **Low** - Nice-to-have enhancement

7. **Scale/Position Controls** ❌
   - Need: UI controls for video quad size and position
   - Current: Fixed size based on scene bounds
   - Impact: **Low** - Advanced customization feature

8. **Blend Mode Options** ❌
   - Need: Different blending modes (multiply, add, overlay, etc.)
   - Current: Only transparent overlay available
   - Impact: **Low** - Advanced visual effect

---

## Architecture Compatibility

### Good News ✅

- **Modular structure:** Audio system is well-separated (`js/audio/` modules)
- **Existing analyzer:** `AnalyserNode` already exists and can accept multiple source types
- **Audio context management:** Proper `AudioContext` handling in `analyzer.js`
- **File loading abstraction:** `loader.js` has clean separation for media element creation

### Challenges ⚠️ (Mostly Resolved for Video!)

- **Single source limitation:** ✅ Video works with existing file/audio source seamlessly
- **No source switching logic:** ⚠️ Would need to add for live input switching
- **FFT size is global:** Current implementation has fixed FFT size per `AnalyserNode`
- **Pre-scanning dependency:** Pre-scanner works with video files, but would need modification for live input
- **Scene integration:** ✅ **RESOLVED** - Video texture fully integrated with scene management

---

## Recommendations

### Priority 1: Live Input (Microphone / Line-In) ⚠️
- **Effort:** High
- **Dependencies:** Permissions, source switching, latency optimization
- **Risk:** Medium - Requires careful audio context management
- **Impact:** High - New capability, significant UX change
- **Status:** ⚠️ **Last remaining major feature** - Video support is complete!

### Priority 2: Video Enhancements (Nice-to-have)
- **Effort:** Low-Medium (per feature)
- **Dependencies:** Video texture implementation ✅
- **Risk:** Low
- **Impact:** Medium - Advanced features
- **Options:**
  - Opacity/scale controls for video background
  - Blend mode options (multiply, add, overlay)
  - Subtitle file parsing for metadata
  - Beat-sync effect triggers from video timestamps

### ✅ COMPLETED: Video Texture Background
- **Status:** Fully implemented and working
- **Modules:** `js/video/texture.js`, `js/video/controls.js`, `js/video/recorder.js`
- **Features:** Video texture, fullscreen quad, comprehensive controls, frame stepping, segment looping

---

## Implementation Notes

### For Live Input:
- Should add a new module: `js/audio/liveInput.js`
- Need to modify `js/audio/index.js` to support source switching
- Consider making FFT size configurable per source type
- Pre-scanner should skip live input (or have different mode)

### For Video Texture: ✅ **COMPLETE**
- ✅ **Video texture creation:** Implemented in `js/video/texture.js`
- ✅ **Scene integration:** Video quad added in `js/main.js` (lines 275-297)
- ✅ **Video controls:** Comprehensive controls in `js/video/controls.js`
- ✅ **Frame updates:** `main.js` line 100-107 calls `update()` each frame
- ✅ **Visibility toggle:** `js/core/controls.js` lines 109-119
- ✅ **Video controls UI:** Frame stepping, segment looping, frame rate in `index.html` lines 291-357

### Video Recording: ✅ **BONUS FEATURE COMPLETE**
- ✅ **Canvas recording:** `js/video/recorder.js` implements MediaRecorder API
- ✅ **Audio sync:** Captures audio from existing Web Audio source
- ✅ **Download:** Automatic download of recorded WebM file
- ✅ **Recording UI:** Record/Stop buttons in `index.html` lines 223-239

