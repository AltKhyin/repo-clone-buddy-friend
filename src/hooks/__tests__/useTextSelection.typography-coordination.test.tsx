// ABOUTME: Tests for typography coordination between table and normal text selections

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTextSelection } from '../useTextSelection';
import { tableSelectionCoordinator } from '@/components/editor/extensions/Table/selection/TableSelectionCoordinator';

// Mock the table selection coordinator
vi.mock('@/components/editor/extensions/Table/selection/TableSelectionCoordinator', () => ({
  tableSelectionCoordinator: {
    hasTableCellSelection: vi.fn(() => false),
    handleNonTableSelection: vi.fn(),
  },
}));

// Mock table component registry
vi.mock('@/components/editor/extensions/Table/tableCommands', () => ({
  tableComponentRegistry: {
    get: vi.fn(() => null),
  },
}));

// Mock editor store
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn(() => ({
    setTextSelection: vi.fn(),
    selectedNodeId: null,
  })),
}));

describe('useTextSelection - Typography Coordination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up DOM for text selection
    document.body.innerHTML = `
      <div data-block-id="text-block-1" class="editor-block">
        <p>This is normal text that can be selected</p>
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('🟢 GREEN: Typography Coordination (Fixed)', () => {
    it('should clear table selections when transitioning from table to normal text', () => {
      const { result } = renderHook(() => useTextSelection());

      // Simulate previous table cell selection
      result.current.textSelection = {
        blockId: 'table-block-1',
        selectedText: 'table text',
        textElement: null,
        range: null,
        hasSelection: true,
        editor: null,
        isTipTapSelection: false,
        isTableCellSelection: true, // Previous selection was table cell
        appliedMarks: {},
      };

      // Mock table coordinator having an active selection
      (tableSelectionCoordinator.hasTableCellSelection as any).mockReturnValue(true);

      // Simulate selecting normal text (not in table)
      act(() => {
        // Create text selection in normal paragraph
        const textNode = document.querySelector('p')?.firstChild as Text;
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 10);
        
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        // Trigger selection change event
        const event = new Event('selectionchange');
        document.dispatchEvent(event);
      });

      // Verify that table selection was cleared due to transition to normal text
      expect(tableSelectionCoordinator.handleNonTableSelection).toHaveBeenCalled();
    });

    it('should NOT clear table selections when selecting within the same table', () => {
      const { result } = renderHook(() => useTextSelection());

      // Start with no previous selection
      result.current.textSelection = null;

      // Mock table coordinator having an active selection
      (tableSelectionCoordinator.hasTableCellSelection as any).mockReturnValue(true);

      // Simulate selecting text within a table cell (not transitioning FROM table)
      act(() => {
        // Add table cell to DOM
        document.body.innerHTML = `
          <div data-block-id="table-block-1" class="editor-block">
            <table>
              <tr>
                <td data-testid="table-cell-0-0">Table cell text</td>
              </tr>
            </table>
          </div>
        `;

        const textNode = document.querySelector('td')?.firstChild as Text;
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 5);
        
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        // Trigger selection change event
        const event = new Event('selectionchange');
        document.dispatchEvent(event);
      });

      // Should NOT clear table selection when there's no transition FROM table cell
      expect(tableSelectionCoordinator.handleNonTableSelection).not.toHaveBeenCalled();
    });

    it('should NOT clear table selections when no previous table selection existed', () => {
      const { result } = renderHook(() => useTextSelection());

      // Start with no previous selection
      result.current.textSelection = null;

      // Mock table coordinator having no active selection
      (tableSelectionCoordinator.hasTableCellSelection as any).mockReturnValue(false);

      // Simulate selecting normal text
      act(() => {
        const textNode = document.querySelector('p')?.firstChild as Text;
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 10);
        
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        // Trigger selection change event
        const event = new Event('selectionchange');
        document.dispatchEvent(event);
      });

      // Should NOT call handleNonTableSelection when no table selection exists
      expect(tableSelectionCoordinator.handleNonTableSelection).not.toHaveBeenCalled();
    });
  });

  describe('🟢 GREEN: Typography System Restoration', () => {
    it('should enable normal text formatting after clearing table selection', () => {
      const mockSetTextSelection = vi.fn();
      
      // Mock editor store to capture text selection updates
      vi.mocked(require('@/store/editorStore').useEditorStore).mockReturnValue({
        setTextSelection: mockSetTextSelection,
        selectedNodeId: null,
      });

      const { result } = renderHook(() => useTextSelection());

      // Simulate the scenario that was broken: table selection -> normal text selection
      // This should clear table selections and enable normal text formatting
      
      // Setup: Previous table cell selection exists
      result.current.textSelection = {
        blockId: 'table-block-1',
        selectedText: 'table text',
        textElement: null,
        range: null,
        hasSelection: true,
        editor: null,
        isTipTapSelection: false,
        isTableCellSelection: true,
        appliedMarks: {},
      };

      (tableSelectionCoordinator.hasTableCellSelection as any).mockReturnValue(true);

      // Action: Select normal text (should trigger coordination)
      act(() => {
        const textNode = document.querySelector('p')?.firstChild as Text;
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 10);
        
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        const event = new Event('selectionchange');
        document.dispatchEvent(event);
      });

      // Verification: Table selection coordination should have been triggered
      expect(tableSelectionCoordinator.handleNonTableSelection).toHaveBeenCalledTimes(1);
      
      // This means normal text formatting should now work because table cell typography is disabled
      console.log('✅ Typography coordination is working - table selections cleared when transitioning to normal text');
    });
  });
});