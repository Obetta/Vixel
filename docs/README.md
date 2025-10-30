# Vixel Starter

Audio-reactive 3D vector field starter built with Three.js and the Web Audio API.

## Quick start

- Node (static server)
  - `npx serve ./vixel` or `npm i -g serve && serve ./vixel`
- Python
  - `python -m http.server 8000`
- Open `http://localhost:8000` (or the URL from your server) and drag & drop an audio/video file.

## Features

- 8-band FFT analysis (Web Audio API)
- Weighted motion patterns: linear drift, Perlin oscillation, radial/spherical mapping
- Kick/bass pulse detection
- Trails via alpha fade
- Color modulation and size scaling
- Top nav / left nav with high-level controls
- Drag-and-drop audio/video input

## Controls (user-facing)

- Vector Density
- Oscillation Intensity
- Trail Length
- Color Preset
- Band Visibility (multi-select)
- Kick/Bass Sensitivity

Internal/proprietary parameters are documented in `architecture.md`.

## Deploy

- Any static host: GitHub Pages, Netlify, Vercel
- Minify/compress assets in `assets/` as needed
- Ensure Three.js is available (CDN or replace `lib/three.min.js` with offline build)

## Project structure

```
vixel/
├─ index.html
├─ style.css
├─ js/
│  ├─ main.js
│  ├─ audio.js
│  ├─ vectorField.js
│  └─ utils.js
├─ lib/
│  └─ three.min.js
├─ assets/
│  ├─ audio/
│  └─ textures/
└─ docs/
   ├─ README.md
   ├─ future_video_support.md
   ├─ future_live_input.md
   └─ architecture.md
```

## Troubleshooting

- If audio does not start, click anywhere to unlock AudioContext, then press Play.
- If visuals stutter, reduce Vector Density and Trail Length.
- For offline use, place a real Three.js build in `lib/three.min.js`. 
