// ABOUTME: Integration test to validate table cell selection preservation during toolbar interactions

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableSelectionCoordinator } from '../extensions/Table/selection/TableSelectionCoordinator';
import { UnifiedToolbar } from '../UnifiedToolbar';

// Mock dependencies
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn(() => ({
    selectedNodeId: null,
    nodes: [],
    updateNode: vi.fn(),
    deleteNode: vi.fn(),
    duplicateNode: vi.fn(),
    selectNode: vi.fn(),
    showGrid: false,
    showSnapGuides: false,
    toggleSnapGuides: vi.fn(),
    canvasZoom: 1.0,
    updateCanvasZoom: vi.fn(),
    getEditor: vi.fn(),
  })),
}));

vi.mock('../extensions/Table/tableCommands', () => ({
  tableComponentRegistry: {
    get: vi.fn((tableId: string) => ({
      addColumn: vi.fn(),
      removeColumn: vi.fn(),
      addRow: vi.fn(),
      removeRow: vi.fn(),
      updateTableData: vi.fn(),
      getCurrentCellPosition: vi.fn(() => ({ row: 0, col: 0 })),
      getFocusedCellEditor: vi.fn(() => ({
        commands: {
          toggleBold: vi.fn(() => true),
          toggleItalic: vi.fn(() => true),
          focus: vi.fn(),
        },
        getAttributes: vi.fn(() => ({})),
        isActive: vi.fn(() => false),
      })),
      getFocusedCellTypographyCommands: vi.fn(),
    })),
  },
}));

vi.mock('@/hooks/useTextSelection', () => ({
  useTextSelection: vi.fn(() => ({
    textSelection: {
      hasSelection: false,
      isTipTapSelection: false,
      editor: null,
      appliedMarks: {},
    },
    applyTypographyToSelection: vi.fn(),
    extractTextProperties: vi.fn(),
  })),
}));

vi.mock('../extensions/Table/selection/useTableSelectionCoordination', () => ({
  useTableSelectionCoordination: vi.fn(() => ({
    hasTableCellSelection: true,
    focusedCell: {
      position: { row: 0, col: 0 },
      editor: {
        commands: {
          toggleBold: vi.fn(() => true),
          toggleItalic: vi.fn(() => true),
          focus: vi.fn(),
        },
        getAttributes: vi.fn(() => ({})),
        isActive: vi.fn(() => false),
      },
      isHeader: false,
      element: document.createElement('td'),
    },
    selectionContext: {
      canApplyTypography: true,
      canNavigate: true,
      canEdit: true,
      activeTypographyCommands: null,
    },
    canApplyTypography: vi.fn(() => true),
    getActiveTypographyCommands: vi.fn(() => ({
      toggleHighlight: vi.fn(() => ({ success: true })),
      toggleBold: vi.fn(() => ({ success: true })),
      toggleItalic: vi.fn(() => ({ success: true })),
      applyProperties: vi.fn(() => ({ success: true })),
      editor: {
        commands: {
          toggleBold: vi.fn(() => true),
          toggleItalic: vi.fn(() => true),
        },
      },
    })),
    applyTypographyToSelection: vi.fn(() => true),
  })),
}));

vi.mock('@/components/providers/CustomThemeProvider', () => ({
  useTheme: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
  })),
}));

vi.mock('@/components/header/ThemeSelector', () => ({
  ThemeSelector: vi.fn(() => null),
}));

vi.mock('../KeyboardShortcutsPanel', () => ({
  KeyboardShortcutsPanel: vi.fn(() => null),
}));

vi.mock('../shared/HighlightColorPicker', () => ({
  HighlightColorPicker: vi.fn(({ onColorSelect, onRemoveHighlight }) => (
    <button 
      data-testid="highlight-color-picker"
      onClick={() => onColorSelect('#ffeb3b')}
    >
      Highlight
    </button>
  )),
}));

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(() => ({ reviewId: 'test-review' })),
}));

