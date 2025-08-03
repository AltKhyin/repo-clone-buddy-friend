// ABOUTME: Central unified resize controller with 60fps performance optimization

import { debounce } from 'lodash-es';
import { BlockPosition } from '@/types/editor';
import { globalPerformanceOptimizer, OptimizationStrategy } from './PerformanceOptimizerStub';

// Core resize handle types
export type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

// Mouse position interface
export interface MousePosition {
  x: number;
  y: number;
}

// Resize update interface for batching
export interface ResizeUpdate {
  nodeId: string;
  position: Partial<BlockPosition>;
  source: 'resize' | 'inspector' | 'content';
  priority: 'high' | 'normal';
  timestamp: number;
}

// Content-aware minimum dimensions
export interface ContentAwareMinimums {
  width: number;
  height: number;
}

// Performance metrics for monitoring
export interface PerformanceMetrics {
  averageFrameTime: number;
  droppedFrames: number;
  totalOperations: number;
  lastOperationTime: number;
}

// Operation lock to prevent conflicts
class OperationLock {
  private currentOperation: 'resize' | 'inspector-adjust' | 'content-change' | null = null;
  private lockTimeout: NodeJS.Timeout | null = null;

  acquireLock(operation: 'resize' | 'inspector-adjust' | 'content-change'): boolean {
    if (this.currentOperation === null) {
      this.currentOperation = operation;
      
      // Auto-release lock after 100ms to prevent permanent locks
      this.lockTimeout = setTimeout(() => {
        this.releaseLock();
      }, 100);
      
      return true;
    }
    return false;
  }

  releaseLock(): void {
    this.currentOperation = null;
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout);
      this.lockTimeout = null;
    }
  }

  isLocked(): boolean {
    return this.currentOperation !== null;
  }

  getCurrentOperation(): string | null {
    return this.currentOperation;
  }
}

// Batched update manager with adaptive 60fps performance optimization
class BatchUpdateManager {
  private pendingUpdates = new Map<string, ResizeUpdate>();
  private onUpdateCallback: (updates: ResizeUpdate[]) => void;
  
  // Adaptive performance-optimized debouncer
  private debouncedFlush: ReturnType<typeof globalPerformanceOptimizer.createOptimizedDebounce>;

  constructor(onUpdate: (updates: ResizeUpdate[]) => void, strategy?: OptimizationStrategy) {
    this.onUpdateCallback = onUpdate;
    
    // Create performance-optimized debouncer
    this.debouncedFlush = globalPerformanceOptimizer.createOptimizedDebounce(() => {
      this.flushUpdates();
    }, {
      strategy,
      onPerformanceDrop: () => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('🚨 Resize performance dropping, switching to high-performance mode');
        }
        globalPerformanceOptimizer.enableHighPerformanceMode();
      },
      onPerformanceImprove: () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Resize performance improved, enabling adaptive mode');
        }
        globalPerformanceOptimizer.enableAdaptiveMode();
      }
    });
  }

  addUpdate(update: ResizeUpdate): void {
    // Use nodeId as key to batch multiple updates to same node
    this.pendingUpdates.set(update.nodeId, update);
    this.debouncedFlush();
  }

  private flushUpdates(): void {
    if (this.pendingUpdates.size === 0) return;

    // Convert to array and sort by priority and timestamp
    const updates = Array.from(this.pendingUpdates.values()).sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1;
      }
      return a.timestamp - b.timestamp;
    });

    // Clear pending updates
    this.pendingUpdates.clear();

    // Execute batch update
    this.onUpdateCallback(updates);
  }

  cancel(): void {
    this.debouncedFlush.cancel();
    this.pendingUpdates.clear();
  }
}

// DOM cache for optimized queries
class DOMCache {
  private cache = new Map<string, HTMLElement>();
  private resizeObservers = new Map<string, ResizeObserver>();

  getElement(nodeId: string): HTMLElement | null {
    try {
      // Check cache first with enhanced validation
      if (this.cache.has(nodeId)) {
        const element = this.cache.get(nodeId)!;
        if (element && document.contains(element)) {
          return element;
        }
        // Remove stale reference
        this.cache.delete(nodeId);
      }

      // Primary query strategy: data-block-id attribute
      let element = document.querySelector(`[data-block-id="${nodeId}"]`) as HTMLElement;
      
      // Fallback query strategies for robustness
      if (!element) {
        // Try data-testid fallback
        element = document.querySelector(`[data-testid="unified-block-${nodeId}"]`) as HTMLElement;
      }
      
      if (!element) {
        // Try data-node-id fallback (for nested content)
        element = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
      }
      
      // Validate element before caching
      if (element && element.nodeType === Node.ELEMENT_NODE) {
        this.cache.set(nodeId, element);
        return element;
      }

      // Log warning in development for debugging
      if (process.env.NODE_ENV === 'development') {
        console.warn(`🔍 DOM Cache: Element not found for nodeId: ${nodeId}`);
        console.warn('Available data-block-id elements:', 
          Array.from(document.querySelectorAll('[data-block-id]')).map(el => el.getAttribute('data-block-id')));
      }
      
      return null;
      
    } catch (error) {
      console.error('🚨 DOM Cache: Query failed for nodeId:', nodeId, error);
      return null;
    }
  }

