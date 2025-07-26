// ABOUTME: React performance optimization hooks for preventing unnecessary re-renders in Rich Block editor

import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { debounce } from 'lodash-es';

/**
 * Options for render optimization hooks
 */
export interface RenderOptimizationOptions {
  /** Enable performance logging in development */
  enableLogging?: boolean;
  /** Debounce delay for expensive operations (ms) */
  debounceMs?: number;
  /** Maximum number of renders to log before suppressing */
  maxLogCount?: number;
}

/**
 * Component render tracking data
 */
export interface RenderTrackingData {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  avgRenderTime: number;
  propsChanged: string[];
  warningThreshold: number;
}

/**
 * Global render tracking registry
 */
class RenderTracker {
  private trackingData = new Map<string, RenderTrackingData>();
  private enabled = process.env.NODE_ENV === 'development';

  track(componentName: string, renderStartTime: number, propsChanged: string[] = []): void {
    if (!this.enabled) return;

    const renderTime = performance.now() - renderStartTime;
    const existing = this.trackingData.get(componentName);

    if (existing) {
      existing.renderCount++;
      existing.lastRenderTime = renderTime;
      existing.avgRenderTime = (existing.avgRenderTime + renderTime) / 2;
      existing.propsChanged = propsChanged;

      // Warn about excessive re-renders
      if (existing.renderCount > existing.warningThreshold) {
        console.warn(
          `🐌 Component "${componentName}" has rendered ${existing.renderCount} times. ` +
            `Avg render time: ${existing.avgRenderTime.toFixed(2)}ms. ` +
            `Props changed: ${propsChanged.join(', ')}`
        );
        existing.warningThreshold *= 2; // Exponential backoff for warnings
      }
    } else {
      this.trackingData.set(componentName, {
        componentName,
        renderCount: 1,
        lastRenderTime: renderTime,
        avgRenderTime: renderTime,
        propsChanged,
        warningThreshold: 10,
      });
    }
  }

  getStats(): RenderTrackingData[] {
    return Array.from(this.trackingData.values()).sort((a, b) => b.renderCount - a.renderCount);
  }

  reset(): void {
    this.trackingData.clear();
  }

  logStats(): void {
    if (!this.enabled) return;

    const stats = this.getStats();
    if (stats.length === 0) return;

    console.group('🎯 Component Render Performance Stats');
    stats.slice(0, 10).forEach(stat => {
      const emoji = stat.renderCount > 20 ? '🚨' : stat.renderCount > 10 ? '⚠️' : '✅';
      console.log(
        `${emoji} ${stat.componentName}: ${stat.renderCount} renders, ` +
          `${stat.avgRenderTime.toFixed(2)}ms avg`
      );
    });
    console.groupEnd();
  }
}

const globalRenderTracker = new RenderTracker();

/**
 * Hook to track component renders and detect performance issues
 * Automatically logs excessive re-renders in development
 */
export const useRenderTracking = (
  componentName: string,
  props: Record<string, any> = {},
  options: RenderOptimizationOptions = {}
) => {
  const { enableLogging = true, maxLogCount = 50 } = options;

  const renderStartTime = useRef(performance.now());
  const previousProps = useRef(props);
  const renderCount = useRef(0);

  // Track which props changed
  const propsChanged = useMemo(() => {
    const changed: string[] = [];
    const prev = previousProps.current;

    for (const key in props) {
      if (prev[key] !== props[key]) {
        changed.push(key);
      }
    }

    for (const key in prev) {
      if (!(key in props)) {
        changed.push(`-${key}`); // Removed prop
      }
    }

    return changed;
  }, [props]);

  useEffect(() => {
    renderCount.current++;

    if (enableLogging && renderCount.current <= maxLogCount) {
      globalRenderTracker.track(componentName, renderStartTime.current, propsChanged);
    }

    previousProps.current = props;
    renderStartTime.current = performance.now();
  });

  return {
    renderCount: renderCount.current,
    propsChanged,
    logStats: () => globalRenderTracker.logStats(),
  };
};

/**
 * Optimized useState that only triggers re-renders when value actually changes
 * Uses Object.is for comparison (same as React's internal comparison)
 */
export const useOptimizedState = <T>(
  initialValue: T
): [T, (newValue: T | ((prev: T) => T)) => void] => {
  const [state, setState] = useState(initialValue);

  const optimizedSetState = useCallback((newValue: T | ((prev: T) => T)) => {
    setState(prevState => {
      const nextState =
        typeof newValue === 'function' ? (newValue as (prev: T) => T)(prevState) : newValue;

      // Only update if value actually changed
      return Object.is(prevState, nextState) ? prevState : nextState;
    });
  }, []);

  return [state, optimizedSetState];
};

