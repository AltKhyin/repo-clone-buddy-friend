// ABOUTME: Zustand store for EVIDENS Unified Rich Content Editor state management

import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { JSONContent } from '@tiptap/react';
import type {
  EditorStore,
  RichContentBlock,
  Point,
  Size,
  SafeZoneConfig,
  GridConfig,
  AutoResizeConfig,
} from '@/types/unified-editor';

// ============================================================================
// THEME TYPES (Added locally to avoid import issues)
// ============================================================================

interface ThemeState {
  mode: 'light' | 'dark';
  customColors: Record<string, string>;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

const DEFAULT_SAFE_ZONE_CONFIG: SafeZoneConfig = {
  HANDLE_WIDTH: 8,
  RESIZE_CORNER_SIZE: 12,
  SAFE_ZONE_PADDING: 4,
  HOVER_THRESHOLD: 2,
  SELECTION_OUTLINE: 2,
  FOCUS_RING_WIDTH: 2,
  MIN_DRAG_DISTANCE: 4,
  DOUBLE_CLICK_THRESHOLD: 300,
  LONG_PRESS_THRESHOLD: 500,
};

const DEFAULT_GRID_CONFIG: GridConfig = {
  enabled: true,
  size: 20,
  subdivisions: 4,
  snapThreshold: 10,
  visualStyle: 'dots',
  opacity: 0.3,
  color: 'var(--color-border-subtle)',
};

const DEFAULT_AUTO_RESIZE_CONFIG: AutoResizeConfig = {
  direction: 'down',
  minHeight: 80,
  maxHeight: 2000,
  contentPadding: 16,
  debounceMs: 150,
  animationDuration: 200,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const generateBlockId = (): string => {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createDefaultBlock = (position: Point, content?: JSONContent): RichContentBlock => {
  const defaultContent: JSONContent = content || {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '',
          },
        ],
      },
    ],
  };

  return {
    id: generateBlockId(),
    type: 'richText',
    position,
    dimensions: { width: 400, height: 200 },
    content: {
      tiptapJSON: defaultContent,
      htmlContent: '<p></p>',
    },
    styling: {
      backgroundColor: '--color-editor-bg', // Token reference
      borderColor: '--color-editor-border',
      borderWidth: 1,
      borderRadius: 8,
      padding: { x: 16, y: 16 },
      opacity: 1,
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    },
  };
};

const calculateCanvasCenter = (): Point => {
  // Calculate center of viewport for new block placement
  const viewport = {
    width: window.innerWidth - 300, // Account for sidebar
    height: window.innerHeight - 100, // Account for header
  };

  return {
    x: viewport.width / 2 - 200, // Center minus half block width
    y: viewport.height / 2 - 100, // Center minus half block height
  };
};

// ============================================================================
// ZUSTAND STORE IMPLEMENTATION
// ============================================================================

