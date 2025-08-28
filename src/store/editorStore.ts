// ABOUTME: Zustand store for managing Visual Composition Engine editor state

import { create } from 'zustand';
import { debounce } from 'lodash-es';
import { tiptapJsonToHtml } from '@/components/editor/shared/tiptapContentHelpers';
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
import { autoMigrateNodeData } from '@/utils/schemaMigration';
const AUTOSAVE_DELAY = 30000; // 30 seconds as per user requirements

// WYSIWYG Canvas Configuration
const initialWYSIWYGCanvas: WYSIWYGCanvas = {
  canvasWidth: 800,
  canvasHeight: 400, // Reduced initial height for content-adaptive sizing (was 600)
  gridColumns: 12,
  snapTolerance: 10,
};

// Initial positions (empty for new documents)
const initialPositions: BlockPositions = {};
const initialMobilePositions: BlockPositions = {};

// CONTENT-ADAPTIVE SYSTEM: Find available position for Rich Block - blocks can touch canvas edges
const findAvailablePosition = (
  existingPositions: BlockPositions,
  blockType?: string
): BlockPosition => {
  // Single Rich Block default dimensions - unified editor architecture
  const getDefaultDimensions = () => {
    return { width: 600, height: 200 }; // Rich Block handles all content types
  };

  const { width: defaultWidth, height: defaultHeight } = getDefaultDimensions(blockType);
  let y = 0; // CONTENT-ADAPTIVE: Start at canvas top edge

  // Find first available Y position with zero margins
  while (true) {
    const hasOverlap = Object.values(existingPositions).some(
      pos =>
        y < pos.y + pos.height &&
        y + defaultHeight > pos.y &&
        0 < pos.x + pos.width && // CONTENT-ADAPTIVE: Check from canvas left edge
        0 + defaultWidth > pos.x
    );

    if (!hasOverlap) break;
    y += defaultHeight + 20; // Move down with spacing (controlled by block padding, not canvas)
  }

  return {
    id: '', // Will be set by caller
    x: 0, // CONTENT-ADAPTIVE: Position at canvas left edge
    y,
    width: defaultWidth,
    height: defaultHeight,
  };
};

// Simple mobile position generator - CONTENT-ADAPTIVE SYSTEM - blocks can touch all canvas edges
const generateMobilePositions = (nodes: NodeObject[], desktopPositions: BlockPositions): BlockPositions => {
  const mobilePositions: BlockPositions = {};
  const MOBILE_CANVAS_WIDTH = 375; // Mobile canvas total width
  const MOBILE_CONTENT_WIDTH = MOBILE_CANVAS_WIDTH; // Full canvas width - no margins
  const MOBILE_SPACING = 20; // Spacing between blocks (controlled by block padding, not canvas)
  let currentY = 0; // Start at canvas top edge - no top padding

  // Sort nodes by their desktop Y position to maintain reading order
  const sortedNodes = nodes
    .map(node => ({
      node,
      desktopY: desktopPositions[node.id]?.y || 0
    }))
    .sort((a, b) => a.desktopY - b.desktopY);

  sortedNodes.forEach(({ node }) => {
    const desktopPos = desktopPositions[node.id];
    if (desktopPos) {
      mobilePositions[node.id] = {
        id: node.id,
        x: 0, // CONTENT-ADAPTIVE: Position at canvas left edge
        y: currentY,
        width: MOBILE_CONTENT_WIDTH, // Full canvas width (375px)
        height: desktopPos.height, // Keep original height
      };
      currentY += desktopPos.height + MOBILE_SPACING;
    }
  });

  return mobilePositions;
};

// Padding migration utility - converts legacy paddingX/Y to individual padding
const migratePaddingData = (data: any): any => {
  // If already migrated (has individual padding fields), return as-is
  if (data.paddingTop !== undefined || data.paddingRight !== undefined || 
      data.paddingBottom !== undefined || data.paddingLeft !== undefined) {
    return data;
  }

  // If has legacy padding, migrate to individual fields
  if (data.paddingX !== undefined || data.paddingY !== undefined) {
    const paddingX = data.paddingX ?? 16;
    const paddingY = data.paddingY ?? 16;
    
    return {
      ...data,
      paddingTop: paddingY,
      paddingRight: paddingX,
      paddingBottom: paddingY,
      paddingLeft: paddingX,
      // Remove legacy fields to prevent confusion
      paddingX: undefined,
      paddingY: undefined,
    };
  }

  // No padding data - set defaults for individual fields
  return {
    ...data,
    paddingTop: 16,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
  };
};

