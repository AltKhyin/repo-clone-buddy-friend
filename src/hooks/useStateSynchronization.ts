// ABOUTME: React hooks for TipTap-React state synchronization in Rich Block editor components

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { debounce } from 'lodash-es';
import { JSONContent } from '@tiptap/react';
import { globalTipTapSynchronizer } from '@/components/editor/shared/tiptapStateSynchronizer';

/**
 * Options for state synchronization hook
 */
export interface StateSyncOptions {
  /** Block ID in unified editor store */
  blockId?: string;
  /** Enable/disable synchronization */
  enabled?: boolean;
  /** Debounce delay for attribute changes (ms) */
  debounceMs?: number;
  /** Enable optimistic updates */
  optimistic?: boolean;
  /** Enable conflict detection */
  detectConflicts?: boolean;
}

/**
 * Hook for synchronizing TipTap component attributes with React state
 * Prevents race conditions and ensures consistency between TipTap and React
 */
export const useAttributeSync = (
  componentId: string | null | undefined,
  componentType: 'table' | 'poll',
  attributes: Record<string, any>,
  updateAttributes: (attrs: Record<string, any>) => void,
  options: StateSyncOptions = {}
) => {
  const {
    blockId,
    enabled = true,
    debounceMs = 300,
    optimistic = true,
    detectConflicts = true,
  } = options;

  const lastSyncedRef = useRef<string>('');
  const isUpdatingRef = useRef(false);

  // Create debounced sync function
  const debouncedSync = useMemo(
    () =>
      debounce((attrs: Record<string, any>, syncId: string) => {
        if (!enabled || !componentId || isUpdatingRef.current) return;

        // Prevent duplicate syncs
        if (lastSyncedRef.current === syncId) return;
        lastSyncedRef.current = syncId;

        try {
          globalTipTapSynchronizer.syncNodeAttributes(componentId, componentType, attrs, {
            blockId,
            optimistic,
            source: 'react',
          });
        } catch (error) {
          console.error('Attribute sync failed:', error);
        }
      }, debounceMs),
    [componentId, componentType, blockId, enabled, optimistic, debounceMs]
  );

  // Sync attributes when they change
  useEffect(() => {
    if (!enabled || !componentId) return;

    const syncId = `${componentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    debouncedSync(attributes, syncId);

    return () => {
      debouncedSync.cancel();
    };
  }, [attributes, componentId, enabled, debouncedSync]);

  // Listen for external state updates
  useEffect(() => {
    if (!enabled || !componentId) return;

    const handleStateUpdate = (event: CustomEvent) => {
      const { componentId: eventComponentId, attributes: newAttributes } = event.detail;

      if (eventComponentId === componentId && !isUpdatingRef.current) {
        isUpdatingRef.current = true;

        try {
          updateAttributes(newAttributes);
        } catch (error) {
          console.error('Failed to update component attributes:', error);
        } finally {
          // Reset flag after a short delay to allow state to settle
          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 50);
        }
      }
    };

    document.addEventListener('component-state-update', handleStateUpdate as EventListener);

    return () => {
      document.removeEventListener('component-state-update', handleStateUpdate as EventListener);
    };
  }, [componentId, enabled, updateAttributes]);

  // Conflict detection
  const checkForConflicts = useCallback(() => {
    if (!detectConflicts || !componentId) return false;

    const snapshot = globalTipTapSynchronizer.getComponentSnapshot(componentId);
    if (!snapshot) return false;

    const currentHash = globalTipTapSynchronizer['hashAttributes'](attributes);
    const hasConflict = snapshot.contentHash !== currentHash;

    if (hasConflict) {
      console.warn('State conflict detected for component:', componentId);
    }

    return hasConflict;
  }, [componentId, attributes, detectConflicts]);

  // Manual sync function
  const syncNow = useCallback(() => {
    if (!enabled || !componentId) return;

    debouncedSync.cancel(); // Cancel pending debounced calls

    const syncId = `manual-${componentId}-${Date.now()}`;
    globalTipTapSynchronizer.syncNodeAttributes(componentId, componentType, attributes, {
      blockId,
      optimistic: false, // Manual syncs should not be optimistic
      source: 'react',
    });

    lastSyncedRef.current = syncId;
  }, [componentId, componentType, attributes, blockId, enabled, debouncedSync]);

  // Get sync statistics
  const getSyncStats = useCallback(() => {
    return globalTipTapSynchronizer.getStats();
  }, []);

  return {
    /** Check if there are state conflicts */
    checkForConflicts,
    /** Manually trigger synchronization */
    syncNow,
    /** Get synchronization statistics */
    getSyncStats,
    /** Whether sync is currently enabled */
    isEnabled: enabled,
    /** Component snapshot from synchronizer */
    snapshot: componentId ? globalTipTapSynchronizer.getComponentSnapshot(componentId) : undefined,
  };
};

/**
 * Hook for synchronizing TipTap content with unified editor store
 * Use this in components that need to sync with the main editor state
 */
export const useContentSync = (
  blockId: string | null | undefined,
  content: JSONContent,
  onContentChange: (content: JSONContent) => void,
  options: StateSyncOptions = {}
) => {
  const {
    enabled = true,
    debounceMs = 500, // Longer debounce for content changes
  } = options;

  const lastContentRef = useRef<string>('');
  const isUpdatingRef = useRef(false);

  // Create debounced content sync
  const debouncedContentSync = useMemo(
    () =>
      debounce((newContent: JSONContent, contentId: string) => {
        if (!enabled || !blockId || isUpdatingRef.current) return;

        // Prevent duplicate syncs
        if (lastContentRef.current === contentId) return;
        lastContentRef.current = contentId;

        try {
          globalTipTapSynchronizer.syncWithUnifiedStore(blockId, newContent, {
            source: 'tiptap',
          });
        } catch (error) {
          console.error('Content sync failed:', error);
        }
      }, debounceMs),
    [blockId, enabled, debounceMs]
  );

  // Sync content when it changes
  useEffect(() => {
    if (!enabled || !blockId) return;

    const contentId = `${blockId}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    debouncedContentSync(content, contentId);

    return () => {
      debouncedContentSync.cancel();
    };
  }, [content, blockId, enabled, debouncedContentSync]);

  // Listen for store updates
  useEffect(() => {
    if (!enabled || !blockId) return;

    const handleStoreUpdate = (event: Event) => {
      // This would listen to unified editor store changes
      // Implementation depends on store notification system
    };

    // Add store listener here if available

    return () => {
      // Remove store listener
    };
  }, [blockId, enabled]);

  return {
    /** Whether content sync is enabled */
    isEnabled: enabled,
    /** Manually sync content */
    syncContent: (newContent: JSONContent) => {
      if (enabled && blockId) {
        debouncedContentSync.cancel();
        globalTipTapSynchronizer.syncWithUnifiedStore(blockId, newContent, {
          source: 'manual',
        });
      }
    },
  };
};

