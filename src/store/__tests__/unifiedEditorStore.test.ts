// ABOUTME: TDD tests for unified editor Zustand store state management and actions

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useUnifiedEditorStore,
  useEditorActions,
  useBlocks,
  useCanvasState,
} from '../unifiedEditorStore';
import type { JSONContent } from '@tiptap/react';
import type { Point, Size } from '@/types/unified-editor';

describe('UnifiedEditorStore - State Management', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useUnifiedEditorStore.getState().actions.resetEditor();
    });
  });

  describe('🔴 TDD: Store Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useUnifiedEditorStore());
      const state = result.current;

      expect(state.blocks).toEqual([]);
      expect(state.selection).toEqual({
        primary: null,
        secondary: [],
        selectionRect: null,
        lastSelected: null,
      });
      expect(state.canvas).toEqual({
        zoom: 1,
        viewport: { x: 0, y: 0 },
        gridEnabled: true,
        snapToGrid: true,
        gridSize: 20,
      });
      expect(state.interaction).toEqual({
        focusedBlockId: null,
        activeEditor: {
          blockId: null,
          selection: null,
          contextualFeatures: [],
        },
      });
    });

    it('should provide editor actions hook', () => {
      const { result } = renderHook(() => useEditorActions());
      const actions = result.current;

      expect(typeof actions.createBlock).toBe('function');
      expect(typeof actions.deleteBlock).toBe('function');
      expect(typeof actions.updateBlock).toBe('function');
      expect(typeof actions.selectBlock).toBe('function');
      expect(typeof actions.clearSelection).toBe('function');
    });
  });

  describe('🔴 TDD: Block Management', () => {
    it('should create a new block with default content', () => {
      const { result: blocksResult } = renderHook(() => useBlocks());
      const { result: actionsResult } = renderHook(() => useEditorActions());

      const position: Point = { x: 100, y: 200 };

      act(() => {
        actionsResult.current.createBlock(position);
      });

      const blocks = blocksResult.current;
      expect(blocks).toHaveLength(1);
      expect(blocks[0].position).toEqual(position);
      expect(blocks[0].dimensions).toEqual({ width: 400, height: 200 });
      expect(blocks[0].content.tiptapJSON).toEqual({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '' }],
          },
        ],
      });
    });

    it('should create a block with custom TipTap content', () => {
      const { result: blocksResult } = renderHook(() => useBlocks());
      const { result: actionsResult } = renderHook(() => useEditorActions());

      const position: Point = { x: 50, y: 100 };
      const customContent: JSONContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Custom content' }],
          },
        ],
      };

      act(() => {
        actionsResult.current.createBlock(position, customContent);
      });

      const blocks = blocksResult.current;
      expect(blocks).toHaveLength(1);
      expect(blocks[0].content.tiptapJSON).toEqual(customContent);
    });

    it('should update block content', () => {
      const { result: blocksResult } = renderHook(() => useBlocks());
      const { result: actionsResult } = renderHook(() => useEditorActions());

      // Create a block first
      let blockId: string;
      act(() => {
        blockId = actionsResult.current.createBlock({ x: 0, y: 0 });
      });

      const newContent: JSONContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Updated content' }],
          },
        ],
      };

      act(() => {
        actionsResult.current.updateContent(blockId, newContent);
      });

      const blocks = blocksResult.current;
      expect(blocks[0].content.tiptapJSON).toEqual(newContent);
      expect(blocks[0].metadata.updatedAt).toBeInstanceOf(Date);
    });

    it('should update block position and dimensions', () => {
      const { result: blocksResult } = renderHook(() => useBlocks());
      const { result: actionsResult } = renderHook(() => useEditorActions());

      // Create a block first
      let blockId: string;
      act(() => {
        blockId = actionsResult.current.createBlock({ x: 0, y: 0 });
      });

      const newPosition: Point = { x: 150, y: 250 };
      const newDimensions: Size = { width: 500, height: 300 };

      act(() => {
        actionsResult.current.updateBlock(blockId, {
          position: newPosition,
          dimensions: newDimensions,
        });
      });

      const blocks = blocksResult.current;
      expect(blocks[0].position).toEqual(newPosition);
      expect(blocks[0].dimensions).toEqual(newDimensions);
    });

    it('should delete a block', () => {
      const { result: blocksResult } = renderHook(() => useBlocks());
      const { result: actionsResult } = renderHook(() => useEditorActions());

      // Create two blocks
      let blockId1: string, blockId2: string;
      act(() => {
        blockId1 = actionsResult.current.createBlock({ x: 0, y: 0 });
        blockId2 = actionsResult.current.createBlock({ x: 100, y: 100 });
      });

      expect(blocksResult.current).toHaveLength(2);

      // Delete first block
      act(() => {
        actionsResult.current.deleteBlock(blockId1);
      });

      const remainingBlocks = blocksResult.current;
      expect(remainingBlocks).toHaveLength(1);
      expect(remainingBlocks[0].id).toBe(blockId2);
    });

    it('should duplicate a block', () => {
      const { result: blocksResult } = renderHook(() => useBlocks());
      const { result: actionsResult } = renderHook(() => useEditorActions());

      // Create a block with custom content
      const customContent: JSONContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Original content' }],
          },
        ],
      };

      let originalBlockId: string;
      act(() => {
        originalBlockId = actionsResult.current.createBlock({ x: 100, y: 100 }, customContent);
      });

      // Duplicate the block
      act(() => {
        actionsResult.current.duplicateBlock(originalBlockId);
      });

      const blocks = blocksResult.current;
      expect(blocks).toHaveLength(2);

      // Check that content is duplicated but IDs are different
      expect(blocks[0].content.tiptapJSON).toEqual(blocks[1].content.tiptapJSON);
      expect(blocks[0].id).not.toBe(blocks[1].id);

      // Check that position is offset for the duplicate
      expect(blocks[1].position.x).toBe(blocks[0].position.x + 20);
      expect(blocks[1].position.y).toBe(blocks[0].position.y + 20);
    });
  });

  describe('🔴 TDD: Selection Management', () => {
    it('should select a single block', () => {
      const { result: storeResult } = renderHook(() => useUnifiedEditorStore());
      const { result: actionsResult } = renderHook(() => useEditorActions());

      // Create a block first
      let blockId: string;
      act(() => {
        blockId = actionsResult.current.createBlock({ x: 0, y: 0 });
      });

      // Select the block
      act(() => {
        actionsResult.current.selectBlock(blockId);
      });

      const selection = storeResult.current.selection;
      expect(selection.primary).toBe(blockId);
      expect(selection.secondary).toEqual([]);
    });

    it('should support multi-selection', () => {
      const { result: storeResult } = renderHook(() => useUnifiedEditorStore());
      const { result: actionsResult } = renderHook(() => useEditorActions());

      // Create multiple blocks
      let blockId1: string, blockId2: string, blockId3: string;
      act(() => {
        blockId1 = actionsResult.current.createBlock({ x: 0, y: 0 });
        blockId2 = actionsResult.current.createBlock({ x: 100, y: 100 });
        blockId3 = actionsResult.current.createBlock({ x: 200, y: 200 });
      });

      // Select first block
      act(() => {
        actionsResult.current.selectBlock(blockId1);
      });

      // Add second block to selection
      act(() => {
        actionsResult.current.selectBlock(blockId2, { multiSelect: true });
      });

      // Add third block to selection
      act(() => {
        actionsResult.current.selectBlock(blockId3, { multiSelect: true });
      });

      const selection = storeResult.current.selection;
      expect(selection.primary).toBe(blockId1);
      expect(selection.secondary).toEqual([blockId2, blockId3]);
    });

    it('should clear selection', () => {
      const { result: storeResult } = renderHook(() => useUnifiedEditorStore());
      const { result: actionsResult } = renderHook(() => useEditorActions());

      // Create and select blocks
      let blockId1: string, blockId2: string;
      act(() => {
        blockId1 = actionsResult.current.createBlock({ x: 0, y: 0 });
        blockId2 = actionsResult.current.createBlock({ x: 100, y: 100 });
        actionsResult.current.selectBlock(blockId1);
        actionsResult.current.selectBlock(blockId2, { multiSelect: true });
      });

      // Verify selection exists
      expect(storeResult.current.selection.primary).toBeTruthy();

      // Clear selection
      act(() => {
        actionsResult.current.clearSelection();
      });

      const selection = storeResult.current.selection;
      expect(selection.primary).toBeNull();
      expect(selection.secondary).toEqual([]);
    });

    it('should focus a block', () => {
      const { result: storeResult } = renderHook(() => useUnifiedEditorStore());
      const { result: actionsResult } = renderHook(() => useEditorActions());

      // Create a block
      let blockId: string;
      act(() => {
        blockId = actionsResult.current.createBlock({ x: 0, y: 0 });
      });

      // Focus the block
      act(() => {
        actionsResult.current.focusBlock(blockId);
      });

      expect(storeResult.current.interaction.focusedBlockId).toBe(blockId);
    });

    it('should blur focused block', () => {
      const { result: storeResult } = renderHook(() => useUnifiedEditorStore());
      const { result: actionsResult } = renderHook(() => useEditorActions());

      // Create and focus a block
      let blockId: string;
      act(() => {
        blockId = actionsResult.current.createBlock({ x: 0, y: 0 });
        actionsResult.current.focusBlock(blockId);
      });

      expect(storeResult.current.interaction.focusedBlockId).toBe(blockId);

      // Blur the block
      act(() => {
        actionsResult.current.blurBlock();
      });

      expect(storeResult.current.interaction.focusedBlockId).toBeNull();
    });
  });

  describe('🔴 TDD: Canvas Management', () => {
    it('should update canvas zoom', () => {
      const { result: canvasResult } = renderHook(() => useCanvasState());
      const { result: actionsResult } = renderHook(() => useEditorActions());

      act(() => {
        actionsResult.current.setZoom(1.5);
      });

      expect(canvasResult.current.zoom).toBe(1.5);
    });

    it('should constrain zoom within bounds', () => {
      const { result: canvasResult } = renderHook(() => useCanvasState());
      const { result: actionsResult } = renderHook(() => useEditorActions());

      // Test minimum zoom
      act(() => {
        actionsResult.current.setZoom(0.05); // Below minimum
      });
      expect(canvasResult.current.zoom).toBe(0.1); // Should be clamped to minimum

      // Test maximum zoom
      act(() => {
        actionsResult.current.setZoom(5); // Above maximum
      });
      expect(canvasResult.current.zoom).toBe(3); // Should be clamped to maximum
    });

    it('should update viewport position', () => {
      const { result: canvasResult } = renderHook(() => useCanvasState());
      const { result: actionsResult } = renderHook(() => useEditorActions());

      const newViewport: Point = { x: -100, y: -200 };

      act(() => {
        actionsResult.current.setViewport(newViewport);
      });

      expect(canvasResult.current.viewport).toEqual(newViewport);
    });

    it('should toggle grid visibility', () => {
      const { result: canvasResult } = renderHook(() => useCanvasState());
      const { result: actionsResult } = renderHook(() => useEditorActions());

      const initialGridState = canvasResult.current.gridEnabled;

      act(() => {
        actionsResult.current.toggleGrid();
      });

      expect(canvasResult.current.gridEnabled).toBe(!initialGridState);
    });
  });

  describe('🔴 TDD: Store Persistence', () => {
    it('should reset editor to initial state', () => {
      const { result: storeResult } = renderHook(() => useUnifiedEditorStore());
      const { result: actionsResult } = renderHook(() => useEditorActions());

      // Create some blocks and modify state
      act(() => {
        actionsResult.current.createBlock({ x: 100, y: 100 });
        actionsResult.current.createBlock({ x: 200, y: 200 });
        actionsResult.current.setZoom(2);
        actionsResult.current.setViewport({ x: -50, y: -100 });
      });

      // Verify state is modified
      expect(storeResult.current.blocks).toHaveLength(2);
      expect(storeResult.current.canvas.zoom).toBe(2);

      // Reset editor
      act(() => {
        actionsResult.current.resetEditor();
      });

      // Verify state is reset
      const state = storeResult.current;
      expect(state.blocks).toEqual([]);
      expect(state.canvas.zoom).toBe(1);
      expect(state.canvas.viewport).toEqual({ x: 0, y: 0 });
      expect(state.selection.primary).toBeNull();
      expect(state.selection.secondary).toEqual([]);
    });
  });

  describe('🔴 TDD: Error Handling', () => {
    it('should handle invalid block operations gracefully', () => {
      const { result: actionsResult } = renderHook(() => useEditorActions());

      // Attempt to delete non-existent block
      expect(() => {
        act(() => {
          actionsResult.current.deleteBlock('non-existent-id');
        });
      }).not.toThrow();

      // Attempt to update non-existent block
      expect(() => {
        act(() => {
          actionsResult.current.updateBlock('non-existent-id', {
            position: { x: 100, y: 100 },
          });
        });
      }).not.toThrow();

      // Attempt to select non-existent block
      expect(() => {
        act(() => {
          actionsResult.current.selectBlock('non-existent-id');
        });
      }).not.toThrow();
    });
  });
});
