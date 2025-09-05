// ABOUTME: Mobile viewport testing utilities for responsive design validation and touch interaction testing.

import { vi } from 'vitest';
import type { RenderResult } from '@testing-library/react';

// Standard viewport dimensions for testing
export const VIEWPORTS = {
  // Mobile devices
  IPHONE_SE: { width: 375, height: 667, label: 'iPhone SE' },
  IPHONE_12: { width: 390, height: 844, label: 'iPhone 12' },
  IPHONE_12_PRO_MAX: { width: 428, height: 926, label: 'iPhone 12 Pro Max' },
  PIXEL_5: { width: 393, height: 851, label: 'Google Pixel 5' },
  GALAXY_S20: { width: 360, height: 800, label: 'Samsung Galaxy S20' },
  
  // Tablets
  IPAD_MINI: { width: 768, height: 1024, label: 'iPad Mini' },
  IPAD_PRO: { width: 1024, height: 1366, label: 'iPad Pro' },
  
  // Desktop
  DESKTOP_SM: { width: 1280, height: 720, label: 'Desktop Small' },
  DESKTOP_LG: { width: 1920, height: 1080, label: 'Desktop Large' },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;

interface ViewportDimensions {
  width: number;
  height: number;
  label: string;
}

// Touch event simulation utilities
export interface TouchEventOptions {
  clientX?: number;
  clientY?: number;
  force?: number;
  radiusX?: number;
  radiusY?: number;
  rotationAngle?: number;
  identifier?: number;
}

export const createTouchEvent = (
  type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
  options: TouchEventOptions = {}
): TouchEvent => {
  const touch = new Touch({
    identifier: options.identifier || 0,
    target: document.body,
    clientX: options.clientX || 0,
    clientY: options.clientY || 0,
    screenX: options.clientX || 0,
    screenY: options.clientY || 0,
    pageX: options.clientX || 0,
    pageY: options.clientY || 0,
    radiusX: options.radiusX || 1,
    radiusY: options.radiusY || 1,
    rotationAngle: options.rotationAngle || 0,
    force: options.force || 1,
  });

  return new TouchEvent(type, {
    touches: type !== 'touchend' && type !== 'touchcancel' ? [touch] : [],
    targetTouches: type !== 'touchend' && type !== 'touchcancel' ? [touch] : [],
    changedTouches: [touch],
    bubbles: true,
    cancelable: true,
  });
};

// Viewport management utilities
export class ViewportManager {
  private originalWidth: number;
  private originalHeight: number;
  private originalUserAgent: string;

  constructor() {
    this.originalWidth = window.innerWidth;
    this.originalHeight = window.innerHeight;
    this.originalUserAgent = navigator.userAgent;
  }

  /**
   * Set viewport dimensions and update window properties
   */
  setViewport(dimensions: ViewportDimensions): void {
    // Update window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: dimensions.width,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: dimensions.height,
    });

    // Update screen dimensions
    Object.defineProperty(window.screen, 'width', {
      writable: true,
      configurable: true,
      value: dimensions.width,
    });

    Object.defineProperty(window.screen, 'height', {
      writable: true,
      configurable: true,
      value: dimensions.height,
    });

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  }

  /**
   * Set mobile user agent for realistic mobile testing
   */
  setMobileUserAgent(): void {
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    });
  }

  /**
   * Set tablet user agent
   */
  setTabletUserAgent(): void {
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    });
  }

  /**
   * Set desktop user agent
   */
  setDesktopUserAgent(): void {
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });
  }

  /**
   * Reset viewport to original dimensions
   */
  reset(): void {
    this.setViewport({
      width: this.originalWidth,
      height: this.originalHeight,
      label: 'Original'
    });

    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: this.originalUserAgent,
    });
  }
}

// Media query testing utilities
export const mockMatchMedia = (matches: boolean = false) => {
  const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
  });

  return mockMatchMedia;
};

