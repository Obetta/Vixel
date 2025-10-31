import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Cleanup Utilities', () => {
  let cleanupTasks = [];
  let originalSetTimeout, originalClearTimeout;
  let originalAddEventListener, originalRemoveEventListener;

  beforeEach(() => {
    cleanupTasks = [];
    
    // Store originals
    originalSetTimeout = global.setTimeout;
    originalClearTimeout = global.clearTimeout;
    originalAddEventListener = EventTarget.prototype.addEventListener;
    originalRemoveEventListener = EventTarget.prototype.removeEventListener;
  });

  afterEach(() => {
    // Restore originals
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
    EventTarget.prototype.addEventListener = originalAddEventListener;
    EventTarget.prototype.removeEventListener = originalRemoveEventListener;
  });

  it('should register cleanup tasks', () => {
    const register = (fn) => {
      cleanupTasks.push(fn);
      return () => {
        const index = cleanupTasks.indexOf(fn);
        if (index > -1) cleanupTasks.splice(index, 1);
      };
    };

    const cleanupFn = () => {};
    const unregister = register(cleanupFn);
    
    expect(cleanupTasks.length).toBe(1);
    
    unregister();
    expect(cleanupTasks.length).toBe(0);
  });

  it('should track blob URLs for cleanup', () => {
    const blobURLs = [];
    const trackBlobURL = (url) => {
      blobURLs.push(url);
    };

    const url = 'blob:http://localhost:3000/abc123';
    trackBlobURL(url);
    
    expect(blobURLs).toContain(url);
  });

  it('should cleanup event listeners', () => {
    const listeners = [];
    const addEventListener = (target, event, handler) => {
      listeners.push({ target, event, handler });
      return () => {
        const index = listeners.findIndex(l => 
          l.target === target && l.event === event && l.handler === handler
        );
        if (index > -1) listeners.splice(index, 1);
      };
    };

    const handler = () => {};
    const remove = addEventListener(window, 'test', handler);
    
    expect(listeners.length).toBe(1);
    
    remove();
    expect(listeners.length).toBe(0);
  });
});