// ===== AI TEMPLATE FIELD REPLACEMENT UTILITIES =====

/**
 * Replaces problematic massive text fields with AI-friendly placeholders
 */
const replaceProblematicFields = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const result = Array.isArray(data) ? [...data] : { ...data };
  
  // Replace htmlContent with regeneration marker
  if ('htmlContent' in result) {
    result.htmlContent = '[AI_REGENERATE_HTML]';
  }
  
  // Replace base64 image sources with semantic placeholders
  if ('src' in result && typeof result.src === 'string' && result.src.startsWith('data:image/')) {
    const imageType = result.src.split(';')[0].split('/')[1] || 'image';
    result.src = `[AI_IMAGE_PLACEHOLDER_${imageType.toUpperCase()}]`;
    result.originalSize = result.src.length; // Track for regeneration
  }
  
  // Recursively process nested objects/arrays
  for (const key in result) {
    if (result[key] && typeof result[key] === 'object') {
      result[key] = replaceProblematicFields(result[key]);
    }
  }
  
  return result;
};

/**
 * Restores problematic fields from AI-friendly placeholders
 */
const restoreProblematicFields = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const result = Array.isArray(data) ? [...data] : { ...data };
  
  // Regenerate htmlContent from tiptapJSON if marked for regeneration
  if (result.htmlContent === '[AI_REGENERATE_HTML]' && result.tiptapJSON) {
    result.htmlContent = tiptapJsonToHtml(result.tiptapJSON);
  }
  
  // Handle image placeholders - create empty uploadable slots
  if ('src' in result && typeof result.src === 'string' && result.src.startsWith('[AI_IMAGE_PLACEHOLDER_')) {
    result.src = ''; // Empty src for AI to populate or user to upload
    result.placeholder = true;
    delete result.originalSize;
  }
  
  // Recursively process nested objects/arrays
  for (const key in result) {
    if (result[key] && typeof result[key] === 'object') {
      result[key] = restoreProblematicFields(result[key]);
    }
  }
  
  return result;
};

/**
 * Helper function to count restored fields in template
 */
const countRestoredFields = (data: any, fieldName: string): number => {
  if (!data || typeof data !== 'object') return 0;
  
  let count = 0;
  
  // Check current level
  if (fieldName === 'htmlContent' && data.htmlContent && data.htmlContent !== '[AI_REGENERATE_HTML]') {
    count++;
  } else if (fieldName === 'placeholder' && data.placeholder === true) {
    count++;
  }
  
  // Recursively count in nested objects/arrays
  for (const key in data) {
    if (data[key] && typeof data[key] === 'object') {
      count += countRestoredFields(data[key], fieldName);
    }
  }
  
  return count;
};

// Canvas boundary validation utilities - CONTENT-ADAPTIVE SYSTEM
const CANVAS_BOUNDARIES = {
  desktop: {
    width: 800,
    height: 400, // Reduced minimum for content-adaptive sizing (was 600)
    margin: 0, // Zero margins - blocks can touch canvas edges
  },
  mobile: {
    width: 375,
    height: 500, // Reduced minimum for content-adaptive sizing (was 800)  
    margin: 0, // Zero margins - blocks can touch canvas edges on mobile too
  }
} as const;

// Calculate dynamic canvas height based on current content positions - CONTENT-ADAPTIVE SYSTEM
const calculateCanvasHeight = (
  positions: BlockPositions, 
  viewport: 'desktop' | 'mobile'
): number => {
  const minHeight = CANVAS_BOUNDARIES[viewport].height;
  // CONTENT-ADAPTIVE: Dynamic bottom margin based on content presence
  
  if (Object.keys(positions).length === 0) {
    return minHeight;
  }
  
  const maxY = Math.max(
    minHeight,
    ...Object.values(positions).map(pos => pos.y + pos.height)
  );
  
  return maxY;
};

