// ABOUTME: Test suite for useTextSelection hook with table cell selection functionality

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTextSelection } from '../useTextSelection';
import { tableComponentRegistry } from '@/components/editor/extensions/Table/tableCommands';

// Mock the editor store
const mockSetTextSelection = vi.fn();
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn(() => ({
    setTextSelection: mockSetTextSelection,
    selectedNodeId: 'test-node-id',
    getEditor: vi.fn(),
  })),
}));

// Mock table component registry
vi.mock('@/components/editor/extensions/Table/tableCommands', () => ({
  tableComponentRegistry: {
    get: vi.fn(),
  },
}));

// Mock TipTap editor
const mockTableCellEditor = {
  isFocused: true,
  getAttributes: vi.fn(() => ({})),
  commands: {
    setFontFamily: vi.fn(),
    setFontSize: vi.fn(),
    setFontWeight: vi.fn(),
    setTextColor: vi.fn(),
    setBackgroundColor: vi.fn(),
    setTextTransform: vi.fn(),
    setLetterSpacing: vi.fn(),
    unsetFontFamily: vi.fn(),
    unsetFontSize: vi.fn(),
    unsetFontWeight: vi.fn(),
    unsetTextColor: vi.fn(),
    unsetBackgroundColor: vi.fn(),
    unsetTextTransform: vi.fn(),
    unsetLetterSpacing: vi.fn(),
  },
};

const mockTableComponent = {
  getFocusedCellEditor: vi.fn(() => mockTableCellEditor),
  getFocusedCellTypographyCommands: vi.fn(() => null),
  getCurrentCellPosition: vi.fn(() => ({ row: 0, col: 1 })),
  addColumn: vi.fn(),
  removeColumn: vi.fn(),
  addRow: vi.fn(),
  removeRow: vi.fn(),
  updateTableData: vi.fn(),
};