/**
 * Combined hook for full state synchronization
 * Use this for components that need both attribute and content sync
 */
export const useFullStateSync = (
  componentId: string | null | undefined,
  componentType: 'table' | 'poll',
  blockId: string | null | undefined,
  attributes: Record<string, any>,
  content: JSONContent,
  updateAttributes: (attrs: Record<string, any>) => void,
  onContentChange: (content: JSONContent) => void,
  options: StateSyncOptions = {}
) => {
  const attributeSync = useAttributeSync(
    componentId,
    componentType,
    attributes,
    updateAttributes,
    options
  );

  const contentSync = useContentSync(blockId, content, onContentChange, options);

  // Combined sync function
  const syncAll = useCallback(() => {
    attributeSync.syncNow();
    contentSync.syncContent(content);
  }, [attributeSync, contentSync, content]);

  // Combined conflict check
  const checkAllConflicts = useCallback(() => {
    return attributeSync.checkForConflicts();
  }, [attributeSync]);

  return {
    /** Sync all state (attributes and content) */
    syncAll,
    /** Check for any conflicts */
    checkAllConflicts,
    /** Attribute sync utilities */
    attributes: attributeSync,
    /** Content sync utilities */
    content: contentSync,
    /** Whether any sync is enabled */
    isEnabled: attributeSync.isEnabled || contentSync.isEnabled,
    /** Combined sync statistics */
    stats: attributeSync.getSyncStats(),
  };
};

/**
 * Hook for debugging state synchronization
 * Use this during development to monitor sync behavior
 */
export const useStateSyncDebug = (componentId: string | null | undefined) => {
  const stats = useMemo(() => {
    return globalTipTapSynchronizer.getStats();
  }, []);

  const componentSnapshot = useMemo(() => {
    return componentId ? globalTipTapSynchronizer.getComponentSnapshot(componentId) : null;
  }, [componentId]);

  const logCurrentState = useCallback(() => {
    console.group('State Sync Debug');
    console.log('Component ID:', componentId);
    console.log('Global Stats:', stats);
    console.log('Component Snapshot:', componentSnapshot);
    console.groupEnd();
  }, [componentId, stats, componentSnapshot]);

  return {
    stats,
    componentSnapshot,
    logCurrentState,
  };
};
