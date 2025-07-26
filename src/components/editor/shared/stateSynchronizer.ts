// ABOUTME: Centralized state synchronization manager for TipTap editor and React component state consistency

import { debounce } from 'lodash-es';
import { JSONContent } from '@tiptap/react';

/**
 * Types for state synchronization
 */
export type StateSource = 'tiptap' | 'react' | 'command' | 'external';
export type StateTarget = 'tiptap' | 'react' | 'store' | 'persistence';
export type UpdatePriority = 'immediate' | 'high' | 'normal' | 'low';

export interface StateUpdate {
  id: string;
  source: StateSource;
  target: StateTarget;
  data: any;
  timestamp: number;
  priority: UpdatePriority;
  version?: number;
}

export interface VersionedContent {
  content: JSONContent;
  version: number;
  hash: string;
  parentVersion?: number;
  timestamp: number;
}

export interface OptimisticUpdate {
  id: string;
  update: any;
  rollbackFn: () => void;
  timestamp: number;
  source: StateSource;
}

export interface ConflictResolution {
  strategy: 'merge' | 'overwrite' | 'reject' | 'user-choice';
  resolver?: (current: any, incoming: any) => any;
}

/**
 * Priority queue for processing updates in correct order
 */
class PriorityQueue<T extends { priority: UpdatePriority }> {
  private items: T[] = [];
  private priorityOrder: Record<UpdatePriority, number> = {
    immediate: 0,
    high: 1,
    normal: 2,
    low: 3,
  };

  enqueue(item: T): void {
    this.items.push(item);
    this.items.sort((a, b) => this.priorityOrder[a.priority] - this.priorityOrder[b.priority]);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  clear(): void {
    this.items = [];
  }

  size(): number {
    return this.items.length;
  }
}

/**
 * Optimistic update manager for handling temporary state changes
 */
export class OptimisticUpdateManager {
  private optimisticUpdates = new Map<string, OptimisticUpdate>();
  private readonly maxAge = 30000; // 30 seconds

  /**
   * Apply an optimistic update with rollback capability
   */
  applyOptimistic(
    id: string,
    update: any,
    rollbackFn: () => void,
    source: StateSource = 'react'
  ): void {
    // Clean up old optimistic updates
    this.cleanupExpiredUpdates();

    this.optimisticUpdates.set(id, {
      id,
      update,
      rollbackFn,
      timestamp: Date.now(),
      source,
    });
  }

  /**
   * Confirm an optimistic update (remove from pending)
   */
  confirm(id: string): boolean {
    return this.optimisticUpdates.delete(id);
  }