// Responsive design test helpers
export const testResponsiveDesign = async (
  renderComponent: () => RenderResult,
  testCallback: (viewport: ViewportDimensions, isMobile: boolean) => void | Promise<void>
) => {
  const viewportManager = new ViewportManager();

  try {
    // Test mobile viewports
    for (const [name, viewport] of Object.entries(VIEWPORTS)) {
      if (name.includes('IPHONE') || name.includes('PIXEL') || name.includes('GALAXY')) {
        viewportManager.setViewport(viewport);
        viewportManager.setMobileUserAgent();
        mockMatchMedia(true); // Mobile breakpoint matches
        
        const result = renderComponent();
        await testCallback(viewport, true);
        result.unmount();
      }
    }

    // Test tablet viewports
    for (const [name, viewport] of Object.entries(VIEWPORTS)) {
      if (name.includes('IPAD')) {
        viewportManager.setViewport(viewport);
        viewportManager.setTabletUserAgent();
        mockMatchMedia(false); // Desktop breakpoint for tablets
        
        const result = renderComponent();
        await testCallback(viewport, false);
        result.unmount();
      }
    }

    // Test desktop viewports
    for (const [name, viewport] of Object.entries(VIEWPORTS)) {
      if (name.includes('DESKTOP')) {
        viewportManager.setViewport(viewport);
        viewportManager.setDesktopUserAgent();
        mockMatchMedia(false); // Desktop breakpoint
        
        const result = renderComponent();
        await testCallback(viewport, false);
        result.unmount();
      }
    }
  } finally {
    viewportManager.reset();
  }
};

// Touch interaction simulation
export const simulateTouch = {
  tap: (element: Element, options: TouchEventOptions = {}) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const touchOptions = {
      clientX: centerX,
      clientY: centerY,
      ...options,
    };

    element.dispatchEvent(createTouchEvent('touchstart', touchOptions));
    element.dispatchEvent(createTouchEvent('touchend', touchOptions));
  },

  longPress: async (element: Element, duration: number = 500, options: TouchEventOptions = {}) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const touchOptions = {
      clientX: centerX,
      clientY: centerY,
      ...options,
    };

    element.dispatchEvent(createTouchEvent('touchstart', touchOptions));
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    element.dispatchEvent(createTouchEvent('touchend', touchOptions));
  },

  swipe: async (
    element: Element,
    direction: 'left' | 'right' | 'up' | 'down',
    distance: number = 100,
    options: TouchEventOptions = {}
  ) => {
    const rect = element.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    let endX = startX;
    let endY = startY;

    switch (direction) {
      case 'left':
        endX = startX - distance;
        break;
      case 'right':
        endX = startX + distance;
        break;
      case 'up':
        endY = startY - distance;
        break;
      case 'down':
        endY = startY + distance;
        break;
    }

    const startOptions = { clientX: startX, clientY: startY, ...options };
    const endOptions = { clientX: endX, clientY: endY, ...options };

    element.dispatchEvent(createTouchEvent('touchstart', startOptions));
    element.dispatchEvent(createTouchEvent('touchmove', endOptions));
    element.dispatchEvent(createTouchEvent('touchend', endOptions));
  },
};

// Orientation change simulation
export const simulateOrientationChange = (orientation: 'portrait' | 'landscape') => {
  const isPortrait = orientation === 'portrait';
  const currentWidth = window.innerWidth;
  const currentHeight = window.innerHeight;

  // Swap dimensions for orientation change
  const newWidth = isPortrait ? Math.min(currentWidth, currentHeight) : Math.max(currentWidth, currentHeight);
  const newHeight = isPortrait ? Math.max(currentWidth, currentHeight) : Math.min(currentWidth, currentHeight);

  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: newWidth,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: newHeight,
  });

  Object.defineProperty(screen, 'orientation', {
    writable: true,
    configurable: true,
    value: {
      angle: isPortrait ? 0 : 90,
      type: isPortrait ? 'portrait-primary' : 'landscape-primary',
    },
  });

  window.dispatchEvent(new Event('orientationchange'));
  window.dispatchEvent(new Event('resize'));
};

