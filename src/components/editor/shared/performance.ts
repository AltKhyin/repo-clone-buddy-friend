// ABOUTME: Performance monitoring and optimization utilities for Rich Block editor components

import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  maxRenderTime: number;
  lastRenderTime: number;
  memoryUsage?: number;
  propsChanges: number;
}

/**
 * Performance warning thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  MAX_RENDER_TIME: 16, // 16ms for 60fps
  WARNING_RENDER_TIME: 8, // 8ms warning threshold
  MAX_RENDERS_PER_SECOND: 60,
  MEMORY_WARNING_MB: 50,
} as const;

/**
 * Global performance registry for tracking component metrics
 */
class PerformanceRegistry {
  private metrics = new Map<string, PerformanceMetrics>();
  private renderTimestamps = new Map<string, number[]>();

  /**
   * Record a render event for a component
   */
  recordRender(componentName: string, renderTime: number, propsChanged: boolean = false) {
    const existing = this.metrics.get(componentName);
    const now = Date.now();

    // Track render timestamps for frequency analysis
    const timestamps = this.renderTimestamps.get(componentName) || [];
    timestamps.push(now);

    // Keep only last second of timestamps
    const oneSecondAgo = now - 1000;
    const recentTimestamps = timestamps.filter(t => t > oneSecondAgo);
    this.renderTimestamps.set(componentName, recentTimestamps);

    if (existing) {
      const newRenderCount = existing.renderCount + 1;
      const newTotalTime = existing.totalRenderTime + renderTime;

      this.metrics.set(componentName, {
        ...existing,
        renderCount: newRenderCount,
        totalRenderTime: newTotalTime,
        averageRenderTime: newTotalTime / newRenderCount,
        maxRenderTime: Math.max(existing.maxRenderTime, renderTime),
        lastRenderTime: renderTime,
        propsChanges: existing.propsChanges + (propsChanged ? 1 : 0),
      });
    } else {
      this.metrics.set(componentName, {
        componentName,
        renderCount: 1,
        totalRenderTime: renderTime,
        averageRenderTime: renderTime,
        maxRenderTime: renderTime,
        lastRenderTime: renderTime,
        propsChanges: propsChanged ? 1 : 0,
      });
    }

    // Check for performance warnings
    this.checkPerformanceWarnings(componentName, renderTime, recentTimestamps.length);
  }

  /**
   * Get metrics for a specific component
   */
  getMetrics(componentName: string): PerformanceMetrics | undefined {
    return this.metrics.get(componentName);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const allMetrics = this.getAllMetrics();

    return {
      totalComponents: allMetrics.length,
      totalRenders: allMetrics.reduce((sum, m) => sum + m.renderCount, 0),
      averageRenderTime:
        allMetrics.reduce((sum, m) => sum + m.averageRenderTime, 0) / allMetrics.length || 0,
      slowestComponent: allMetrics.reduce(
        (slowest, current) =>
          current.maxRenderTime > (slowest?.maxRenderTime || 0) ? current : slowest,
        null as PerformanceMetrics | null
      ),
      mostActiveComponent: allMetrics.reduce(
        (most, current) => (current.renderCount > (most?.renderCount || 0) ? current : most),
        null as PerformanceMetrics | null
      ),
    };
  }

  /**
   * Check for performance warnings (only log critical issues to avoid console spam)
   */
  private checkPerformanceWarnings(
    componentName: string,
    renderTime: number,
    rendersPerSecond: number
  ) {
    // Only log extremely slow renders (4x the threshold) to avoid console spam
    if (renderTime > PERFORMANCE_THRESHOLDS.MAX_RENDER_TIME * 4) {
      console.warn(
        `⚡ Critical Performance Warning: ${componentName} render took ${renderTime.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.MAX_RENDER_TIME}ms)`
      );
    }

    // Only log extremely high render rates (2x the threshold) to avoid console spam
    if (rendersPerSecond > PERFORMANCE_THRESHOLDS.MAX_RENDERS_PER_SECOND * 2) {
      console.warn(
        `⚡ Critical Performance Warning: ${componentName} rendering at ${rendersPerSecond} fps (threshold: ${PERFORMANCE_THRESHOLDS.MAX_RENDERS_PER_SECOND} fps)`
      );
    }
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
    this.renderTimestamps.clear();
  }

  /**
   * Reset metrics for a specific component
   */
  reset(componentName: string) {
    this.metrics.delete(componentName);
    this.renderTimestamps.delete(componentName);
  }
}

// Global performance registry instance
export const performanceRegistry = new PerformanceRegistry();

/**
 * Performance monitoring hook for React components
 */
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const previousProps = useRef<any>(null);
  const renderCount = useRef(0);

  // Start timing when component begins rendering
  renderStartTime.current = performance.now();
  renderCount.current++;

  useEffect(() => {
    // Calculate render time when component finishes rendering
    const renderTime = performance.now() - renderStartTime.current;

    // Record render without props comparison (hook doesn't receive props)
    performanceRegistry.recordRender(componentName, renderTime, false);
  });

  return {
    renderCount: renderCount.current,
    getMetrics: () => performanceRegistry.getMetrics(componentName),
    getSummary: () => performanceRegistry.getSummary(),
  };
}

