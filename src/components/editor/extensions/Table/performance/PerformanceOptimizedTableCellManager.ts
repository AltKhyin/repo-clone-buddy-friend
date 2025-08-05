// ABOUTME: High-performance table cell editor manager with advanced memory management and lazy loading

import { Editor } from '@tiptap/core';
import { createTableCellEditorConfig, TableCellEditorOptions } from '../tableEditorConfig';

/**
 * Performance metrics for monitoring table cell editor usage
 */
interface PerformanceMetrics {
  activeEditors: number;
  createdEditors: number;
  destroyedEditors: number;
  cacheHits: number;
  cacheMisses: number;
  memoryUsageMB: number;
  averageCreationTimeMs: number;
  lastCleanupTime: number;
}

/**
 * Editor metadata for advanced management
 */
interface EditorMetadata {
  editor: Editor;
  cellId: string;
  lastAccessed: number;
  accessCount: number;
  memoryEstimateMB: number;
  isActive: boolean;
  creationTime: number;
  // 🎯 FIX #1: Track pending debounced updates for cancellation
  pendingUpdateTimeout?: NodeJS.Timeout;
}

/**
 * Configuration for performance optimization
 */
interface PerformanceConfig {
  /** Maximum number of editor instances to keep alive */
  maxActiveEditors: number;
  /** Maximum memory usage before forced cleanup (MB) */
  maxMemoryUsageMB: number;
  /** How long to keep unused editors alive (ms) */
  editorTTL: number;
  /** Interval for automatic cleanup (ms) */
  cleanupInterval: number;
  /** Enable performance monitoring */
  enableMetrics: boolean;
  /** Enable memory usage tracking */
  enableMemoryTracking: boolean;
}

/**
 * High-performance table cell editor manager with advanced optimization features
 */