export const useUnifiedEditorStore = create<EditorStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Canvas State
        canvas: {
          zoom: 1,
          viewport: { x: 0, y: 0 },
          gridEnabled: true,
          snapToGrid: true,
          gridSize: 20,
        },

        // Block Management
        blocks: [],
        selection: {
          primary: null,
          secondary: [],
          selectionRect: null,
          lastSelected: null,
        },
        interaction: {
          focusedBlockId: null,
          activeEditor: {
            blockId: null,
            selection: null,
            contextualFeatures: [],
          },
        },

        // Theme State
        theme: {
          mode: 'light',
          customColors: {},
        },

        // Toolbar State
        toolbar: {
          visible: false,
          position: { x: 0, y: 0 },
          features: [],
          currentContext: null,
        },

        // Configuration
        config: {
          safeZone: DEFAULT_SAFE_ZONE_CONFIG,
          grid: DEFAULT_GRID_CONFIG,
          autoResize: DEFAULT_AUTO_RESIZE_CONFIG,
        },

        // Actions
        actions: {
          // ================================================================
          // BLOCK OPERATIONS
          // ================================================================

          createBlock: (position: Point, content?: JSONContent): string => {
            const block = createDefaultBlock(position, content);

            set(state => {
              state.blocks.push(block);
            });

            return block.id;
          },

          updateBlock: (id: string, updates: Partial<RichContentBlock>) => {
            set(state => {
              const blockIndex = state.blocks.findIndex(b => b.id === id);
              if (blockIndex !== -1) {
                const block = state.blocks[blockIndex];
                Object.assign(block, updates);
                block.metadata = {
                  ...block.metadata,
                  updatedAt: new Date(),
                  version: block.metadata.version + 1,
                };
              }
            });
          },

          deleteBlock: (id: string) => {
            set(state => {
              // Remove from blocks array
              state.blocks = state.blocks.filter(b => b.id !== id);

              // Clean up selection state
              if (state.selection.primary === id) {
                state.selection.primary = null;
              }
              state.selection.secondary = state.selection.secondary.filter(
                blockId => blockId !== id
              );

              // Clean up interaction state
              if (state.interaction.focusedBlockId === id) {
                state.interaction.focusedBlockId = null;
              }
              if (state.interaction.activeEditor.blockId === id) {
                state.interaction.activeEditor.blockId = null;
                state.interaction.activeEditor.selection = null;
                state.interaction.activeEditor.contextualFeatures = [];
              }
            });
          },

          duplicateBlock: (id: string): string => {
            const { blocks } = get();
            const originalBlock = blocks.find(b => b.id === id);

            if (!originalBlock) return '';

            const duplicatedBlock = createDefaultBlock(
              {
                x: originalBlock.position.x + 20,
                y: originalBlock.position.y + 20,
              },
              originalBlock.content.tiptapJSON
            );

            // Copy styling from original
            duplicatedBlock.styling = { ...originalBlock.styling };
            duplicatedBlock.dimensions = { ...originalBlock.dimensions };

            set(state => {
              state.blocks.push(duplicatedBlock);
            });

            return duplicatedBlock.id;
          },

          // ================================================================
          // SELECTION OPERATIONS
          // ================================================================

          selectBlock: (id: string, options = {}) => {
            const { multiSelect = false, rangeSelect = false } = options;

            set(state => {
              if (!multiSelect && !rangeSelect) {
                // Single selection - clear others
                state.selection.primary = id;
                state.selection.secondary = [];
              } else if (multiSelect) {
                // Multi-select - add to selection
                if (state.selection.primary === null) {
                  state.selection.primary = id;
                } else if (
                  state.selection.primary !== id &&
                  !state.selection.secondary.includes(id)
                ) {
                  state.selection.secondary.push(id);
                }
              } else if (rangeSelect && state.selection.lastSelected) {
                // Range selection - select all blocks between last and current
                const allBlocks = state.blocks;
                const startIndex = allBlocks.findIndex(b => b.id === state.selection.lastSelected);
                const endIndex = allBlocks.findIndex(b => b.id === id);

                if (startIndex !== -1 && endIndex !== -1) {
                  const minIndex = Math.min(startIndex, endIndex);
                  const maxIndex = Math.max(startIndex, endIndex);

                  // Clear current selection
                  state.selection.primary = null;
                  state.selection.secondary = [];

                  // Select range
                  for (let i = minIndex; i <= maxIndex; i++) {
                    const blockId = allBlocks[i].id;
                    if (state.selection.primary === null) {
                      state.selection.primary = blockId;
                    } else {
                      state.selection.secondary.push(blockId);
                    }
                  }
                }
              }

              state.selection.lastSelected = id;
            });
          },

          focusBlock: (id: string) => {
            set(state => {
              state.interaction.focusedBlockId = id;
              state.interaction.activeEditor.blockId = id;
            });
          },

          clearSelection: () => {
            set(state => {
              state.selection.primary = null;
              state.selection.secondary = [];
              state.selection.selectionRect = null;
              state.selection.lastSelected = null;
            });
          },

          // ================================================================
          // CONTENT OPERATIONS
          // ================================================================

          updateContent: (blockId: string, content: JSONContent) => {
            set(state => {
              const block = state.blocks.find(b => b.id === blockId);
              if (block) {
                block.content.tiptapJSON = content;
                // Note: htmlContent would be updated by TipTap editor's getHTML()
                block.metadata = {
                  ...block.metadata,
                  updatedAt: new Date(),
                  version: block.metadata.version + 1,
                };
              }
            });
          },

          applyFormatting: (blockId: string, formatting: any) => {
            // This would be handled by TipTap editor commands
            // Implementation depends on specific formatting type
            console.log('Apply formatting:', blockId, formatting);
          },

          // ================================================================
          // CANVAS OPERATIONS
          // ================================================================

          setZoom: (zoom: number) => {
            set(state => {
              state.canvas.zoom = Math.max(0.1, Math.min(3, zoom));
            });
          },

          setViewport: (viewport: Point) => {
            set(state => {
              state.canvas.viewport = viewport;
            });
          },

          toggleGrid: () => {
            set(state => {
              state.canvas.gridEnabled = !state.canvas.gridEnabled;
            });
          },

          // ================================================================
          // THEME OPERATIONS
          // ================================================================

          setTheme: (mode: 'light' | 'dark') => {
            set(state => {
              state.theme.mode = mode;
            });
          },

          updateCustomColor: (key: string, value: string) => {
            set(state => {
              state.theme.customColors[key] = value;
            });
          },

          // ================================================================
          // EDITOR OPERATIONS
          // ================================================================

          blurBlock: () => {
            set(state => {
              state.interaction.focusedBlockId = null;
              state.interaction.activeEditor.blockId = null;
              state.interaction.activeEditor.selection = null;
              state.interaction.activeEditor.contextualFeatures = [];
            });
          },

          resetEditor: () => {
            set(state => {
              // Reset to initial state
              state.blocks = [];
              state.selection = {
                primary: null,
                secondary: [],
                selectionRect: null,
                lastSelected: null,
              };
              state.canvas = {
                zoom: 1,
                viewport: { x: 0, y: 0 },
                gridEnabled: true,
                snapToGrid: true,
                gridSize: 20,
              };
              state.interaction = {
                focusedBlockId: null,
                activeEditor: {
                  blockId: null,
                  selection: null,
                  contextualFeatures: [],
                },
              };
              state.theme = {
                mode: 'light',
                customColors: {},
              };
              state.toolbar = {
                visible: false,
                position: { x: 0, y: 0 },
                features: [],
                currentContext: null,
              };
            });
          },
        },
      }))
    ),
    {
      name: 'unified-editor-store',
      partialize: state => ({
        // Only persist certain parts of the state
        theme: state.theme,
        canvas: {
          gridEnabled: state.canvas.gridEnabled,
          snapToGrid: state.canvas.snapToGrid,
          gridSize: state.canvas.gridSize,
        },
      }),
    }
  )
);

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

// Hook for accessing only actions (prevents unnecessary re-renders)
export const useEditorActions = () => useUnifiedEditorStore(state => state.actions);

// Hook for accessing canvas state
export const useCanvasState = () => useUnifiedEditorStore(state => state.canvas);

// Hook for accessing blocks
export const useBlocks = () => useUnifiedEditorStore(state => state.blocks);

// Hook for accessing selection state
export const useSelection = () => useUnifiedEditorStore(state => state.selection);

// Hook for accessing theme state
export const useTheme = () => useUnifiedEditorStore(state => state.theme);

// Hook for accessing specific block by ID
export const useBlock = (id: string) =>
  useUnifiedEditorStore(state => state.blocks.find(block => block.id === id));

// Hook for checking if block is selected
export const useIsBlockSelected = (id: string) =>
  useUnifiedEditorStore(
    state => state.selection.primary === id || state.selection.secondary.includes(id)
  );

// Hook for getting focused block
export const useFocusedBlock = () =>
  useUnifiedEditorStore(state => {
    const focusedId = state.interaction.focusedBlockId;
    return focusedId ? state.blocks.find(b => b.id === focusedId) : null;
  });
