import '@testing-library/jest-dom/vitest';

// Provide WebGL mocks for tests
class WebGLRenderingContextMock {}
// @ts-expect-error jsdom augmentation
window.WebGLRenderingContext = WebGLRenderingContextMock;

// @ts-expect-error jsdom augmentation
window.WebGL2RenderingContext = WebGLRenderingContextMock;

// @ts-expect-error test global
globalThis.__APP_CONFIG__ = {
  name: 'Quantum Toilet — FLUSH∞',
  backendUrl: 'http://localhost:3000',
  wsPath: '/flush',
  enableSimulate: true
};