/**
 * Optimized useCallback hook with dependency tracking
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  debugName?: string
): T {
  const depsRef = useRef<React.DependencyList>(deps);
  const callbackRef = useRef<T>(callback);
  const recreateCount = useRef(0);

  // Check if dependencies actually changed
  const depsChanged = useMemo(() => {
    const changed = deps.some((dep, index) => dep !== depsRef.current[index]);
    if (changed) {
      recreateCount.current++;
      // Only warn for excessive callback recreation (50+ times) to avoid console spam
      if (debugName && recreateCount.current > 50) {
        console.warn(
          `⚡ Critical Performance Warning: ${debugName} callback recreated ${recreateCount.current} times`
        );
      }
    }
    return changed;
  }, deps);

  if (depsChanged) {
    callbackRef.current = callback;
    depsRef.current = deps;
  }

  return callbackRef.current;
}

/**
 * Optimized useMemo hook with cache hit tracking
 */
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  debugName?: string
): T {
  const cacheHits = useRef(0);
  const cacheMisses = useRef(0);

  const result = useMemo(() => {
    cacheMisses.current++;

    // Only warn for extremely low hit rates (< 20%) and after significant usage to avoid console spam
    if (debugName && cacheMisses.current > 20 && cacheHits.current > 0) {
      const hitRate = cacheHits.current / (cacheHits.current + cacheMisses.current);
      if (hitRate < 0.2) {
        // Less than 20% hit rate
        console.warn(
          `⚡ Critical Performance Warning: ${debugName} memo has extremely low hit rate: ${(hitRate * 100).toFixed(1)}%`
        );
      }
    }

    return factory();
  }, deps);

  cacheHits.current++;

  return result;
}

/**
 * Memory usage monitoring hook
 */
export function useMemoryMonitor(
  componentName: string,
  enabled: boolean = process.env.NODE_ENV === 'development'
) {
  const memorySnapshots = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled || !('memory' in performance)) return;

    const checkMemory = () => {
      const memInfo = (performance as any).memory;
      if (memInfo) {
        const usedMB = memInfo.usedJSHeapSize / 1024 / 1024;
        memorySnapshots.current.push(usedMB);

        // Keep only last 10 snapshots
        if (memorySnapshots.current.length > 10) {
          memorySnapshots.current = memorySnapshots.current.slice(-10);
        }

        // Check for serious memory leaks (consistently increasing usage over threshold)
        if (memorySnapshots.current.length >= 5) {
          const recent = memorySnapshots.current.slice(-5);
          const increasing = recent.every((val, i) => i === 0 || val > recent[i - 1]);

          // Only warn for high memory usage (2x threshold) to avoid console spam
          if (increasing && usedMB > PERFORMANCE_THRESHOLDS.MEMORY_WARNING_MB * 2) {
            console.warn(
              `⚡ Critical Memory Warning: ${componentName} memory usage increasing: ${usedMB.toFixed(2)}MB`
            );
          }
        }
      }
    };

    const interval = setInterval(checkMemory, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [componentName, enabled]);

  return {
    getCurrentMemory: () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        return memInfo ? memInfo.usedJSHeapSize / 1024 / 1024 : 0;
      }
      return 0;
    },
    getMemorySnapshots: () => [...memorySnapshots.current],
  };
}

/**
 * Debounced value hook with performance tracking
 */
export function useOptimizedDebounce<T>(value: T, delay: number, debugName?: string): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  const updateCount = useRef(0);
  const suppressCount = useRef(0);

  useEffect(() => {
    updateCount.current++;

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    suppressCount.current++;

    // Remove frequent logging to prevent console spam
    // Performance info can be accessed via PerformanceDebug.logMetrics() if needed

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Component profiler for detailed performance analysis
 */
export function withProfiler<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return function ProfiledComponent(props: P) {
    usePerformanceMonitor(componentName);
    useMemoryMonitor(componentName);

    return React.createElement(Component, props);
  };
}

/**
 * Performance debugging utilities
 */
export const PerformanceDebug = {
  /**
   * Log current performance metrics
   */
  logMetrics() {
    const summary = performanceRegistry.getSummary();
    const allMetrics = performanceRegistry.getAllMetrics();

    console.group('🚀 Performance Metrics');
    console.log('Summary:', summary);
    console.table(allMetrics);
    console.groupEnd();
  },

  /**
   * Identify performance bottlenecks
   */
  identifyBottlenecks() {
    const allMetrics = performanceRegistry.getAllMetrics();
    const bottlenecks = allMetrics.filter(
      m => m.averageRenderTime > PERFORMANCE_THRESHOLDS.WARNING_RENDER_TIME || m.renderCount > 100
    );

    if (bottlenecks.length > 0) {
      console.group('⚠️ Performance Bottlenecks');
      console.table(bottlenecks);
      console.groupEnd();
    } else {
      console.log('✅ No performance bottlenecks detected');
    }

    return bottlenecks;
  },

  /**
   * Clear all performance data
   */
  clear() {
    performanceRegistry.clear();
    console.log('🧹 Performance metrics cleared');
  },

  /**
   * Enable performance warnings
   */
  enableWarnings() {
    if (typeof window !== 'undefined') {
      (window as any).__PERFORMANCE_WARNINGS_ENABLED__ = true;
    }
  },

  /**
   * Disable performance warnings
   */
  disableWarnings() {
    if (typeof window !== 'undefined') {
      (window as any).__PERFORMANCE_WARNINGS_ENABLED__ = false;
    }
  },
};

// Add performance debugging to global scope in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).PerformanceDebug = PerformanceDebug;
}