describe('🎯 Table Cell + Toolbar Integration Tests', () => {
  let tableSelectionCoordinator: TableSelectionCoordinator;
  let mockStartToolbarInteraction: ReturnType<typeof vi.fn>;
  let mockEndToolbarInteraction: ReturnType<typeof vi.fn>;
  let mockIsToolbarInteractionActive: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create fresh coordinator instance for each test
    tableSelectionCoordinator = new TableSelectionCoordinator();
    
    // Mock the toolbar interaction methods
    mockStartToolbarInteraction = vi.fn();
    mockEndToolbarInteraction = vi.fn();
    mockIsToolbarInteractionActive = vi.fn(() => false);
    
    tableSelectionCoordinator.startToolbarInteraction = mockStartToolbarInteraction;
    tableSelectionCoordinator.endToolbarInteraction = mockEndToolbarInteraction;
    tableSelectionCoordinator.isToolbarInteractionActive = mockIsToolbarInteractionActive;
    
    // Setup DOM for table cell
    document.body.innerHTML = `
      <div data-block-id="table-block-1" class="editor-block">
        <table>
          <tr>
            <td data-testid="table-cell-0-0" role="gridcell">Cell content</td>
          </tr>
        </table>
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    tableSelectionCoordinator.destroy();
  });

  describe('🎯 PHASE 4: Toolbar Interaction Preservation', () => {
    it('should preserve table cell selection when clicking Bold button', async () => {
      const user = userEvent.setup();
      
      // Setup: Focus a table cell first
      tableSelectionCoordinator.focusCell('table-block-1', { row: 0, col: 0 });
      expect(tableSelectionCoordinator.hasTableCellSelection()).toBe(true);
      
      // Render toolbar
      render(<UnifiedToolbar />);
      
      // Find and click the Bold button
      const boldButton = screen.getByRole('button', { name: /make text bold/i });
      expect(boldButton).toBeInTheDocument();
      
      // Simulate mousedown (should start toolbar interaction)
      fireEvent.mouseDown(boldButton);
      expect(mockStartToolbarInteraction).toHaveBeenCalledTimes(1);
      
      // Simulate click (should apply bold formatting)
      await user.click(boldButton);
      
      // Simulate mouseup (should end toolbar interaction)
      fireEvent.mouseUp(boldButton);
      expect(mockEndToolbarInteraction).toHaveBeenCalledTimes(1);
      
      // Verify table cell selection is preserved
      expect(tableSelectionCoordinator.hasTableCellSelection()).toBe(true);
      
      console.log('✅ VALIDATION: Bold button preserves table cell selection during interaction');
    });

    it('should preserve table cell selection when using Highlight button', async () => {
      const user = userEvent.setup();
      
      // Setup: Focus a table cell first
      tableSelectionCoordinator.focusCell('table-block-1', { row: 0, col: 0 });
      expect(tableSelectionCoordinator.hasTableCellSelection()).toBe(true);
      
      render(<UnifiedToolbar />);
      
      // Find and interact with Highlight button
      const highlightButton = screen.getByRole('button', { name: /highlight text/i });
      expect(highlightButton).toBeInTheDocument();
      
      // Test interaction preservation
      fireEvent.mouseDown(highlightButton);
      expect(mockStartToolbarInteraction).toHaveBeenCalledTimes(1);
      
      await user.click(highlightButton);
      
      fireEvent.mouseUp(highlightButton);
      expect(mockEndToolbarInteraction).toHaveBeenCalledTimes(1);
      
      // Verify selection preservation
      expect(tableSelectionCoordinator.hasTableCellSelection()).toBe(true);
      
      console.log('✅ VALIDATION: Highlight button preserves table cell selection');
    });

    it('should preserve table cell selection when using text alignment controls', async () => {
      const user = userEvent.setup();
      
      // Setup: Focus a table cell first
      tableSelectionCoordinator.focusCell('table-block-1', { row: 0, col: 0 });
      expect(tableSelectionCoordinator.hasTableCellSelection()).toBe(true);
      
      render(<UnifiedToolbar />);
      
      // Test all alignment buttons
      const alignButtons = [
        { name: /align text to the left/i, label: 'Left' },
        { name: /center align text/i, label: 'Center' },
        { name: /align text to the right/i, label: 'Right' },
        { name: /justify text alignment/i, label: 'Justify' },
      ];
      
      for (const { name, label } of alignButtons) {
        const alignButton = screen.getByRole('button', { name });
        expect(alignButton).toBeInTheDocument();
        
        // Test interaction preservation for each alignment
        fireEvent.mouseDown(alignButton);
        await user.click(alignButton);
        fireEvent.mouseUp(alignButton);
        
        // Verify selection is still preserved
        expect(tableSelectionCoordinator.hasTableCellSelection()).toBe(true);
        
        console.log(`✅ VALIDATION: ${label} alignment preserves table cell selection`);
      }
      
      // Should have called start/end toolbar interaction for each button
      expect(mockStartToolbarInteraction).toHaveBeenCalledTimes(alignButtons.length);
      expect(mockEndToolbarInteraction).toHaveBeenCalledTimes(alignButtons.length);
    });

    it('should preserve table cell selection during font property changes', async () => {
      const user = userEvent.setup();
      
      // Setup: Focus a table cell first
      tableSelectionCoordinator.focusCell('table-block-1', { row: 0, col: 0 });
      expect(tableSelectionCoordinator.hasTableCellSelection()).toBe(true);
      
      render(<UnifiedToolbar />);
      
      // Test font size input
      const fontSizeInput = screen.getByDisplayValue('16'); // Default font size
      expect(fontSizeInput).toBeInTheDocument();
      
      fireEvent.mouseDown(fontSizeInput);
      expect(mockStartToolbarInteraction).toHaveBeenCalledTimes(1);
      
      await user.clear(fontSizeInput);
      await user.type(fontSizeInput, '18');
      
      fireEvent.mouseUp(fontSizeInput);
      expect(mockEndToolbarInteraction).toHaveBeenCalledTimes(1);
      
      // Verify selection preservation
      expect(tableSelectionCoordinator.hasTableCellSelection()).toBe(true);
      
      console.log('✅ VALIDATION: Font size changes preserve table cell selection');
    });

    it('should handle rapid toolbar interactions without losing selection', async () => {
      const user = userEvent.setup();
      
      // Setup: Focus a table cell first
      tableSelectionCoordinator.focusCell('table-block-1', { row: 0, col: 0 });
      expect(tableSelectionCoordinator.hasTableCellSelection()).toBe(true);
      
      render(<UnifiedToolbar />);
      
      // Rapid fire multiple toolbar interactions
      const boldButton = screen.getByRole('button', { name: /make text bold/i });
      const italicButton = screen.getByRole('button', { name: /toggle italic/i });
      const highlightButton = screen.getByRole('button', { name: /highlight text/i });
      
      // Rapid sequence of interactions
      fireEvent.mouseDown(boldButton);
      await user.click(boldButton);
      fireEvent.mouseUp(boldButton);
      
      fireEvent.mouseDown(italicButton);
      await user.click(italicButton);
      fireEvent.mouseUp(italicButton);
      
      fireEvent.mouseDown(highlightButton);
      await user.click(highlightButton);
      fireEvent.mouseUp(highlightButton);
      
      // Should preserve selection through rapid interactions
      expect(tableSelectionCoordinator.hasTableCellSelection()).toBe(true);
      expect(mockStartToolbarInteraction).toHaveBeenCalledTimes(3);
      expect(mockEndToolbarInteraction).toHaveBeenCalledTimes(3);
      
      console.log('✅ VALIDATION: Rapid toolbar interactions preserve table cell selection');
    });

    it('should not interfere with normal text selections outside tables', async () => {
      const user = userEvent.setup();
      
      // Setup: No table cell selection (simulating normal text)
      expect(tableSelectionCoordinator.hasTableCellSelection()).toBe(false);
      
      // Mock the useTableSelectionCoordination to return no table cell selection
      const { useTableSelectionCoordination } = await import('../extensions/Table/selection/useTableSelectionCoordination');
      vi.mocked(useTableSelectionCoordination).mockReturnValue({
        hasTableCellSelection: false,
        focusedCell: null,
        selectionContext: {
          canApplyTypography: false,
          canNavigate: false,
          canEdit: false,
          activeTypographyCommands: null,
        },
        canApplyTypography: vi.fn(() => false),
        getActiveTypographyCommands: vi.fn(() => null),
        applyTypographyToSelection: vi.fn(() => false),
      });
      
      render(<UnifiedToolbar />);
      
      // Try to click formatting buttons - they should not call toolbar interaction methods
      const buttons = screen.queryAllByRole('button');
      
      if (buttons.length > 0) {
        const firstButton = buttons[0];
        fireEvent.mouseDown(firstButton);
        fireEvent.mouseUp(firstButton);
      }
      
      // Should NOT have called toolbar interaction methods (no table cell selection)
      expect(mockStartToolbarInteraction).not.toHaveBeenCalled();
      expect(mockEndToolbarInteraction).not.toHaveBeenCalled();
      
      console.log('✅ VALIDATION: Toolbar interactions do not interfere with normal text selections');
    });
  });

  describe('🎯 INTEGRATION: End-to-End Validation', () => {
    it('should demonstrate complete solution for user issue: "unable to interact with any menu without losing selection"', async () => {
      const user = userEvent.setup();
      
      console.log('🎯 TESTING: Complete solution for user issue...');
      
      // Step 1: User focuses a table cell
      console.log('Step 1: User focuses table cell');
      tableSelectionCoordinator.focusCell('table-block-1', { row: 0, col: 0 });
      expect(tableSelectionCoordinator.hasTableCellSelection()).toBe(true);
      
      render(<UnifiedToolbar />);
      
      // Step 2: User tries to apply bold formatting (the problematic scenario)
      console.log('Step 2: User clicks Bold button (previously lost selection)');
      const boldButton = screen.getByRole('button', { name: /make text bold/i });
      
      // This should now work WITHOUT losing selection
      fireEvent.mouseDown(boldButton); // Preserves selection
      await user.click(boldButton); // Applies formatting
      fireEvent.mouseUp(boldButton); // Cleans up interaction
      
      // Step 3: Verify the issue is resolved
      expect(tableSelectionCoordinator.hasTableCellSelection()).toBe(true);
      expect(mockStartToolbarInteraction).toHaveBeenCalled();
      expect(mockEndToolbarInteraction).toHaveBeenCalled();
      
      console.log('✅ SUCCESS: User can now interact with toolbar without losing table cell selection');
      
      // Step 4: Test additional interactions to ensure robustness
      console.log('Step 4: Testing additional toolbar interactions...');
      
      const highlightButton = screen.getByRole('button', { name: /highlight text/i });
      fireEvent.mouseDown(highlightButton);
      await user.click(highlightButton);
      fireEvent.mouseUp(highlightButton);
      
      // Still should have selection
      expect(tableSelectionCoordinator.hasTableCellSelection()).toBe(true);
      
      console.log('🎉 COMPLETE: All table cell + toolbar interactions work correctly!');
    });
  });
});