  /**
   * Rollback an optimistic update
   */
  rollback(id: string): boolean {
    const optimistic = this.optimisticUpdates.get(id);
    if (optimistic) {
      try {
        optimistic.rollbackFn();
        this.optimisticUpdates.delete(id);
        return true;
      } catch (error) {
        console.error('Failed to rollback optimistic update:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Rollback all optimistic updates from a specific source
   */
  rollbackBySource(source: StateSource): number {
    let rolledBack = 0;
    for (const [id, update] of this.optimisticUpdates.entries()) {
      if (update.source === source) {
        if (this.rollback(id)) {
          rolledBack++;
        }
      }
    }
    return rolledBack;
  }

  /**
   * Get all pending optimistic updates
   */
  getPendingUpdates(): OptimisticUpdate[] {
    return Array.from(this.optimisticUpdates.values());
  }

  /**
   * Clean up expired optimistic updates
   */
  private cleanupExpiredUpdates(): void {
    const now = Date.now();
    for (const [id, update] of this.optimisticUpdates.entries()) {
      if (now - update.timestamp > this.maxAge) {
        console.warn('Optimistic update expired, rolling back:', id);
        this.rollback(id);
      }
    }
  }
}

/**
 * Content versioning system for conflict resolution
 */
export class ContentVersionManager {
  private versionCounter = 0;
  private contentHistory = new Map<string, VersionedContent[]>();
  private readonly maxHistorySize = 50;

  /**
   * Create a new content version
   */
  createVersion(content: JSONContent, parentVersion?: number, nodeId?: string): VersionedContent {
    const version: VersionedContent = {
      content,
      version: ++this.versionCounter,
      hash: this.hashContent(content),
      parentVersion,
      timestamp: Date.now(),
    };

    if (nodeId) {
      this.addToHistory(nodeId, version);
    }

    return version;
  }

  /**
   * Check if content has changed since version
   */
  hasChanged(content: JSONContent, version: number, nodeId?: string): boolean {
    if (nodeId) {
      const history = this.contentHistory.get(nodeId);
      const targetVersion = history?.find(v => v.version === version);
      if (targetVersion) {
        return this.hashContent(content) !== targetVersion.hash;
      }
    }
    return true; // Assume changed if no history
  }

  /**
   * Get version history for a node
   */
  getHistory(nodeId: string): VersionedContent[] {
    return this.contentHistory.get(nodeId) || [];
  }

  /**
   * Merge two content versions (basic implementation)
   */
  mergeContent(base: JSONContent, current: JSONContent, incoming: JSONContent): JSONContent {
    // Simple merge strategy - in practice, this would need more sophisticated logic
    // For now, we'll use the incoming content but preserve structure
    try {
      return {
        ...base,
        ...incoming,
        content: this.mergeContentArray(
          base.content || [],
          current.content || [],
          incoming.content || []
        ),
      };
    } catch (error) {
      console.warn('Content merge failed, using incoming content:', error);
      return incoming;
    }
  }

  private hashContent(content: JSONContent): string {
    // Simple hash implementation - in production, use a proper hash function
    return btoa(JSON.stringify(content)).slice(0, 8);
  }

  private addToHistory(nodeId: string, version: VersionedContent): void {
    let history = this.contentHistory.get(nodeId) || [];
    history.push(version);

    // Limit history size
    if (history.length > this.maxHistorySize) {
      history = history.slice(-this.maxHistorySize);
    }

    this.contentHistory.set(nodeId, history);
  }

  private mergeContentArray(base: any[], current: any[], incoming: any[]): any[] {
    // Basic array merge - preserve structure where possible
    const maxLength = Math.max(base.length, current.length, incoming.length);
    const result = [];

    for (let i = 0; i < maxLength; i++) {
      if (incoming[i] !== undefined) {
        result[i] = incoming[i];
      } else if (current[i] !== undefined) {
        result[i] = current[i];
      } else if (base[i] !== undefined) {
        result[i] = base[i];
      }
    }

    return result;
  }
}

/**
 * Main state synchronization manager
 */
export class EditorStateSynchronizer {
  private updateQueue = new PriorityQueue<StateUpdate>();
  private optimisticManager = new OptimisticUpdateManager();
  private versionManager = new ContentVersionManager();
  private conflicts = new Map<string, ConflictResolution>();
  private isProcessing = false;
  private processQueue = debounce(this.processUpdates.bind(this), 0); // Immediate but batched

  /**
   * Synchronize state between source and target
   */
  synchronize(
    source: StateSource,
    target: StateTarget,
    data: any,
    options: {
      priority?: UpdatePriority;
      version?: number;
      nodeId?: string;
      optimistic?: boolean;
      rollbackFn?: () => void;
    } = {}
  ): string {
    const updateId = this.generateUpdateId();
    const update: StateUpdate = {
      id: updateId,
      source,
      target,
      data,
      timestamp: Date.now(),
      priority: options.priority || 'normal',
      version: options.version,
    };

    // Handle optimistic updates
    if (options.optimistic && options.rollbackFn) {
      this.optimisticManager.applyOptimistic(updateId, data, options.rollbackFn, source);
    }

    this.updateQueue.enqueue(update);
    this.processQueue();

    return updateId;
  }

  /**
   * Confirm an optimistic update
   */
  confirmUpdate(updateId: string): boolean {
    return this.optimisticManager.confirm(updateId);
  }

  /**
   * Rollback an update
   */
  rollbackUpdate(updateId: string): boolean {
    return this.optimisticManager.rollback(updateId);
  }

  /**
   * Set conflict resolution strategy for a data path
   */
  setConflictResolution(path: string, resolution: ConflictResolution): void {
    this.conflicts.set(path, resolution);
  }

  /**
   * Create a content version for tracking
   */
  createContentVersion(content: JSONContent, nodeId: string): VersionedContent {
    return this.versionManager.createVersion(content, undefined, nodeId);
  }

  /**
   * Check if content synchronization would cause conflicts
   */
  wouldConflict(content: JSONContent, version: number, nodeId: string): boolean {
    return this.versionManager.hasChanged(content, version, nodeId);
  }

  /**
   * Get synchronization statistics
   */
  getStats() {
    return {
      queueSize: this.updateQueue.size(),
      pendingOptimistic: this.optimisticManager.getPendingUpdates().length,
      isProcessing: this.isProcessing,
      conflictStrategies: this.conflicts.size,
    };
  }

  /**
   * Process queued updates
   */
  private async processUpdates(): Promise<void> {
    if (this.isProcessing || this.updateQueue.isEmpty()) return;

    this.isProcessing = true;

    try {
      while (!this.updateQueue.isEmpty()) {
        const update = this.updateQueue.dequeue();
        if (update) {
          await this.applyUpdateWithConflictResolution(update);
        }
      }
    } catch (error) {
      console.error('Error processing update queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Apply update with conflict resolution
   */
  private async applyUpdateWithConflictResolution(update: StateUpdate): Promise<void> {
    try {
      // Check for conflicts
      const conflictResolution = this.conflicts.get(`${update.source}->${update.target}`);

      if (conflictResolution && conflictResolution.strategy === 'reject') {
        console.warn('Update rejected by conflict resolution policy:', update.id);
        return;
      }

      // Create version for tracking
      if (update.data?.content && update.target === 'tiptap') {
        this.versionManager.createVersion(update.data.content);
      }

      // Apply the update (this would integrate with actual TipTap/React state)
      await this.executeUpdate(update);
    } catch (error) {
      console.error('Failed to apply update:', update.id, error);

      // If this was an optimistic update, roll it back
      this.optimisticManager.rollback(update.id);
    }
  }

  /**
   * Execute the actual update (override in implementation)
   */
  protected async executeUpdate(update: StateUpdate): Promise<void> {
    // This method should be overridden by specific implementations
    // For now, just log the update
    console.log('Executing update:', update);
  }

  /**
   * Generate unique update ID
   */
  private generateUpdateId(): string {
    return `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.updateQueue.clear();
    this.optimisticManager.rollbackBySource('react');
    this.conflicts.clear();
    this.processQueue.cancel();
  }
}

/**
 * Singleton instance for global state synchronization
 */
export const globalStateSynchronizer = new EditorStateSynchronizer();
