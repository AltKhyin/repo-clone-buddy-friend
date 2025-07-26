// ABOUTME: TipTap-specific state synchronization implementation for Rich Block editor components

import { JSONContent } from '@tiptap/react';
import {
  EditorStateSynchronizer,
  StateSource,
  StateTarget,
  StateUpdate,
} from './stateSynchronizer';
import { useEditorStore } from '@/store/editorStore';

/**
 * TipTap-specific state update types
 */
export interface TipTapStateUpdate extends StateUpdate {
  blockId?: string;
  componentType: 'table' | 'poll';
  componentId: string;
  contentData: {
    tiptapJSON: JSONContent;
    attributes: Record<string, any>;
  };
}

/**
 * Component state change detection
 */
export interface ComponentStateSnapshot {
  componentId: string;
  componentType: 'table' | 'poll';
  attributes: Record<string, any>;
  contentHash: string;
  timestamp: number;
}

/**
 * TipTap state synchronization implementation
 * Handles bidirectional sync between TipTap editor state and React component state
 */
export class TipTapStateSynchronizer extends EditorStateSynchronizer {
  private componentSnapshots = new Map<string, ComponentStateSnapshot>();
  private editorStore = useEditorStore.getState();

  /**
   * Synchronize TipTap node attributes with React component state
   */
  syncNodeAttributes(
    componentId: string,
    componentType: 'table' | 'poll',
    newAttributes: Record<string, any>,
    options: {
      blockId?: string;
      optimistic?: boolean;
      source?: StateSource;
    } = {}
  ): string {
    const { blockId = null, optimistic = true, source = 'react' } = options;

    // Create snapshot for change detection
    const snapshot: ComponentStateSnapshot = {
      componentId,
      componentType,
      attributes: { ...newAttributes },
      contentHash: this.hashAttributes(newAttributes),
      timestamp: Date.now(),
    };

    // Check if attributes actually changed
    const previousSnapshot = this.componentSnapshots.get(componentId);
    if (previousSnapshot && previousSnapshot.contentHash === snapshot.contentHash) {
      // No change, skip synchronization
      return '';
    }

    // Store new snapshot
    this.componentSnapshots.set(componentId, snapshot);

    // Create rollback function for optimistic updates
    const rollbackFn = previousSnapshot
      ? () => {
          this.componentSnapshots.set(componentId, previousSnapshot);
          this.notifyComponentUpdate(componentId, previousSnapshot.attributes);
        }
      : () => {
          this.componentSnapshots.delete(componentId);
        };

    // Create TipTap content structure
    const tiptapJSON: JSONContent = this.createTipTapContent(componentType, newAttributes);

    const updateData: TipTapStateUpdate = {
      id: this.generateUpdateId(),
      source,
      target: 'tiptap',
      data: {
        componentType,
        componentId,
        contentData: {
          tiptapJSON,
          attributes: newAttributes,
        },
      },
      timestamp: Date.now(),
      priority: 'normal',
      blockId,
      componentType,
      componentId,
      contentData: {
        tiptapJSON,
        attributes: newAttributes,
      },
    };

    return this.synchronize(source, 'tiptap', updateData, {
      optimistic,
      rollbackFn,
      nodeId: componentId,
    });
  }

  /**
   * Synchronize React component state with TipTap editor changes
   */
  syncComponentState(
    componentId: string,
    componentType: 'table' | 'poll',
    tiptapContent: JSONContent,
    options: {
      blockId?: string;
      source?: StateSource;
    } = {}
  ): string {
    const { blockId = null, source = 'tiptap' } = options;

    // Extract attributes from TipTap content
    const attributes = this.extractAttributesFromContent(componentType, tiptapContent);

    // Create snapshot
    const snapshot: ComponentStateSnapshot = {
      componentId,
      componentType,
      attributes,
      contentHash: this.hashAttributes(attributes),
      timestamp: Date.now(),
    };

    // Check for changes
    const previousSnapshot = this.componentSnapshots.get(componentId);
    if (previousSnapshot && previousSnapshot.contentHash === snapshot.contentHash) {
      return '';
    }

    // Update snapshot
    this.componentSnapshots.set(componentId, snapshot);

    const updateData = {
      componentType,
      componentId,
      attributes,
      tiptapContent,
    };

    return this.synchronize(source, 'react', updateData, {
      nodeId: componentId,
      priority: 'high', // TipTap changes should be high priority
    });
  }

  /**
   * Handle unified editor store integration
   */
  syncWithUnifiedStore(
    blockId: string,
    content: JSONContent,
    options: {
      source?: StateSource;
    } = {}
  ): string {
    const { source = 'tiptap' } = options;

    // Update unified editor store
    const updateData = {
      blockId,
      content,
      timestamp: Date.now(),
    };

    return this.synchronize(source, 'store', updateData, {
      priority: 'normal',
      nodeId: blockId,
    });
  }

  /**
   * Execute state update with proper error handling
   */
  protected async executeUpdate(update: StateUpdate): Promise<void> {
    try {
      const tiptapUpdate = update as TipTapStateUpdate;

      switch (update.target) {
        case 'tiptap':
          await this.updateTipTapEditor(tiptapUpdate);
          break;
        case 'react':
          await this.updateReactComponent(tiptapUpdate);
          break;
        case 'store':
          await this.updateUnifiedStore(tiptapUpdate);
          break;
        default:
          console.warn('Unknown update target:', update.target);
      }

      // Confirm optimistic update if successful
      this.confirmUpdate(update.id);
    } catch (error) {
      console.error('Failed to execute state update:', error);

      // Rollback optimistic update on error
      this.rollbackUpdate(update.id);
      throw error;
    }
  }

