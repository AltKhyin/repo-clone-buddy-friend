// ABOUTME: Simple stub to replace complex performance optimizer - no-op implementation

// Stub optimization strategies (no actual optimization)
export enum OptimizationStrategy {
  ADAPTIVE = 'adaptive',
  HIGH_PERFORMANCE = 'high_performance',
  CONSERVATIVE = 'conservative'
}

// Stub performance metrics interface
export interface PerformanceMetrics {
  averageFrameTime: number;
  droppedFrames: number;
  totalOperations: number;
  lastOperationTime: number;
  performanceMode: string;
  targetFrameTime: number;
}

// Stub performance optimizer - all methods are no-ops
export class PerformanceOptimizerStub {
  createOptimizedDebounce(fn: () => void, options?: any) {
    // Return a simple immediate execution function - no debouncing complexity
    const execute = () => fn();
    execute.cancel = () => {}; // No-op cancel
    return execute;
  }

  enableHighPerformanceMode(): void {
    // No-op - no performance optimization needed
  }

  enableAdaptiveMode(): void {
    // No-op - no performance optimization needed
  }

  getMetrics(): PerformanceMetrics {
    // Return stub metrics - no actual monitoring
    return {
      averageFrameTime: 16.67, // Assume 60fps
      droppedFrames: 0,
      totalOperations: 0,
      lastOperationTime: Date.now(),
      performanceMode: 'simple',
      targetFrameTime: 16.67
    };
  }

  isPerformanceOptimal(): boolean {
    // Always return true - no complex optimization logic
    return true;
  }

  destroy(): void {
    // No-op - no cleanup needed
  }
}

// Global stub instance - replaces complex performance optimizer
export const globalPerformanceOptimizer = new PerformanceOptimizerStub();

// Legacy exports for backward compatibility
export const usePerformanceMonitor = () => ({
  metrics: globalPerformanceOptimizer.getMetrics(),
  isOptimal: true
});

export const cleanupGlobalPerformanceOptimizer = () => {
  // No-op - no cleanup needed in stub
};