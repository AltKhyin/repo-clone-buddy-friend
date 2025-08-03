// ABOUTME: Test for fixing circular reference issues in TableSelectionCoordinator state management

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TableSelectionCoordinator } from '../TableSelectionCoordinator';
import { Editor } from '@tiptap/core';
import { createTypographyCommands } from '../../../../shared/typography-commands';
import { tableComponentRegistry } from '../../tableCommands';

// Mock typography commands to avoid circular reference
vi.mock('../../../../shared/typography-commands', () => ({
  createTypographyCommands: vi.fn()
}));

describe('TableSelectionCoordinator - Circular Reference Fix', () => {
  let coordinator: TableSelectionCoordinator;
  let mockEditor: Editor;
  let mockComponent: any;

  beforeEach(() => {
    coordinator = new TableSelectionCoordinator();
    
    // Create mock editor with circular references (simulating real TipTap editor)
    mockEditor = {
      extensionManager: {
        editor: null // Will create circular reference
      },
      commands: {
        focus: vi.fn(),
        selectAll: vi.fn(),
        blur: vi.fn()
      },
      isDestroyed: false
    } as any;
    
    // Create circular reference to simulate real TipTap structure
    mockEditor.extensionManager.editor = mockEditor;
    
    // Mock typography commands that would contain the editor
    const mockTypographyCommands = {
      editor: mockEditor,
      applyProperties: vi.fn(),
      toggleBold: vi.fn(),
      toggleItalic: vi.fn()
    };
    
    vi.mocked(createTypographyCommands).mockReturnValue(mockTypographyCommands);
    
    // Mock table component
    mockComponent = {
      getFocusedCellEditor: vi.fn().mockReturnValue(mockEditor),
      addColumn: vi.fn(),
      removeColumn: vi.fn(),
      addRow: vi.fn(),
      removeRow: vi.fn()
    };
    
    // Register the mock component
    tableComponentRegistry.register('test-table', mockComponent);
  });

  it('should not throw circular reference error when focusing cell with editor', () => {
    expect(() => {
      coordinator.focusCell('test-table', { row: 0, col: 0 }, {
        editor: mockEditor,
        cellElement: document.createElement('td'),
        cellId: 'test-cell-0-0'
      });
    }).not.toThrow();
  });

  it('should not throw circular reference error when blurring cell', () => {
    // First focus a cell
    coordinator.focusCell('test-table', { row: 0, col: 0 }, {
      editor: mockEditor,
      cellElement: document.createElement('td'),
      cellId: 'test-cell-0-0'
    });

    // Then blur it - this should not throw circular reference error
    expect(() => {
      coordinator.blurCell();
    }).not.toThrow();
  });

  it('should properly emit context change events without circular reference errors', () => {
    const contextChangeSpy = vi.fn();
    coordinator.on('contextChange', contextChangeSpy);

    // Focus cell with editor (should emit contextChange)
    coordinator.focusCell('test-table', { row: 0, col: 0 }, {
      editor: mockEditor,
      cellElement: document.createElement('td'),
      cellId: 'test-cell-0-0'
    });

    // Should have called contextChange without throwing
    expect(contextChangeSpy).toHaveBeenCalled();
  });

  it('should maintain proper state even with circular references in typography commands', () => {
    coordinator.focusCell('test-table', { row: 0, col: 0 }, {
      editor: mockEditor,
      cellElement: document.createElement('td'),
      cellId: 'test-cell-0-0'
    });

    const state = coordinator.getSelectionState();
    
    expect(state.hasTableCellSelection).toBe(true);
    expect(state.selectionContext.canApplyTypography).toBe(true);
    expect(state.selectionContext.activeTypographyCommands).toBeDefined();
  });

  it('should detect context changes properly using structural comparison instead of JSON.stringify', () => {
    const contextChangeSpy = vi.fn();
    coordinator.on('contextChange', contextChangeSpy);

    // Focus first cell
    coordinator.focusCell('test-table', { row: 0, col: 0 }, {
      editor: mockEditor,
      cellElement: document.createElement('td'),
      cellId: 'test-cell-0-0'
    });

    const firstCallCount = contextChangeSpy.mock.calls.length;

    // Focus same cell again - should not trigger context change since capabilities are the same
    coordinator.focusCell('test-table', { row: 0, col: 0 }, {
      editor: mockEditor,
      cellElement: document.createElement('td'),
      cellId: 'test-cell-0-0'
    });

    // Should not have additional context change calls
    expect(contextChangeSpy.mock.calls.length).toBe(firstCallCount);

    // Clear selection with force to bypass lock - should trigger context change (capabilities change)
    coordinator.clearSelection(true);

    // Should have new context change call for capability change
    expect(contextChangeSpy.mock.calls.length).toBeGreaterThan(firstCallCount);
  });
});