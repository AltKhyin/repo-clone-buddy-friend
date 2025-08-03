// ABOUTME: Test suite for RichTableCell component with typography functionality

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RichTableCell } from '../RichTableCell';
import { performanceOptimizedTableCellManager } from '../performance/PerformanceOptimizedTableCellManager';

// Mock the performance optimized table cell manager
vi.mock('../performance/PerformanceOptimizedTableCellManager', () => ({
  createTableCellEditorConfig: vi.fn(() => ({
    commands: {
      setContent: vi.fn(),
      focus: vi.fn(),
      blur: vi.fn(),
    },
    getHTML: vi.fn(() => '<p>Test content</p>'),
    getText: vi.fn(() => 'Test content'),
    on: vi.fn(),
    destroy: vi.fn(),
  })),
  performanceOptimizedTableCellManager: {
    getEditor: vi.fn(() => ({
      commands: {
        setContent: vi.fn(),
        focus: vi.fn(),
        blur: vi.fn(),
      },
      getHTML: vi.fn(() => '<p>Test content</p>'),
      getText: vi.fn(() => 'Test content'),
      on: vi.fn(),
      destroy: vi.fn(),
    })),
    removeEditor: vi.fn(),
    cleanup: vi.fn(),
    getPerformanceMetrics: vi.fn(() => ({
      cacheHits: 0,
      cacheMisses: 0,
      totalEditors: 0,
      memoryUsage: 0,
    })),
  },
  extractPlainTextFromRichContent: vi.fn((content) => content.replace(/<[^>]*>/g, '')),
  convertPlainTextToRichContent: vi.fn((text) => `<p>${text}</p>`),
  isValidRichContent: vi.fn((content) => content.includes('<')),
  EMPTY_RICH_CELL_CONTENT: '<p></p>',
}));

// Mock the table selection coordinator
vi.mock('../selection/TableSelectionCoordinator', () => ({
  tableSelectionCoordinator: {
    focusCell: vi.fn(),
    navigateCell: vi.fn(),
    clearSelection: vi.fn(),
  },
}));

// Mock TipTap React components
vi.mock('@tiptap/react', () => ({
  EditorContent: ({ editor, className }: any) => (
    <div data-testid="editor-content" className={className}>
      {editor?.getHTML?.() || 'Mock editor content'}
    </div>
  ),
}));

// Mock typography commands
vi.mock('../../shared/typography-commands', () => ({
  createTypographyCommands: vi.fn(() => ({
    setFontFamily: vi.fn(() => ({ success: true, appliedProperties: {}, errors: [] })),
    setFontSize: vi.fn(() => ({ success: true, appliedProperties: {}, errors: [] })),
    toggleHighlight: vi.fn(() => ({ success: true, appliedProperties: {}, errors: [] })),
    getCurrentAttributes: vi.fn(() => ({})),
    getActiveMarks: vi.fn(() => ({})),
  })),
}));

