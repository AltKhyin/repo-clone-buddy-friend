// ABOUTME: Zustand store for managing Visual Composition Engine editor state

import { create } from 'zustand';
import { debounce } from 'lodash-es';
import {
  EditorState,
  NodeObject,
  BlockPosition,
  BlockPositions,
  WYSIWYGCanvas,
  StructuredContentV3,
  StructuredContentV2,
  StructuredContent,
  TextSelectionInfo,
  generateNodeId,
  getDefaultDataForBlockType,
  validateStructuredContent,
} from '@/types/editor';
import { migrateAllHeadingBlocks } from '@/utils/headingBlockMigration';
const AUTOSAVE_DELAY = 30000; // 30 seconds as per user requirements

// WYSIWYG Canvas Configuration
const initialWYSIWYGCanvas: WYSIWYGCanvas = {
  canvasWidth: 800,
  canvasHeight: 600,
  gridColumns: 12,
  snapTolerance: 10,
};

// Initial positions (empty for new documents)
const initialPositions: BlockPositions = {};

// Enhanced utility: Find available position with content-aware sizing for different block types
const findAvailablePosition = (
  existingPositions: BlockPositions,
  blockType?: string
): BlockPosition => {
  // Content-aware default dimensions based on block type
  const getDefaultDimensions = (type?: string) => {
    switch (type) {
      case 'textBlock':
        return { width: 400, height: 120 };
      case 'imageBlock':
        return { width: 400, height: 300 };
      case 'quoteBlock':
        return { width: 400, height: 150 };
      case 'keyTakeawayBlock':
        return { width: 400, height: 150 };
      case 'videoEmbedBlock':
        return { width: 560, height: 315 }; // 16:9 aspect ratio
      case 'tableBlock':
        return { width: 600, height: 200 };
      case 'pollBlock':
        return { width: 400, height: 250 };
      case 'referenceBlock':
        return { width: 400, height: 180 };
      case 'separatorBlock':
        return { width: 400, height: 40 };
      default:
        return { width: 400, height: 120 }; // Default fallback
    }
  };

  const { width: defaultWidth, height: defaultHeight } = getDefaultDimensions(blockType);
  let y = 50; // Start 50px from top

  // Find first available Y position with content-aware spacing
  while (true) {
    const hasOverlap = Object.values(existingPositions).some(
      pos =>
        y < pos.y + pos.height &&
        y + defaultHeight > pos.y &&
        50 < pos.x + pos.width && // Start at x=50 for better visual hierarchy
        50 + defaultWidth > pos.x
    );

    if (!hasOverlap) break;
    y += defaultHeight + 20; // Move down with spacing
  }

  return {
    id: '', // Will be set by caller
    x: 50, // Content-aware left margin
    y,
    width: defaultWidth,
    height: defaultHeight,
  };
};

