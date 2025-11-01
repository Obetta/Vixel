// Utility functions and lightweight Perlin noise implementation

window.VixelUtils = (function () {
  // DEBUG flag - set window.DEBUG = true to enable debug logging
  const DEBUG = window.DEBUG || false;
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function mapRange(value, inMin, inMax, outMin, outMax) {
    if (inMax === inMin) return outMin;
    const t = (value - inMin) / (inMax - inMin);
    return outMin + (outMax - outMin) * t;
  }

  function ema(prev, next, alpha) {
    return alpha * next + (1 - alpha) * prev;
  }

  // Simple deterministic PRNG for noise permutation
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Lightweight Perlin Noise (3D) adapted for animations
  function Perlin(seed = 1337) {
    const rand = mulberry32(seed);
    const p = new Uint8Array(512);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = perm[i];
      perm[i] = perm[j];
      perm[j] = tmp;
    }
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];

    function fade(t) {
      return t * t * t * (t * (t * 6 - 15) + 10);
    }
    function grad(hash, x, y, z) {
      const h = hash & 15;
      const u = h < 8 ? x : y;
      const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    function noise3(x, y, z) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      const Z = Math.floor(z) & 255;
      x -= Math.floor(x);
      y -= Math.floor(y);
      z -= Math.floor(z);
      const u = fade(x), v = fade(y), w = fade(z);
      const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
      const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
      return lerp(
        lerp(
          lerp(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u),
          lerp(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u),
          v
        ),
        lerp(
          lerp(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u),
          lerp(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u),
          v
        ),
        w
      );
    }

    return { noise3 };
  }

  function createColorLerp(preset) {
    // Returns a function t->[r,g,b]
    const palettes = {
      aurora: [
        [0.1, 0.9, 0.8],
        [0.6, 0.5, 1.0],
        [0.2, 0.6, 1.0]
      ],
      neon: [
        [0.0, 1.0, 0.8],
        [1.0, 0.0, 0.8],
        [0.9, 1.0, 0.2]
      ],
      sunset: [
        [1.0, 0.4, 0.2],
        [0.9, 0.2, 0.6],
        [0.2, 0.4, 1.0]
      ],
      mono: [
        [0.7, 0.7, 0.8],
        [0.5, 0.5, 0.6],
        [0.9, 0.9, 1.0]
      ]
    };
    const stops = palettes[preset] || palettes.aurora;
    return function (t) {
      const x = clamp(t, 0, 1) * (stops.length - 1);
      const i = Math.floor(x);
      const f = x - i;
      const a = stops[i];
      const b = stops[Math.min(i + 1, stops.length - 1)];
      return [
        lerp(a[0], b[0], f),
        lerp(a[1], b[1], f),
        lerp(a[2], b[2], f)
      ];
    };
  }

  // Debug logging utility
  function debugLog(...args) {
    if (DEBUG) {
      console.log(...args);
    }
  }

  return {
    clamp,
    lerp,
    mapRange,
    ema,
    Perlin,
    createColorLerp,
    debugLog
  };
})();


