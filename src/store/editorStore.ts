// ABOUTME: Zustand store for managing Visual Composition Engine editor state

import { create } from 'zustand';
import { debounce } from 'lodash-es';
import {
  EditorState,
  NodeObject,
  LayoutItem,
  Layouts,
  MasterDerivedLayouts,
  Viewport,
  CanvasTransform,
  StructuredContentV2,
  generateNodeId,
  getDefaultDataForBlockType,
  validateStructuredContent,
} from '@/types/editor';
import {
  ensureMasterDerivedLayouts,
  createInitialLayouts,
  generateMobileFromDesktop,
  shouldRegenerateMobile,
  markMobileAsGenerated,
  updateDesktopLayout,
  updateMobileLayout,
  getLayoutForViewport,
  convertToLegacyFormat,
} from './layoutUtils';

const AUTOSAVE_DELAY = 30000; // 30 seconds as per user requirements

const initialCanvasTransform: CanvasTransform = {
  x: 0,
  y: 0,
  zoom: 1,
};

const initialLayouts = createInitialLayouts();

/**
 * Editor store following the same simple pattern as auth.ts.
 * Manages all editor state for the Visual Composition Engine.
 * Optimized with selective subscriptions and stable selectors.
 */
export const useEditorStore = create<EditorState>((set, get) => {
  // Save operation mutex to prevent race conditions
  let saveMutex = false;

  // Debounced save function with race condition protection
  const debouncedSave = debounce(async () => {
    const state = get();
    if (!state.reviewId || !state.isDirty || saveMutex) return;

    try {
      saveMutex = true; // Lock to prevent concurrent saves
      set({ isSaving: true });

      const structuredContent: StructuredContentV2 = {
        version: '2.0.0',
        nodes: state.nodes,
        layouts: state.layouts,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          editorVersion: '1.0.0',
        },
      };

      console.log('[EditorStore] About to validate content:', {
        hasVersion: !!structuredContent.version,
        version: structuredContent.version,
        nodesType: typeof structuredContent.nodes,
        nodesArray: Array.isArray(structuredContent.nodes),
        nodeCount: structuredContent.nodes?.length || 0,
        layoutsType: typeof structuredContent.layouts,
        layoutsKeys: Object.keys(structuredContent.layouts || {}),
        hasDesktop: !!structuredContent.layouts?.desktop,
        hasMobile: !!structuredContent.layouts?.mobile,
        hasMetadata: !!structuredContent.metadata,
        sample: JSON.stringify(structuredContent).substring(0, 200) + '...',
      });

      // Validate before saving
      try {
        validateStructuredContent(structuredContent);
        console.log('[EditorStore] Validation successful');
      } catch (validationError) {
        console.error('[EditorStore] Validation failed:', {
          error: validationError,
          structuredContent,
        });
        throw validationError;
      }

      // Call the actual save function if available
      if (state.persistenceCallbacks?.save) {
        await state.persistenceCallbacks.save(state.reviewId, structuredContent);
      } else {
        console.warn('Auto-save skipped: No persistence save callback configured');
        return; // Don't update state if we can't save
      }

      set({
        isDirty: false,
        isSaving: false,
        lastSaved: new Date(),
      });
    } catch (error) {
      console.error('Save failed:', error);
      set({ isSaving: false });
      // TODO: Show error toast when we integrate with UI
    } finally {
      saveMutex = false; // Always release the mutex
    }
  }, AUTOSAVE_DELAY);

  return {
    // Document State
    reviewId: null,
    title: '',
    description: '',

    // Content State
    nodes: [],
    layouts: initialLayouts,

    // Editor State
    selectedNodeId: null,
    currentViewport: 'desktop',
    isDirty: false,
    isSaving: false,
    lastSaved: null,
    isFullscreen: false,
    isInspectorVisible: true,

    // Canvas State
    canvasTransform: initialCanvasTransform,
    canvasTheme: 'light' as const,
    showGrid: true,
    showRulers: false,
    showGuidelines: false,
    guidelines: {
      horizontal: [],
      vertical: [],
    },

    // Clipboard State
    clipboardData: null,

    // History State
    history: [],
    historyIndex: -1,

    // Persistence Callbacks
    persistenceCallbacks: null,

    // ===== NODE ACTIONS =====

    addNode: nodeData => {
      const newNode: NodeObject = {
        id: generateNodeId(),
        type: nodeData.type || 'textBlock',
        data: nodeData.data || getDefaultDataForBlockType(nodeData.type || 'textBlock'),
        ...nodeData,
      } as NodeObject;

      set(state => {
        const updatedState = {
          ...state,
          nodes: [...state.nodes, newNode],
          selectedNodeId: newNode.id,
          isDirty: true,
        };

        // Auto-save after adding node
        debouncedSave();

        return updatedState;
      });
    },

    updateNode: (nodeId, updates) => {
      set(state => {
        const nodeIndex = state.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return state;

        const updatedNodes = [...state.nodes];
        updatedNodes[nodeIndex] = {
          ...updatedNodes[nodeIndex],
          ...updates,
          id: nodeId, // Ensure ID is preserved
        } as NodeObject;

        const updatedState = {
          ...state,
          nodes: updatedNodes,
          isDirty: true,
        };

        // Auto-save after updating node
        debouncedSave();

        return updatedState;
      });
    },

    deleteNode: nodeId => {
      set(state => {
        // Ensure we have master/derived layouts
        const layouts = ensureMasterDerivedLayouts(state.layouts);

        const updatedNodes = state.nodes.filter(n => n.id !== nodeId);
        const updatedDesktopItems = layouts.desktop.data.items.filter(i => i.nodeId !== nodeId);
        const updatedMobileItems = layouts.mobile.data.items.filter(i => i.nodeId !== nodeId);

        // Update both desktop and mobile layouts
        const updatedDesktopLayout = updateDesktopLayout(layouts, {
          ...layouts.desktop.data,
          items: updatedDesktopItems,
        });

        const updatedLayouts = updateMobileLayout(updatedDesktopLayout, {
          ...layouts.mobile.data,
          items: updatedMobileItems,
        });

        const updatedState = {
          ...state,
          nodes: updatedNodes,
          layouts: updatedLayouts,
          selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
          isDirty: true,
        };

        // Auto-save after deleting node
        debouncedSave();

        return updatedState;
      });
    },

    duplicateNode: nodeId => {
      const state = get();
      const originalNode = state.nodes.find(n => n.id === nodeId);
      if (!originalNode) return;

      // Create duplicate with new ID
      const duplicateNode: NodeObject = {
        ...originalNode,
        id: generateNodeId(),
      };

      get().addNode(duplicateNode);
    },

    // ===== LAYOUT ACTIONS =====

    updateLayout: (nodeId, layout, viewport) => {
      set(state => {
        // Ensure we have master/derived layouts
        const layouts = ensureMasterDerivedLayouts(state.layouts);

        // Get the current layout config for the viewport
        const currentLayoutConfig = getLayoutForViewport(layouts, viewport);
        const currentItems = currentLayoutConfig.items;
        const existingIndex = currentItems.findIndex(i => i.nodeId === nodeId);

        let updatedItems;
        if (existingIndex >= 0) {
          // Update existing layout item
          updatedItems = [...currentItems];
          updatedItems[existingIndex] = { ...layout, nodeId };
        } else {
          // Add new layout item
          updatedItems = [...currentItems, { ...layout, nodeId }];
        }

        // Create updated layout config
        const updatedLayoutConfig = {
          ...currentLayoutConfig,
          items: updatedItems,
        };

        // Update the appropriate layout using utility functions
        const updatedLayouts =
          viewport === 'desktop'
            ? updateDesktopLayout(layouts, updatedLayoutConfig)
            : updateMobileLayout(layouts, updatedLayoutConfig);

        const updatedState = {
          ...state,
          layouts: updatedLayouts,
          isDirty: true,
        };

        // Auto-save after layout update
        debouncedSave();

        return updatedState;
      });
    },

    // ===== SELECTION ACTIONS =====

    selectNode: nodeId => {
      set({ selectedNodeId: nodeId });
    },

    // ===== VIEWPORT ACTIONS =====

    // ===== MASTER/DERIVED LAYOUT SYSTEM =====

    switchViewport: viewport => {
      const state = get();
      if (state.currentViewport === viewport) return; // No change needed

      // Check if switching to mobile and mobile layout needs generation
      if (viewport === 'mobile') {
        const layouts = ensureMasterDerivedLayouts(state.layouts);
        if (!layouts.mobile.isGenerated && layouts.mobile.data.items.length === 0) {
          console.log('[EditorStore] Auto-generating mobile layout from desktop');
          get().generateMobileFromDesktop();
        }
      }

      // Simple viewport switch - no layout conversion
      set({
        currentViewport: viewport,
      });

      console.log(`[EditorStore] Switched to ${viewport} viewport (no conversion)`);
    },

    generateMobileFromDesktop: () => {
      set(state => {
        const layouts = ensureMasterDerivedLayouts(state.layouts);

        try {
          const { mobileLayout, nodeUpdates } = generateMobileFromDesktop(
            layouts.desktop.data,
            state.nodes
          );

          // Apply node content adaptations for mobile
          Object.entries(nodeUpdates).forEach(([nodeId, updates]) => {
            if (Object.keys(updates).length > 0) {
              get().updateNode(nodeId, updates);
            }
          });

          // Mark mobile as generated from current desktop
          const updatedLayouts = markMobileAsGenerated(layouts, mobileLayout);

          console.log('[EditorStore] Generated mobile layout from desktop:', {
            mobileItems: mobileLayout.items.length,
            nodeUpdates: Object.keys(nodeUpdates).length,
          });

          return {
            ...state,
            layouts: updatedLayouts,
            isDirty: true,
          };
        } catch (error) {
          console.error('[EditorStore] Failed to generate mobile layout:', error);
          return state;
        }
      });

      // Auto-save after generation
      debouncedSave();
    },

    shouldRegenerateMobile: () => {
      const state = get();
      const layouts = ensureMasterDerivedLayouts(state.layouts);
      return shouldRegenerateMobile(layouts);
    },

    resetMobileLayout: () => {
      console.log('[EditorStore] Resetting mobile layout from desktop');
      get().generateMobileFromDesktop();
    },

    updateCanvasTransform: transform => {
      set(state => ({
        canvasTransform: { ...state.canvasTransform, ...transform },
      }));
    },

    setCanvasTheme: theme => {
      set({ canvasTheme: theme });
    },

    toggleGrid: () => {
      set(state => ({ showGrid: !state.showGrid }));
    },

    toggleRulers: () => {
      set(state => ({ showRulers: !state.showRulers }));
    },

    toggleGuidelines: () => {
      set(state => ({ showGuidelines: !state.showGuidelines }));
    },

    toggleFullscreen: async () => {
      const state = get();
      const newFullscreenState = !state.isFullscreen;

      try {
        if (newFullscreenState) {
          // Enter browser fullscreen mode
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if ((document.documentElement as any).webkitRequestFullscreen) {
            // Safari support
            await (document.documentElement as any).webkitRequestFullscreen();
          } else if ((document.documentElement as any).msRequestFullscreen) {
            // IE/Edge support
            await (document.documentElement as any).msRequestFullscreen();
          } else if ((document.documentElement as any).mozRequestFullScreen) {
            // Firefox support
            await (document.documentElement as any).mozRequestFullScreen();
          }
        } else {
          // Exit browser fullscreen mode
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            // Safari support
            await (document as any).webkitExitFullscreen();
          } else if ((document as any).msExitFullscreen) {
            // IE/Edge support
            await (document as any).msExitFullscreen();
          } else if ((document as any).mozCancelFullScreen) {
            // Firefox support
            await (document as any).mozCancelFullScreen();
          }
        }

        // Update internal state
        set({ isFullscreen: newFullscreenState });
      } catch (error) {
        console.error('Fullscreen toggle failed:', error);
        // Don't update state if fullscreen failed
      }
    },

    toggleInspector: () => {
      set(state => ({ isInspectorVisible: !state.isInspectorVisible }));
    },

    // Handle browser fullscreen changes (ESC key, F11, etc.)
    handleFullscreenChange: () => {
      const isActuallyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement ||
        (document as any).mozFullScreenElement
      );

      // Sync internal state with actual browser fullscreen state
      set({ isFullscreen: isActuallyFullscreen });
    },

    addGuideline: (type, position) => {
      set(state => ({
        guidelines: {
          ...state.guidelines,
          [type]: [...state.guidelines[type], position].sort((a, b) => a - b),
        },
      }));
    },

    removeGuideline: (type, position) => {
      set(state => ({
        guidelines: {
          ...state.guidelines,
          [type]: state.guidelines[type].filter(p => p !== position),
        },
      }));
    },

    clearGuidelines: () => {
      set({
        guidelines: {
          horizontal: [],
          vertical: [],
        },
      });
    },

    // ===== CLIPBOARD ACTIONS =====

    copyNodes: nodeIds => {
      const state = get();
      const nodesToCopy = state.nodes.filter(n => nodeIds.includes(n.id));
      set({ clipboardData: nodesToCopy });
    },

    pasteNodes: () => {
      const state = get();
      if (!state.clipboardData) return;

      // Create new nodes with new IDs
      state.clipboardData.forEach(node => {
        get().addNode({
          ...node,
          id: generateNodeId(), // New ID for pasted node
        });
      });
    },

    // ===== HISTORY ACTIONS =====

    undo: () => {
      const state = get();
      if (state.historyIndex > 0) {
        const previousState = state.history[state.historyIndex - 1];
        set({
          nodes: previousState.nodes,
          layouts: previousState.layouts,
          historyIndex: state.historyIndex - 1,
          isDirty: true,
        });
      }
    },

    redo: () => {
      const state = get();
      if (state.historyIndex < state.history.length - 1) {
        const nextState = state.history[state.historyIndex + 1];
        set({
          nodes: nextState.nodes,
          layouts: nextState.layouts,
          historyIndex: state.historyIndex + 1,
          isDirty: true,
        });
      }
    },

    pushToHistory: () => {
      const state = get();
      const currentState: StructuredContentV2 = {
        version: '2.0.0',
        nodes: state.nodes,
        layouts: state.layouts,
      };

      // Limit history to 50 entries
      const newHistory = [...state.history.slice(0, state.historyIndex + 1), currentState];
      if (newHistory.length > 50) {
        newHistory.shift();
      }

      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    },

    // ===== DATA PERSISTENCE =====

    // Utility function to sanitize layout items before saving
    sanitizeLayouts: (layouts: Layouts): Layouts => {
      const sanitizeItems = (items: LayoutItem[] | undefined): LayoutItem[] => {
        if (!items || !Array.isArray(items)) {
          return [];
        }
        return items.map(item => ({
          ...item,
          x: Math.max(0, item.x),
          y: Math.max(0, item.y),
          w: Math.min(12, Math.max(1, item.w)), // Ensure w is between 1-12
          h: Math.max(1, item.h), // Ensure h is at least 1
        }));
      };

      return {
        desktop: {
          ...layouts.desktop,
          items: sanitizeItems(layouts.desktop?.items),
        },
        mobile: {
          ...layouts.mobile,
          items: sanitizeItems(layouts.mobile?.items),
        },
      };
    },

    saveToDatabase: async () => {
      // Force immediate save (bypass debounce)
      const state = get();
      if (!state.reviewId || saveMutex) return;

      try {
        saveMutex = true; // Lock to prevent concurrent saves
        set({ isSaving: true });

        // Convert to legacy format for backward compatibility and sanitize
        const layouts = ensureMasterDerivedLayouts(state.layouts);
        const legacyLayouts = convertToLegacyFormat(layouts);
        const sanitizedLayouts = get().sanitizeLayouts(legacyLayouts);

        const structuredContent: StructuredContentV2 = {
          version: '2.0.0',
          nodes: state.nodes,
          layouts: sanitizedLayouts,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            editorVersion: '1.0.0',
          },
        };

        // Validate before saving
        validateStructuredContent(structuredContent);

        // Call the actual save function - this will be set by the component using persistence hooks
        if (state.persistenceCallbacks?.save) {
          await state.persistenceCallbacks.save(state.reviewId, structuredContent);
        } else {
          console.warn('No persistence save callback configured');
        }

        set({
          isDirty: false,
          isSaving: false,
          lastSaved: new Date(),
        });
      } catch (error) {
        console.error('Save failed:', error);
        set({ isSaving: false });
        throw error;
      } finally {
        saveMutex = false; // Always release the mutex
      }
    },

    loadFromDatabase: async reviewId => {
      try {
        console.log('[EditorStore] Starting loadFromDatabase for reviewId:', reviewId);
        set({ reviewId, isSaving: true });

        // Call the actual load function - this will be set by the component using persistence hooks
        if (get().persistenceCallbacks?.load) {
          console.log('[EditorStore] Calling persistence load callback');
          const data = await get().persistenceCallbacks!.load(reviewId);
          console.log('[EditorStore] Load callback returned:', {
            hasData: !!data,
            hasStructuredContent: !!data?.structured_content,
            nodeCount: data?.structured_content?.nodes?.length || 0,
            updatedAt: data?.updated_at,
          });

          if (data?.structured_content) {
            // Sanitize layouts when loading to handle any legacy invalid data
            const sanitizedLayouts = get().sanitizeLayouts(data.structured_content.layouts);

            // Migrate to master/derived format (auto-migrates legacy layouts)
            const masterDerivedLayouts = ensureMasterDerivedLayouts(sanitizedLayouts);

            console.log('[EditorStore] Loading content into store:', {
              originalNodes: data.structured_content.nodes.length,
              sanitizedLayouts: Object.keys(sanitizedLayouts).length,
              isMasterDerived: masterDerivedLayouts.desktop.type === 'master',
            });

            // Load the content into the store
            set({
              nodes: data.structured_content.nodes,
              layouts: masterDerivedLayouts,
              selectedNodeId: null,
              isDirty: false,
              isSaving: false,
              lastSaved: new Date(data.updated_at),
            });

            console.log('[EditorStore] Content loaded successfully with master/derived layouts');
          } else {
            console.log('[EditorStore] No existing content found, using empty state');
            // No existing content - start with empty state
            set({
              nodes: [],
              layouts: initialLayouts,
              selectedNodeId: null,
              isDirty: false,
              isSaving: false,
              lastSaved: null,
            });
          }
        } else {
          console.warn('[EditorStore] No persistence load callback configured');
          // Fallback to empty state
          set({
            nodes: [],
            layouts: initialLayouts,
            selectedNodeId: null,
            isDirty: false,
            isSaving: false,
            lastSaved: null,
          });
        }
      } catch (error) {
        console.error('[EditorStore] Load failed:', error);
        set({ isSaving: false });
        throw error;
      }
    },

    loadFromJSON: json => {
      try {
        const validatedContent = validateStructuredContent(json);

        // Sanitize layouts when loading from JSON
        const sanitizedLayouts = get().sanitizeLayouts(validatedContent.layouts);

        // Migrate to master/derived format
        const masterDerivedLayouts = ensureMasterDerivedLayouts(sanitizedLayouts);

        set({
          nodes: validatedContent.nodes,
          layouts: masterDerivedLayouts,
          isDirty: false,
          selectedNodeId: null,
        });

        // Push to history after loading
        get().pushToHistory();
      } catch (error) {
        console.error('JSON load failed:', error);
        throw error;
      }
    },

    exportToJSON: () => {
      const state = get();

      // Convert to legacy format for backward compatibility
      const layouts = ensureMasterDerivedLayouts(state.layouts);
      const legacyLayouts = convertToLegacyFormat(layouts);

      return {
        version: '2.0.0' as const,
        nodes: state.nodes,
        layouts: legacyLayouts,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          editorVersion: '1.0.0',
        },
      };
    },

    exportToPDF: async () => {
      // TODO: Implement PDF export functionality
      console.log('Exporting to PDF...');
    },

    // ===== PERSISTENCE =====

    setPersistenceCallbacks: callbacks => {
      set({ persistenceCallbacks: callbacks });
    },

    // ===== UTILITIES =====

    reset: () => {
      set({
        reviewId: null,
        title: '',
        description: '',
        nodes: [],
        layouts: initialLayouts,
        selectedNodeId: null,
        currentViewport: 'desktop',
        isDirty: false,
        isSaving: false,
        lastSaved: null,
        canvasTransform: initialCanvasTransform,
        clipboardData: null,
        history: [],
        historyIndex: -1,
        persistenceCallbacks: null,
      });
    },

    setError: error => {
      // TODO: Implement error state management
      console.error('Editor error:', error);
    },
  };
});