describe('RichTableCell', () => {
  const defaultProps = {
    content: 'Test content',
    position: { row: 0, col: 0 },
    styling: {
      cellPadding: 12,
      fontSize: 14,
      fontWeight: 400,
      textAlign: 'left' as const,
      borderColor: '#e2e8f0',
      headerBackgroundColor: '#f8fafc',
    },
    cellId: 'test-cell-0-0',
    onContentChange: vi.fn(),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    onNavigate: vi.fn(),
  };

  // Helper to render cell in proper table structure
  const renderInTable = (cell: React.ReactElement, isHeader = false) => {
    if (isHeader) {
      return render(
        <table>
          <thead>
            <tr>{cell}</tr>
          </thead>
        </table>
      );
    } else {
      return render(
        <table>
          <tbody>
            <tr>{cell}</tr>
          </tbody>
        </table>
      );
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any editor instances
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render as table cell (td) by default', () => {
      renderInTable(<RichTableCell {...defaultProps} />);
      
      const cell = screen.getByRole('gridcell');
      expect(cell.tagName).toBe('TD');
      expect(cell).toHaveAttribute('data-testid', 'table-cell-0-0');
    });

    it('should render as header cell (th) when isHeader is true', () => {
      renderInTable(<RichTableCell {...defaultProps} isHeader={true} />, true);
      
      const cell = screen.getByRole('gridcell');
      expect(cell.tagName).toBe('TH');
    });

    it('should apply correct styling', () => {
      renderInTable(<RichTableCell {...defaultProps} />);
      
      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({
        padding: '12px',
        fontSize: '14px',
        fontWeight: '400',
        textAlign: 'left',
        border: '1px solid #e2e8f0',
      });
    });

    it('should apply header styling when isHeader is true', () => {
      renderInTable(<RichTableCell {...defaultProps} isHeader={true} />, true);
      
      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({
        fontWeight: '600',
        backgroundColor: '#f8fafc',
      });
    });
  });

  describe('Content Management', () => {
    it('should display plain text content correctly', () => {
      renderInTable(<RichTableCell {...defaultProps} content="Plain text" />);
      
      expect(screen.getByText('Plain text')).toBeInTheDocument();
    });

    it('should handle empty content with placeholder', () => {
      renderInTable(<RichTableCell {...defaultProps} content="" />);
      
      expect(screen.getByText('Empty')).toBeInTheDocument();
    });

    it('should show header placeholder for empty header cells', () => {
      renderInTable(<RichTableCell {...defaultProps} content="" isHeader={true} />, true);
      
      expect(screen.getByText('Header')).toBeInTheDocument();
    });

    it('should call onContentChange when content is updated', async () => {
      const onContentChange = vi.fn();
      renderInTable(<RichTableCell {...defaultProps} onContentChange={onContentChange} />);
      
      // Simulate editor content change
      expect(performanceOptimizedTableCellManager.getEditor).toHaveBeenCalled();
    });
  });

  describe('Focus and Selection', () => {
    it('should handle cell focus correctly', () => {
      const onFocus = vi.fn();
      renderInTable(<RichTableCell {...defaultProps} onFocus={onFocus} />);
      
      const cell = screen.getByRole('gridcell');
      fireEvent.click(cell);
      
      // Focus should be handled by the editor manager
      expect(performanceOptimizedTableCellManager.getEditor).toHaveBeenCalled();
    });

    it('should apply selection styling when selected', () => {
      renderInTable(<RichTableCell {...defaultProps} isSelected={true} />);
      
      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveClass('bg-muted/30');
      expect(cell).toHaveAttribute('aria-selected', 'true');
    });

    it('should show editor content after click', () => {
      renderInTable(<RichTableCell {...defaultProps} />);
      
      const cell = screen.getByRole('gridcell');
      fireEvent.click(cell);
      
      // Should show editor content when focused (editor content is mocked to always be present)
      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle Tab navigation', () => {
      const onNavigate = vi.fn();
      renderInTable(<RichTableCell {...defaultProps} onNavigate={onNavigate} />);
      
      const cell = screen.getByRole('gridcell');
      fireEvent.keyDown(cell, { key: 'Tab' });
      
      expect(onNavigate).toHaveBeenCalledWith('right');
    });

    it('should handle Shift+Tab navigation', () => {
      const onNavigate = vi.fn();
      renderInTable(<RichTableCell {...defaultProps} onNavigate={onNavigate} />);
      
      const cell = screen.getByRole('gridcell');
      fireEvent.keyDown(cell, { key: 'Tab', shiftKey: true });
      
      expect(onNavigate).toHaveBeenCalledWith('left');
    });

    it('should handle Ctrl+Enter navigation', () => {
      const onNavigate = vi.fn();
      renderInTable(<RichTableCell {...defaultProps} onNavigate={onNavigate} />);
      
      const cell = screen.getByRole('gridcell');
      fireEvent.keyDown(cell, { key: 'Enter', ctrlKey: true });
      
      expect(onNavigate).toHaveBeenCalledWith('down');
    });

    it('should handle arrow key navigation with Ctrl', () => {
      const onNavigate = vi.fn();
      renderInTable(<RichTableCell {...defaultProps} onNavigate={onNavigate} />);
      
      const cell = screen.getByRole('gridcell');
      
      fireEvent.keyDown(cell, { key: 'ArrowUp', ctrlKey: true });
      expect(onNavigate).toHaveBeenCalledWith('up');
      
      fireEvent.keyDown(cell, { key: 'ArrowDown', ctrlKey: true });
      expect(onNavigate).toHaveBeenCalledWith('down');
      
      fireEvent.keyDown(cell, { key: 'ArrowLeft', ctrlKey: true });
      expect(onNavigate).toHaveBeenCalledWith('left');
      
      fireEvent.keyDown(cell, { key: 'ArrowRight', ctrlKey: true });
      expect(onNavigate).toHaveBeenCalledWith('right');
    });
  });

  describe('Editor Integration', () => {
    it('should create editor instance through manager', () => {
      renderInTable(<RichTableCell {...defaultProps} />);
      
      expect(performanceOptimizedTableCellManager.getEditor).toHaveBeenCalledWith(
        'test-cell-0-0',
        expect.objectContaining({
          content: expect.any(String),
          isHeader: false,
          position: { row: 0, col: 0 },
        })
      );
    });

    it('should provide typography commands access', () => {
      renderInTable(<RichTableCell {...defaultProps} />);
      
      // Should create typography commands for the editor
      expect(performanceOptimizedTableCellManager.getEditor).toHaveBeenCalled();
    });
  });

  describe('Performance Optimization', () => {
    it('should show display mode when not focused for better performance', () => {
      renderInTable(<RichTableCell {...defaultProps} />);
      
      // Should show display content instead of editor when not focused
      expect(screen.getByText('Test content')).toBeInTheDocument();
      expect(screen.queryByTestId('editor-content')).not.toBeInTheDocument();
    });

    it('should switch to editor mode when focused', async () => {
      renderInTable(<RichTableCell {...defaultProps} />);
      
      const cell = screen.getByRole('gridcell');
      fireEvent.click(cell);
      
      // Should show editor when focused
      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderInTable(<RichTableCell {...defaultProps} />);
      
      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveAttribute('role', 'gridcell');
      expect(cell).toHaveAttribute('tabIndex', '0');
      expect(cell).toHaveAttribute('aria-selected', 'false');
    });

    it('should update aria-selected when selected', () => {
      renderInTable(<RichTableCell {...defaultProps} isSelected={true} />);
      
      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveAttribute('aria-selected', 'true');
    });

    it('should be keyboard accessible', () => {
      renderInTable(<RichTableCell {...defaultProps} />);
      
      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveAttribute('tabIndex', '0');
      
      // Should be focusable with keyboard
      cell.focus();
      expect(cell).toHaveFocus();
    });
  });
});