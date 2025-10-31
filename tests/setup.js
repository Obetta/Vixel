// Mock Three.js for testing
global.THREE = {
  // Add minimal mocks as needed
  Vector3: class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
  },
  Scene: class Scene {},
  PerspectiveCamera: class PerspectiveCamera {},
  WebGLRenderer: class WebGLRenderer {
    constructor() {
      this.domElement = document.createElement('canvas');
    }
    render() {}
    setSize() {}
  }
};