// Legacy support
const initialCanvasTransform: CanvasTransform = {
  x: 0,
  y: 0,
  zoom: 1,
};

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

      const structuredContent: StructuredContentV3 = {
        version: '3.0.0',
        nodes: state.nodes,
        positions: state.positions,
        canvas: state.canvas,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          editorVersion: '2.0.0',
        },
      };

      console.log('[EditorStore] About to validate content:', {
        hasVersion: !!structuredContent.version,
        version: structuredContent.version,
        nodesType: typeof structuredContent.nodes,
        nodesArray: Array.isArray(structuredContent.nodes),
        nodeCount: structuredContent.nodes?.length || 0,
        positionsType: typeof structuredContent.positions,
        positionsKeys: Object.keys(structuredContent.positions || {}),
        positionCount: Object.keys(structuredContent.positions || {}).length,
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

    // Content State (V3 - WYSIWYG positioning)
    nodes: [],
    positions: initialPositions,
    canvas: initialWYSIWYGCanvas,

    // Editor State
    selectedNodeId: null,
    textSelection: null, // Text selection for unified typography editing
    canvasZoom: 1.0,
    isDirty: false,
    isSaving: false,
    lastSaved: null,
    isFullscreen: false,

    // WYSIWYG Canvas Display Options
    showGrid: true,
    showSnapGuides: true,

    // Clipboard State
    clipboardData: null,

    // History State
    history: [],
    historyIndex: -1,

    // Persistence Callbacks
    persistenceCallbacks: null,

    // ===== NODE ACTIONS =====

    addNode: nodeData => {
      const nodeType = nodeData.type || 'textBlock';
      const nodeDataValue = nodeData.data || getDefaultDataForBlockType(nodeType);
      
      const newNode: NodeObject = {
        id: generateNodeId(),
        type: nodeType,
        data: nodeDataValue,
        // Include any additional properties from nodeData EXCEPT id, type, data
        ...Object.fromEntries(
          Object.entries(nodeData).filter(([key]) => !['id', 'type', 'data'].includes(key))
        ),
      } as NodeObject;

      set(state => {
        // Create position for new node to avoid overlaps
        const existingPositions = Object.values(state.positions);
        const newPosition = findAvailablePosition(existingPositions);
        newPosition.id = newNode.id;

        const updatedState = {
          ...state,
          nodes: [...state.nodes, newNode],
          positions: {
            ...state.positions,
            [newNode.id]: newPosition,
          },
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

    // ===== WYSIWYG POSITION ACTIONS =====

    updateNodePosition: (nodeId, positionUpdate) => {
      set(state => {
        const currentPosition = state.positions[nodeId];
        if (!currentPosition) return state;

        const updatedState = {
          ...state,
          positions: {
            ...state.positions,
            [nodeId]: {
              ...currentPosition,
              ...positionUpdate,
            },
          },
          isDirty: true,
        };

        // Auto-save after position update
        debouncedSave();

        return updatedState;
      });
    },

    initializeNodePosition: (nodeId, blockType) => {
      set(state => {
        if (state.positions[nodeId]) return state; // Already has position

        // Find the node to get its type if not provided
        const node = state.nodes.find(n => n.id === nodeId);
        const typeToUse = blockType || node?.type;

        const existingPositions = Object.values(state.positions);
        const newPosition = findAvailablePosition(existingPositions, typeToUse);
        newPosition.id = nodeId;

        return {
          ...state,
          positions: {
            ...state.positions,
            [nodeId]: newPosition,
          },
          isDirty: true,
        };
      });
    },

    updateCanvasZoom: zoom => {
      set(state => ({
        ...state,
        canvasZoom: Math.max(0.5, Math.min(2.0, zoom)),
      }));
    },

    toggleSnapGuides: () => {
      set(state => ({ ...state, showSnapGuides: !state.showSnapGuides }));
    },

    deleteNode: nodeId => {
      set(state => {
        // Remove node from nodes array
        const updatedNodes = state.nodes.filter(n => n.id !== nodeId);

        // Remove position data for deleted node
        const updatedPositions = { ...state.positions };
        delete updatedPositions[nodeId];

        const updatedState = {
          ...state,
          nodes: updatedNodes,
          positions: updatedPositions,
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
      const originalPosition = state.positions[nodeId];
      if (!originalNode || !originalPosition) return;

      // Create duplicate with new ID
      const duplicateNode: NodeObject = {
        ...originalNode,
        id: generateNodeId(),
      };

      // Create position for duplicate (offset to avoid overlap)
      const duplicatePosition = {
        ...originalPosition,
        id: duplicateNode.id,
        x: originalPosition.x + 20, // Small offset
        y: originalPosition.y + 20,
      };

      set(state => {
        const updatedState = {
          ...state,
          nodes: [...state.nodes, duplicateNode],
          positions: {
            ...state.positions,
            [duplicateNode.id]: duplicatePosition,
          },
          selectedNodeId: duplicateNode.id,
          isDirty: true,
        };

        // Auto-save after duplicating node
        debouncedSave();

        return updatedState;
      });
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

    setTextSelection: textSelection => {
      set({ textSelection });
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

    toggleFullscreen: () => {
      const state = get();
      const newFullscreenState = !state.isFullscreen;

      // Application-level fullscreen - simpler and more reliable
      if (newFullscreenState) {
        // Add fullscreen CSS class to body for styling
        document.body.classList.add('editor-fullscreen');
        document.documentElement.classList.add('editor-fullscreen');
      } else {
        // Remove fullscreen CSS class
        document.body.classList.remove('editor-fullscreen');
        document.documentElement.classList.remove('editor-fullscreen');
      }

      // Update internal state
      set({ isFullscreen: newFullscreenState });
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

        // Handle V3 format
        if (previousState.version === '3.0.0') {
          set({
            nodes: previousState.nodes,
            positions: previousState.positions,
            canvas: previousState.canvas,
            historyIndex: state.historyIndex - 1,
            isDirty: true,
          });
        }
        // Handle V2 format (legacy) - migrate to V3
        else {
          // For legacy V2 format, we need to migrate to V3 positions
          const positions: any = {};
          const columnWidth = 800 / 12;

          previousState.nodes.forEach((node, index) => {
            const layoutItem = previousState.layouts?.desktop?.items?.find(
              item => item.nodeId === node.id
            );

            if (layoutItem) {
              positions[node.id] = {
                id: node.id,
                x: layoutItem.x * (columnWidth / 2),
                y: layoutItem.y * 20,
                width: layoutItem.w * (columnWidth / 2),
                height: layoutItem.h * 20,
              };
            } else {
              const existingPositions = Object.values(positions);
              const newPosition = findAvailablePosition(existingPositions);
              newPosition.id = node.id;
              positions[node.id] = newPosition;
            }
          });

          set({
            nodes: previousState.nodes,
            positions,
            canvas: initialWYSIWYGCanvas,
            historyIndex: state.historyIndex - 1,
            isDirty: true,
          });
        }
      }
    },

    redo: () => {
      const state = get();
      if (state.historyIndex < state.history.length - 1) {
        const nextState = state.history[state.historyIndex + 1];

        // Handle V3 format
        if (nextState.version === '3.0.0') {
          set({
            nodes: nextState.nodes,
            positions: nextState.positions,
            canvas: nextState.canvas,
            historyIndex: state.historyIndex + 1,
            isDirty: true,
          });
        }
        // Handle V2 format (legacy) - migrate to V3
        else {
          // For legacy V2 format, we need to migrate to V3 positions
          const positions: any = {};
          const columnWidth = 800 / 12;

          nextState.nodes.forEach((node, index) => {
            const layoutItem = nextState.layouts?.desktop?.items?.find(
              item => item.nodeId === node.id
            );

            if (layoutItem) {
              positions[node.id] = {
                id: node.id,
                x: layoutItem.x * (columnWidth / 2),
                y: layoutItem.y * 20,
                width: layoutItem.w * (columnWidth / 2),
                height: layoutItem.h * 20,
              };
            } else {
              const existingPositions = Object.values(positions);
              const newPosition = findAvailablePosition(existingPositions);
              newPosition.id = node.id;
              positions[node.id] = newPosition;
            }
          });

          set({
            nodes: nextState.nodes,
            positions,
            canvas: initialWYSIWYGCanvas,
            historyIndex: state.historyIndex + 1,
            isDirty: true,
          });
        }
      }
    },

    pushToHistory: () => {
      const state = get();
      const currentState: StructuredContentV3 = {
        version: '3.0.0',
        nodes: state.nodes,
        positions: state.positions,
        canvas: state.canvas,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          editorVersion: '2.0.0',
        },
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
      if (!state.reviewId || saveMutex) return;

      try {
        saveMutex = true; // Lock to prevent concurrent saves
        set({ isSaving: true });

        const structuredContent: StructuredContentV3 = {
          version: '3.0.0',
          nodes: state.nodes,
          positions: state.positions,
          canvas: state.canvas,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            editorVersion: '2.0.0',
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
            const content = data.structured_content;

            // Handle V3 format (WYSIWYG positioning)
            if (content.version === '3.0.0') {
              console.log('[EditorStore] Loading V3 content (WYSIWYG positioning):', {
                nodeCount: content.nodes.length,
                positionCount: Object.keys(content.positions || {}).length,
                canvasConfig: content.canvas,
              });

              // Migrate any legacy heading blocks to unified text blocks
              const migratedNodes = migrateAllHeadingBlocks(content.nodes);

              // Initialize positions for nodes that don't have them
              const positions = content.positions || {};
              const missingPositions: any = {};

              migratedNodes.forEach(node => {
                if (!positions[node.id]) {
                  const existingPositions = Object.values(positions);
                  const newPosition = findAvailablePosition(existingPositions);
                  newPosition.id = node.id;
                  missingPositions[node.id] = newPosition;
                }
              });

              set({
                nodes: migratedNodes,
                positions: { ...positions, ...missingPositions },
                canvas: content.canvas || initialWYSIWYGCanvas,
                selectedNodeId: null,
                isDirty: false,
                isSaving: false,
                lastSaved: new Date(data.updated_at),
              });

              console.log('[EditorStore] V3 content loaded successfully');
            }
            // Handle V2 format (legacy layouts) - migrate to V3
            else if (content.version === '2.0.0') {
              console.log('[EditorStore] Loading V2 content and migrating to V3:', {
                nodeCount: content.nodes.length,
                hasLayouts: !!content.layouts,
              });

              // Migrate any legacy heading blocks to unified text blocks
              const migratedNodes = migrateAllHeadingBlocks(content.nodes);

              // Migrate V2 layout to V3 positions
              const positions: any = {};
              const columnWidth = 800 / 12; // Standard 12-column grid

              migratedNodes.forEach((node, index) => {
                // Try to find layout item in desktop layout
                const layoutItem = content.layouts?.desktop?.items?.find(
                  item => item.nodeId === node.id
                );

                if (layoutItem) {
                  // Convert grid coordinates to pixel coordinates
                  positions[node.id] = {
                    id: node.id,
                    x: layoutItem.x * (columnWidth / 2),
                    y: layoutItem.y * 20,
                    width: layoutItem.w * (columnWidth / 2),
                    height: layoutItem.h * 20,
                  };
                } else {
                  // Create default position
                  const existingPositions = Object.values(positions);
                  const newPosition = findAvailablePosition(existingPositions);
                  newPosition.id = node.id;
                  positions[node.id] = newPosition;
                }
              });

              set({
                nodes: migratedNodes,
                positions,
                canvas: initialWYSIWYGCanvas,
                selectedNodeId: null,
                isDirty: false,
                isSaving: false,
                lastSaved: new Date(data.updated_at),
              });

              console.log('[EditorStore] V2 content migrated to V3 successfully');
            }
          } else {
            console.log('[EditorStore] No existing content found, using empty state');
            // No existing content - start with empty state
            set({
              nodes: [],
              positions: initialPositions,
              canvas: initialWYSIWYGCanvas,
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
            positions: initialPositions,
            canvas: initialWYSIWYGCanvas,
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
        // Handle V3 format (WYSIWYG positioning)
        if (json.version === '3.0.0') {
          // Initialize positions for nodes that don't have them
          const positions = json.positions || {};
          const missingPositions: any = {};

          json.nodes.forEach(node => {
            if (!positions[node.id]) {
              const existingPositions = Object.values(positions);
              const newPosition = findAvailablePosition(existingPositions);
              newPosition.id = node.id;
              missingPositions[node.id] = newPosition;
            }
          });

          set({
            nodes: json.nodes,
            positions: { ...positions, ...missingPositions },
            canvas: json.canvas || initialWYSIWYGCanvas,
            isDirty: false,
            selectedNodeId: null,
          });
        }
        // Handle V2 format (legacy layouts) - migrate to V3
        else {
          const validatedContent = validateStructuredContent(json);

          // Migrate V2 layout to V3 positions
          const positions: any = {};
          const columnWidth = 800 / 12; // Standard 12-column grid

          validatedContent.nodes.forEach((node, index) => {
            // Try to find layout item in desktop layout
            const layoutItem = validatedContent.layouts?.desktop?.items?.find(
              item => item.nodeId === node.id
            );

            if (layoutItem) {
              // Convert grid coordinates to pixel coordinates
              positions[node.id] = {
                id: node.id,
                x: layoutItem.x * (columnWidth / 2),
                y: layoutItem.y * 20,
                width: layoutItem.w * (columnWidth / 2),
                height: layoutItem.h * 20,
              };
            } else {
              // Create default position
              const existingPositions = Object.values(positions);
              const newPosition = findAvailablePosition(existingPositions);
              newPosition.id = node.id;
              positions[node.id] = newPosition;
            }
          });

          set({
            nodes: validatedContent.nodes,
            positions,
            canvas: initialWYSIWYGCanvas,
            isDirty: false,
            selectedNodeId: null,
          });
        }

        // Push to history after loading
        get().pushToHistory();
      } catch (error) {
        console.error('JSON load failed:', error);
        throw error;
      }
    },

    exportToJSON: () => {
      const state = get();

      // Export in V3 format (WYSIWYG positioning)
      const exportData: StructuredContentV3 = {
        version: '3.0.0',
        nodes: state.nodes,
        positions: state.positions,
        canvas: state.canvas,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          editorVersion: '2.0.0',
        },
      };

      return exportData;
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
        positions: initialPositions,
        canvas: initialWYSIWYGCanvas,
        selectedNodeId: null,
        canvasZoom: 1.0,
        isDirty: false,
        isSaving: false,
        lastSaved: null,
        showGrid: true,
        showSnapGuides: true,
        // Legacy support
        currentViewport: 'desktop',
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
    setCanvasTheme: state.setCanvasTheme,
    clearGuidelines: state.clearGuidelines,
  }));
