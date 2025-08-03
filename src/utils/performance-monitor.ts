// ABOUTME: Performance monitoring utility for measuring table detection inefficiencies and optimization impact

interface PerformanceMetrics {
  proseMirrorCalls: number;
  domTraversalCalls: number;
  executionTimeMs: number;
  cacheHits: number;
  cacheMisses: number;
}

interface DetectionMetrics extends PerformanceMetrics {
  detectionMethod: 'dom' | 'prosemirror' | 'hybrid';
  success: boolean;
  elementType: string;
  errorCount: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    proseMirrorCalls: 0,
    domTraversalCalls: 0,
    executionTimeMs: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  private callStack: string[] = [];
  private startTime: number = 0;

  /**
   * Reset all metrics counters
   */
  reset(): void {
    this.metrics = {
      proseMirrorCalls: 0,
      domTraversalCalls: 0,
      executionTimeMs: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
    this.callStack = [];
  }

  /**
   * Start timing a performance measurement
   */
  startTiming(): void {
    this.startTime = performance.now();
  }

  /**
   * Stop timing and record execution time
   */
  stopTiming(): number {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    this.metrics.executionTimeMs += duration;
    return duration;
  }

  /**
   * Record a ProseMirror state access call
   */
  recordProseMirrorCall(functionName: string, details?: any): void {
    this.metrics.proseMirrorCalls++;
    this.callStack.push(`PM:${functionName}`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PerformanceMonitor] ProseMirror call: ${functionName}`, details);
    }
  }

  /**
   * Record a DOM traversal operation
   */
  recordDomTraversal(operation: string): void {
    this.metrics.domTraversalCalls++;
    this.callStack.push(`DOM:${operation}`);
  }

  /**
   * Record cache hit/miss
   */
  recordCacheEvent(hit: boolean): void {
    if (hit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get detailed call stack for debugging
   */
  getCallStack(): string[] {
    return [...this.callStack];
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    const cacheHitRate = metrics.cacheHits + metrics.cacheMisses > 0 
      ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) * 100).toFixed(1)
      : '0';

    return `
📊 Performance Report
├── ProseMirror Calls: ${metrics.proseMirrorCalls}
├── DOM Traversals: ${metrics.domTraversalCalls}
├── Execution Time: ${metrics.executionTimeMs.toFixed(2)}ms
├── Cache Hit Rate: ${cacheHitRate}%
└── Call Stack (${this.callStack.length} operations):
    ${this.callStack.slice(-10).join(' → ')}
    `.trim();
  }
}

// Global monitor instance
const globalMonitor = new PerformanceMonitor();

/**
 * Measure ProseMirror calls within a function execution
 * Used to establish baseline metrics for current inefficient system
 */
export function measureProseMirrorCalls(fn: () => void): { proseMirrorCalls: number } {
  const initialCount = globalMonitor.getMetrics().proseMirrorCalls;
  
  // Instrument common ProseMirror operations during execution
  const originalConsoleWarn = console.warn;
  let pmCallsDetected = 0;
  
  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('findParentCell') || 
        message.includes('ProseMirror') || 
        message.includes('doc.resolve')) {
      pmCallsDetected++;
      globalMonitor.recordProseMirrorCall('detected-via-warning', { message });
    }
    originalConsoleWarn(...args);
  };

  try {
    globalMonitor.startTiming();
    fn();
    globalMonitor.stopTiming();
  } finally {
    console.warn = originalConsoleWarn;
  }

  const finalCount = globalMonitor.getMetrics().proseMirrorCalls;
  
  return {
    proseMirrorCalls: (finalCount - initialCount) + pmCallsDetected
  };
}

/**
 * Measure optimized table detection performance
 * Used to validate that unified system eliminates ProseMirror calls
 */
export function measureOptimizedDetection(element: HTMLElement): DetectionMetrics {
  globalMonitor.reset();
  globalMonitor.startTiming();

  let detectionMethod: 'dom' | 'prosemirror' | 'hybrid' = 'dom';
  let success = false;
  let errorCount = 0;

  try {
    // This will eventually call the unified detection utility
    // For now, simulate optimized DOM-based detection
    
    globalMonitor.recordDomTraversal('findDataAttributes');
    
    // Check for table cell data attributes
    const isTableCell = element.hasAttribute('data-testid') && 
                       element.getAttribute('data-testid')?.startsWith('table-cell-');
    
    if (isTableCell) {
      globalMonitor.recordDomTraversal('extractCellPosition');
      globalMonitor.recordDomTraversal('findTableContainer');
      detectionMethod = 'dom';
      success = true;
    } else {
      // Check if it's inside a table structure
      globalMonitor.recordDomTraversal('traverseParentNodes');
      const tableAncestor = element.closest('table, [data-block-id]');
      success = Boolean(tableAncestor);
    }

    globalMonitor.recordCacheEvent(false); // Miss for first-time detection
    
  } catch (error) {
    errorCount++;
    console.warn('[measureOptimizedDetection] Error during detection:', error);
  }

  const executionTime = globalMonitor.stopTiming();
  const metrics = globalMonitor.getMetrics();

  return {
    ...metrics,
    detectionMethod,
    success,
    elementType: element.tagName.toLowerCase(),
    errorCount,
  };
}

/**
 * Instrument existing findParentCell function to track calls
 * This helps identify when and how often the problematic function is called
 */
export function instrumentFindParentCell(originalFunction: Function): Function {
  return function instrumentedFindParentCell(...args: any[]) {
    globalMonitor.recordProseMirrorCall('findParentCell', {
      args: args.map(arg => typeof arg === 'object' ? '[object]' : arg),
      stackTrace: new Error().stack?.split('\n').slice(1, 4)
    });

    globalMonitor.startTiming();
    try {
      const result = originalFunction.apply(this, args);
      globalMonitor.stopTiming();
      return result;
    } catch (error) {
      globalMonitor.stopTiming();
      globalMonitor.recordProseMirrorCall('findParentCell-error', { error: error.message });
      throw error;
    }
  };
}

/**
 * Benchmark table detection performance
 * Used to validate performance improvements
 */
export function benchmarkTableDetection(
  element: HTMLElement, 
  iterations: number = 1000
): {
  avgTimeMs: number;
  totalProseMirrorCalls: number;
  totalDomCalls: number;
  successRate: number;
} {
  globalMonitor.reset();
  let successCount = 0;
  
  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    try {
      const result = measureOptimizedDetection(element);
      if (result.success) {
        successCount++;
      }
    } catch (error) {
      // Count failures
    }
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const metrics = globalMonitor.getMetrics();
  
  return {
    avgTimeMs: totalTime / iterations,
    totalProseMirrorCalls: metrics.proseMirrorCalls,
    totalDomCalls: metrics.domTraversalCalls,
    successRate: (successCount / iterations) * 100,
  };
}

/**
 * Create performance monitoring session
 * Useful for tracking performance across multiple operations
 */
export function createMonitoringSession(sessionName: string) {
  const sessionMonitor = new PerformanceMonitor();
  
  return {
    start: () => sessionMonitor.startTiming(),
    stop: () => sessionMonitor.stopTiming(),
    recordProseMirror: (fn: string, details?: any) => sessionMonitor.recordProseMirrorCall(fn, details),
    recordDom: (op: string) => sessionMonitor.recordDomTraversal(op),
    recordCache: (hit: boolean) => sessionMonitor.recordCacheEvent(hit),
    getMetrics: () => sessionMonitor.getMetrics(),
    generateReport: () => `[${sessionName}] ${sessionMonitor.generateReport()}`,
    reset: () => sessionMonitor.reset(),
  };
}

/**
 * Monitor DOM selection events for performance analysis
 */
export function monitorSelectionEvents() {
  const eventMonitor = createMonitoringSession('SelectionEvents');
  let eventCount = 0;

  const originalHandler = document.addEventListener;
  
  // Wrap event listeners to track selection-related events
  const monitoredEvents = ['selectionchange', 'mouseup', 'keyup', 'focus', 'blur'];
  
  monitoredEvents.forEach(eventType => {
    document.addEventListener(eventType, () => {
      eventCount++;
      eventMonitor.recordDom(`${eventType}-event`);
      
      if (eventCount % 50 === 0) {
        console.log(`[SelectionMonitor] ${eventCount} events processed`);
        console.log(eventMonitor.generateReport());
      }
    });
  });

  return {
    getEventCount: () => eventCount,
    getReport: () => eventMonitor.generateReport(),
    reset: () => {
      eventCount = 0;
      eventMonitor.reset();
    }
  };
}

// Export singleton instance for global monitoring
export { globalMonitor };

// Development utilities
if (process.env.NODE_ENV === 'development') {
  // Make monitor available in global scope for debugging
  (window as any).__performanceMonitor = globalMonitor;
}