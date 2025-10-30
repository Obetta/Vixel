# Vixel Architecture

This document explains the full audio → visual pipeline and which parameters are user-facing vs internal.

## Pipeline overview

1) Audio input (file or video extraction)
- User selects or drags an audio/video file.
- For videos, audio is extracted via the media element and connected to Web Audio.

2) Web Audio API → FFT → 8 frequency bands
- `AnalyserNode` performs FFT (size 2048 by default) and returns frequency magnitudes.
- Magnitudes are grouped into 8 roughly log-spaced bands.

3) Normalization and per-band amplitude calculation
- Raw magnitudes (0–255) are averaged within each band and normalized to 0–1.
- A peak-hold with decay smooths the readings frame-to-frame.

4) Vector weighting
- For each band: `motion_weight = pow(f_norm, gamma)`.
- `gamma` > 1 biases high values and suppresses noise.

5) Motion patterns applied
- Linear drift: slow X/Y drift modulated by mid/high bands.
- Perlin oscillation: low-frequency pseudo-random displacement in Z.
- Radial/spherical field: distance- and angle-driven push/pull.

6) Kick/bass detection triggers pulses
- Low bands are compared to an adaptive threshold.
- On hit, a pulse increases size and adds an outward push.

7) Trail alpha fading logic
- A fullscreen transparent quad is rendered each frame to fade the previous frame (alpha depends on Trail Length).
- Instanced vectors are drawn on top, producing motion trails.

8) Color modulation by amplitude
- A color gradient is sampled by overall amplitude to tint instances.

9) Rendering in Three.js InstancedMesh
- A `THREE.InstancedMesh` holds all vector instances (cones) for efficient GPU rendering.

## Parameters

User-facing controls
- Vector density: number of instances arranged on a grid.
- Oscillation intensity: scales the Perlin Z oscillation.
- Trail length/fade: adjusts the alpha used to fade the previous frame.
- Color presets: selects the gradient used for modulation.
- Band visibility: toggles per-band contributions.
- Kick/bass sensitivity: controls detection threshold.

Internal/proprietary parameters
- `gamma`: exponent in weighting (`pow(f_norm, gamma)`), default ~1.4.
- Decay constants: smoothing for band amplitudes and kick level.
- Noise amplitude: scales Perlin displacement.
- Radial mapping: transforms distance/angle to radial motion strength.
- Per-vector band weighting: internal mix of bands into motion components.

## Data flow

- Audio element → AnalyserNode → Uint8 frequency data → 8-band averages → normalized 0–1 → weights via `gamma` → motion components (drift, noise, radial) → kick pulse → color/scale → instance matrices/colors → renderer.

## Performance notes

- Instanced rendering avoids per-mesh overhead.
- Smoothing and band collapsing reduce per-frame CPU work.
- Avoid re-allocations inside the render loop.
- Keep pixel ratio <= 2; expose density to trade quality vs performance.
