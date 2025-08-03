// ABOUTME: Comprehensive integration test for unified selection system validating table cell typography functionality

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UnifiedToolbar } from '../UnifiedToolbar';
import { RichTableCell } from '../extensions/Table/RichTableCell';
import { useUnifiedSelection } from '@/hooks/useUnifiedSelection';
import { useSelectionStore } from '@/store/selectionStore';

// Mock lucide-react icons - comprehensive list for UnifiedToolbar compatibility
vi.mock('lucide-react', async importOriginal => {
  const MockIcon = ({ size, className, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'mock-icon',
      'data-size': size,
      className,
      ...props,
    });

  const actual = await importOriginal<typeof import('lucide-react')>();

  return {
    ...actual,
    // Basic formatting icons
    Bold: MockIcon,
    Italic: MockIcon,
    Underline: MockIcon,
    Strikethrough: MockIcon,
    Highlighter: MockIcon,
    // Alignment icons
    AlignLeft: MockIcon,
    AlignCenter: MockIcon,
    AlignRight: MockIcon,
    AlignJustify: MockIcon,
    // History icons (MISSING - causing test failures)
    Undo: MockIcon,
    Redo: MockIcon,
    // Device icons
    Monitor: MockIcon,
    Smartphone: MockIcon,
    // Action icons
    HelpCircle: MockIcon,
    Trash2: MockIcon,
    Copy: MockIcon,
    Ruler: MockIcon,
    ZoomIn: MockIcon,
    ZoomOut: MockIcon,
    Table: MockIcon,
    Plus: MockIcon,
    Image: MockIcon,
    Video: MockIcon,
    List: MockIcon,
    ListOrdered: MockIcon,
    Quote: MockIcon,
    Link: MockIcon,
  };
});

// Mock the editor store
const mockEditorStore = {
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
};

vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => mockEditorStore,
}));

// Mock router
vi.mock('react-router-dom', () => ({
  useParams: () => ({ reviewId: 'test-review-id' }),
}));

