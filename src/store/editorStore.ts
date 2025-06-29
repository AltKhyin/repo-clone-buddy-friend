// ABOUTME: Zustand store for managing Visual Composition Engine editor state

import { create } from 'zustand';
import { debounce } from 'lodash-es';
import { 
  EditorState, 
  NodeObject, 
  LayoutItem, 
  Viewport, 
  CanvasTransform, 
  StructuredContentV2,
  generateNodeId,
  getDefaultDataForBlockType,
  validateStructuredContent 
} from '@/types/editor';

const AUTOSAVE_DELAY = 30000; // 30 seconds as per user requirements

const initialCanvasTransform: CanvasTransform = {
  x: 0,
  y: 0,
  zoom: 1,
};

const initialLayouts = {
  desktop: {
    gridSettings: { columns: 12 },
    items: [],
  },
  mobile: {
    gridSettings: { columns: 4 },
    items: [],
  },
};

/**
 * Editor store following the same simple pattern as auth.ts.
 * Manages all editor state for the Visual Composition Engine.
 * No middleware dependencies - manual immutable updates.
 */
export const useEditorStore = create<EditorState>((set, get) => {
  // Debounced save function
  const debouncedSave = debounce(async () => {
    const state = get();
    if (!state.reviewId || !state.isDirty) return;
    
    try {
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
      
      // Validate before saving
      validateStructuredContent(structuredContent);
      
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
        lastSaved: new Date() 
      });
    } catch (error) {
      console.error('Save failed:', error);
      set({ isSaving: false });
      // TODO: Show error toast when we integrate with UI
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
    
    addNode: (nodeData) => {
      const newNode: NodeObject = {
        id: generateNodeId(),
        type: nodeData.type || 'textBlock',
        data: nodeData.data || getDefaultDataForBlockType(nodeData.type || 'textBlock'),
        ...nodeData,
      } as NodeObject;
      
      set((state) => {
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
      set((state) => {
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
    
    deleteNode: (nodeId) => {
      set((state) => {
        const updatedNodes = state.nodes.filter(n => n.id !== nodeId);
        const updatedDesktopItems = state.layouts.desktop.items.filter(i => i.nodeId !== nodeId);
        const updatedMobileItems = state.layouts.mobile.items.filter(i => i.nodeId !== nodeId);
        
        const updatedState = {
          ...state,
          nodes: updatedNodes,
          layouts: {
            desktop: {
              ...state.layouts.desktop,
              items: updatedDesktopItems,
            },
            mobile: {
              ...state.layouts.mobile,
              items: updatedMobileItems,
            },
          },
          selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
          isDirty: true,
        };
        
        // Auto-save after deleting node
        debouncedSave();
        
        return updatedState;
      });
    },
    
    duplicateNode: (nodeId) => {
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
      set((state) => {
        const currentItems = state.layouts[viewport].items;
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
        
        const updatedState = {
          ...state,
          layouts: {
            ...state.layouts,
            [viewport]: {
              ...state.layouts[viewport],
              items: updatedItems,
            },
          },
          isDirty: true,
        };
        
        // Auto-save after layout update
        debouncedSave();
        
        return updatedState;
      });
    },
    
    // ===== SELECTION ACTIONS =====
    
    selectNode: (nodeId) => {
      set({ selectedNodeId: nodeId });
    },
    
    // ===== VIEWPORT ACTIONS =====
    
    switchViewport: (viewport) => {
      const state = get();
      if (state.currentViewport === viewport) return; // No change needed
      
      const currentLayout = state.layouts[state.currentViewport];
      const targetLayout = state.layouts[viewport];
      
      // Smart layout conversion: try to preserve relative positioning
      const convertedItems = currentLayout.items.map(item => {
        const currentColumns = currentLayout.gridSettings.columns;
        const targetColumns = targetLayout.gridSettings.columns;
        
        // Calculate relative position as percentage
        const relativeX = item.x / currentColumns;
        const relativeWidth = item.w / currentColumns;
        
        // Convert to target viewport coordinates
        const newX = Math.floor(relativeX * targetColumns);
        const newWidth = Math.max(1, Math.floor(relativeWidth * targetColumns));
        
        // Ensure the item fits within the target grid
        const adjustedX = Math.min(newX, targetColumns - newWidth);
        const adjustedWidth = Math.min(newWidth, targetColumns - adjustedX);
        
        return {
          ...item,
          x: adjustedX,
          w: adjustedWidth,
        };
      });
      
      // Update the target layout with converted items if it's empty
      const updatedLayouts = {
        ...state.layouts,
        [viewport]: {
          ...targetLayout,
          items: targetLayout.items.length === 0 ? convertedItems : targetLayout.items,
        },
      };
      
      set({ 
        currentViewport: viewport,
        layouts: updatedLayouts,
        isDirty: true,
      });
      
      // Auto-save after viewport switch
      debouncedSave();
    },
    
    updateCanvasTransform: (transform) => {
      set((state) => ({
        canvasTransform: { ...state.canvasTransform, ...transform },
      }));
    },
    
    setCanvasTheme: (theme) => {
      set({ canvasTheme: theme });
    },
    
    toggleGrid: () => {
      set((state) => ({ showGrid: !state.showGrid }));
    },
    
    toggleRulers: () => {
      set((state) => ({ showRulers: !state.showRulers }));
    },
    
    toggleGuidelines: () => {
      set((state) => ({ showGuidelines: !state.showGuidelines }));
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
      set((state) => ({
        guidelines: {
          ...state.guidelines,
          [type]: [...state.guidelines[type], position].sort((a, b) => a - b),
        },
      }));
    },
    
    removeGuideline: (type, position) => {
      set((state) => ({
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
    
    copyNodes: (nodeIds) => {
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
    
    saveToDatabase: async () => {
      // Force immediate save (bypass debounce)
      const state = get();
      if (!state.reviewId) return;
      
      try {
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
          lastSaved: new Date() 
        });
      } catch (error) {
        console.error('Save failed:', error);
        set({ isSaving: false });
        throw error;
      }
    },
    
    loadFromDatabase: async (reviewId) => {
      try {
        set({ reviewId, isSaving: true });
        
        // Call the actual load function - this will be set by the component using persistence hooks
        if (get().persistenceCallbacks?.load) {
          const data = await get().persistenceCallbacks!.load(reviewId);
          
          if (data?.structured_content) {
            // Load the content into the store
            set({
              nodes: data.structured_content.nodes,
              layouts: data.structured_content.layouts,
              selectedNodeId: null,
              isDirty: false,
              isSaving: false,
              lastSaved: new Date(data.updated_at),
            });
          } else {
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
          console.warn('No persistence load callback configured');
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
        console.error('Load failed:', error);
        set({ isSaving: false });
        throw error;
      }
    },
    
    loadFromJSON: (json) => {
      try {
        const validatedContent = validateStructuredContent(json);
        
        set({
          nodes: validatedContent.nodes,
          layouts: validatedContent.layouts,
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
      return {
        version: '2.0.0' as const,
        nodes: state.nodes,
        layouts: state.layouts,
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
    
    setPersistenceCallbacks: (callbacks) => {
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
    
    setError: (error) => {
      // TODO: Implement error state management
      console.error('Editor error:', error);
    },
  };
});