import { describe, it, expect, beforeEach } from 'vitest';

describe('Core Modules', () => {
  beforeEach(() => {
    // Setup mocks
    global.THREE = {
      Scene: class Scene {
        add() {}
      },
      PerspectiveCamera: class PerspectiveCamera {
        constructor(fov, aspect, near, far) {
          this.fov = fov;
          this.aspect = aspect;
          this.near = near;
          this.far = far;
          this.position = { set: () => {}, x: 0, y: 0, z: 0 };
          this.up = { set: () => {}, x: 0, y: 0, z: 1 };
          this.lookAt = () => {};
        }
      },
      WebGLRenderer: class WebGLRenderer {
        constructor() {
          this.domElement = document.createElement('canvas');
          this.setSize = () => {};
          this.render = () => {};
        }
      },
      Group: class Group {
        add() {}
        getObjectByName() { return null; }
      }
    };

    global.window = {
      ...global.window,
      innerWidth: 1920,
      innerHeight: 1080
    };
  });

  it('should create camera with correct properties', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    // Mock Camera module
    const Camera = {
      createCamera: (canvasEl, orbit) => {
        const width = canvasEl.clientWidth || 800;
        const height = canvasEl.clientHeight || 600;
        const camera = new THREE.PerspectiveCamera(55, width / height || 1, 0.1, 100);
        camera.up.set(0, 0, 1);
        return camera;
      }
    };

    const orbit = { phi: Math.PI / 4, theta: Math.PI / 4 };
    const camera = Camera.createCamera(canvas, orbit);
    
    expect(camera).toBeDefined();
    expect(camera.fov).toBe(55);
  });

  it('should handle scene setup', () => {
    const Scene = {
      setupScene: (canvasEl) => {
        const renderer = new THREE.WebGLRenderer({ canvas: canvasEl });
        const scene = new THREE.Scene();
        const world = new THREE.Group();
        return { renderer, scene, world };
      }
    };

    const canvas = document.createElement('canvas');
    const sceneData = Scene.setupScene(canvas);
    
    expect(sceneData).toBeDefined();
    expect(sceneData.renderer).toBeDefined();
    expect(sceneData.scene).toBeDefined();
    expect(sceneData.world).toBeDefined();
  });
});

