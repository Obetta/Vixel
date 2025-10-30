# Future: Video Support

This starter already accepts video files and extracts audio via the media element. The following features can extend video integration:

- Video texture background
  - Create a hidden `<video>` element and a `THREE.VideoTexture`.
  - Map to a fullscreen quad behind the vector field.
  - Add user control to toggle/scale/luma-blend the video backdrop.

- Audio from video without playback
  - Allow muted video playback but keep audio routed to Web Audio.
  - Provide scrubbing controls to analyze segments.

- Beat-synced effects from video metadata
  - Read frame timestamps or subtitles to cue visual changes.

- Performance
  - Use `playsInline`, reasonable video resolutions, and hardware-accelerated decoding.
  - Pause rendering when tab is hidden to save resources.