// Mock theme provider
vi.mock('@/components/providers/CustomThemeProvider', () => ({
  useTheme: () => ({ theme: 'light' }),
  CustomThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock theme selector to avoid provider issues
vi.mock('@/components/header/ThemeSelector', () => ({
  ThemeSelector: () => <div data-testid="theme-selector">Theme Selector</div>,
}));

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Unified Selection System Integration', () => {
  beforeEach(() => {
    // Reset selection store between tests
    useSelectionStore.getState().dispatch({ type: 'CLEAR_SELECTION' });
    vi.clearAllMocks();
  });

  describe('Core Selection State Machine', () => {
    it('should start with empty selection state', () => {
      const { result } = renderHook(() => useUnifiedSelection());
      
      expect(result.current.hasSelection).toBe(false);
      expect(result.current.canApplyTypography).toBe(false);
      expect(result.current.currentSelection.type).toBe('none');
    });

    it('should transition to table-cell selection when cell is selected', () => {
      const { result } = renderHook(() => useUnifiedSelection());
      
      // Mock editor for table cell
      const mockEditor = {
        commands: { focus: vi.fn() },
        getAttributes: vi.fn().mockReturnValue({}),
        isActive: vi.fn().mockReturnValue(false),
      };
      
      act(() => {
        result.current.selectTableCell('table-1', {
          tableId: 'table-1',
          position: { row: 0, col: 0 },
          isHeader: false,
          editor: mockEditor as any,
          element: document.createElement('td'),
          cellId: 'table-1-0-0',
        });
      });
      
      expect(result.current.hasSelection).toBe(true);
      expect(result.current.canApplyTypography).toBe(true);
      expect(result.current.currentSelection.type).toBe('table-cell');
      expect(result.current.currentSelection.cellSelection?.tableId).toBe('table-1');
    });

    it('should preserve selection during toolbar interactions', () => {
      const { result } = renderHook(() => useUnifiedSelection());
      
      // Set up table cell selection
      const mockEditor = {
        commands: { focus: vi.fn() },
        getAttributes: vi.fn().mockReturnValue({ fontWeight: 400 }),
        isActive: vi.fn().mockReturnValue(false),
        chain: vi.fn().mockReturnThis(),
        setFontWeight: vi.fn().mockReturnThis(),
        run: vi.fn(),
      };
      
      act(() => {
        result.current.selectTableCell('table-1', {
          tableId: 'table-1',
          position: { row: 0, col: 0 },
          isHeader: false,
          editor: mockEditor as any,
          element: document.createElement('td'),
          cellId: 'table-1-0-0',
        });
      });
      
      // Verify selection exists
      expect(result.current.hasSelection).toBe(true);
      
      // Apply typography with preservation
      act(() => {
        result.current.preserveDuringToolbarInteraction(() => {
          result.current.applyTypography({ fontWeight: 700 });
        });
      });
      
      // Selection should still exist after typography operation
      expect(result.current.hasSelection).toBe(true);
      expect(result.current.currentSelection.type).toBe('table-cell');
    });
  });

  describe('Typography Application', () => {
    it('should apply bold formatting to table cell content', () => {
      const { result } = renderHook(() => useUnifiedSelection());
      
      // Mock TipTap editor commands with proper structure
      const mockEditor = {
        commands: { 
          focus: vi.fn(),
          setFontWeight: vi.fn().mockReturnValue(true),
        },
        getAttributes: vi.fn().mockReturnValue({ fontWeight: 400 }),
        isActive: vi.fn().mockReturnValue(false),
        chain: vi.fn().mockReturnThis(),
        run: vi.fn().mockReturnValue(true),
      };
      
      // Set up table cell selection
      act(() => {
        result.current.selectTableCell('table-1', {
          tableId: 'table-1',
          position: { row: 0, col: 0 },
          isHeader: false,
          editor: mockEditor as any,
          element: document.createElement('td'),
          cellId: 'table-1-0-0',
        });
      });
      
      // Apply bold formatting
      let success: boolean;
      act(() => {
        success = result.current.applyTypography({ fontWeight: 700 });
      });
      
      expect(success).toBe(true);
      expect(mockEditor.commands.setFontWeight).toHaveBeenCalledWith(700);
    });

    it('should apply italic formatting to table cell content', () => {
      const { result } = renderHook(() => useUnifiedSelection());
      
      const mockEditor = {
        commands: { 
          focus: vi.fn(),
          toggleItalic: vi.fn().mockReturnValue(true),
        },
        getAttributes: vi.fn().mockReturnValue({}),
        isActive: vi.fn().mockReturnValue(false),
        chain: vi.fn().mockReturnThis(),
        toggleItalic: vi.fn().mockReturnThis(),
        run: vi.fn().mockReturnValue(true),
      };
      
      act(() => {
        result.current.selectTableCell('table-1', {
          tableId: 'table-1',
          position: { row: 0, col: 0 },
          isHeader: false,
          editor: mockEditor as any,
          element: document.createElement('td'),
          cellId: 'table-1-0-0',
        });
      });
      
      let success: boolean;
      act(() => {
        success = result.current.applyTypography({ fontStyle: 'italic' });
      });
      
      expect(success).toBe(true);
      expect(mockEditor.commands.toggleItalic).toHaveBeenCalled();
    });

    it('should apply highlight to table cell content', () => {
      const { result } = renderHook(() => useUnifiedSelection());
      
      const mockEditor = {
        commands: { 
          focus: vi.fn(),
          setHighlight: vi.fn().mockReturnValue(true),
        },
        getAttributes: vi.fn().mockReturnValue({}),
        isActive: vi.fn().mockReturnValue(false),
        chain: vi.fn().mockReturnThis(),
        setHighlight: vi.fn().mockReturnThis(),
        run: vi.fn().mockReturnValue(true),
      };
      
      act(() => {
        result.current.selectTableCell('table-1', {
          tableId: 'table-1',
          position: { row: 0, col: 0 },
          isHeader: false,
          editor: mockEditor as any,
          element: document.createElement('td'),
          cellId: 'table-1-0-0',
        });
      });
      
      let success: boolean;
      act(() => {
        success = result.current.applyTypography({ backgroundColor: '#ffeb3b' });
      });
      
      expect(success).toBe(true);
      expect(mockEditor.commands.setHighlight).toHaveBeenCalledWith({ color: '#ffeb3b' });
    });
  });

  describe('Toolbar Integration', () => {
    it('should enable typography buttons when table cell is selected', () => {
      render(
        <TestWrapper>
          <UnifiedToolbar />
        </TestWrapper>
      );
      
      // Initially, typography buttons should be disabled
      const boldButton = screen.getByLabelText('Make text bold');
      expect(boldButton).toBeDisabled();
      
      // Simulate table cell selection
      const { result } = renderHook(() => useUnifiedSelection());
      
      const mockEditor = {
        commands: { focus: vi.fn() },
        getAttributes: vi.fn().mockReturnValue({}),
        isActive: vi.fn().mockReturnValue(false),
      };
      
      act(() => {
        result.current.selectTableCell('table-1', {
          tableId: 'table-1',
          position: { row: 0, col: 0 },
          isHeader: false,
          editor: mockEditor as any,
          element: document.createElement('td'),
          cellId: 'table-1-0-0',
        });
      });
      
      // After selection, typography buttons should be enabled
      waitFor(() => {
        expect(boldButton).not.toBeDisabled();
      });
    });

    it('should handle Bold button click without losing table cell selection', async () => {
      const { result } = renderHook(() => useUnifiedSelection());
      
      render(
        <TestWrapper>
          <UnifiedToolbar />
        </TestWrapper>
      );
      
      // Set up table cell selection with mock editor
      const mockEditor = {
        commands: { 
          focus: vi.fn(),
          setFontWeight: vi.fn().mockReturnValue(true),
        },
        getAttributes: vi.fn().mockReturnValue({ fontWeight: 400 }),
        isActive: vi.fn().mockReturnValue(false),
        chain: vi.fn().mockReturnThis(),
        run: vi.fn().mockReturnValue(true),
      };
      
      act(() => {
        result.current.selectTableCell('table-1', {
          tableId: 'table-1',
          position: { row: 0, col: 0 },
          isHeader: false,
          editor: mockEditor as any,
          element: document.createElement('td'),
          cellId: 'table-1-0-0',
        });
      });
      
      // Verify selection exists
      expect(result.current.hasSelection).toBe(true);
      
      // Click bold button
      const boldButton = screen.getByLabelText('Make text bold');
      fireEvent.click(boldButton);
      
      // Verify selection is preserved and formatting was applied
      await waitFor(() => {
        expect(result.current.hasSelection).toBe(true);
        expect(result.current.currentSelection.type).toBe('table-cell');
        expect(mockEditor.commands.setFontWeight).toHaveBeenCalledWith(700);
      });
    });
  });

  describe('Component Integration', () => {
    it('should show "Table Cell Mode" in TypographyModeIndicator for table cell selections', () => {
      const { result } = renderHook(() => useUnifiedSelection());
      
      const TypographyModeIndicator = () => {
        const { hasSelection, canApplyTypography, currentSelection } = useUnifiedSelection();
        
        const mode = hasSelection && canApplyTypography
          ? currentSelection.type === 'table-cell' 
            ? 'table-cell'
            : 'selection'
          : 'none';
            
        return <div data-testid="typography-mode">{mode}</div>;
      };
      
      render(<TypographyModeIndicator />);
      
      // Initially no mode
      expect(screen.getByTestId('typography-mode')).toHaveTextContent('none');
      
      // Select table cell
      const mockEditor = {
        commands: { focus: vi.fn() },
        getAttributes: vi.fn().mockReturnValue({}),
        isActive: vi.fn().mockReturnValue(false),
      };
      
      act(() => {
        result.current.selectTableCell('table-1', {
          tableId: 'table-1',
          position: { row: 0, col: 0 },
          isHeader: false,
          editor: mockEditor as any,
          element: document.createElement('td'),
          cellId: 'table-1-0-0',
        });
      });
      
      // Should show table-cell mode
      expect(screen.getByTestId('typography-mode')).toHaveTextContent('table-cell');
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle missing editor gracefully', () => {
      const { result } = renderHook(() => useUnifiedSelection());
      
      expect(() => {
        act(() => {
          result.current.selectTableCell('table-1', {
            tableId: 'table-1',
            position: { row: 0, col: 0 },
            isHeader: false,
            editor: null,
            element: document.createElement('td'),
            cellId: 'table-1-0-0',
          });
        });
      }).not.toThrow();
      
      expect(result.current.canApplyTypography).toBe(false);
    });

    it('should clear selection properly', () => {
      const { result } = renderHook(() => useUnifiedSelection());
      
      // Set up selection
      const mockEditor = {
        commands: { focus: vi.fn() },
        getAttributes: vi.fn().mockReturnValue({}),
        isActive: vi.fn().mockReturnValue(false),
      };
      
      act(() => {
        result.current.selectTableCell('table-1', {
          tableId: 'table-1',
          position: { row: 0, col: 0 },
          isHeader: false,
          editor: mockEditor as any,
          element: document.createElement('td'),
          cellId: 'table-1-0-0',
        });
      });
      
      expect(result.current.hasSelection).toBe(true);
      
      // Clear selection
      act(() => {
        result.current.clearSelection();
      });
      
      expect(result.current.hasSelection).toBe(false);
      expect(result.current.currentSelection.type).toBe('none');
    });

    it('should handle concurrent selection changes', () => {
      const { result } = renderHook(() => useUnifiedSelection());
      
      const mockEditor1 = {
        commands: { focus: vi.fn() },
        getAttributes: vi.fn().mockReturnValue({}),
        isActive: vi.fn().mockReturnValue(false),
      };
      
      const mockEditor2 = {
        commands: { focus: vi.fn() },
        getAttributes: vi.fn().mockReturnValue({}),
        isActive: vi.fn().mockReturnValue(false),
      };
      
      // Select first cell
      act(() => {
        result.current.selectTableCell('table-1', {
          tableId: 'table-1',
          position: { row: 0, col: 0 },
          isHeader: false,
          editor: mockEditor1 as any,
          element: document.createElement('td'),
          cellId: 'table-1-0-0',
        });
      });
      
      expect(result.current.currentSelection.cellSelection?.position).toEqual({ row: 0, col: 0 });
      
      // Select second cell (should replace first)
      act(() => {
        result.current.selectTableCell('table-1', {
          tableId: 'table-1',
          position: { row: 0, col: 1 },
          isHeader: false,
          editor: mockEditor2 as any,
          element: document.createElement('td'),
          cellId: 'table-1-0-1',
        });
      });
      
      expect(result.current.currentSelection.cellSelection?.position).toEqual({ row: 0, col: 1 });
    });
  });
});