export class PerformanceOptimizedTableCellManager {
  private editors = new Map<string, EditorMetadata>();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private performanceMetrics: PerformanceMetrics;
  private config: PerformanceConfig;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      maxActiveEditors: 25,
      maxMemoryUsageMB: 50,
      editorTTL: 300000, // 5 minutes
      cleanupInterval: 60000, // 1 minute
      enableMetrics: true,
      enableMemoryTracking: true,
      ...config,
    };

    this.performanceMetrics = {
      activeEditors: 0,
      createdEditors: 0,
      destroyedEditors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      memoryUsageMB: 0,
      averageCreationTimeMs: 0,
      lastCleanupTime: Date.now(),
    };

    this.startPeriodicCleanup();
  }

  /**
   * Get or create an editor instance with advanced caching and performance optimization
   */
  getEditor(cellId: string, options: TableCellEditorOptions): Editor {
    const now = Date.now();

    // Check if editor exists and is still valid
    if (this.editors.has(cellId)) {
      const metadata = this.editors.get(cellId)!;
      
      // Update access metadata
      metadata.lastAccessed = now;
      metadata.accessCount++;
      metadata.isActive = true;

      // Update performance metrics
      if (this.config.enableMetrics) {
        this.performanceMetrics.cacheHits++;
      }

      // Update content if provided
      if (options.content !== undefined && metadata.editor.getHTML() !== options.content) {
        metadata.editor.commands.setContent(options.content);
      }

      return metadata.editor;
    }

    // Cache miss - need to create new editor
    if (this.config.enableMetrics) {
      this.performanceMetrics.cacheMisses++;
    }

    // Check if we need to clean up before creating new editor
    this.performMemoryCheck();

    // Create new editor with performance tracking
    const creationStart = performance.now();
    const editor = this.createOptimizedEditor(options);
    const creationTime = performance.now() - creationStart;

    // Create metadata
    const metadata: EditorMetadata = {
      editor,
      cellId,
      lastAccessed: now,
      accessCount: 1,
      memoryEstimateMB: this.estimateEditorMemoryUsage(editor),
      isActive: true,
      creationTime,
    };

    // Store editor
    this.editors.set(cellId, metadata);

    // Update performance metrics
    if (this.config.enableMetrics) {
      this.performanceMetrics.activeEditors++;
      this.performanceMetrics.createdEditors++;
      this.updateAverageCreationTime(creationTime);
      this.updateMemoryUsage();
    }

    return editor;
  }

  /**
   * Create an optimized editor instance with performance features
   */
  private createOptimizedEditor(options: TableCellEditorOptions): Editor {
    const editor = createTableCellEditorConfig(options.content);

    // Set up optimized event handlers with safe debouncing
    if (options.onUpdate) {
      // 🎯 FIX #1: Use cell-aware debounced update that prevents stale updates
      editor.on('update', ({ editor }) => {
        this.safelyUpdateCellContent(editor, options.onUpdate!);
      });
    }

    if (options.onFocus) {
      editor.on('focus', options.onFocus);
    }

    if (options.onBlur) {
      const optimizedBlur = () => {
        options.onBlur?.();
        
        // 🎯 FIX #1: Cancel pending updates and mark as inactive
        const cellId = this.findCellIdByEditor(editor);
        if (cellId) {
          const metadata = this.editors.get(cellId);
          if (metadata) {
            // Cancel any pending debounced updates to prevent stale updates
            if (metadata.pendingUpdateTimeout) {
              clearTimeout(metadata.pendingUpdateTimeout);
              metadata.pendingUpdateTimeout = undefined;
              console.log(`[TableCellManager] 🚫 Cancelled pending update for cell ${cellId} on blur`);
            }
            metadata.isActive = false;
          }
        }
      };
      editor.on('blur', optimizedBlur);
    }

    // Add memory cleanup handlers
    editor.on('destroy', () => {
      const cellId = this.findCellIdByEditor(editor);
      if (cellId && this.config.enableMetrics) {
        this.performanceMetrics.destroyedEditors++;
        this.performanceMetrics.activeEditors--;
        this.updateMemoryUsage();
      }
    });

    return editor;
  }

  /**
   * 🎯 FIX #1: Safely update cell content with activity checking
   * Prevents stale updates when cells have lost focus
   */
  private safelyUpdateCellContent(editor: Editor, updateCallback: (content: string) => void): void {
    const cellId = this.findCellIdByEditor(editor);
    if (!cellId) {
      console.warn('[TableCellManager] Cannot update cell content - cell ID not found');
      return;
    }

    const metadata = this.editors.get(cellId);
    if (!metadata) {
      console.warn(`[TableCellManager] Cannot update cell content - metadata not found for cell ${cellId}`);
      return;
    }

    // Cancel any existing pending update
    if (metadata.pendingUpdateTimeout) {
      clearTimeout(metadata.pendingUpdateTimeout);
    }

    // Set up new debounced update with activity check
    metadata.pendingUpdateTimeout = setTimeout(() => {
      // Only proceed if the cell is still active
      if (metadata.isActive) {
        try {
          const content = editor.getHTML();
          updateCallback(content);
          console.log(`[TableCellManager] ✅ Updated content for active cell ${cellId}`);
        } catch (error) {
          console.error(`[TableCellManager] Error updating cell ${cellId}:`, error);
        }
      } else {
        console.log(`[TableCellManager] 🚫 Skipped update for inactive cell ${cellId}`);
      }
      
      // Clear the timeout reference
      metadata.pendingUpdateTimeout = undefined;
    }, 150); // Keep same 150ms debounce timing
  }

  /**
   * Remove and destroy an editor instance with cleanup
   */
  removeEditor(cellId: string): boolean {
    const metadata = this.editors.get(cellId);
    if (!metadata) return false;

    try {
      // 🎯 FIX #1: Cancel any pending updates before destroying
      if (metadata.pendingUpdateTimeout) {
        clearTimeout(metadata.pendingUpdateTimeout);
        metadata.pendingUpdateTimeout = undefined;
        console.log(`[TableCellManager] 🚫 Cancelled pending update for removed cell ${cellId}`);
      }

      metadata.editor.destroy();
      this.editors.delete(cellId);
      
      if (this.config.enableMetrics) {
        this.performanceMetrics.activeEditors--;
        this.performanceMetrics.destroyedEditors++;
        this.updateMemoryUsage();
      }
      
      return true;
    } catch (error) {
      console.warn(`Error destroying editor for cell ${cellId}:`, error);
      return false;
    }
  }

  /**
   * Perform intelligent cleanup based on memory usage and access patterns
   */
  performSmartCleanup(): number {
    const now = Date.now();
    const editors = Array.from(this.editors.entries());
    let removedCount = 0;

    // Sort by priority for removal (least recently used, inactive, memory usage)
    const sortedForRemoval = editors
      .map(([cellId, metadata]) => ({
        cellId,
        metadata,
        priority: this.calculateRemovalPriority(metadata, now),
      }))
      .sort((a, b) => b.priority - a.priority); // Higher priority = more likely to be removed

    // Calculate how many editors we need to remove
    const currentCount = this.editors.size;
    const targetCount = Math.floor(this.config.maxActiveEditors * 0.8); // Target 80% of max
    const toRemove = Math.max(0, currentCount - targetCount);

    // Remove editors based on priority
    for (let i = 0; i < Math.min(toRemove, sortedForRemoval.length); i++) {
      const { cellId } = sortedForRemoval[i];
      if (this.removeEditor(cellId)) {
        removedCount++;
      }
    }

    if (this.config.enableMetrics) {
      this.performanceMetrics.lastCleanupTime = now;
    }

    return removedCount;
  }

  /**
   * Calculate removal priority for an editor (higher = more likely to be removed)
   */
  private calculateRemovalPriority(metadata: EditorMetadata, now: number): number {
    const timeSinceAccess = now - metadata.lastAccessed;
    const isExpired = timeSinceAccess > this.config.editorTTL;
    const isInactive = !metadata.isActive;
    const memoryWeight = metadata.memoryEstimateMB / 10; // Weight memory usage
    const accessWeight = Math.max(0, 10 - metadata.accessCount); // Less accessed = higher priority

    let priority = 0;
    
    if (isExpired) priority += 50;
    if (isInactive) priority += 30;
    priority += timeSinceAccess / 1000; // Age in seconds
    priority += memoryWeight;
    priority += accessWeight;

    return priority;
  }

  /**
   * Check memory usage and perform cleanup if needed
   */
  private performMemoryCheck(): void {
    if (!this.config.enableMemoryTracking) return;

    const currentMemory = this.calculateTotalMemoryUsage();
    
    if (currentMemory > this.config.maxMemoryUsageMB || 
        this.editors.size >= this.config.maxActiveEditors) {
      
      console.log(`[TableCellManager] Memory check triggered: ${currentMemory}MB / ${this.config.maxMemoryUsageMB}MB, ${this.editors.size} editors`);
      
      const removedCount = this.performSmartCleanup();
      
      console.log(`[TableCellManager] Cleaned up ${removedCount} editors. Remaining: ${this.editors.size}`);
    }
  }

  /**
   * Calculate total memory usage of all editors
   */
  private calculateTotalMemoryUsage(): number {
    let totalMemory = 0;
    for (const metadata of this.editors.values()) {
      totalMemory += metadata.memoryEstimateMB;
    }
    return totalMemory;
  }

  /**
   * Estimate memory usage of an editor instance
   */
  private estimateEditorMemoryUsage(editor: Editor): number {
    try {
      const contentLength = editor.getHTML().length;
      const extensionCount = editor.extensionManager?.extensions?.length || 10; // Fallback
      
      // Rough estimation based on content size and extensions
      const baseMemory = 0.5; // Base overhead in MB
      const contentMemory = contentLength / 10000; // ~100KB per 10K characters
      const extensionMemory = extensionCount * 0.1; // ~100KB per extension
      
      return baseMemory + contentMemory + extensionMemory;
    } catch (error) {
      // Fallback estimation if editor is not fully initialized
      return 1.0; // 1MB default estimation
    }
  }

  /**
   * Find cell ID by editor instance
   */
  private findCellIdByEditor(editor: Editor): string | null {
    for (const [cellId, metadata] of this.editors.entries()) {
      if (metadata.editor === editor) {
        return cellId;
      }
    }
    return null;
  }

  /**
   * Update average creation time metric
   */
  private updateAverageCreationTime(newTime: number): void {
    const currentAverage = this.performanceMetrics.averageCreationTimeMs;
    const createdCount = this.performanceMetrics.createdEditors;
    
    this.performanceMetrics.averageCreationTimeMs = 
      (currentAverage * (createdCount - 1) + newTime) / createdCount;
  }

  /**
   * Update memory usage metric
   */
  private updateMemoryUsage(): void {
    if (this.config.enableMemoryTracking) {
      this.performanceMetrics.memoryUsageMB = this.calculateTotalMemoryUsage();
    }
  }

  /**
   * Start periodic cleanup process
   */
  private startPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.performSmartCleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Debounce utility for performance optimization
   */
  private debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get editor usage statistics
   */
  getUsageStatistics(): {
    totalEditors: number;
    activeEditors: number;
    inactiveEditors: number;
    averageAccessCount: number;
    oldestEditorAge: number;
    totalMemoryUsage: number;
  } {
    const now = Date.now();
    const editors = Array.from(this.editors.values());
    
    const activeEditors = editors.filter(m => m.isActive).length;
    const inactiveEditors = editors.length - activeEditors;
    const averageAccessCount = editors.reduce((sum, m) => sum + m.accessCount, 0) / editors.length || 0;
    const oldestEditorAge = editors.length > 0 
      ? Math.max(...editors.map(m => now - m.lastAccessed))
      : 0;

    return {
      totalEditors: editors.length,
      activeEditors,
      inactiveEditors,
      averageAccessCount,
      oldestEditorAge,
      totalMemoryUsage: this.calculateTotalMemoryUsage(),
    };
  }

  /**
   * Force cleanup of all inactive editors
   */
  cleanupInactiveEditors(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [cellId, metadata] of this.editors.entries()) {
      if (!metadata.isActive && (now - metadata.lastAccessed) > 30000) { // 30 seconds
        if (this.removeEditor(cellId)) {
          removedCount++;
        }
      }
    }

    return removedCount;
  }

  /**
   * Destroy all editor instances and cleanup
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // 🎯 FIX #1: Cancel all pending updates and destroy all editors
    for (const metadata of this.editors.values()) {
      try {
        // Cancel any pending debounced updates
        if (metadata.pendingUpdateTimeout) {
          clearTimeout(metadata.pendingUpdateTimeout);
        }
        metadata.editor.destroy();
      } catch (error) {
        console.warn('Error destroying editor during cleanup:', error);
      }
    }

    this.editors.clear();
    
    // Reset metrics
    this.performanceMetrics = {
      activeEditors: 0,
      createdEditors: 0,
      destroyedEditors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      memoryUsageMB: 0,
      averageCreationTimeMs: 0,
      lastCleanupTime: Date.now(),
    };
  }
}

// Global performance-optimized instance
export const performanceOptimizedTableCellManager = new PerformanceOptimizedTableCellManager({
  maxActiveEditors: 30,
  maxMemoryUsageMB: 100,
  editorTTL: 300000, // 5 minutes
  cleanupInterval: 60000, // 1 minute
  enableMetrics: true,
  enableMemoryTracking: true,
});

// Performance monitoring utilities
export const TableCellPerformanceMonitor = {
  getMetrics: () => performanceOptimizedTableCellManager.getPerformanceMetrics(),
  getUsageStats: () => performanceOptimizedTableCellManager.getUsageStatistics(),
  forceCleanup: () => performanceOptimizedTableCellManager.performSmartCleanup(),
  cleanupInactive: () => performanceOptimizedTableCellManager.cleanupInactiveEditors(),
};