// ABOUTME: Tests for intelligent selection persistence preventing inappropriate clearing of table cell selections

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TableSelectionCoordinator } from '../TableSelectionCoordinator';
import { Editor } from '@tiptap/core';
import { createTypographyCommands } from '../../../../shared/typography-commands';
import { tableComponentRegistry } from '../../tableCommands';

// Mock typography commands
vi.mock('../../../../shared/typography-commands', () => ({
  createTypographyCommands: vi.fn()
}));

describe('TableSelectionCoordinator - Intelligent Selection Persistence', () => {
  let coordinator: TableSelectionCoordinator;
  let mockEditor: Editor;
  let mockComponent: any;

  beforeEach(() => {
    coordinator = new TableSelectionCoordinator();
    
    // Create mock editor
    mockEditor = {
      commands: {
        focus: vi.fn(),
        selectAll: vi.fn(),
        blur: vi.fn()
      },
      isDestroyed: false
    } as any;
    
    // Mock typography commands
    const mockTypographyCommands = {
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

  describe('Selection Locking Mechanism', () => {
    it('should lock selection when table cell is focused', () => {
      // Initially not locked
      expect(coordinator.isSelectionLocked()).toBe(false);

      // Focus a cell
      coordinator.focusCell('test-table', { row: 0, col: 0 }, {
        editor: mockEditor,
        cellElement: document.createElement('td'),
        cellId: 'test-cell-0-0'
      });

      // Should now be locked
      expect(coordinator.isSelectionLocked()).toBe(true);
    });

    it('should prevent selection clearing when locked', () => {
      // Focus a cell (this locks selection)
      coordinator.focusCell('test-table', { row: 0, col: 0 }, {
        editor: mockEditor,
        cellElement: document.createElement('td'),
        cellId: 'test-cell-0-0'
      });

      const stateBefore = coordinator.getSelectionState();
      expect(stateBefore.hasTableCellSelection).toBe(true);

      // Try to clear selection (should be blocked)
      coordinator.clearSelection();

      const stateAfter = coordinator.getSelectionState();
      expect(stateAfter.hasTableCellSelection).toBe(true); // Should still be selected
      expect(coordinator.isSelectionLocked()).toBe(true); // Should still be locked
    });

    it('should allow forced clearing even when locked', () => {
      // Focus a cell (this locks selection)
      coordinator.focusCell('test-table', { row: 0, col: 0 }, {
        editor: mockEditor,
        cellElement: document.createElement('td'),
        cellId: 'test-cell-0-0'
      });

      expect(coordinator.isSelectionLocked()).toBe(true);

      // Force clear selection
      coordinator.clearSelection(true);

      const state = coordinator.getSelectionState();
      expect(state.hasTableCellSelection).toBe(false);
      expect(coordinator.isSelectionLocked()).toBe(false);
    });

    it('should allow manual lock and unlock operations', () => {
      // Focus a cell
      coordinator.focusCell('test-table', { row: 0, col: 0 }, {
        editor: mockEditor,
        cellElement: document.createElement('td'),
        cellId: 'test-cell-0-0'
      });

      expect(coordinator.isSelectionLocked()).toBe(true);

      // Manually unlock
      coordinator.unlockSelection();
      expect(coordinator.isSelectionLocked()).toBe(false);

      // Now clearing should work
      coordinator.clearSelection();
      expect(coordinator.getSelectionState().hasTableCellSelection).toBe(false);
    });

    it('should not lock when no cell is selected', () => {
      // Try to lock without any selection
      coordinator.lockSelection();
      expect(coordinator.isSelectionLocked()).toBe(false);
    });
  });

  describe('Intelligent Clearing Logic', () => {
    it('should clear selection when not locked', () => {
      // Focus a cell
      coordinator.focusCell('test-table', { row: 0, col: 0 }, {
        editor: mockEditor,
        cellElement: document.createElement('td'),
        cellId: 'test-cell-0-0'
      });

      // Unlock manually
      coordinator.unlockSelection();

      // Clear should work
      coordinator.clearSelection();
      expect(coordinator.getSelectionState().hasTableCellSelection).toBe(false);
    });

    it('should release lock when clearing successfully', () => {
      // Focus a cell
      coordinator.focusCell('test-table', { row: 0, col: 0 }, {
        editor: mockEditor,
        cellElement: document.createElement('td'),
        cellId: 'test-cell-0-0'
      });

      // Unlock and clear
      coordinator.unlockSelection();
      coordinator.clearSelection();

      // Lock should be released
      expect(coordinator.isSelectionLocked()).toBe(false);
    });
  });

  describe('Integration with Global Selection System', () => {
    it('should maintain typography context when selection is locked', () => {
      // Focus a cell
      coordinator.focusCell('test-table', { row: 0, col: 0 }, {
        editor: mockEditor,
        cellElement: document.createElement('td'),
        cellId: 'test-cell-0-0'
      });

      const state = coordinator.getSelectionState();
      expect(state.selectionContext.canApplyTypography).toBe(true);
      expect(state.selectionContext.activeTypographyCommands).toBeDefined();

      // Try to clear (should be blocked)
      coordinator.clearSelection();

      // Typography context should be preserved
      const stateAfter = coordinator.getSelectionState();
      expect(stateAfter.selectionContext.canApplyTypography).toBe(true);
      expect(stateAfter.selectionContext.activeTypographyCommands).toBeDefined();
    });
  });
});