  /**
   * Update TipTap editor state
   */
  private async updateTipTapEditor(update: TipTapStateUpdate): Promise<void> {
    // This would integrate with the actual TipTap editor instance
    // For now, we'll emit an event that the editor can listen to
    const event = new CustomEvent('tiptap-state-update', {
      detail: {
        componentId: update.componentId,
        componentType: update.componentType,
        contentData: update.contentData,
      },
    });

    document.dispatchEvent(event);
  }

  /**
   * Update React component state
   */
  private async updateReactComponent(update: TipTapStateUpdate): Promise<void> {
    // Notify component of state change
    this.notifyComponentUpdate(
      update.data.componentId || update.componentId,
      update.data.attributes || update.data
    );
  }

  /**
   * Update main editor store
   */
  private async updateUnifiedStore(update: StateUpdate): Promise<void> {
    const { blockId, content } = update.data;

    if (blockId && content) {
      // Update the main editor store
      this.editorStore.updateNode(blockId, { data: content });
    }
  }

  /**
   * Notify component of state update
   */
  private notifyComponentUpdate(componentId: string, attributes: Record<string, any>): void {
    const event = new CustomEvent('component-state-update', {
      detail: {
        componentId,
        attributes,
      },
    });

    document.dispatchEvent(event);
  }

  /**
   * Create TipTap content structure from component attributes
   */
  private createTipTapContent(
    componentType: 'table' | 'poll',
    attributes: Record<string, any>
  ): JSONContent {
    const baseContent: JSONContent = {
      type: componentType === 'table' ? 'customTable' : 'customPoll',
      attrs: attributes,
    };

    if (componentType === 'table') {
      // Create table-specific content structure
      return {
        ...baseContent,
        content: [
          {
            type: 'tableRow',
            content: (attributes.headers || []).map(() => ({
              type: 'tableCell',
              content: [{ type: 'paragraph' }],
            })),
          },
          ...(attributes.rows || []).map((row: string[]) => ({
            type: 'tableRow',
            content: row.map(() => ({
              type: 'tableCell',
              content: [{ type: 'paragraph' }],
            })),
          })),
        ],
      };
    } else {
      // Create poll-specific content structure
      return {
        ...baseContent,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: attributes.question || '',
              },
            ],
          },
        ],
      };
    }
  }

  /**
   * Extract component attributes from TipTap content
   */
  private extractAttributesFromContent(
    componentType: 'table' | 'poll',
    content: JSONContent
  ): Record<string, any> {
    if (!content.attrs) {
      return {};
    }

    // Return the attributes directly - TipTap stores component state in attrs
    return { ...content.attrs };
  }

  /**
   * Generate hash for attributes to detect changes
   */
  private hashAttributes(attributes: Record<string, any>): string {
    try {
      const sortedKeys = Object.keys(attributes).sort();
      const sortedObj = sortedKeys.reduce(
        (obj, key) => {
          obj[key] = attributes[key];
          return obj;
        },
        {} as Record<string, any>
      );

      return btoa(JSON.stringify(sortedObj)).slice(0, 12);
    } catch (error) {
      console.warn('Failed to hash attributes:', error);
      return `fallback-${Date.now()}`;
    }
  }

  /**
   * Get component state snapshot
   */
  getComponentSnapshot(componentId: string): ComponentStateSnapshot | undefined {
    return this.componentSnapshots.get(componentId);
  }

  /**
   * Get synchronization statistics including component-specific data
   */
  getStats() {
    const baseStats = super.getStats();

    return {
      ...baseStats,
      componentSnapshots: this.componentSnapshots.size,
      components: Array.from(this.componentSnapshots.keys()),
    };
  }

  /**
   * Clean up component snapshots
   */
  dispose(): void {
    super.dispose();
    this.componentSnapshots.clear();
  }
}

/**
 * Global TipTap state synchronizer instance
 */
export const globalTipTapSynchronizer = new TipTapStateSynchronizer();

/**
 * React Hook for TipTap state synchronization
 * Use this in TipTap components to automatically sync state
 */
export const useTipTapStateSync = (
  componentId: string | null | undefined,
  componentType: 'table' | 'poll',
  attributes: Record<string, any>,
  options: {
    blockId?: string;
    enabled?: boolean;
    debounceMs?: number;
  } = {}
) => {
  const { blockId, enabled = true, debounceMs = 300 } = options;

  // This hook implementation would use React's useEffect and useCallback
  // to integrate with the synchronizer. The actual implementation would be:
  //
  // useEffect(() => {
  //   if (!enabled || !componentId) return;
  //
  //   const debouncedSync = debounce((attrs: Record<string, any>) => {
  //     globalTipTapSynchronizer.syncNodeAttributes(
  //       componentId,
  //       componentType,
  //       attrs,
  //       { blockId, optimistic: true }
  //     );
  //   }, debounceMs);
  //
  //   debouncedSync(attributes);
  //
  //   return () => {
  //     debouncedSync.cancel();
  //   };
  // }, [componentId, componentType, attributes, blockId, enabled, debounceMs]);

  return {
    syncAttributes: (attrs: Record<string, any>) => {
      if (enabled && componentId) {
        globalTipTapSynchronizer.syncNodeAttributes(componentId, componentType, attrs, {
          blockId,
          optimistic: true,
        });
      }
    },
    getSnapshot: () => {
      return componentId ? globalTipTapSynchronizer.getComponentSnapshot(componentId) : undefined;
    },
  };
};