// Device pixel ratio simulation
export const mockDevicePixelRatio = (ratio: number) => {
  Object.defineProperty(window, 'devicePixelRatio', {
    writable: true,
    configurable: true,
    value: ratio,
  });
};

// Network condition simulation for mobile testing
export const mockNetworkConditions = (type: 'slow-3g' | 'fast-3g' | '4g' | 'wifi') => {
  const conditions = {
    'slow-3g': { downlink: 0.4, rtt: 2000 },
    'fast-3g': { downlink: 1.5, rtt: 562.5 },
    '4g': { downlink: 4, rtt: 175 },
    'wifi': { downlink: 10, rtt: 40 },
  };

  Object.defineProperty(navigator, 'connection', {
    writable: true,
    configurable: true,
    value: {
      downlink: conditions[type].downlink,
      rtt: conditions[type].rtt,
      effectiveType: type,
      ...conditions[type],
    },
  });
};

// Accessibility testing for mobile
export const validateMobileAccessibility = {
  touchTargetSize: (element: Element, minimumSize: number = 44): boolean => {
    const rect = element.getBoundingClientRect();
    return rect.width >= minimumSize && rect.height >= minimumSize;
  },

  touchTargetSpacing: (element1: Element, element2: Element, minimumSpacing: number = 8): boolean => {
    const rect1 = element1.getBoundingClientRect();
    const rect2 = element2.getBoundingClientRect();

    const horizontalGap = Math.max(0, Math.min(rect1.left - rect2.right, rect2.left - rect1.right));
    const verticalGap = Math.max(0, Math.min(rect1.top - rect2.bottom, rect2.top - rect1.bottom));

    return horizontalGap >= minimumSpacing || verticalGap >= minimumSpacing;
  },

  readabilityContrast: (element: Element): boolean => {
    const styles = window.getComputedStyle(element);
    const fontSize = parseFloat(styles.fontSize);
    
    // Basic check - font should be at least 16px for mobile readability
    return fontSize >= 16;
  },
};

// Test utilities for common mobile patterns
export const mobileTestUtils = {
  /**
   * Test component behavior across all mobile viewports
   */
  testAcrossMobileViewports: async (
    renderComponent: () => RenderResult,
    testFunction: (viewport: ViewportDimensions) => void | Promise<void>
  ) => {
    const mobileViewports = [
      VIEWPORTS.IPHONE_SE,
      VIEWPORTS.IPHONE_12,
      VIEWPORTS.PIXEL_5,
      VIEWPORTS.GALAXY_S20,
    ];

    const viewportManager = new ViewportManager();
    
    try {
      for (const viewport of mobileViewports) {
        viewportManager.setViewport(viewport);
        viewportManager.setMobileUserAgent();
        
        const result = renderComponent();
        await testFunction(viewport);
        result.unmount();
      }
    } finally {
      viewportManager.reset();
    }
  },

  /**
   * Test progressive disclosure patterns
   */
  testProgressiveDisclosure: (
    mobileElement: Element | null,
    desktopElement: Element | null,
    expectation: 'hide-mobile' | 'show-mobile' | 'different'
  ) => {
    if (expectation === 'hide-mobile') {
      expect(mobileElement).toBeNull();
      expect(desktopElement).not.toBeNull();
    } else if (expectation === 'show-mobile') {
      expect(mobileElement).not.toBeNull();
      expect(desktopElement).toBeNull();
    } else if (expectation === 'different') {
      expect(mobileElement).not.toBe(desktopElement);
    }
  },
};

export default {
  VIEWPORTS,
  ViewportManager,
  createTouchEvent,
  mockMatchMedia,
  testResponsiveDesign,
  simulateTouch,
  simulateOrientationChange,
  mockDevicePixelRatio,
  mockNetworkConditions,
  validateMobileAccessibility,
  mobileTestUtils,
};