// ABOUTME: Comprehensive test suite for EditorStore state management with TDD coverage

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEditorStore } from './editorStore';
import { generateNodeId, getDefaultDataForBlockType } from '@/types/editor';

// Mock the debounce function
vi.mock('lodash-es', () => ({
  debounce: (fn: (...args: any[]) => any) => fn
}));

// Mock crypto.randomUUID with proper UUID format and incrementing counter
let uuidCounter = 0;
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => {
      const counter = (++uuidCounter).toString(16).padStart(8, '0');
      return `550e8400-e29b-41d4-a716-${counter}40000`;
    }
  }
});

// Also mock Math.random for the fallback UUID generation
const originalMathRandom = Math.random;
let randomCallCount = 0;
Math.random = () => {
  // Provide predictable values for testing
  return (0.1 + (randomCallCount++ % 10) * 0.05);
};

describe('EditorStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useEditorStore.getState().reset();
    // Reset UUID counter for predictable test results
    uuidCounter = 0;
    randomCallCount = 0;
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useEditorStore.getState();
      
      expect(state.reviewId).toBe(null);
      expect(state.title).toBe('');
      expect(state.description).toBe('');
      expect(state.nodes).toEqual([]);
      expect(state.selectedNodeId).toBe(null);
      expect(state.currentViewport).toBe('desktop');
      expect(state.isDirty).toBe(false);
      expect(state.isSaving).toBe(false);
      expect(state.lastSaved).toBe(null);
      expect(state.clipboardData).toBe(null);
      expect(state.history).toEqual([]);
      expect(state.historyIndex).toBe(-1);
    });

    it('should have correct initial layouts', () => {
      const state = useEditorStore.getState();
      
      expect(state.layouts.desktop.gridSettings.columns).toBe(12);
      expect(state.layouts.desktop.items).toEqual([]);
      expect(state.layouts.mobile.gridSettings.columns).toBe(4);
      expect(state.layouts.mobile.items).toEqual([]);
    });

    it('should have correct initial canvas transform', () => {
      const state = useEditorStore.getState();
      
      expect(state.canvasTransform).toEqual({
        x: 0,
        y: 0,
        zoom: 1
      });
    });
  });

  describe('Node Management', () => {
    describe('addNode', () => {
      it('should add a new node with auto-generated ID', () => {
        const { addNode } = useEditorStore.getState();
        
        addNode({
          type: 'textBlock',
          data: { htmlContent: 'Test content' }
        });
        
        const state = useEditorStore.getState();
        expect(state.nodes).toHaveLength(1);
        expect(state.nodes[0].id).toMatch(/^550e8400-e29b-41d4-a716-[0-9a-f]{8}40000$/);
        expect(state.nodes[0].type).toBe('textBlock');
        expect(state.nodes[0].data.htmlContent).toBe('Test content');
        expect(state.selectedNodeId).toBe(state.nodes[0].id);
        expect(state.isDirty).toBe(true);
      });

      it('should add node with default data when no data provided', () => {
        const { addNode } = useEditorStore.getState();
        
        addNode({ type: 'headingBlock' });
        
        const state = useEditorStore.getState();
        const node = state.nodes[0];
        expect(node.data).toEqual(getDefaultDataForBlockType('headingBlock'));
      });

      it('should handle multiple node types correctly', () => {
        const { addNode } = useEditorStore.getState();
        
        addNode({ type: 'textBlock' });
        addNode({ type: 'imageBlock' });
        addNode({ type: 'tableBlock' });
        
        const state = useEditorStore.getState();
        expect(state.nodes).toHaveLength(3);
        expect(state.nodes[0].type).toBe('textBlock');
        expect(state.nodes[1].type).toBe('imageBlock');
        expect(state.nodes[2].type).toBe('tableBlock');
      });
    });

    describe('updateNode', () => {
      it('should update existing node data', () => {
        const { addNode, updateNode } = useEditorStore.getState();
        
        addNode({ type: 'textBlock', data: { htmlContent: 'Original' } });
        const nodeId = useEditorStore.getState().nodes[0].id;
        
        updateNode(nodeId, {
          data: { htmlContent: 'Updated', fontSize: 18 }
        });
        
        const state = useEditorStore.getState();
        expect(state.nodes[0].data.htmlContent).toBe('Updated');
        expect(state.nodes[0].data.fontSize).toBe(18);
        expect(state.isDirty).toBe(true);
      });

      it('should preserve node ID when updating', () => {
        const { addNode, updateNode } = useEditorStore.getState();
        
        addNode({ type: 'textBlock' });
        const originalId = useEditorStore.getState().nodes[0].id;
        
        updateNode(originalId, { data: { htmlContent: 'Updated' } });
        
        const state = useEditorStore.getState();
        expect(state.nodes[0].id).toBe(originalId);
      });

      it('should not update non-existent node', () => {
        const { updateNode } = useEditorStore.getState();
        
        updateNode('non-existent-id', { data: { htmlContent: 'Test' } });
        
        const state = useEditorStore.getState();
        expect(state.nodes).toHaveLength(0);
        expect(state.isDirty).toBe(false);
      });
    });

    describe('deleteNode', () => {
      it('should delete existing node', () => {
        const { addNode, deleteNode } = useEditorStore.getState();
        
        addNode({ type: 'textBlock' });
        const nodeId = useEditorStore.getState().nodes[0].id;
        
        deleteNode(nodeId);
        
        const state = useEditorStore.getState();
        expect(state.nodes).toHaveLength(0);
        expect(state.isDirty).toBe(true);
      });

      it('should clear selection when deleting selected node', () => {
        const { addNode, deleteNode, selectNode } = useEditorStore.getState();
        
        addNode({ type: 'textBlock' });
        const nodeId = useEditorStore.getState().nodes[0].id;
        selectNode(nodeId);
        
        deleteNode(nodeId);
        
        const state = useEditorStore.getState();
        expect(state.selectedNodeId).toBe(null);
      });

      it('should remove node from all layouts when deleting', () => {
        const { addNode, deleteNode, updateLayout } = useEditorStore.getState();
        
        addNode({ type: 'textBlock' });
        const nodeId = useEditorStore.getState().nodes[0].id;
        
        // Add to desktop layout
        updateLayout(nodeId, { nodeId, x: 0, y: 0, w: 6, h: 2 }, 'desktop');
        
        deleteNode(nodeId);
        
        const state = useEditorStore.getState();
        expect(state.layouts.desktop.items).toHaveLength(0);
        expect(state.layouts.mobile.items).toHaveLength(0);
      });
    });

    describe('duplicateNode', () => {
      it('should create duplicate with new ID', () => {
        const { addNode, duplicateNode } = useEditorStore.getState();
        
        addNode({ type: 'textBlock', data: { htmlContent: 'Original' } });
        const originalId = useEditorStore.getState().nodes[0].id;
        
        duplicateNode(originalId);
        
        const state = useEditorStore.getState();
        expect(state.nodes).toHaveLength(2);
        expect(state.nodes[1].id).not.toBe(originalId);
        expect(state.nodes[1].type).toBe('textBlock');
        expect(state.nodes[1].data.htmlContent).toBe('Original');
      });

      it('should not duplicate non-existent node', () => {
        const { duplicateNode } = useEditorStore.getState();
        
        duplicateNode('non-existent-id');
        
        const state = useEditorStore.getState();
        expect(state.nodes).toHaveLength(0);
      });
    });
  });

  describe('Layout Management', () => {
    describe('updateLayout', () => {
      it('should add new layout item for node', () => {
        const { addNode, updateLayout } = useEditorStore.getState();
        
        addNode({ type: 'textBlock' });
        const nodeId = useEditorStore.getState().nodes[0].id;
        
        updateLayout(nodeId, { x: 0, y: 0, w: 6, h: 2 }, 'desktop');
        
        const state = useEditorStore.getState();
        expect(state.layouts.desktop.items).toHaveLength(1);
        expect(state.layouts.desktop.items[0]).toEqual({
          nodeId,
          x: 0,
          y: 0,
          w: 6,
          h: 2
        });
        expect(state.isDirty).toBe(true);
      });

      it('should update existing layout item', () => {
        const { addNode, updateLayout } = useEditorStore.getState();
        
        addNode({ type: 'textBlock' });
        const nodeId = useEditorStore.getState().nodes[0].id;
        
        updateLayout(nodeId, { x: 0, y: 0, w: 6, h: 2 }, 'desktop');
        updateLayout(nodeId, { x: 6, y: 0, w: 6, h: 3 }, 'desktop');
        
        const state = useEditorStore.getState();
        expect(state.layouts.desktop.items).toHaveLength(1);
        expect(state.layouts.desktop.items[0]).toEqual({
          nodeId,
          x: 6,
          y: 0,
          w: 6,
          h: 3
        });
      });

      it('should handle different viewports independently', () => {
        const { addNode, updateLayout } = useEditorStore.getState();
        
        addNode({ type: 'textBlock' });
        const nodeId = useEditorStore.getState().nodes[0].id;
        
        updateLayout(nodeId, { x: 0, y: 0, w: 12, h: 2 }, 'desktop');
        updateLayout(nodeId, { x: 0, y: 0, w: 4, h: 3 }, 'mobile');
        
        const state = useEditorStore.getState();
        expect(state.layouts.desktop.items[0].w).toBe(12);
        expect(state.layouts.mobile.items[0].w).toBe(4);
      });
    });
  });

  describe('Selection Management', () => {
    describe('selectNode', () => {
      it('should select existing node', () => {
        const { addNode, selectNode } = useEditorStore.getState();
        
        addNode({ type: 'textBlock' });
        const nodeId = useEditorStore.getState().nodes[0].id;
        
        selectNode(nodeId);
        
        const state = useEditorStore.getState();
        expect(state.selectedNodeId).toBe(nodeId);
      });

      it('should allow deselecting by passing null', () => {
        const { addNode, selectNode } = useEditorStore.getState();
        
        addNode({ type: 'textBlock' });
        const nodeId = useEditorStore.getState().nodes[0].id;
        selectNode(nodeId);
        
        selectNode(null);
        
        const state = useEditorStore.getState();
        expect(state.selectedNodeId).toBe(null);
      });
    });
  });

  describe('Viewport Management', () => {
    describe('switchViewport', () => {
      it('should switch to mobile viewport', () => {
        const { switchViewport } = useEditorStore.getState();
        
        switchViewport('mobile');
        
        const state = useEditorStore.getState();
        expect(state.currentViewport).toBe('mobile');
      });

      it('should switch back to desktop viewport', () => {
        const { switchViewport } = useEditorStore.getState();
        
        switchViewport('mobile');
        switchViewport('desktop');
        
        const state = useEditorStore.getState();
        expect(state.currentViewport).toBe('desktop');
      });
    });

    describe('updateCanvasTransform', () => {
      it('should update canvas transform properties', () => {
        const { updateCanvasTransform } = useEditorStore.getState();
        
        updateCanvasTransform({ x: 100, zoom: 1.5 });
        
        const state = useEditorStore.getState();
        expect(state.canvasTransform).toEqual({
          x: 100,
          y: 0,
          zoom: 1.5
        });
      });

      it('should merge with existing transform properties', () => {
        const { updateCanvasTransform } = useEditorStore.getState();
        
        updateCanvasTransform({ x: 50, y: 75 });
        updateCanvasTransform({ zoom: 2.0 });
        
        const state = useEditorStore.getState();
        expect(state.canvasTransform).toEqual({
          x: 50,
          y: 75,
          zoom: 2.0
        });
      });
    });
  });

  describe('Clipboard Operations', () => {
    describe('copyNodes', () => {
      it('should copy specified nodes to clipboard', () => {
        const { addNode, copyNodes } = useEditorStore.getState();
        
        addNode({ type: 'textBlock', data: { htmlContent: 'Text 1' } });
        addNode({ type: 'headingBlock', data: { htmlContent: 'Heading 1', level: 1 } });
        
        const state1 = useEditorStore.getState();
        const nodeIds = state1.nodes.map(n => n.id);
        
        copyNodes(nodeIds);
        
        const state2 = useEditorStore.getState();
        expect(state2.clipboardData).toHaveLength(2);
        expect(state2.clipboardData![0].type).toBe('textBlock');
        expect(state2.clipboardData![1].type).toBe('headingBlock');
      });

      it('should handle copying non-existent nodes', () => {
        const { copyNodes } = useEditorStore.getState();
        
        copyNodes(['non-existent-1', 'non-existent-2']);
        
        const state = useEditorStore.getState();
        expect(state.clipboardData).toEqual([]);
      });
    });

    describe('pasteNodes', () => {
      it('should paste copied nodes with new IDs', () => {
        const { addNode, copyNodes, pasteNodes } = useEditorStore.getState();
        
        addNode({ type: 'textBlock', data: { htmlContent: 'Original' } });
        const originalId = useEditorStore.getState().nodes[0].id;
        
        copyNodes([originalId]);
        pasteNodes();
        
        const state = useEditorStore.getState();
        expect(state.nodes).toHaveLength(2);
        expect(state.nodes[1].id).not.toBe(originalId);
        expect(state.nodes[1].data.htmlContent).toBe('Original');
      });

      it('should do nothing when clipboard is empty', () => {
        const { pasteNodes } = useEditorStore.getState();
        
        pasteNodes();
        
        const state = useEditorStore.getState();
        expect(state.nodes).toHaveLength(0);
      });
    });
  });

  describe('Data Persistence', () => {
    describe('loadFromJSON', () => {
      it('should load valid structured content', () => {
        const { loadFromJSON } = useEditorStore.getState();
        
        const validContent = {
          version: '2.0.0' as const,
          nodes: [
            {
              id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format
              type: 'textBlock' as const,
              data: { htmlContent: 'Test content' }
            }
          ],
          layouts: {
            desktop: {
              gridSettings: { columns: 12 },
              items: []
            },
            mobile: {
              gridSettings: { columns: 4 },
              items: []
            }
          }
        };
        
        loadFromJSON(validContent);
        
        const state = useEditorStore.getState();
        expect(state.nodes).toHaveLength(1);
        expect(state.nodes[0].id).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(state.nodes[0].data.htmlContent).toBe('Test content');
        expect(state.isDirty).toBe(false);
      });

      it('should throw error for invalid content', () => {
        const { loadFromJSON } = useEditorStore.getState();
        
        const invalidContent = {
          version: '1.0.0', // Wrong version
          nodes: []
        };
        
        expect(() => loadFromJSON(invalidContent as any)).toThrow();
      });
    });

    describe('exportToJSON', () => {
      it('should export current state as structured content', () => {
        const { addNode, exportToJSON } = useEditorStore.getState();
        
        addNode({ type: 'textBlock', data: { htmlContent: 'Export test' } });
        
        const exported = exportToJSON();
        
        expect(exported.version).toBe('2.0.0');
        expect(exported.nodes).toHaveLength(1);
        expect(exported.nodes[0].data.htmlContent).toBe('Export test');
        expect(exported.layouts).toBeDefined();
        expect(exported.metadata).toBeDefined();
      });
    });
  });

  describe('Utility Functions', () => {
    describe('reset', () => {
      it('should reset all state to initial values', () => {
        const { addNode, selectNode, switchViewport, reset } = useEditorStore.getState();
        
        // Modify state
        addNode({ type: 'textBlock' });
        selectNode(useEditorStore.getState().nodes[0].id);
        switchViewport('mobile');
        
        reset();
        
        const state = useEditorStore.getState();
        expect(state.nodes).toEqual([]);
        expect(state.selectedNodeId).toBe(null);
        expect(state.currentViewport).toBe('desktop');
        expect(state.isDirty).toBe(false);
      });
    });
  });
});