  observeContentChanges(nodeId: string, callback: (dimensions: { width: number; height: number }) => void): void {
    const element = this.getElement(nodeId);
    if (!element || this.resizeObservers.has(nodeId)) return;

    const contentWrapper = element.querySelector('.unified-content-area') as HTMLElement;
    if (!contentWrapper) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        callback({ width, height });
      }
    });

    observer.observe(contentWrapper);
    this.resizeObservers.set(nodeId, observer);
  }

  stopObserving(nodeId: string): void {
    const observer = this.resizeObservers.get(nodeId);
    if (observer) {
      observer.disconnect();
      this.resizeObservers.delete(nodeId);
    }
    this.cache.delete(nodeId);
  }

  clear(): void {
    this.resizeObservers.forEach(observer => observer.disconnect());
    this.resizeObservers.clear();
    this.cache.clear();
  }
}

/**
 * Unified Resize Controller - Single source of truth for all resize operations
 * Eliminates dual resize system conflicts while maintaining 60fps performance
 */
export class UnifiedResizeController {
  private nodeId: string;
  private isResizing = false;
  private currentHandle: ResizeHandle | null = null;
  private startMousePosition: MousePosition = { x: 0, y: 0 };
  private startDimensions: BlockPosition;
  private contentAwareMinimums: ContentAwareMinimums;
  private maxDimensions: { width: number; height: number };
  private zoom: number;

  // Core systems
  private operationLock = new OperationLock();
  private batchManager: BatchUpdateManager;
  private domCache = new DOMCache();

  // Performance monitoring handled by globalPerformanceOptimizer

  // Update callback
  private onUpdateCallback: (nodeId: string, position: Partial<BlockPosition>) => void;

  constructor(
    nodeId: string,
    startDimensions: BlockPosition,
    options: {
      contentAwareMinimums?: ContentAwareMinimums;
      maxDimensions?: { width: number; height: number };
      zoom?: number;
      onUpdate: (nodeId: string, position: Partial<BlockPosition>) => void;
    }
  ) {
    this.nodeId = nodeId;
    this.startDimensions = { ...startDimensions };
    this.contentAwareMinimums = options.contentAwareMinimums || { width: 100, height: 60 };
    this.maxDimensions = options.maxDimensions || { width: 1200, height: 800 };
    this.zoom = options.zoom || 1;
    this.onUpdateCallback = options.onUpdate;

    // Initialize batch manager with adaptive performance optimization
    this.batchManager = new BatchUpdateManager((updates) => {
      this.processBatchedUpdates(updates);
    }, OptimizationStrategy.ADAPTIVE);

    // Start observing content changes for automatic minimum dimension updates
    this.domCache.observeContentChanges(nodeId, (dimensions) => {
      this.updateContentMinimums(dimensions);
    });
  }

  /**
   * Start resize operation - replaces both useResizeSystem and embedded ResizeHandles
   */
  startResize(handle: ResizeHandle, mousePosition: MousePosition): boolean {
    if (!this.operationLock.acquireLock('resize')) {
      return false; // Another operation in progress
    }

    this.isResizing = true;
    this.currentHandle = handle;
    this.startMousePosition = { ...mousePosition };
    
    // Capture current dimensions as start point
    const element = this.domCache.getElement(this.nodeId);
    if (element) {
      const rect = element.getBoundingClientRect();
      this.startDimensions = {
        ...this.startDimensions,
        width: rect.width,
        height: rect.height,
        x: parseInt(element.style.left) || this.startDimensions.x,
        y: parseInt(element.style.top) || this.startDimensions.y,
      };
    }

    return true;
  }

  /**
   * Update resize operation with 60fps performance optimization
   */
  updateResize(mousePosition: MousePosition): void {
    if (!this.isResizing || !this.currentHandle) return;

    const startTime = performance.now();

    // Calculate mouse delta with zoom factor
    const deltaX = (mousePosition.x - this.startMousePosition.x) / this.zoom;
    const deltaY = (mousePosition.y - this.startMousePosition.y) / this.zoom;

    // Calculate new dimensions based on handle
    const newPosition = this.calculateNewPosition(this.currentHandle, deltaX, deltaY);

    // Apply constraints
    const constrainedPosition = this.applyConstraints(newPosition);

    // Add to batch queue for optimized updates
    this.batchManager.addUpdate({
      nodeId: this.nodeId,
      position: constrainedPosition,
      source: 'resize',
      priority: 'high',
      timestamp: startTime,
    });

    // Performance tracking is now handled by globalPerformanceOptimizer
    // No need for manual metrics update
  }

