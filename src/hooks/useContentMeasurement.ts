// ABOUTME: Hook for dynamic content measurement using ResizeObserver API

import { useRef, useEffect, useState, useCallback } from 'react';

export interface ContentDimensions {
  /** Actual content width in pixels */
  contentWidth: number;
  /** Actual content height in pixels */
  contentHeight: number;
  /** Content bounding box for precise measurements */
  boundingBox: DOMRect | null;
  /** Whether measurements are being actively tracked */
  isObserving: boolean;
}

export interface ContentMeasurementOptions {
  /** Debounce delay for measurement updates (default: 16ms for 60fps) */
  debounceMs?: number;
  /** Whether to include padding in measurements (default: false) */
  includePadding?: boolean;
  /** Whether to include borders in measurements (default: false) */
  includeBorders?: boolean;
  /** Custom measurement selector within the element */
  measurementSelector?: string;
}

/**
 * Hook for measuring content dimensions with ResizeObserver
 * Provides real-time content size tracking for content-aware resize constraints
 */
export function useContentMeasurement(options: ContentMeasurementOptions = {}) {
  const {
    debounceMs = 16,
    includePadding = false,
    includeBorders = false,
    measurementSelector,
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const debounceRef = useRef<number | null>(null);

  const [dimensions, setDimensions] = useState<ContentDimensions>({
    contentWidth: 0,
    contentHeight: 0,
    boundingBox: null,
    isObserving: false,
  });

  // Calculate actual content dimensions
  const measureContent = useCallback(
    (element: HTMLElement): ContentDimensions => {
      const measurementTarget = measurementSelector
        ? (element.querySelector(measurementSelector) as HTMLElement)
        : element;

      if (!measurementTarget) {
        return {
          contentWidth: 0,
          contentHeight: 0,
          boundingBox: null,
          isObserving: false,
        };
      }

      const boundingBox = measurementTarget.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(measurementTarget);

      // Get box model dimensions
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;

      const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
      const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;
      const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
      const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;

      // Calculate content dimensions based on options
      let contentWidth = boundingBox.width;
      let contentHeight = boundingBox.height;

      if (!includePadding) {
        contentWidth -= paddingLeft + paddingRight;
        contentHeight -= paddingTop + paddingBottom;
      }

      if (!includeBorders) {
        contentWidth -= borderLeft + borderRight;
        contentHeight -= borderTop + borderBottom;
      }

      return {
        contentWidth: Math.max(0, contentWidth),
        contentHeight: Math.max(0, contentHeight),
        boundingBox,
        isObserving: true,
      };
    },
    [includePadding, includeBorders, measurementSelector]
  );

  // Debounced measurement update
  const updateDimensions = useCallback(
    (element: HTMLElement) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = window.setTimeout(() => {
        const newDimensions = measureContent(element);
        setDimensions(newDimensions);
      }, debounceMs);
    },
    [measureContent, debounceMs]
  );

  // Initialize ResizeObserver
  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;

    // Create ResizeObserver
    observerRef.current = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === element) {
          updateDimensions(element);
        }
      }
    });

    // Start observing
    observerRef.current.observe(element);

    // Initial measurement
    updateDimensions(element);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [updateDimensions]);

  // Manual remeasure function
  const remeasure = useCallback(() => {
    if (elementRef.current) {
      updateDimensions(elementRef.current);
    }
  }, [updateDimensions]);

  // Get minimum dimensions based on content
  const getMinimumDimensions = useCallback(() => {
    return {
      width: Math.max(50, dimensions.contentWidth), // Ensure minimum usable width
      height: Math.max(30, dimensions.contentHeight), // Ensure minimum usable height
    };
  }, [dimensions.contentWidth, dimensions.contentHeight]);

  return {
    elementRef,
    dimensions,
    remeasure,
    getMinimumDimensions,
  };
}

/**
 * Helper function to calculate styling-aware minimum dimensions
 * Takes into account padding, borders, and content requirements
 */
export function calculateStyledMinDimensions(
  contentDimensions: ContentDimensions,
  stylingProps: {
    paddingX?: number;
    paddingY?: number;
    borderWidth?: number;
  }
): { width: number; height: number } {
  const { paddingX = 0, paddingY = 0, borderWidth = 0 } = stylingProps;

  // Account for padding and borders in minimum dimensions
  const totalHorizontalSpacing = paddingX * 2 + borderWidth * 2;
  const totalVerticalSpacing = paddingY * 2 + borderWidth * 2;

  return {
    width: Math.max(100, contentDimensions.contentWidth + totalHorizontalSpacing),
    height: Math.max(60, contentDimensions.contentHeight + totalVerticalSpacing),
  };
}
