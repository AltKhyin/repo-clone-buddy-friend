// ABOUTME: Simple resize system exports without constraints or performance optimizations

// Simple controller - no constraints, no performance optimizations
export { SimpleResizeController } from './SimpleResizeController';
export type { 
  ResizeHandle, 
  MousePosition 
} from './SimpleResizeController';

// Simple integration hook
export { useSimpleResize } from './useSimpleResize';
export type { UseSimpleResizeOptions, SimpleResizeHandlers } from './useSimpleResize';

// Simple resize handles component
export { SimpleResizeHandles } from './SimpleResizeHandles';
export type { SimpleResizeHandlesProps } from './SimpleResizeHandles';

// Legacy complex system exports (for gradual migration)
export { UnifiedResizeController } from './UnifiedResizeController';
export { useUnifiedResize, useResizeHandleEvents } from './useUnifiedResize';
export { UnifiedResizeHandles } from './UnifiedResizeHandles';
export { getResizeHandleCursor, getResizeHandlePosition } from './useUnifiedResize';

// Performance optimizer stub exports (replaces complex performance system)
export { 
  globalPerformanceOptimizer, 
  usePerformanceMonitor,
  cleanupGlobalPerformanceOptimizer
} from './PerformanceOptimizerStub';
export { OptimizationStrategy } from './PerformanceOptimizerStub';
export type { PerformanceMetrics } from './PerformanceOptimizerStub';

/**
 * SIMPLE RESIZE SYSTEM OVERVIEW
 * 
 * This system provides unrestricted block resizing as requested:
 * 
 * 1. COMPLETE RESIZE FREEDOM
 *    - No size constraints or content-aware limitations
 *    - No performance optimization systems that cause complexity
 *    - Direct DOM updates without batching or debouncing
 * 
 * 2. SIMPLE IMPLEMENTATION
 *    - SimpleResizeController: Direct, immediate resize operations
 *    - useSimpleResize: Basic integration hook without constraints
 *    - SimpleResizeHandles: Always-available handles (never constrained)
 * 
 * 3. USER-FRIENDLY EXPERIENCE
 *    - All handles always blue (available) or green (resizing)
 *    - No red constraint indicators - complete freedom
 *    - Simple visual feedback without warnings or limitations
 * 
 * 4. EVIDENS COMPLIANCE
 *    - [C0.2.5] Reduces complexity through removal of convoluted optimizations
 *    - [C0.2.4] Eliminates constraint duplication and performance overhead
 *    - Clean, efficient code at base level without optimization workarounds
 * 
 * IMPLEMENTATION STATUS:
 * ✅ SimpleResizeController: Direct resize without constraints
 * ✅ useSimpleResize: Simple integration hook
 * ✅ SimpleResizeHandles: Constraint-free visual handles
 * ✅ UnifiedBlockWrapper: Integrated with simple system
 * ✅ Inspector integration: Height adjustment now works with direct DOM measurement
 * ✅ Legacy cleanup: Complex performance systems replaced with simple stubs
 */