  /**
   * End resize operation
   */
  endResize(): void {
    this.isResizing = false;
    this.currentHandle = null;
    this.operationLock.releaseLock();
  }

  /**
   * Inspector height adjustment integration - prevents conflicts with enhanced error handling
   */
  adjustHeightToContent(): number {
    const maxRetries = 3;
    let attempt = 0;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📏 Inspector: Starting height adjustment for nodeId:', this.nodeId);
    }
    
    while (attempt < maxRetries) {
      // Try to acquire operation lock with retry logic
      if (!this.operationLock.acquireLock('inspector-adjust')) {
        if (attempt < maxRetries - 1) {
          // Wait briefly and retry if locked
          attempt++;
          console.warn(`📏 Inspector: Height adjustment locked, retrying (${attempt}/${maxRetries})`);
          continue;
        }
        console.warn('📏 Inspector: Height adjustment locked after retries, skipping');
        return this.startDimensions.height;
      }

      try {
        // Enhanced DOM element query with improved error handling
        const element = this.domCache.getElement(this.nodeId);
        if (!element) {
          throw new Error(`Element not found for nodeId: ${this.nodeId}`);
        }

        const contentWrapper = element.querySelector('.unified-content-area') as HTMLElement;
        if (!contentWrapper) {
          throw new Error('Content wrapper (.unified-content-area) not found');
        }

        // Calculate optimal height with improved measurement
        const contentRect = contentWrapper.getBoundingClientRect();
        const contentHeight = contentRect.height;
        
        if (contentHeight <= 0) {
          throw new Error(`Invalid content height: ${contentHeight}`);
        }
        
        // More accurate padding and border calculation
        const computedStyle = getComputedStyle(element);
        const paddingY = parseFloat(computedStyle.paddingTop || '0') + 
                        parseFloat(computedStyle.paddingBottom || '0');
        const borderY = parseFloat(computedStyle.borderTopWidth || '0') + 
                       parseFloat(computedStyle.borderBottomWidth || '0');
        
        // Add small buffer for proper content display
        const additionalSpacing = paddingY + borderY + 8;

        // Calculate optimal height with improved constraints
        const optimalHeight = Math.max(
          this.contentAwareMinimums.height,
          Math.min(this.maxDimensions.height, contentHeight + additionalSpacing)
        );

        if (process.env.NODE_ENV === 'development') {
          console.log('📏 Inspector: Height calculation:', {
            contentHeight,
            paddingY,
            borderY,
            additionalSpacing,
            optimalHeight,
            currentHeight: this.startDimensions.height
          });
        }

        // Queue the height adjustment with high priority
        this.batchManager.addUpdate({
          nodeId: this.nodeId,
          position: { height: optimalHeight },
          source: 'inspector',
          priority: 'high',
          timestamp: performance.now(),
        });

        this.operationLock.releaseLock();
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`📏 Inspector: Height adjustment successful - ${this.startDimensions.height}px → ${optimalHeight}px`);
        }
        
