// ABOUTME: Tests for keyboard shortcuts ensuring all editor operations work correctly

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

// Mock dependencies
const mockUseEditorStore = {
  undo: vi.fn(),
  redo: vi.fn(),
  selectedNodeId: 'test-node-1',
  nodes: [{ id: 'test-node-1', type: 'textBlock', data: {} }],
  positions: {
    'test-node-1': { id: 'test-node-1', x: 100, y: 100, width: 400, height: 120 },
  },
  deleteNode: vi.fn(),
  duplicateNode: vi.fn(),
  copyNodes: vi.fn(),
  pasteNodes: vi.fn(),
  updateNodePosition: vi.fn(),
  history: [{ version: '3.0.0', nodes: [], positions: {}, canvas: {} }],
  historyIndex: 0,
  saveToDatabase: vi.fn(),
  toggleFullscreen: vi.fn(),
  toggleInspector: vi.fn(),
  addNode: vi.fn(),
  switchViewport: vi.fn(),
  currentViewport: 'desktop',
};

const mockUseToast = {
  toast: vi.fn(),
};

vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => mockUseEditorStore,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => mockUseToast,
}));

describe('Keyboard Shortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset positions to default state
    mockUseEditorStore.positions['test-node-1'] = {
      id: 'test-node-1',
      x: 100,
      y: 100,
      width: 400,
      height: 120,
    };
  });

  describe('Arrow Key Shortcuts - Resize Operations', () => {
    it('should increase block width with Ctrl+Right Arrow', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      // Find the resize width increase shortcut
      const shortcut = result.current.shortcuts.find(s => s.id === 'resize-width-increase');

      expect(shortcut).toBeDefined();
      expect(shortcut?.keys).toEqual(['ctrl', 'arrowright']);
      expect(shortcut?.disabled).toBe(false); // Should be enabled when block is selected

      // Execute the shortcut action
      act(() => {
        shortcut?.action();
      });

      // Should call updateNodePosition with increased width
      expect(mockUseEditorStore.updateNodePosition).toHaveBeenCalledWith('test-node-1', {
        width: 420, // 400 + 20
      });

      // Should show toast notification
      expect(mockUseToast.toast).toHaveBeenCalledWith({
        title: 'Width Increased',
        description: 'Width: 420px',
        duration: 1000,
      });
    });

    it('should decrease block width with Ctrl+Left Arrow', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      const shortcut = result.current.shortcuts.find(s => s.id === 'resize-width-decrease');

      expect(shortcut).toBeDefined();
      expect(shortcut?.keys).toEqual(['ctrl', 'arrowleft']);

      act(() => {
        shortcut?.action();
      });

      expect(mockUseEditorStore.updateNodePosition).toHaveBeenCalledWith('test-node-1', {
        width: 380, // 400 - 20
      });
    });

    it('should increase block height with Ctrl+Down Arrow', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      const shortcut = result.current.shortcuts.find(s => s.id === 'resize-height-increase');

      expect(shortcut).toBeDefined();
      expect(shortcut?.keys).toEqual(['ctrl', 'arrowdown']);

      act(() => {
        shortcut?.action();
      });

      expect(mockUseEditorStore.updateNodePosition).toHaveBeenCalledWith('test-node-1', {
        height: 140, // 120 + 20
      });
    });

    it('should decrease block height with Ctrl+Up Arrow', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      const shortcut = result.current.shortcuts.find(s => s.id === 'resize-height-decrease');

      expect(shortcut).toBeDefined();
      expect(shortcut?.keys).toEqual(['ctrl', 'arrowup']);

      act(() => {
        shortcut?.action();
      });

      expect(mockUseEditorStore.updateNodePosition).toHaveBeenCalledWith('test-node-1', {
        height: 100, // 120 - 20
      });
    });

    it('should respect width limits when resizing', () => {
      // Test max width limit
      mockUseEditorStore.positions['test-node-1'].width = 790;
      const { result } = renderHook(() => useKeyboardShortcuts());

      const increaseWidthShortcut = result.current.shortcuts.find(
        s => s.id === 'resize-width-increase'
      );

      act(() => {
        increaseWidthShortcut?.action();
      });

      expect(mockUseEditorStore.updateNodePosition).toHaveBeenCalledWith('test-node-1', {
        width: 800, // Capped at max canvas width
      });

      // Test min width limit
      mockUseEditorStore.positions['test-node-1'].width = 110;
      const decreaseWidthShortcut = result.current.shortcuts.find(
        s => s.id === 'resize-width-decrease'
      );

      act(() => {
        decreaseWidthShortcut?.action();
      });

      expect(mockUseEditorStore.updateNodePosition).toHaveBeenCalledWith('test-node-1', {
        width: 100, // Capped at min width
      });
    });

    it('should respect height limits when resizing', () => {
      // Test min height limit
      mockUseEditorStore.positions['test-node-1'].height = 60;
      const { result } = renderHook(() => useKeyboardShortcuts());

      const decreaseHeightShortcut = result.current.shortcuts.find(
        s => s.id === 'resize-height-decrease'
      );

      act(() => {
        decreaseHeightShortcut?.action();
      });

      expect(mockUseEditorStore.updateNodePosition).toHaveBeenCalledWith('test-node-1', {
        height: 50, // Capped at min height
      });
    });
  });

  describe('Arrow Key Shortcuts - Move Operations', () => {
    it('should move block right with Shift+Right Arrow', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      const shortcut = result.current.shortcuts.find(s => s.id === 'move-right');

      expect(shortcut).toBeDefined();
      expect(shortcut?.keys).toEqual(['shift', 'arrowright']);

      act(() => {
        shortcut?.action();
      });

      expect(mockUseEditorStore.updateNodePosition).toHaveBeenCalledWith('test-node-1', {
        x: 110, // 100 + 10
      });
    });

    it('should move block left with Shift+Left Arrow', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      const shortcut = result.current.shortcuts.find(s => s.id === 'move-left');

      expect(shortcut).toBeDefined();
      expect(shortcut?.keys).toEqual(['shift', 'arrowleft']);

      act(() => {
        shortcut?.action();
      });

      expect(mockUseEditorStore.updateNodePosition).toHaveBeenCalledWith('test-node-1', {
        x: 90, // 100 - 10
      });
    });

    it('should move block down with Shift+Down Arrow', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      const shortcut = result.current.shortcuts.find(s => s.id === 'move-down');

      expect(shortcut).toBeDefined();
      expect(shortcut?.keys).toEqual(['shift', 'arrowdown']);

      act(() => {
        shortcut?.action();
      });

      expect(mockUseEditorStore.updateNodePosition).toHaveBeenCalledWith('test-node-1', {
        y: 110, // 100 + 10
      });
    });

    it('should move block up with Shift+Up Arrow', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      const shortcut = result.current.shortcuts.find(s => s.id === 'move-up');

      expect(shortcut).toBeDefined();
      expect(shortcut?.keys).toEqual(['shift', 'arrowup']);

      act(() => {
        shortcut?.action();
      });

      expect(mockUseEditorStore.updateNodePosition).toHaveBeenCalledWith('test-node-1', {
        y: 90, // 100 - 10
      });
    });

    it('should respect left boundary when moving', () => {
      mockUseEditorStore.positions['test-node-1'].x = 5;
      const { result } = renderHook(() => useKeyboardShortcuts());

      const moveLeftShortcut = result.current.shortcuts.find(s => s.id === 'move-left');

      act(() => {
        moveLeftShortcut?.action();
      });

      expect(mockUseEditorStore.updateNodePosition).toHaveBeenCalledWith('test-node-1', {
        x: 0, // Capped at left boundary
      });
    });

    it('should respect right boundary when moving', () => {
      mockUseEditorStore.positions['test-node-1'].x = 410; // 800 - 400 + 10
      const { result } = renderHook(() => useKeyboardShortcuts());

      const moveRightShortcut = result.current.shortcuts.find(s => s.id === 'move-right');

      act(() => {
        moveRightShortcut?.action();
      });

      expect(mockUseEditorStore.updateNodePosition).toHaveBeenCalledWith('test-node-1', {
        x: 400, // Capped at right boundary (800 - 400)
      });
    });

    it('should respect top boundary when moving', () => {
      mockUseEditorStore.positions['test-node-1'].y = 5;
      const { result } = renderHook(() => useKeyboardShortcuts());

      const moveUpShortcut = result.current.shortcuts.find(s => s.id === 'move-up');

      act(() => {
        moveUpShortcut?.action();
      });

      expect(mockUseEditorStore.updateNodePosition).toHaveBeenCalledWith('test-node-1', {
        y: 0, // Capped at top boundary
      });
    });
  });

  describe('Existing Copy/Paste/Delete Shortcuts', () => {
    it('should copy block with Ctrl+C', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      const shortcut = result.current.shortcuts.find(s => s.id === 'copy');

      expect(shortcut).toBeDefined();
      expect(shortcut?.keys).toEqual(['ctrl', 'c']);

      act(() => {
        shortcut?.action();
      });

      expect(mockUseEditorStore.copyNodes).toHaveBeenCalledWith(['test-node-1']);
    });

    it('should paste block with Ctrl+V', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      const shortcut = result.current.shortcuts.find(s => s.id === 'paste');

      expect(shortcut).toBeDefined();
      expect(shortcut?.keys).toEqual(['ctrl', 'v']);

      act(() => {
        shortcut?.action();
      });

      expect(mockUseEditorStore.pasteNodes).toHaveBeenCalled();
    });

    it('should delete block with Delete key', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      const shortcut = result.current.shortcuts.find(s => s.id === 'delete');

      expect(shortcut).toBeDefined();
      expect(shortcut?.keys).toEqual(['delete']);

      act(() => {
        shortcut?.action();
      });

      expect(mockUseEditorStore.deleteNode).toHaveBeenCalledWith('test-node-1');
    });
  });

  describe('Shortcut Disabling', () => {
    it('should disable block manipulation shortcuts when no block is selected', () => {
      mockUseEditorStore.selectedNodeId = null;

      const { result } = renderHook(() => useKeyboardShortcuts());

      const manipulationShortcuts = [
        'resize-width-increase',
        'resize-width-decrease',
        'resize-height-increase',
        'resize-height-decrease',
        'move-right',
        'move-left',
        'move-down',
        'move-up',
        'delete',
        'duplicate',
        'copy',
      ];

      manipulationShortcuts.forEach(shortcutId => {
        const shortcut = result.current.shortcuts.find(s => s.id === shortcutId);
        expect(shortcut?.disabled).toBe(true);
      });
    });

    it('should categorize shortcuts correctly', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      const editingShortcuts = result.current.shortcuts.filter(s => s.category === 'editing');
      const blockShortcuts = result.current.shortcuts.filter(s => s.category === 'blocks');
      const systemShortcuts = result.current.shortcuts.filter(s => s.category === 'system');

      // Should have the new arrow key shortcuts in editing category
      expect(editingShortcuts.length).toBeGreaterThanOrEqual(12); // 8 arrow shortcuts + existing editing shortcuts
      expect(blockShortcuts.length).toBeGreaterThanOrEqual(4); // Quick block creation shortcuts
      expect(systemShortcuts.length).toBeGreaterThanOrEqual(5); // Undo, redo, save, fullscreen, inspector, help, etc.
    });
  });
});