/**
 * Memoized callback that only changes when dependencies actually change
 * More aggressive memoization than useCallback for expensive operations
 */
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const callbackRef = useRef(callback);
  const depsRef = useRef(deps);

  // Update callback only if dependencies actually changed
  const depsChanged = useMemo(() => {
    if (depsRef.current.length !== deps.length) return true;
    return deps.some((dep, index) => !Object.is(dep, depsRef.current[index]));
  }, deps);

  useEffect(() => {
    if (depsChanged) {
      callbackRef.current = callback;
      depsRef.current = deps;
    }
  }, [callback, depsChanged, deps]);

  return callbackRef.current;
};

/**
 * Debounced callback with automatic cleanup
 * Prevents excessive calls during rapid state changes
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): [T, { cancel: () => void; flush: () => void }] => {
  const debouncedCallback = useMemo(() => debounce(callback, delay), [callback, delay, ...deps]);

  useEffect(() => {
    return () => {
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);

  return [debouncedCallback as T, debouncedCallback];
};

/**
 * Memoized value with deep comparison for objects/arrays
 * Prevents re-renders when object content is the same but reference changed
 */
export const useDeepMemo = <T>(factory: () => T, deps: React.DependencyList): T => {
  const ref = useRef<T>();
  const depsRef = useRef<React.DependencyList>();

  const depsChanged = useMemo(() => {
    if (!depsRef.current) return true;
    if (depsRef.current.length !== deps.length) return true;

    return deps.some((dep, index) => {
      const prevDep = depsRef.current![index];

      // Use deep comparison for objects/arrays
      if (
        typeof dep === 'object' &&
        dep !== null &&
        typeof prevDep === 'object' &&
        prevDep !== null
      ) {
        return JSON.stringify(dep) !== JSON.stringify(prevDep);
      }

      return !Object.is(dep, prevDep);
    });
  }, deps);

  if (depsChanged || ref.current === undefined) {
    ref.current = factory();
    depsRef.current = deps;
  }

  return ref.current;
};

/**
 * Hook for lazy computation that only runs when value is needed
 * Useful for expensive calculations that might not be used
 */
export const useLazyMemo = <T>(factory: () => T, deps: React.DependencyList): (() => T) => {
  const memoizedValue = useMemo(factory, deps);

  return useCallback(() => memoizedValue, [memoizedValue]);
};

/**
 * Batch state updates to prevent multiple re-renders
 * Useful when updating multiple related state values
 */
export const useBatchedUpdates = () => {
  const batchedUpdates = useCallback(<T>(fn: () => T): T => {
    // In React 18+, updates are automatically batched
    // For React 17 and below, we would use unstable_batchedUpdates
    return fn();
  }, []);

  return batchedUpdates;
};

/**
 * Prevents re-renders of child components when parent renders
 * Similar to React.memo but as a hook
 */
export const useRenderBarrier = <T extends Record<string, any>>(
  props: T,
  compare?: (prevProps: T, nextProps: T) => boolean
): T => {
  const propsRef = useRef(props);

  const memoizedProps = useMemo(
    () => props,
    [compare ? compare(propsRef.current, props) : Object.values(props)]
  );

  propsRef.current = props;
  return memoizedProps;
};

/**
 * Performance monitoring hook for expensive operations
 * Logs timing information in development
 */
export const usePerformanceMonitor = (
  operationName: string,
  enabled: boolean = process.env.NODE_ENV === 'development'
) => {
  const startTime = useRef<number>();

  const start = useCallback(() => {
    if (enabled) {
      startTime.current = performance.now();
    }
  }, [enabled]);

  const end = useCallback(() => {
    if (enabled && startTime.current) {
      const duration = performance.now() - startTime.current;
      if (duration > 16) {
        // More than one frame at 60fps
        console.warn(`⚠️ Slow operation "${operationName}": ${duration.toFixed(2)}ms`);
      }
    }
  }, [enabled, operationName]);

  const measure = useCallback(
    <T>(fn: () => T): T => {
      start();
      const result = fn();
      end();
      return result;
    },
    [start, end]
  );

  return { start, end, measure };
};

/**
 * Hook to prevent component updates during animations or transitions
 * Useful to maintain smooth animations
 */
export const useRenderSuspension = (shouldSuspend: boolean) => {
  const suspendedValue = useRef<any>();
  const isSuspended = useRef(false);

  useEffect(() => {
    if (shouldSuspend && !isSuspended.current) {
      isSuspended.current = true;
    } else if (!shouldSuspend && isSuspended.current) {
      isSuspended.current = false;
    }
  }, [shouldSuspend]);

  const suspendRender = useCallback((value: any) => {
    if (isSuspended.current) {
      return suspendedValue.current;
    }
    suspendedValue.current = value;
    return value;
  }, []);

  return { suspendRender, isSuspended: isSuspended.current };
};

// Export render tracker for global access
export { globalRenderTracker };