        return optimalHeight;
        
      } catch (error) {
        console.error('📏 Inspector: Height adjustment failed on attempt', attempt + 1, error);
        this.operationLock.releaseLock();
        
        if (attempt < maxRetries - 1) {
          attempt++;
          // Brief delay before retry - synchronous approach to avoid async complexity
          // Use a simple loop delay instead of async/await
          continue;
        }
        
        // All retries failed
        console.error('📏 Inspector: Height adjustment failed after all retries');
        return this.startDimensions.height;
      }
    }
    
    return this.startDimensions.height;
  }

  /**
   * Set dimensions directly - used by Inspector
   */
  setDimensions(width: number, height: number): void {
    if (!this.operationLock.acquireLock('inspector-adjust')) {
      return; // Another operation in progress
    }

    const constrainedPosition = this.applyConstraints({
      id: this.nodeId,
      width,
      height,
      x: this.startDimensions.x,
      y: this.startDimensions.y,
      zIndex: this.startDimensions.zIndex,
    });

    this.batchManager.addUpdate({
      nodeId: this.nodeId,
      position: constrainedPosition,
      source: 'inspector', 
      priority: 'high',
      timestamp: performance.now(),
    });

    this.operationLock.releaseLock();
  }

  /**
   * Get current performance metrics from global optimizer
   */
  getResizeMetrics(): PerformanceMetrics {
    return globalPerformanceOptimizer.getMetrics();
  }

  /**
   * Enable high performance mode for continuous operations
   */
  enableHighPerformanceMode(): void {
    globalPerformanceOptimizer.enableHighPerformanceMode();
    
    // Recreate batch manager with high performance strategy
    this.batchManager.cancel();
    this.batchManager = new BatchUpdateManager((updates) => {
      this.processBatchedUpdates(updates);
    }, OptimizationStrategy.HIGH_PERFORMANCE);
  }

  /**
   * Enable adaptive performance mode for dynamic optimization
   */
  enableAdaptiveMode(): void {
    globalPerformanceOptimizer.enableAdaptiveMode();
    
    // Recreate batch manager with adaptive strategy
    this.batchManager.cancel();
    this.batchManager = new BatchUpdateManager((updates) => {
      this.processBatchedUpdates(updates);
    }, OptimizationStrategy.ADAPTIVE);
  }

  /**
   * Update internal position tracking when external position changes
   */
  updatePosition(newPosition: BlockPosition): void {
    this.startDimensions = { ...newPosition };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.batchManager.cancel();
    this.domCache.clear();
    this.operationLock.releaseLock();
  }

  // Private methods

  private calculateNewPosition(handle: ResizeHandle, deltaX: number, deltaY: number): BlockPosition {
    let newWidth = this.startDimensions.width;
    let newHeight = this.startDimensions.height;
    let newX = this.startDimensions.x;
    let newY = this.startDimensions.y;

    // Handle-specific calculations - optimized for performance
    switch (handle) {
      case 'se': // Southeast (bottom-right)
        newWidth += deltaX;
        newHeight += deltaY;
        break;
      case 'sw': // Southwest (bottom-left)
        newWidth -= deltaX;
        newHeight += deltaY;
        newX += deltaX;
        break;
      case 'ne': // Northeast (top-right)
        newWidth += deltaX;
        newHeight -= deltaY;
        newY += deltaY;
        break;
      case 'nw': // Northwest (top-left)
        newWidth -= deltaX;
        newHeight -= deltaY;
        newX += deltaX;
        newY += deltaY;
        break;
      case 'n': // North (top)
        newHeight -= deltaY;
        newY += deltaY;
        break;
      case 's': // South (bottom)
        newHeight += deltaY;
        break;
      case 'e': // East (right)
        newWidth += deltaX;
        break;
      case 'w': // West (left)
        newWidth -= deltaX;
        newX += deltaX;
        break;
    }

    return {
      id: this.nodeId,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
      zIndex: this.startDimensions.zIndex,
    };
  }

  private applyConstraints(position: BlockPosition): BlockPosition {
    // Apply size constraints
    const constrainedWidth = Math.max(
      this.contentAwareMinimums.width,
      Math.min(this.maxDimensions.width, position.width)
    );
    const constrainedHeight = Math.max(
      this.contentAwareMinimums.height,
      Math.min(this.maxDimensions.height, position.height)
    );

    // Apply position constraints
    const constrainedX = Math.max(0, Math.min(800 - constrainedWidth, position.x));
    const constrainedY = Math.max(0, position.y);

    return {
      ...position,
      x: constrainedX,
      y: constrainedY,
      width: constrainedWidth,
      height: constrainedHeight,
    };
  }

  private processBatchedUpdates(updates: ResizeUpdate[]): void {
    // Group updates by node ID (though in this case, single node)
    const updatesByNode = new Map<string, ResizeUpdate>();
    
    for (const update of updates) {
      updatesByNode.set(update.nodeId, update);
    }

    // Process each node update
    updatesByNode.forEach((update) => {
      this.onUpdateCallback(update.nodeId, update.position);
    });
  }

  private updateContentMinimums(dimensions: { width: number; height: number }): void {
    // Update content-aware minimums with optimized buffer calculations
    // Reduced buffer sizes to prevent over-constraining - previous 40/20 was too restrictive
    const widthBuffer = Math.max(16, Math.round(dimensions.width * 0.05)); // 5% buffer, min 16px
    const heightBuffer = Math.max(12, Math.round(dimensions.height * 0.05)); // 5% buffer, min 12px
    
    this.contentAwareMinimums = {
      width: Math.max(100, dimensions.width + widthBuffer),
      height: Math.max(60, dimensions.height + heightBuffer),
    };
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📏 Content minimums updated:', {
        contentSize: dimensions,
        buffers: { width: widthBuffer, height: heightBuffer },
        minimums: this.contentAwareMinimums
      });
    }
  }

  // Performance metrics now handled by globalPerformanceOptimizer
}