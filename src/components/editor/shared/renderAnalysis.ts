// ABOUTME: Render performance analysis utilities for identifying and optimizing component render patterns

import { useRef, useEffect, useCallback } from 'react';

/**
 * Render reason tracking for performance analysis
 */
export interface RenderReason {
  timestamp: number;
  reason: 'props' | 'state' | 'context' | 'force' | 'mount' | 'unmount';
  details: string;
  renderDuration?: number;
}

/**
 * Component render analytics
 */
export interface RenderAnalytics {
  componentName: string;
  totalRenders: number;
  averageRenderTime: number;
  maxRenderTime: number;
  renderReasons: RenderReason[];
  propsChanges: number;
  stateChanges: number;
  wastedRenders: number; // Renders that didn't change output
}

/**
 * Global render analytics registry
 */
class RenderAnalyticsRegistry {
  private analytics = new Map<string, RenderAnalytics>();
  private renderCounts = new Map<string, number>();

  recordRender(
    componentName: string,
    reason: RenderReason['reason'],
    details: string,
    renderTime?: number
  ) {
    const existing = this.analytics.get(componentName);
    const renderReason: RenderReason = {
      timestamp: Date.now(),
      reason,
      details,
      renderDuration: renderTime,
    };

    if (existing) {
      existing.totalRenders++;
      existing.renderReasons.push(renderReason);

      if (renderTime) {
        existing.averageRenderTime =
          (existing.averageRenderTime * (existing.totalRenders - 1) + renderTime) /
          existing.totalRenders;
        existing.maxRenderTime = Math.max(existing.maxRenderTime, renderTime);
      }

      if (reason === 'props') existing.propsChanges++;
      if (reason === 'state') existing.stateChanges++;

      // Keep only last 50 render reasons for memory efficiency
      if (existing.renderReasons.length > 50) {
        existing.renderReasons = existing.renderReasons.slice(-50);
      }
    } else {
      this.analytics.set(componentName, {
        componentName,
        totalRenders: 1,
        averageRenderTime: renderTime || 0,
        maxRenderTime: renderTime || 0,
        renderReasons: [renderReason],
        propsChanges: reason === 'props' ? 1 : 0,
        stateChanges: reason === 'state' ? 1 : 0,
        wastedRenders: 0,
      });
    }
  }

  getAnalytics(componentName: string): RenderAnalytics | undefined {
    return this.analytics.get(componentName);
  }

  getAllAnalytics(): RenderAnalytics[] {
    return Array.from(this.analytics.values());
  }

  getPerformanceReport() {
    const allAnalytics = this.getAllAnalytics();

    return {
      totalComponents: allAnalytics.length,
      totalRenders: allAnalytics.reduce((sum, a) => sum + a.totalRenders, 0),
      averageRenderTime:
        allAnalytics.reduce((sum, a) => sum + a.averageRenderTime, 0) / allAnalytics.length || 0,
      slowestComponents: allAnalytics.sort((a, b) => b.maxRenderTime - a.maxRenderTime).slice(0, 5),
      mostActiveComponents: allAnalytics
        .sort((a, b) => b.totalRenders - a.totalRenders)
        .slice(0, 5),
      wastefulness: allAnalytics.sort((a, b) => b.wastedRenders - a.wastedRenders).slice(0, 5),
    };
  }

  clear() {
    this.analytics.clear();
    this.renderCounts.clear();
  }
}

export const renderAnalyticsRegistry = new RenderAnalyticsRegistry();

/**
 * Hook for tracking render reasons and performance
 */
export function useRenderAnalysis(
  componentName: string,
  enabled: boolean = process.env.NODE_ENV === 'development'
) {
  const renderStartTime = useRef<number>(0);
  const previousProps = useRef<any>(null);
  const previousState = useRef<any>(null);
  const renderCount = useRef(0);

  // Start timing
  if (enabled) {
    renderStartTime.current = performance.now();
    renderCount.current++;
  }

  useEffect(() => {
    if (!enabled) return;

    const renderTime = performance.now() - renderStartTime.current;

    // Determine render reason
    let reason: RenderReason['reason'] = 'mount';
    let details = 'Initial mount';

    if (renderCount.current > 1) {
      if (previousProps.current !== null) {
        reason = 'props';
        details = 'Props changed';
      } else {
        reason = 'state';
        details = 'State changed';
      }
    }

    renderAnalyticsRegistry.recordRender(componentName, reason, details, renderTime);
  });

  const trackStateChange = useCallback(
    (stateName: string) => {
      if (!enabled) return;
      renderAnalyticsRegistry.recordRender(componentName, 'state', `State changed: ${stateName}`);
    },
    [componentName, enabled]
  );

  const trackPropsChange = useCallback(
    (propsNames: string[]) => {
      if (!enabled) return;
      renderAnalyticsRegistry.recordRender(
        componentName,
        'props',
        `Props changed: ${propsNames.join(', ')}`
      );
    },
    [componentName, enabled]
  );

  return {
    trackStateChange,
    trackPropsChange,
    getRenderCount: () => renderCount.current,
    getAnalytics: () => renderAnalyticsRegistry.getAnalytics(componentName),
  };
}