// Validate and constrain position to canvas boundaries (with dynamic height support)
const validatePosition = (
  position: BlockPosition, 
  viewport: 'desktop' | 'mobile',
  canvasHeight: number = CANVAS_BOUNDARIES[viewport].height
): BlockPosition => {
  const boundaries = CANVAS_BOUNDARIES[viewport];
  
  // Calculate constraints
  const minX = boundaries.margin;
  const maxX = boundaries.width - boundaries.margin - position.width;
  const minY = boundaries.margin; 
  
  // IMPORTANT: Allow expansion beyond current canvas height for downward movement
  // Only constrain if trying to position above minimum boundaries
  const maxY = Math.max(canvasHeight - position.height - boundaries.margin, minY);

  // Constrain position within boundaries - CONTENT-ADAPTIVE SYSTEM
  const constrainedPosition: BlockPosition = {
    ...position,
    x: Math.max(minX, Math.min(maxX, position.x)),
    // For Y, only constrain upward movement, allow downward expansion
    y: Math.max(minY, position.y), // Remove maxY constraint to allow canvas expansion
    // CONTENT-ADAPTIVE: Width can use full canvas width on both desktop and mobile
    width: Math.min(position.width, boundaries.width),
  };

  return constrainedPosition;
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
        mobilePositions: state.mobilePositions,
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
    mobilePositions: initialMobilePositions,
    canvas: initialWYSIWYGCanvas,
    currentViewport: 'desktop' as Viewport,

    // Editor State
    selectedNodeId: null,
    textSelection: null, // Text selection for unified typography editing
    canvasZoom: 1.0,
    isDirty: false,
    isSaving: false,
    lastSaved: null,
    isFullscreen: false,

    // Simple Block Activation - replaces complex interaction system
    activeBlockId: null,

    // Unified Selection System - coordinates all selection types
    selectionState: {
      activeBlockId: null,
      contentSelection: null,
      hasBlockSelection: false,
      hasContentSelection: false,
      preventMultiSelection: true,
    },

    // WYSIWYG Canvas Display Options
    showGrid: true,
    showSnapGuides: true,

    // UI State - Rich Block Architecture
    isInspectorVisible: true,
    canvasTheme: 'light',
    canvasBackgroundColor: 'hsl(var(--background))', // Default background token
    showRulers: false,
    showGuidelines: false,
    guidelines: { horizontal: [], vertical: [] },

    // TipTap Editor Registry for unified insertion architecture
    editorRegistry: new Map(),

    // Clipboard State
    clipboardData: null,

    // History State
    history: [],
    historyIndex: -1,

    // Persistence Callbacks
    persistenceCallbacks: null,

    // ===== NODE ACTIONS =====

    addNode: nodeData => {
      // Force all new nodes to be Rich Blocks - unified architecture
      const nodeType = 'richBlock';
      const nodeDataValue = nodeData.data || getDefaultDataForBlockType(nodeType);

      // Auto-migrate any legacy content to richBlock format
      const migration = autoMigrateNodeData(nodeData.type || 'textBlock', nodeDataValue);
      
      // Apply padding migration to ensure individual padding fields
      const migratedData = migratePaddingData(migration.data);
      const finalNodeData = migratedData;

      if (migration.migrated) {
        console.log(`[EditorStore] Auto-migrated ${nodeData.type} to richBlock`);
      }

      const newNode: NodeObject = {
        id: generateNodeId(),
        type: nodeType, // Always richBlock
        data: finalNodeData,
        // Include any additional properties from nodeData EXCEPT id, type, data
        ...Object.fromEntries(
          Object.entries(nodeData).filter(([key]) => !['id', 'type', 'data'].includes(key))
        ),
      } as NodeObject;

      set(state => {
        // Create position for new Rich Block
        const existingPositions = Object.values(state.positions);
        const newPosition = findAvailablePosition(existingPositions);
        newPosition.id = newNode.id;

        // AUTO-GENERATE mobile position immediately to sync new blocks to mobile canvas
        const newMobilePosition = {
          id: newNode.id,
          x: 0, // Full width on mobile
          y: Object.keys(state.mobilePositions).length * 220, // Stack vertically with spacing
          width: 375, // Mobile canvas width
          height: newPosition.height,
        };

        const updatedState = {
          ...state,
          nodes: [...state.nodes, newNode],
          positions: {
            ...state.positions,
            [newNode.id]: newPosition,
          },
          mobilePositions: {
            ...state.mobilePositions,
            [newNode.id]: newMobilePosition,
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
        
        // Apply padding migration if data is being updated
        const processedUpdates = updates.data ? {
          ...updates,
          data: migratePaddingData(updates.data)
        } : updates;
        
        updatedNodes[nodeIndex] = {
          ...updatedNodes[nodeIndex],
          ...processedUpdates,
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

        // Create updated position
        const updatedPosition = {
          ...currentPosition,
          ...positionUpdate,
        };

        // Calculate current canvas height and validate position
        const currentCanvasHeight = calculateCanvasHeight(state.positions, 'desktop');
        const constrainedPosition = validatePosition(updatedPosition, 'desktop', currentCanvasHeight);

        const updatedState = {
          ...state,
          positions: {
            ...state.positions,
            [nodeId]: constrainedPosition,
          },
          isDirty: true,
        };

        // Auto-save after position update
        debouncedSave();

        return updatedState;
      });
    },

    // Update mobile positions specifically with boundary validation
    updateMobilePosition: (nodeId: string, positionUpdate: Partial<BlockPosition>) => {
      set((state) => {
        const currentPosition = state.mobilePositions[nodeId];
        if (!currentPosition) {
          console.warn(`[EditorStore] No mobile position found for node ${nodeId}`);
          return state;
        }

        // Create updated position
        const updatedPosition = {
          ...currentPosition,
          ...positionUpdate,
        };

        // Calculate current canvas height and validate position  
        const currentCanvasHeight = calculateCanvasHeight(state.mobilePositions, 'mobile');
        const constrainedPosition = validatePosition(updatedPosition, 'mobile', currentCanvasHeight);

        const updatedState = {
          ...state,
          mobilePositions: {
            ...state.mobilePositions,
            [nodeId]: constrainedPosition,
          },
          isDirty: true,
        };

        // Auto-save after position update
        debouncedSave();

        return updatedState;
      });
    },

    // Unified position update that handles both viewports
    updateCurrentViewportPosition: (nodeId: string, positionUpdate: Partial<BlockPosition>) => {
      const state = get();
      if (state.currentViewport === 'mobile') {
        state.updateMobilePosition(nodeId, positionUpdate);
      } else {
        state.updateNodePosition(nodeId, positionUpdate);
      }
    },

    initializeNodePosition: (nodeId, blockType) => {
      set(state => {
        if (state.positions[nodeId]) return state; // Already has position

        // All blocks are Rich Blocks in unified architecture
        const existingPositions = Object.values(state.positions);
        const newPosition = findAvailablePosition(existingPositions);
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

        // Clean up editor registry for deleted node
        const newRegistry = new Map(state.editorRegistry);
        newRegistry.delete(nodeId);

        const updatedState = {
          ...state,
          nodes: updatedNodes,
          positions: updatedPositions,
          editorRegistry: newRegistry,
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
      const originalMobilePosition = state.mobilePositions[nodeId];
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

      // AUTO-GENERATE mobile position for duplicate to sync with mobile canvas
      const duplicateMobilePosition = originalMobilePosition ? {
        ...originalMobilePosition,
        id: duplicateNode.id,
        y: originalMobilePosition.y + originalMobilePosition.height + 20, // Stack below original with spacing
      } : {
        id: duplicateNode.id,
        x: 0, // Full width on mobile
        y: Object.keys(state.mobilePositions).length * 220, // Stack vertically with spacing
        width: 375, // Mobile canvas width
        height: duplicatePosition.height,
      };

      set(state => {
        const updatedState = {
          ...state,
          nodes: [...state.nodes, duplicateNode],
          positions: {
            ...state.positions,
            [duplicateNode.id]: duplicatePosition,
          },
          mobilePositions: {
            ...state.mobilePositions,
            [duplicateNode.id]: duplicateMobilePosition,
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
    // NOTE: Layout actions removed - Rich Block uses WYSIWYG positioning only

    // ===== SELECTION ACTIONS =====

    selectNode: nodeId => {
      set({ selectedNodeId: nodeId });
    },

    setTextSelection: textSelection => {
      set({ textSelection });
    },

    // ===== SIMPLE BLOCK ACTIVATION ACTIONS =====

    setActiveBlock: blockId => {
      set({ activeBlockId: blockId });
    },

    // ===== UNIFIED SELECTION COORDINATION ACTIONS =====

    activateBlock: blockId => {
      set(state => {
        // CRITICAL FIX P2: Preserve content selection when switching blocks for inspector continuity
        const shouldPreserveContent = state.selectionState.contentSelection?.blockId === blockId;

        return {
          selectionState: {
            activeBlockId: blockId,
            contentSelection: shouldPreserveContent ? state.selectionState.contentSelection : null,
            hasBlockSelection: blockId !== null,
            hasContentSelection: shouldPreserveContent
              ? state.selectionState.hasContentSelection
              : false,
            preventMultiSelection: true,
          },
          // Sync legacy activeBlockId for backward compatibility
          activeBlockId: blockId,
          // INSPECTOR INTEGRATION: Connect activeBlockId to selectedNodeId for inspector display
          selectedNodeId: blockId,
        };
      });
    },

    setContentSelection: contentSelection => {
      set(state => ({
        selectionState: {
          ...state.selectionState,
          contentSelection,
          hasContentSelection: contentSelection !== null,
          // If setting content selection, ensure the block is also active
          activeBlockId: contentSelection
            ? contentSelection.blockId
            : state.selectionState.activeBlockId,
          hasBlockSelection: contentSelection ? true : state.selectionState.hasBlockSelection,
        },
        // Sync legacy activeBlockId
        activeBlockId: contentSelection
          ? contentSelection.blockId
          : state.selectionState.activeBlockId,
      }));
    },

    clearAllSelection: () => {
      // SIMPLIFIED: Clear only block selections - unified system handles text/table selections
      console.log('[EditorStore] Clearing block selection');
      set({
        selectionState: {
          activeBlockId: null,
          contentSelection: null,
          hasBlockSelection: false,
          hasContentSelection: false,
          preventMultiSelection: true,
        },
        // Sync legacy state
        selectedNodeId: null,
        textSelection: null,
      });
    },

    // Content-specific selection actions
    selectTableCell: (blockId, tableId, cellPosition, isEditing = false) => {
      const state = get();
      const contentSelection = {
        type: 'table_cell' as const,
        blockId,
        data: {
          tableCell: {
            tableId,
            cellPosition,
            isEditing,
            editValue: '',
          },
        },
      };

      state.setContentSelection(contentSelection);
    },

    // Selection state queries
    isBlockActive: blockId => {
      const state = get();
      return state.selectionState.activeBlockId === blockId;
    },

    hasContentSelection: () => {
      const state = get();
      return state.selectionState.hasContentSelection;
    },

    getActiveContentType: () => {
      const state = get();
      return state.selectionState.contentSelection?.type || 'none';
    },

    // ===== TIPTAP EDITOR REGISTRY ACTIONS =====

    registerEditor: (nodeId, editor) => {
      set(state => {
        const newRegistry = new Map(state.editorRegistry);
        newRegistry.set(nodeId, editor);
        return { editorRegistry: newRegistry };
      });
    },

    unregisterEditor: nodeId => {
      set(state => {
        const newRegistry = new Map(state.editorRegistry);
        newRegistry.delete(nodeId);
        return { editorRegistry: newRegistry };
      });
    },

    getEditor: nodeId => {
      const state = get();
      return state.editorRegistry.get(nodeId) || null;
    },

    // ===== VIEWPORT ACTIONS =====

    // ===== VIEWPORT ACTIONS =====
    // NOTE: Legacy layout system removed - Rich Block uses responsive WYSIWYG positioning

    switchViewport: viewport => {
      // Simple viewport switch for Rich Block responsive design
      set({ currentViewport: viewport });
      console.log(`[EditorStore] Switched to ${viewport} viewport (Rich Block responsive)`);
    },

    generateMobileLayout: () => {
      // Simple mobile layout generation - stacks blocks vertically
      const state = get();
      const mobilePositions = generateMobilePositions(state.nodes, state.positions);
      
      set({ 
        mobilePositions,
        isDirty: true 
      });
      
      console.log(`[EditorStore] Generated mobile layout for ${state.nodes.length} blocks`);
      
      // Auto-save after generating mobile layout
      debouncedSave();
    },

    updateCanvasTransform: transform => {
      set(state => ({
        canvasTransform: { ...state.canvasTransform, ...transform },
      }));
    },

    setCanvasTheme: theme => {
      set({ canvasTheme: theme });
    },

    setCanvasBackgroundColor: (color: string) => {
      set({ canvasBackgroundColor: color });
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

    toggleInspector: () => {
      set(state => ({ isInspectorVisible: !state.isInspectorVisible }));
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
        // Handle legacy V2 format - create Rich Block positions
        else {
          // Create default Rich Block positions for legacy content
          const positions: any = {};
          previousState.nodes.forEach((node, index) => {
            const existingPositions = Object.values(positions);
            const newPosition = findAvailablePosition(existingPositions);
            newPosition.id = node.id;
            positions[node.id] = newPosition;
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
        // Handle legacy V2 format - create Rich Block positions
        else {
          // Create default Rich Block positions for legacy content
          const positions: any = {};
          nextState.nodes.forEach((node, index) => {
            const existingPositions = Object.values(positions);
            const newPosition = findAvailablePosition(existingPositions);
            newPosition.id = node.id;
            positions[node.id] = newPosition;
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
          mobilePositions: state.mobilePositions,
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

              // Initialize positions for nodes that don't have them
              const positions = content.positions || {};
              const missingPositions: any = {};

              content.nodes.forEach(node => {
                if (!positions[node.id]) {
                  const existingPositions = Object.values(positions);
                  const newPosition = findAvailablePosition(existingPositions);
                  newPosition.id = node.id;
                  missingPositions[node.id] = newPosition;
                }
              });

              // Load mobile positions or generate them if missing
              const mobilePositions = content.mobilePositions || generateMobilePositions(content.nodes, { ...positions, ...missingPositions });

              set({
                nodes: content.nodes,
                positions: { ...positions, ...missingPositions },
                mobilePositions,
                canvas: content.canvas || initialWYSIWYGCanvas,
                currentViewport: 'desktop',
                selectedNodeId: null,
                isDirty: false,
                isSaving: false,
                lastSaved: new Date(data.updated_at),
              });

              console.log('[EditorStore] V3 content loaded successfully');
            }
            // Handle legacy V2 format - migrate to V3 Rich Block
            else if (content.version === '2.0.0') {
              console.log('[EditorStore] Loading V2 content and migrating to Rich Block V3:', {
                nodeCount: content.nodes.length,
              });

              // Create default Rich Block positions for all legacy content
              const positions: any = {};
              content.nodes.forEach((node, index) => {
                const existingPositions = Object.values(positions);
                const newPosition = findAvailablePosition(existingPositions);
                newPosition.id = node.id;
                positions[node.id] = newPosition;
              });

              // Generate mobile positions for migrated content
              const mobilePositions = generateMobilePositions(content.nodes, positions);

              set({
                nodes: content.nodes,
                positions,
                mobilePositions,
                canvas: initialWYSIWYGCanvas,
                currentViewport: 'desktop',
                selectedNodeId: null,
                isDirty: false,
                isSaving: false,
                lastSaved: new Date(data.updated_at),
              });

              console.log('[EditorStore] V2 content migrated to Rich Block V3 successfully');
            }
          } else {
            console.log('[EditorStore] No existing content found, using empty state');
            // No existing content - start with empty state
            set({
              nodes: [],
              positions: initialPositions,
              mobilePositions: initialMobilePositions,
              canvas: initialWYSIWYGCanvas,
              currentViewport: 'desktop',
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
            mobilePositions: initialMobilePositions,
            canvas: initialWYSIWYGCanvas,
            currentViewport: 'desktop',
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

          // Load mobile positions or generate them if missing
          const mobilePositions = json.mobilePositions || generateMobilePositions(json.nodes, { ...positions, ...missingPositions });

          set({
            nodes: json.nodes,
            positions: { ...positions, ...missingPositions },
            mobilePositions,
            canvas: json.canvas || initialWYSIWYGCanvas,
            currentViewport: 'desktop',
            isDirty: false,
            selectedNodeId: null,
          });
        }
        // Handle legacy V2 format - migrate to Rich Block V3
        else {
          const validatedContent = validateStructuredContent(json);

          // Create default Rich Block positions for all legacy content
          const positions: any = {};
          validatedContent.nodes.forEach((node, index) => {
            const existingPositions = Object.values(positions);
            const newPosition = findAvailablePosition(existingPositions);
            newPosition.id = node.id;
            positions[node.id] = newPosition;
          });

          // Generate mobile positions for migrated content
          const mobilePositions = generateMobilePositions(validatedContent.nodes, positions);

          set({
            nodes: validatedContent.nodes,
            positions,
            mobilePositions,
            canvas: initialWYSIWYGCanvas,
            currentViewport: 'desktop',
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
        mobilePositions: state.mobilePositions,
        canvas: state.canvas,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          editorVersion: '2.0.0',
        },
      };

      return exportData;
    },

    exportAsTemplate: () => {
      const state = get();
      
      // Start with base JSON export (not recursive call to avoid infinite loop)
      const baseTemplate = state.exportToJSON();
      
      // Apply field replacement to remove problematic massive text
      const aiOptimizedTemplate = replaceProblematicFields(baseTemplate);
      
      // Add AI guidance metadata
      return {
        ...aiOptimizedTemplate,
        __aiMetadata: {
          version: 'ai-optimized-1.0',
          instructions: 'Complex JSON structures preserved. Massive text fields replaced with placeholders.',
          placeholders: {
            '[AI_REGENERATE_HTML]': 'HTML will be auto-generated from tiptapJSON on import',
            '[AI_IMAGE_PLACEHOLDER_*]': 'Replace with empty string or image URL'
          },
          generatedAt: new Date().toISOString()
        }
      };
    },

    importFromTemplate: (templateData: any) => {
      try {
        // Check if it's an AI template or legacy template
        let actualTemplateData = templateData;
        
        // If it has AI metadata, extract the template data
        if (templateData.__aiMetadata) {
          const { __aiMetadata, ...extractedData } = templateData;
          actualTemplateData = extractedData;
        }
        
        // Validate template format
        if (!actualTemplateData.version || !actualTemplateData.nodes) {
          throw new Error('Invalid template format');
        }
        
        // 🎯 CRITICAL FIX: Detect if this is a normal export (UUID keys) vs AI template (semantic keys)
        const isNormalExport = actualTemplateData.positions && 
          Object.keys(actualTemplateData.positions).some(key => 
            key.length > 10 && key.includes('-') // Detect UUID format
          );
        
        console.log('[ImportFromTemplate] 🔍 Import type detection:', {
          isNormalExport,
          hasAIMetadata: !!templateData.__aiMetadata,
          positionKeys: actualTemplateData.positions ? Object.keys(actualTemplateData.positions).slice(0, 2) : [],
          nodeCount: actualTemplateData.nodes.length
        });
        
        // 🎯 NORMAL EXPORT PATH: Direct import without ID regeneration
        if (isNormalExport) {
          console.log('[ImportFromTemplate] 📥 Processing normal export with UUID preservation');
          
          // For normal exports, use the data as-is (positions already have correct UUID keys)
          const restoredTemplate = restoreProblematicFields(actualTemplateData);
          
          // Direct import without regenerating IDs - positions already match node IDs
          get().loadFromJSON(restoredTemplate);
          
          console.log('Normal export imported successfully:', {
            nodeCount: restoredTemplate.nodes.length,
            hasPositions: restoredTemplate.positions ? Object.keys(restoredTemplate.positions).length : 0,
            hasMobilePositions: restoredTemplate.mobilePositions ? Object.keys(restoredTemplate.mobilePositions).length : 0,
            preservedUUIDs: true
          });
          
          return;
        }
        
        // 🎯 AI TEMPLATE PATH: ID regeneration for semantic templates
        console.log('[ImportFromTemplate] 🤖 Processing AI template with ID regeneration');
        
        // Restore problematic fields that were replaced (if it's an AI template)
        const restoredTemplate = restoreProblematicFields(actualTemplateData);
        
        // Generate new UUIDs for actual usage in the editor
        const nodesWithNewIds = restoredTemplate.nodes.map((node: any) => ({
          ...node,
          id: generateNodeId() // Generate real UUIDs for editor usage
        }));
        
        // Reconstruct positions with new UUIDs
        const newPositions: Record<string, any> = {};
        const newMobilePositions: Record<string, any> = {};
        
        nodesWithNewIds.forEach((node, index) => {
          const templateId = `block-${index + 1}`;
          if (restoredTemplate.positions && restoredTemplate.positions[templateId]) {
            newPositions[node.id] = {
              ...restoredTemplate.positions[templateId],
              id: node.id
            };
          }
          if (restoredTemplate.mobilePositions && restoredTemplate.mobilePositions[templateId]) {
            newMobilePositions[node.id] = {
              ...restoredTemplate.mobilePositions[templateId],
              id: node.id
            };
          }
        });
        
        // Reconstruct full database format for import
        const reconstructedData: StructuredContentV3 = {
          version: restoredTemplate.version || '3.0.0',
          nodes: nodesWithNewIds,
          positions: newPositions,
          mobilePositions: newMobilePositions,
          canvas: restoredTemplate.canvas || get().canvas,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            editorVersion: '2.0.0',
          },
        };
        
        // Use existing loadFromJSON - it handles validation perfectly!
        get().loadFromJSON(reconstructedData);
        
        console.log('AI template imported successfully:', {
          nodeCount: nodesWithNewIds.length,
          hasPositions: Object.keys(newPositions).length > 0,
          hasMobilePositions: Object.keys(newMobilePositions).length > 0,
          wasAITemplate: !!templateData.__aiMetadata,
          restoredHtmlFields: countRestoredFields(restoredTemplate, 'htmlContent'),
          imageFieldsProcessed: countRestoredFields(restoredTemplate, 'placeholder')
        });
        
      } catch (error) {
        console.error('Import failed:', error);
        throw new Error(`Import failed: ${error.message}`);
      }
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
        mobilePositions: initialMobilePositions,
        canvas: initialWYSIWYGCanvas,
        currentViewport: 'desktop',
        selectedNodeId: null,
        canvasZoom: 1.0,
        isDirty: false,
        isSaving: false,
        lastSaved: null,
        activeBlockId: null,
        selectionState: {
          activeBlockId: null,
          contentSelection: null,
          hasBlockSelection: false,
          hasContentSelection: false,
          preventMultiSelection: true,
        },
        showGrid: true,
        showSnapGuides: true,
        canvasTransform: initialCanvasTransform,
        // UI State
        isInspectorVisible: true,
        canvasTheme: 'light',
        canvasBackgroundColor: 'hsl(var(--background))',
        showRulers: false,
        showGuidelines: false,
        guidelines: { horizontal: [], vertical: [] },
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
    canvasBackgroundColor: state.canvasBackgroundColor,
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

// Dual viewport selectors
export const useCurrentViewport = () => useEditorStore(state => state.currentViewport);
export const useCurrentPositions = () => 
  useEditorStore(state => state.currentViewport === 'mobile' ? state.mobilePositions : state.positions);
export const useMobilePositions = () => useEditorStore(state => state.mobilePositions);

// Active block selector
export const useActiveBlockId = () => useEditorStore(state => state.activeBlockId);

// Unified Selection System selectors
export const useSelectionState = () => useEditorStore(state => state.selectionState);

export const useIsBlockActive = (blockId: string) =>
  useEditorStore(state => state.selectionState.activeBlockId === blockId);

export const useContentSelection = () =>
  useEditorStore(state => state.selectionState.contentSelection);

export const useHasContentSelection = () =>
  useEditorStore(state => state.selectionState.hasContentSelection);

export const useActiveContentType = () =>
  useEditorStore(state => state.selectionState.contentSelection?.type || 'none');

// Selection query selectors
export const useSelectionQueries = () =>
  useEditorStore(state => ({
    isBlockActive: state.isBlockActive,
    hasContentSelection: state.hasContentSelection,
    getActiveContentType: state.getActiveContentType,
  }));

// Stable action selectors (prevents function recreation)
export const useEditorActions = () =>
  useEditorStore(state => ({
    addNode: state.addNode,
    updateNode: state.updateNode,
    deleteNode: state.deleteNode,
    selectNode: state.selectNode,
    duplicateNode: state.duplicateNode,
    setActiveBlock: state.setActiveBlock,
    // Unified selection actions
    activateBlock: state.activateBlock,
    setContentSelection: state.setContentSelection,
    clearAllSelection: state.clearAllSelection,
    selectTableCell: state.selectTableCell,
    // Dual viewport actions
    switchViewport: state.switchViewport,
    generateMobileLayout: state.generateMobileLayout,
    updateMobilePosition: state.updateMobilePosition,
    updateCurrentViewportPosition: state.updateCurrentViewportPosition,
  }));

export const useCanvasActions = () =>
  useEditorStore(state => ({
    toggleGrid: state.toggleGrid,
    toggleRulers: state.toggleRulers,
    toggleGuidelines: state.toggleGuidelines,
    toggleFullscreen: state.toggleFullscreen,
    setCanvasTheme: state.setCanvasTheme,
    setCanvasBackgroundColor: state.setCanvasBackgroundColor,
    clearGuidelines: state.clearGuidelines,
  }));
