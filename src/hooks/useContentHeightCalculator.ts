// ABOUTME: Hook for calculating optimal content height to prevent content from being hidden

import { useCallback, useMemo } from 'react';
import { useContentMeasurement, ContentDimensions } from './useContentMeasurement';
import { Editor } from '@tiptap/react';

export interface ContentHeightCalculation {
  /** Calculated optimal height in pixels */
  optimalHeight: number;
  /** Current content height in pixels */
  currentContentHeight: number;
  /** Whether content is currently overflowing */
  isOverflowing: boolean;
  /** Whether calculation is based on accurate measurements */
  isAccurate: boolean;
  /** Additional spacing needed (padding, borders, etc.) */
  additionalSpacing: number;
}

export interface ContentHeightCalculatorOptions {
  /** Current block height */
  currentHeight: number;
  /** Current block width (affects text reflow) */
  currentWidth: number;
  /** Padding values */
  paddingX?: number;
  paddingY?: number;
  /** Border width */
  borderWidth?: number;
  /** Minimum height constraint */
  minHeight?: number;
  /** Maximum height constraint */
  maxHeight?: number;
  /** TipTap editor instance for accurate content measurement */
  editor?: Editor | null;
}

/**
 * Hook for calculating optimal content height to fit all content without hiding
 * Uses ResizeObserver for accurate measurements and TipTap editor integration
 */
export function useContentHeightCalculator(options: ContentHeightCalculatorOptions) {
  const {
    currentHeight,
    currentWidth,
    paddingX = 0,
    paddingY = 0,
    borderWidth = 0,
    minHeight = 60,
    maxHeight = 800,
    editor,
  } = options;

  // Use content measurement hook for real-time dimension tracking
  const { elementRef, dimensions, remeasure } = useContentMeasurement({
    debounceMs: 16, // 60fps for smooth updates
    includePadding: false, // We'll calculate padding separately
    includeBorders: false, // We'll calculate borders separately
    measurementSelector: '.ProseMirror', // Measure TipTap content specifically
  });

  // Calculate additional spacing from styling
  const additionalSpacing = useMemo(() => {
    return paddingY * 2 + borderWidth * 2;
  }, [paddingY, borderWidth]);

  // Calculate optimal height based on content measurements
  const calculateOptimalHeight = useCallback((): ContentHeightCalculation => {
    // If we don't have accurate measurements yet, use TipTap editor as fallback
    if (!dimensions.isObserving && editor) {
      const editorElement = editor.view.dom as HTMLElement;
      if (editorElement) {
        const editorRect = editorElement.getBoundingClientRect();
        const fallbackContentHeight = editorRect.height;
        const fallbackOptimalHeight = Math.max(
          minHeight,
          Math.min(maxHeight, fallbackContentHeight + additionalSpacing)
        );

        return {
          optimalHeight: fallbackOptimalHeight,
          currentContentHeight: fallbackContentHeight,
          isOverflowing: currentHeight < fallbackOptimalHeight,
          isAccurate: false, // Mark as inaccurate since using fallback
          additionalSpacing,
        };
      }
    }

    // Use ResizeObserver measurements for accurate calculation
    const contentHeight = dimensions.contentHeight;
    const optimalHeight = Math.max(
      minHeight,
      Math.min(maxHeight, contentHeight + additionalSpacing)
    );

    // Check if content is currently overflowing
    const availableContentHeight = currentHeight - additionalSpacing;
    const isOverflowing = contentHeight > availableContentHeight;

    return {
      optimalHeight,
      currentContentHeight: contentHeight,
      isOverflowing,
      isAccurate: dimensions.isObserving,
      additionalSpacing,
    };
  }, [dimensions, editor, currentHeight, minHeight, maxHeight, additionalSpacing]);

  // Get current height calculation
  const heightCalculation = useMemo(() => {
    return calculateOptimalHeight();
  }, [calculateOptimalHeight]);

  // Calculate if adjustment is needed and beneficial
  const needsHeightAdjustment = useMemo(() => {
    const calc = heightCalculation;

    // Don't adjust if measurements aren't accurate
    if (!calc.isAccurate) return false;

    // Adjust if content is overflowing
    if (calc.isOverflowing) return true;

    // Adjust if current height is significantly larger than needed (more than 50px waste)
    const heightWaste = currentHeight - calc.optimalHeight;
    return heightWaste > 50;
  }, [heightCalculation, currentHeight]);

  // Calculate height adjustment amount
  const heightAdjustmentAmount = useMemo(() => {
    if (!needsHeightAdjustment) return 0;
    return heightCalculation.optimalHeight - currentHeight;
  }, [needsHeightAdjustment, heightCalculation.optimalHeight, currentHeight]);

  // Function to trigger height adjustment
  const adjustHeightToContent = useCallback(() => {
    // Force remeasurement before adjustment
    remeasure();

    // Return the calculated optimal height
    const calc = calculateOptimalHeight();
    return calc.optimalHeight;
  }, [remeasure, calculateOptimalHeight]);

  // Function to check if content fits within given height
  const checkContentFitsInHeight = useCallback(
    (targetHeight: number): boolean => {
      const calc = calculateOptimalHeight();
      return calc.optimalHeight <= targetHeight;
    },
    [calculateOptimalHeight]
  );

  return {
    // Measurement ref for attaching to content element
    contentRef: elementRef,

    // Current height calculation
    heightCalculation,

    // Adjustment helpers
    needsHeightAdjustment,
    heightAdjustmentAmount,

    // Action functions
    adjustHeightToContent,
    checkContentFitsInHeight,
    remeasure,
  };
}

/**
 * Helper function to calculate optimal height for static content
 * Useful for one-off calculations without the full hook
 */
export function calculateStaticOptimalHeight(
  contentElement: HTMLElement,
  stylingProps: {
    paddingY?: number;
    borderWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  } = {}
): number {
  const { paddingY = 0, borderWidth = 0, minHeight = 60, maxHeight = 800 } = stylingProps;

  // Measure content dimensions
  const contentRect = contentElement.getBoundingClientRect();
  const contentHeight = contentRect.height;

  // Calculate additional spacing
  const additionalSpacing = paddingY * 2 + borderWidth * 2;

  // Return optimal height with constraints
  return Math.max(minHeight, Math.min(maxHeight, contentHeight + additionalSpacing));
}