/**
 * Hook for detecting unnecessary re-renders
 */
export function useRenderWasteDetection(
  componentName: string,
  props: Record<string, any>,
  enabled: boolean = process.env.NODE_ENV === 'development'
) {
  const previousProps = useRef<Record<string, any>>(props);
  const previousOutput = useRef<string>('');
  const renderCount = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    renderCount.current++;

    // Compare props to detect changes
    const changedProps: string[] = [];
    const propKeys = Object.keys(props);

    for (const key of propKeys) {
      if (previousProps.current[key] !== props[key]) {
        changedProps.push(key);
      }
    }

    // If props haven't changed but component re-rendered, it might be wasted
    if (changedProps.length === 0 && renderCount.current > 1) {
      const analytics = renderAnalyticsRegistry.getAnalytics(componentName);
      if (analytics) {
        analytics.wastedRenders++;
        // Only warn for excessive wasted renders (10+ times) to avoid console spam
        if (analytics.wastedRenders === 10) {
          console.warn(
            `🚨 Critical Performance Warning: ${componentName} has accumulated ${analytics.wastedRenders} wasted renders. Props unchanged but component re-rendered.`
          );
        }
      }
    }

    previousProps.current = props;
  }, [componentName, props, enabled]);

  return {
    getWastedRenderCount: () =>
      renderAnalyticsRegistry.getAnalytics(componentName)?.wastedRenders || 0,
  };
}

/**
 * Props comparison utility for React.memo
 */
export function createShallowPropsComparison<T extends Record<string, any>>(
  componentName: string,
  propsToIgnore: (keyof T)[] = []
) {
  return (prevProps: T, nextProps: T): boolean => {
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    // Different number of props
    if (prevKeys.length !== nextKeys.length) {
      // Remove frequent logging to prevent console spam
      // Debug info can be accessed via RenderAnalysisDebug.logAnalytics() if needed
      return false;
    }

    // Check each prop
    for (const key of nextKeys) {
      if (propsToIgnore.includes(key as keyof T)) continue;

      if (prevProps[key] !== nextProps[key]) {
        // Remove frequent logging to prevent console spam
        // Debug info can be accessed via RenderAnalysisDebug.logAnalytics() if needed
        return false;
      }
    }

    return true; // Props are equal, skip re-render
  };
}

/**
 * Render performance debugging utilities
 */
export const RenderAnalysisDebug = {
  /**
   * Log render analytics for all components
   */
  logAnalytics() {
    const report = renderAnalyticsRegistry.getPerformanceReport();

    console.group('🎯 Render Performance Analytics');
    console.log('Summary:', report);
    console.table(renderAnalyticsRegistry.getAllAnalytics());
    console.groupEnd();
  },

  /**
   * Identify components with performance issues
   */
  identifyPerformanceIssues() {
    const analytics = renderAnalyticsRegistry.getAllAnalytics();
    const issues: string[] = [];

    analytics.forEach(component => {
      // Only report critical performance issues (higher thresholds to avoid spam)
      if (component.averageRenderTime > 50) {
        issues.push(
          `${component.componentName}: Critical slow renders (${component.averageRenderTime.toFixed(2)}ms avg)`
        );
      }

      if (component.totalRenders > 1000) {
        issues.push(
          `${component.componentName}: Excessive render count (${component.totalRenders} renders)`
        );
      }

      if (component.wastedRenders > 100) {
        issues.push(
          `${component.componentName}: Excessive wasted renders (${component.wastedRenders} unnecessary)`
        );
      }
    });

    if (issues.length > 0) {
      console.group('⚠️ Critical Render Performance Issues');
      issues.forEach(issue => console.warn(issue));
      console.groupEnd();
    } else {
      console.log('✅ No critical render performance issues detected');
    }

    return issues;
  },

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations() {
    const analytics = renderAnalyticsRegistry.getAllAnalytics();
    const recommendations: string[] = [];

    analytics.forEach(component => {
      if (component.propsChanges > component.stateChanges * 2) {
        recommendations.push(
          `${component.componentName}: Consider React.memo or props optimization`
        );
      }

      if (component.wastedRenders > 5) {
        recommendations.push(
          `${component.componentName}: Add proper dependency arrays to useEffect/useCallback/useMemo`
        );
      }

      if (component.averageRenderTime > 10) {
        recommendations.push(
          `${component.componentName}: Consider component splitting or virtualization`
        );
      }
    });

    if (recommendations.length > 0) {
      console.group('💡 Optimization Recommendations');
      recommendations.forEach(rec => console.log(rec));
      console.groupEnd();
    }

    return recommendations;
  },

  /**
   * Clear all analytics data
   */
  clear() {
    renderAnalyticsRegistry.clear();
    console.log('🧹 Render analytics cleared');
  },
};

// Add to global scope in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).RenderAnalysisDebug = RenderAnalysisDebug;
}
