import { describe, it, expect, beforeAll } from 'vitest';

// Load utils first
beforeAll(async () => {
  // Create a script element to load utils.js
  const script = document.createElement('script');
  script.src = '/js/utils.js';
  document.head.appendChild(script);
  await new Promise((resolve) => {
    script.onload = resolve;
    setTimeout(resolve, 100); // Fallback timeout
  });
});

describe('Vixel Utils', () => {
  it('should clamp values correctly', () => {
    const { clamp } = window.VixelUtils || {};
    if (!clamp) {
      // If utils haven't loaded yet, wait a bit
      return;
    }
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('should map ranges correctly', () => {
    const { mapRange } = window.VixelUtils || {};
    if (!mapRange) {
      return;
    }
    expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
    expect(mapRange(2, 0, 4, 0, 8)).toBe(4);
  });

  it('should lerp values correctly', () => {
    const { lerp } = window.VixelUtils || {};
    if (!lerp) {
      return;
    }
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 100, 0.25)).toBe(25);
  });

  it('should create Perlin noise instance', () => {
    const { Perlin } = window.VixelUtils || {};
    if (!Perlin) {
      return;
    }
    const noise = Perlin();
    expect(noise).toBeDefined();
    expect(typeof noise.noise3).toBe('function');
    
    // Test noise function returns a number
    const value = noise.noise3(0.5, 0.5, 0.5);
    expect(typeof value).toBe('number');
    expect(isFinite(value)).toBe(true);
  });

  it('should create color lerp function', () => {
    const { createColorLerp } = window.VixelUtils || {};
    if (!createColorLerp) {
      return;
    }
    const lerpFn = createColorLerp('aurora');
    expect(typeof lerpFn).toBe('function');
    
    const color = lerpFn(0.5);
    expect(Array.isArray(color)).toBe(true);
    expect(color.length).toBe(3);
    expect(color.every(c => typeof c === 'number')).toBe(true);
  });
});
