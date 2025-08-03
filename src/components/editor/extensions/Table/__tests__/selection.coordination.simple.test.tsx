// ABOUTME: Simplified tests for table cell selection coordination system - focusing on core functionality

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  TableSelectionCoordinator,
  tableSelectionCoordinator 
} from '../selection/TableSelectionCoordinator';
import { useTableSelectionCoordination } from '../selection/useTableSelectionCoordination';
import { tableComponentRegistry } from '../tableCommands';

// Mock dependencies
vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => ({
    setTextSelection: vi.fn(),
  }),
}));

// Mock typography commands
vi.mock('../../../shared/typography-commands', () => ({
  createTypographyCommands: vi.fn(() => ({
    setFontFamily: vi.fn().mockReturnValue({ success: true }),
    setFontSize: vi.fn().mockReturnValue({ success: true }),
    setTextColor: vi.fn().mockReturnValue({ success: true }),
    setBackgroundColor: vi.fn().mockReturnValue({ success: true }),
    setFontWeight: vi.fn().mockReturnValue({ success: true }),
    unsetProperty: vi.fn().mockReturnValue({ success: true }),
    toggleBold: vi.fn().mockReturnValue({ success: true }),
    toggleItalic: vi.fn().mockReturnValue({ success: true }),
    toggleHighlight: vi.fn().mockReturnValue({ success: true }),
  })),
}));

// Mock DOM APIs
Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: vi.fn(() => ({
    removeAllRanges: vi.fn(),
    addRange: vi.fn(),
    toString: vi.fn(() => ''),
    rangeCount: 0,
  })),
});

describe('Table Selection Coordination - Core Functionality', () => {
  let coordinator: TableSelectionCoordinator;
  let mockComponent: any;
  let mockEditor: any;

  beforeEach(() => {
    coordinator = new TableSelectionCoordinator();
    
    // Create mock TipTap editor
    mockEditor = {
      commands: {
        focus: vi.fn(),
        blur: vi.fn(),
        selectAll: vi.fn(),
      },
      getAttributes: vi.fn(() => ({})),
      isFocused: true,
      getHTML: vi.fn(() => '<p>test content</p>'),
    };

    // Create mock table component
    mockComponent = {
      addColumn: vi.fn(),
      removeColumn: vi.fn(),
      addRow: vi.fn(),
      removeRow: vi.fn(),
      updateTableData: vi.fn(),
      getCurrentCellPosition: vi.fn(() => ({ row: 0, col: 0 })),
      getFocusedCellEditor: vi.fn(() => mockEditor),
      getFocusedCellTypographyCommands: vi.fn(),
    };

    // Register mock component
    tableComponentRegistry.register('test-table-1', mockComponent);

    // Create DOM elements for testing
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const mockElement = document.createElement('td');
        mockElement.setAttribute('data-testid', `table-cell-${row}-${col}`);
        document.body.appendChild(mockElement);
      }
    }
  });

  afterEach(() => {
    coordinator.destroy();
    tableComponentRegistry.unregister('test-table-1');
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Basic Coordination', () => {
    it('should focus a cell successfully', () => {
      const result = coordinator.focusCell('test-table-1', { row: 0, col: 0 });
      
      expect(result).toBe(true);
      expect(mockEditor.commands.focus).toHaveBeenCalled();
      
      const state = coordinator.getSelectionState();
      expect(state.hasTableCellSelection).toBe(true);
      expect(state.focusedCell?.position).toEqual({ row: 0, col: 0 });
    });

    it('should handle navigation between cells', () => {
      // Focus initial cell
      coordinator.focusCell('test-table-1', { row: 1, col: 1 });
      
      // Navigate right
      const result = coordinator.navigateCell('right');
      expect(result).toBe(true);
      
      const state = coordinator.getSelectionState();
      expect(state.focusedCell?.position).toEqual({ row: 1, col: 2 });
    });

    it('should clear selections', () => {
      coordinator.focusCell('test-table-1', { row: 0, col: 0 });
      coordinator.clearSelection();
      
      const state = coordinator.getSelectionState();
      expect(state.hasTableCellSelection).toBe(false);
      expect(state.focusedCell).toBeUndefined();
    });

    it('should emit events when selection changes', () => {
      const listener = vi.fn();
      coordinator.on('cellSelection', listener);
      
      coordinator.focusCell('test-table-1', { row: 0, col: 0 });
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          hasTableCellSelection: true,
          focusedCell: expect.objectContaining({
            position: { row: 0, col: 0 },
          }),
        })
      );
    });
  });

  describe('React Hook Integration', () => {
    it('should initialize correctly', () => {
      const { result } = renderHook(() => useTableSelectionCoordination());
      
      expect(result.current.hasTableCellSelection).toBe(false);
      expect(result.current.focusedCell).toBeUndefined();
      expect(result.current.selectedCells).toHaveLength(0);
    });

    it('should handle cell focus through hook', () => {
      const { result } = renderHook(() => useTableSelectionCoordination());
      
      act(() => {
        const success = result.current.handleCellFocus('test-table-1', { row: 0, col: 0 });
        expect(success).toBe(true);
      });
      
      expect(result.current.hasTableCellSelection).toBe(true);
      expect(result.current.focusedCell?.position).toEqual({ row: 0, col: 0 });
    });

    it('should provide typography capabilities', () => {
      const { result } = renderHook(() => useTableSelectionCoordination());
      
      act(() => {
        result.current.handleCellFocus('test-table-1', { row: 0, col: 0 });
      });
      
      expect(result.current.canApplyTypography()).toBe(true);
      expect(result.current.getActiveTypographyCommands()).toBeTruthy();
    });
  });

  describe('Typography Integration', () => {
    it('should apply typography properties', () => {
      coordinator.focusCell('test-table-1', { row: 0, col: 0 });
      
      const result = coordinator.applyTypographyToSelection({
        fontFamily: 'Arial',
        fontSize: 18,
      });
      
      expect(result).toBe(true);
    });

    it('should handle range selections', () => {
      const result = coordinator.selectCellRange(
        'test-table-1',
        { row: 0, col: 0 },
        { row: 1, col: 1 }
      );
      
      expect(result).toBe(true);
      
      const state = coordinator.getSelectionState();
      expect(state.selectedCells).toHaveLength(4); // 2x2 range
      expect(state.selectionContext.canApplyTypography).toBe(true);
    });
  });
});