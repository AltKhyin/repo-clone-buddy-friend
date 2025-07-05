// ABOUTME: Minimal test setup for fast tests without performance monitoring overhead
import '@testing-library/jest-dom';
import React from 'react';
import { vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Essential mocks only - no performance monitoring

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Minimal Radix UI polyfills
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || vi.fn(() => false);
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || vi.fn();
  Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture || vi.fn();
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || vi.fn();
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Minimal cleanup
beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

afterEach(() => {
  cleanup();
});