// ===== OPTIMIZED SELECTORS FOR PERFORMANCE =====

/**
 * Stable selectors for selective subscriptions to prevent unnecessary re-renders.
 * Use these in components that only need specific parts of the editor state.
 */

// Node-related selectors
export const useSelectedNode = () =>
  useEditorStore(state => {
    if (!state.selectedNodeId) return null;
    return state.nodes.find(n => n.id === state.selectedNodeId) || null;
  });

export const useNodeCount = () => useEditorStore(state => state.nodes.length);

export const useNodeById = (nodeId: string | null) =>
  useEditorStore(state => (nodeId ? state.nodes.find(n => n.id === nodeId) || null : null));

// Canvas state selectors
export const useCanvasState = () =>
  useEditorStore(state => ({
    canvasTransform: state.canvasTransform,
    canvasTheme: state.canvasTheme,
    showGrid: state.showGrid,
    showRulers: state.showRulers,
    showGuidelines: state.showGuidelines,
    guidelines: state.guidelines,
  }));

// UI state selectors
export const useUIState = () =>
  useEditorStore(state => ({
    currentViewport: state.currentViewport,
    isFullscreen: state.isFullscreen,
    isInspectorVisible: state.isInspectorVisible,
  }));

// Persistence state selectors
export const usePersistenceState = () =>
  useEditorStore(state => ({
    isDirty: state.isDirty,
    isSaving: state.isSaving,
    lastSaved: state.lastSaved,
  }));

// Layout selectors
export const useCurrentLayout = () =>
  useEditorStore(state => {
    const layouts = ensureMasterDerivedLayouts(state.layouts);
    return getLayoutForViewport(layouts, state.currentViewport);
  });

// Stable action selectors (prevents function recreation)
export const useEditorActions = () =>
  useEditorStore(state => ({
    addNode: state.addNode,
    updateNode: state.updateNode,
    deleteNode: state.deleteNode,
    selectNode: state.selectNode,
    duplicateNode: state.duplicateNode,
  }));

export const useCanvasActions = () =>
  useEditorStore(state => ({
    toggleGrid: state.toggleGrid,
    toggleRulers: state.toggleRulers,
    toggleGuidelines: state.toggleGuidelines,
    toggleFullscreen: state.toggleFullscreen,
    toggleInspector: state.toggleInspector,
    setCanvasTheme: state.setCanvasTheme,
    clearGuidelines: state.clearGuidelines,
  }));