describe('useTextSelection - Table Cell Integration', () => {
  let selectionChangeSpy: any;
  let mockSelection: any;
  let mockRange: any;

  beforeEach(() => {
    // Create a proper text node for testing
    const textNode = document.createTextNode('selected text');
    
    // Mock window.getSelection
    mockRange = {
      commonAncestorContainer: textNode,
      toString: vi.fn(() => 'selected text'),
      cloneRange: vi.fn(() => mockRange),
      getRangeAt: vi.fn(() => mockRange),
      collapsed: false,
    };

    mockSelection = {
      rangeCount: 1,
      toString: vi.fn(() => 'selected text'),
      getRangeAt: vi.fn(() => mockRange),
      removeAllRanges: vi.fn(),
    };

    Object.defineProperty(window, 'getSelection', {
      value: vi.fn(() => mockSelection),
      writable: true,
    });

    // Setup table component registry mock
    vi.mocked(tableComponentRegistry.get).mockReturnValue(mockTableComponent);

    // Clear all previous calls
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Table Cell Detection', () => {
    it('should detect table cell selection correctly', () => {
      const { result } = renderHook(() => useTextSelection());

      // Create mock table cell element
      const tableCellElement = document.createElement('td');
      tableCellElement.setAttribute('data-testid', 'table-cell-0-1');
      tableCellElement.setAttribute('role', 'gridcell');
      
      // Create mock table container
      const tableContainer = document.createElement('div');
      tableContainer.setAttribute('data-block-id', 'table-123');
      tableContainer.appendChild(tableCellElement);
      
      // Create mock text node inside cell
      const textNode = document.createTextNode('Cell content');
      tableCellElement.appendChild(textNode);
      
      document.body.appendChild(tableContainer);

      // Mock the range to point to our table cell
      mockRange.commonAncestorContainer = textNode;

      // Simulate text selection in table cell
      act(() => {
        const event = new Event('selectionchange');
        document.dispatchEvent(event);
      });

      // Verify table cell selection was detected
      expect(result.current.textSelection?.isTableCellSelection).toBe(true);
      expect(result.current.textSelection?.tableCellInfo?.tableId).toBe('table-123');
      expect(result.current.textSelection?.tableCellInfo?.cellPosition).toEqual({ row: 0, col: 1 });
      expect(result.current.textSelection?.tableCellInfo?.isHeader).toBe(false);

      // Cleanup
      document.body.removeChild(tableContainer);
    });

    it('should detect header cell selection correctly', () => {
      const { result } = renderHook(() => useTextSelection());

      // Create mock header cell element (row -1 indicates header)
      const headerCellElement = document.createElement('th');
      headerCellElement.setAttribute('data-testid', 'table-cell--1-0');
      headerCellElement.setAttribute('role', 'gridcell');
      
      // Create mock table container
      const tableContainer = document.createElement('div');
      tableContainer.setAttribute('data-block-id', 'table-456');
      tableContainer.appendChild(headerCellElement);
      
      // Create mock text node inside header
      const textNode = document.createTextNode('Header content');
      headerCellElement.appendChild(textNode);
      
      document.body.appendChild(tableContainer);

      // Mock the range to point to our header cell
      mockRange.commonAncestorContainer = textNode;

      // Simulate text selection in header cell
      act(() => {
        const event = new Event('selectionchange');
        document.dispatchEvent(event);
      });

      // Verify header cell selection was detected
      expect(result.current.textSelection?.isTableCellSelection).toBe(true);
      expect(result.current.textSelection?.tableCellInfo?.tableId).toBe('table-456');
      expect(result.current.textSelection?.tableCellInfo?.cellPosition).toEqual({ row: -1, col: 0 });
      expect(result.current.textSelection?.tableCellInfo?.isHeader).toBe(true);

      // Cleanup
      document.body.removeChild(tableContainer);
    });

    it('should get table cell editor from registry', () => {
      const { result } = renderHook(() => useTextSelection());

      // Create mock table cell with editor content
      const tableCellElement = document.createElement('td');
      tableCellElement.setAttribute('data-testid', 'table-cell-1-2');
      tableCellElement.classList.add('table-cell-container');
      
      const tableContainer = document.createElement('div');
      tableContainer.setAttribute('data-block-id', 'table-789');
      tableContainer.appendChild(tableCellElement);
      
      const textNode = document.createTextNode('Rich content');
      tableCellElement.appendChild(textNode);
      
      document.body.appendChild(tableContainer);

      // Mock the range
      mockRange.commonAncestorContainer = textNode;

      // Simulate selection
      act(() => {
        const event = new Event('selectionchange');
        document.dispatchEvent(event);
      });

      // Verify registry was called and editor was retrieved
      expect(tableComponentRegistry.get).toHaveBeenCalledWith('table-789');
      expect(mockTableComponent.getFocusedCellEditor).toHaveBeenCalled();
      expect(result.current.textSelection?.tableCellInfo?.cellEditor).toBe(mockTableCellEditor);

      // Cleanup
      document.body.removeChild(tableContainer);
    });
  });

  describe('Typography Application in Table Cells', () => {
    it('should apply typography to table cell editor', () => {
      const { result } = renderHook(() => useTextSelection());

      // Setup table cell selection
      const tableCellElement = document.createElement('td');
      tableCellElement.setAttribute('data-testid', 'table-cell-0-0');
      
      const tableContainer = document.createElement('div');
      tableContainer.setAttribute('data-block-id', 'table-abc');
      tableContainer.appendChild(tableCellElement);
      
      const textNode = document.createTextNode('Content to style');
      tableCellElement.appendChild(textNode);
      
      document.body.appendChild(tableContainer);

      // Mock the range and selection
      mockRange.commonAncestorContainer = textNode;

      // Simulate selection to set up table cell context
      act(() => {
        const event = new Event('selectionchange');
        document.dispatchEvent(event);
      });

      // Apply typography properties
      act(() => {
        const success = result.current.applyTypographyToSelection({
          fontFamily: 'Arial',
          fontSize: 18,
          fontWeight: 600,
          textColor: '#ff0000',
        });
        expect(success).toBe(true);
      });

      // Verify that the table cell editor commands were called
      expect(mockTableCellEditor.commands.setFontFamily).toHaveBeenCalledWith('Arial');
      expect(mockTableCellEditor.commands.setFontSize).toHaveBeenCalledWith(18);
      expect(mockTableCellEditor.commands.setFontWeight).toHaveBeenCalledWith(600);
      expect(mockTableCellEditor.commands.setTextColor).toHaveBeenCalledWith('#ff0000');

      // Cleanup
      document.body.removeChild(tableContainer);
    });

    it('should unset typography properties when value is null/undefined', () => {
      const { result } = renderHook(() => useTextSelection());

      // Setup table cell selection
      const tableCellElement = document.createElement('td');
      tableCellElement.setAttribute('data-testid', 'table-cell-1-1');
      
      const tableContainer = document.createElement('div');
      tableContainer.setAttribute('data-block-id', 'table-def');
      tableContainer.appendChild(tableCellElement);
      
      const textNode = document.createTextNode('Content to unstyle');
      tableCellElement.appendChild(textNode);
      
      document.body.appendChild(tableContainer);

      mockRange.commonAncestorContainer = textNode;

      // Simulate selection
      act(() => {
        const event = new Event('selectionchange');
        document.dispatchEvent(event);
      });

      // Apply null/undefined values to unset properties
      act(() => {
        const success = result.current.applyTypographyToSelection({
          fontFamily: null,
          fontSize: undefined,
          backgroundColor: '',
        });
        expect(success).toBe(true);
      });

      // Verify that unset commands were called
      expect(mockTableCellEditor.commands.unsetFontFamily).toHaveBeenCalled();
      expect(mockTableCellEditor.commands.unsetFontSize).toHaveBeenCalled();
      expect(mockTableCellEditor.commands.unsetBackgroundColor).toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(tableContainer);
    });
  });

  describe('Selection Priority', () => {
    it('should prioritize table cell editor over main editor', () => {
      const { result } = renderHook(() => useTextSelection());

      // Create table cell with both main editor context and cell editor
      const tableCellElement = document.createElement('td');
      tableCellElement.setAttribute('data-testid', 'table-cell-2-3');
      tableCellElement.classList.add('ProseMirror'); // This would normally indicate main editor
      
      const tableContainer = document.createElement('div');
      tableContainer.setAttribute('data-block-id', 'table-priority-test');
      tableContainer.appendChild(tableCellElement);
      
      const textNode = document.createTextNode('Priority test content');
      tableCellElement.appendChild(textNode);
      
      document.body.appendChild(tableContainer);

      mockRange.commonAncestorContainer = textNode;

      // Simulate selection
      act(() => {
        const event = new Event('selectionchange');
        document.dispatchEvent(event);
      });

      // Verify that table cell editor is prioritized
      expect(result.current.textSelection?.isTableCellSelection).toBe(true);
      expect(result.current.textSelection?.editor).toBe(mockTableCellEditor);
      expect(result.current.textSelection?.isTipTapSelection).toBe(true);

      // Cleanup
      document.body.removeChild(tableContainer);
    });
  });

  describe('Non-Table Cell Selections', () => {
    it('should handle regular text selections without table cell context', () => {
      const { result } = renderHook(() => useTextSelection());

      // Create regular text element (not in table)
      const textElement = document.createElement('div');
      textElement.setAttribute('data-block-id', 'regular-block');
      
      const textNode = document.createTextNode('Regular text content');
      textElement.appendChild(textNode);
      
      document.body.appendChild(textElement);

      mockRange.commonAncestorContainer = textNode;

      // Simulate selection
      act(() => {
        const event = new Event('selectionchange');
        document.dispatchEvent(event);
      });

      // Verify that table cell selection is false
      expect(result.current.textSelection?.isTableCellSelection).toBe(false);
      expect(result.current.textSelection?.tableCellInfo).toBeUndefined();
      expect(result.current.textSelection?.blockId).toBe('regular-block');

      // Cleanup
      document.body.removeChild(textElement);
    });
  });
});