// ABOUTME: Tests for Reddit-inspired layout utility system ensuring proper class generation and responsive behavior

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  LAYOUT_CONSTANTS,
  generateLayoutClasses,
  generateContentClasses,
  generateResponsiveClasses,
  generateAntiCompressionClasses,
  calculateGridCols,
  generateCenteringClasses,
  generateContentGrid,
  breakpoints,
  layoutClasses
} from './layout-utils';

describe('Layout Utilities', () => {
  describe('LAYOUT_CONSTANTS', () => {
    it('should have Reddit-inspired content constraints with total width allocation', () => {
      expect(LAYOUT_CONSTANTS.TOTAL_CONTENT_WIDTH).toBe(1200);
      expect(LAYOUT_CONSTANTS.MAIN_CONTENT_MAX_WIDTH).toBe(756);
      expect(LAYOUT_CONSTANTS.SIDEBAR_MAX_WIDTH).toBe(316);
      expect(LAYOUT_CONSTANTS.SIDEBAR_MIN_WIDTH).toBe(280);
    });

    it('should align with existing mobile breakpoint', () => {
      expect(LAYOUT_CONSTANTS.MOBILE_BREAKPOINT).toBe(768);
    });

    it('should have proper spacing scale', () => {
      expect(LAYOUT_CONSTANTS.CONTENT_PADDING).toMatchObject({
        mobile: 16,
        tablet: 24,
        desktop: 32,
      });
    });
  });

  describe('generateLayoutClasses', () => {
    it('should generate standard layout with fixed sidebar classes and proper centering', () => {
      const classes = generateLayoutClasses('standard', 'fixed');
      
      expect(classes).toContain('w-full');
      expect(classes).toContain('min-h-screen');
      expect(classes).toContain('bg-background');
      expect(classes).toContain('grid');
      expect(classes).toContain('justify-center'); // NEW: Centering
      expect(classes).toContain('lg:grid-cols-[756px_316px]'); // NEW: Fixed grid cols
      expect(classes).toContain('lg:max-w-[1200px]'); // NEW: Total width constraint
    });

    it('should generate content-only layout classes', () => {
      const classes = generateLayoutClasses('content-only');
      
      expect(classes).toContain('grid-cols-1');
      expect(classes).not.toContain('minmax(0,756px)');
    });

    it('should generate centered layout classes with proper centering', () => {
      const classes = generateLayoutClasses('centered');
      
      expect(classes).toContain('max-w-4xl');
      expect(classes).toContain('justify-center'); // NEW: Flexbox centering instead of mx-auto
      expect(classes).toContain('w-full');
    });

    it('should generate wide layout classes with proper centering', () => {
      const classes = generateLayoutClasses('wide');
      
      expect(classes).toContain('max-w-6xl');
      expect(classes).toContain('justify-center'); // NEW: Flexbox centering instead of mx-auto
      expect(classes).toContain('w-full');
    });

    it('should generate admin layout classes', () => {
      const classes = generateLayoutClasses('admin');
      
      expect(classes).toContain('space-y-6');
    });

    it('should handle custom className parameter', () => {
      const customClass = 'custom-test-class';
      const classes = generateLayoutClasses('standard', 'none', customClass);
      
      expect(classes).toContain(customClass);
    });
  });

  describe('generateContentClasses', () => {
    it('should generate main content classes with width constraints', () => {
      const classes = generateContentClasses('main');
      
      expect(classes).toContain('min-w-0');
      expect(classes).toContain('max-w-[756px]');
      expect(classes).toContain('w-full');
      expect(classes).toContain('overflow-hidden');
    });

    it('should generate sidebar classes with proper constraints', () => {
      const classes = generateContentClasses('sidebar');
      
      expect(classes).toContain('max-w-[316px]');
      expect(classes).toContain('hidden lg:block');
    });

    it('should generate article classes with prose styling', () => {
      const classes = generateContentClasses('article');
      
      expect(classes).toContain('max-w-4xl');
      expect(classes).toContain('prose');
      expect(classes).toContain('prose-lg');
    });

    it('should generate wide content classes', () => {
      const classes = generateContentClasses('wide');
      
      expect(classes).toContain('max-w-6xl');
      expect(classes).toContain('mx-auto');
    });

    it('should generate full-width classes', () => {
      const classes = generateContentClasses('full-width');
      
      expect(classes).toContain('w-full');
    });
  });

  describe('generateResponsiveClasses', () => {
    it('should generate desktop-only classes', () => {
      const classes = generateResponsiveClasses('desktop-only');
      
      expect(classes).toContain('hidden lg:block');
    });

    it('should generate mobile-only classes', () => {
      const classes = generateResponsiveClasses('mobile-only');
      
      expect(classes).toContain('block lg:hidden');
    });

    it('should generate responsive padding classes', () => {
      const classes = generateResponsiveClasses('padding');
      
      expect(classes).toContain('px-4');
      expect(classes).toContain('py-6');
      expect(classes).toContain('lg:px-8');
    });

    it('should generate responsive gap classes', () => {
      const classes = generateResponsiveClasses('gap');
      
      expect(classes).toContain('gap-4');
      expect(classes).toContain('lg:gap-6');
    });
  });

  describe('generateAntiCompressionClasses', () => {
    it('should generate prevent-overflow classes', () => {
      const classes = generateAntiCompressionClasses('prevent-overflow');
      
      expect(classes).toContain('overflow-hidden');
      expect(classes).toContain('min-w-0');
    });

    it('should generate flex-content classes', () => {
      const classes = generateAntiCompressionClasses('flex-content');
      
      expect(classes).toContain('min-w-0');
      expect(classes).toContain('flex-1');
    });

    it('should generate fixed-content classes', () => {
      const classes = generateAntiCompressionClasses('fixed-content');
      
      expect(classes).toContain('flex-shrink-0');
    });

    it('should generate grid-item classes', () => {
      const classes = generateAntiCompressionClasses('grid-item');
      
      expect(classes).toContain('min-w-0');
    });
  });

  describe('calculateGridCols', () => {
    it('should calculate proper grid columns with default values using new fixed approach', () => {
      const result = calculateGridCols();
      
      expect(result).toBe('756px 316px'); // NEW: Fixed width allocation
    });

    it('should calculate grid columns with custom values using new fixed approach', () => {
      const result = calculateGridCols(800, 320, 16);
      
      expect(result).toBe('800px 320px'); // NEW: Fixed width allocation
    });

    it('should handle custom sidebar width in new fixed approach', () => {
      const result = calculateGridCols(600, 200, 8);
      
      expect(result).toBe('600px 200px'); // NEW: Direct width allocation (minimum width enforced at CSS level)
    });
  });

  describe('generateCenteringClasses', () => {
    it('should generate proper centering classes with default total width', () => {
      const classes = generateCenteringClasses();
      
      expect(classes).toContain('flex');
      expect(classes).toContain('justify-center');
      expect(classes).toContain('w-full');
      expect(classes).toContain('max-w-[1200px]');
      expect(classes).toContain('mx-auto');
    });

    it('should generate centering classes with custom max width', () => {
      const classes = generateCenteringClasses(800);
      
      expect(classes).toContain('max-w-[800px]');
    });

    it('should merge custom className', () => {
      const classes = generateCenteringClasses(1200, 'custom-class');
      
      expect(classes).toContain('custom-class');
    });
  });

  describe('generateContentGrid', () => {
    it('should generate single column grid', () => {
      const classes = generateContentGrid('single');
      
      expect(classes).toContain('grid');
      expect(classes).toContain('w-full');
      expect(classes).toContain('grid-cols-1');
    });

    it('should generate two-column fixed grid with proper dimensions', () => {
      const classes = generateContentGrid('two-column-fixed');
      
      expect(classes).toContain('grid');
      expect(classes).toContain('lg:grid-cols-[756px_316px]');
      expect(classes).toContain('gap-6 lg:gap-8');
    });

    it('should generate two-column flexible grid', () => {
      const classes = generateContentGrid('two-column-flex');
      
      expect(classes).toContain('lg:grid-cols-[756px_auto]');
    });

    it('should merge custom className', () => {
      const classes = generateContentGrid('single', 'custom-grid-class');
      
      expect(classes).toContain('custom-grid-class');
    });
  });

  describe('breakpoints', () => {
    let mockMatchMedia: any;

    beforeEach(() => {
      mockMatchMedia = vi.fn();
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should have correct breakpoint media queries', () => {
      expect(breakpoints.mobile).toBe('(max-width: 767px)');
      expect(breakpoints.tablet).toBe('(min-width: 768px) and (max-width: 1023px)');
      expect(breakpoints.desktop).toBe('(min-width: 1024px)');
    });

    it('should detect mobile breakpoint match', () => {
      mockMatchMedia.mockReturnValue({ matches: true });
      
      const result = breakpoints.matches('mobile');
      
      expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
      expect(result).toBe(true);
    });

    it('should detect desktop breakpoint match', () => {
      mockMatchMedia.mockReturnValue({ matches: false });
      
      const result = breakpoints.matches('desktop');
      
      expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
      expect(result).toBe(false);
    });

    it('should return false when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-expect-error Testing SSR behavior
      delete global.window;
      
      const result = breakpoints.matches('mobile');
      
      expect(result).toBe(false);
      
      global.window = originalWindow;
    });
  });

  describe('layoutClasses', () => {
    it('should have base container classes', () => {
      expect(layoutClasses.container.base).toContain('w-full');
      expect(layoutClasses.container.base).toContain('min-h-screen');
      expect(layoutClasses.container.base).toContain('bg-background');
    });

    it('should have proper grid classes', () => {
      expect(layoutClasses.container.grid).toContain('grid');
      expect(layoutClasses.container.grid).toContain('gap-6');
    });

    it('should have responsive padding classes', () => {
      expect(layoutClasses.container.responsive).toContain('px-4');
      expect(layoutClasses.container.responsive).toContain('lg:px-8');
    });

    it('should have anti-compression utilities', () => {
      expect(layoutClasses.antiCompression.preventOverflow).toContain('overflow-hidden');
      expect(layoutClasses.antiCompression.preventOverflow).toContain('min-w-0');
    });
  });

  describe('Integration with existing utilities', () => {
    it('should work with twMerge for class deduplication', () => {
      const classes = generateLayoutClasses('standard', 'fixed', 'w-full bg-red-500');
      
      // Should not have duplicate w-full
      const classArray = classes.split(' ');
      const wFullCount = classArray.filter(c => c === 'w-full').length;
      expect(wFullCount).toBe(1);
      
      // Should override background
      expect(classes).toContain('bg-red-500');
      expect(classes).not.toContain('bg-background');
    });
  });
});