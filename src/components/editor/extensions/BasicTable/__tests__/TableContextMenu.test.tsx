// ABOUTME: Tests for TableContextMenu component following TDD principles

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TableContextMenu } from '../TableContextMenu';
import { BasicTableData, CellPosition } from '../types';

// Mock table data
const mockTableData: BasicTableData = {
  headers: ['Col A', 'Col B', 'Col C'],
  rows: [
    ['A1', 'B1', 'C1'],
    ['A2', 'B2', 'C2']
  ]
};

// Mock handlers
const mockOnAction = vi.fn();
const mockOnClose = vi.fn();

describe('TableContextMenu', () => {
  beforeEach(() => {
    mockOnAction.mockClear();
    mockOnClose.mockClear();
  });

  const defaultProps = {
    position: { x: 100, y: 150 },
    selectedCell: { row: 0, col: 1 } as CellPosition,
    tableData: mockTableData,
    onAction: mockOnAction,
    onClose: mockOnClose
  };

  describe('Rendering', () => {
    it('renders context menu at correct position', () => {
      const { container } = render(<TableContextMenu {...defaultProps} />);
      
      const menu = container.querySelector('.absolute');
      expect(menu).toHaveStyle({
        left: '100px',
        top: '150px'
      });
    });

    it('renders all menu items for data cell', () => {
      render(<TableContextMenu {...defaultProps} />);
      
      // Row operations
      expect(screen.getByText('Insert row above')).toBeInTheDocument();
      expect(screen.getByText('Insert row below')).toBeInTheDocument();
      
      // Column operations  
      expect(screen.getByText('Insert column before')).toBeInTheDocument();
      expect(screen.getByText('Insert column after')).toBeInTheDocument();
      
      // Alignment
      expect(screen.getByText('Align left')).toBeInTheDocument();
      expect(screen.getByText('Align center')).toBeInTheDocument();
      expect(screen.getByText('Align right')).toBeInTheDocument();
      
      // Deletion
      expect(screen.getByText('Delete row')).toBeInTheDocument();
      expect(screen.getByText('Delete column')).toBeInTheDocument();
      expect(screen.getByText('Delete table')).toBeInTheDocument();
    });

    it('disables delete row for header cells', () => {
      const headerCellProps = {
        ...defaultProps,
        selectedCell: { row: -1, col: 0 }
      };
      
      render(<TableContextMenu {...headerCellProps} />);
      
      // Delete row should not be visible for header row
      expect(screen.queryByText('Delete row')).not.toBeInTheDocument();
    });

    it('disables delete column when only one column exists', () => {
      const singleColumnData: BasicTableData = {
        headers: ['Only Col'],
        rows: [['A1'], ['A2']]
      };
      
      const singleColProps = {
        ...defaultProps,
        tableData: singleColumnData
      };
      
      render(<TableContextMenu {...singleColProps} />);
      
      // Delete column should not be visible
      expect(screen.queryByText('Delete column')).not.toBeInTheDocument();
    });

    it('disables delete row when only one row exists', () => {
      const singleRowData: BasicTableData = {
        headers: ['Col A', 'Col B'],
        rows: [['A1', 'B1']]
      };
      
      const singleRowProps = {
        ...defaultProps,
        tableData: singleRowData
      };
      
      render(<TableContextMenu {...singleRowProps} />);
      
      // Delete row should not be visible
      expect(screen.queryByText('Delete row')).not.toBeInTheDocument();
    });
  });

  describe('Menu Actions', () => {
    it('handles row insertion actions', () => {
      render(<TableContextMenu {...defaultProps} />);
      
      // Test insert row above
      fireEvent.click(screen.getByText('Insert row above'));
      expect(mockOnAction).toHaveBeenCalledWith('insertRowAbove', defaultProps.selectedCell);
      
      mockOnAction.mockClear();
      
      // Test insert row below
      fireEvent.click(screen.getByText('Insert row below'));
      expect(mockOnAction).toHaveBeenCalledWith('insertRowBelow', defaultProps.selectedCell);
    });

    it('handles column insertion actions', () => {
      render(<TableContextMenu {...defaultProps} />);
      
      // Test insert column before
      fireEvent.click(screen.getByText('Insert column before'));
      expect(mockOnAction).toHaveBeenCalledWith('insertColumnBefore', defaultProps.selectedCell);
      
      mockOnAction.mockClear();
      
      // Test insert column after
      fireEvent.click(screen.getByText('Insert column after'));
      expect(mockOnAction).toHaveBeenCalledWith('insertColumnAfter', defaultProps.selectedCell);
    });

    it('handles alignment actions', () => {
      render(<TableContextMenu {...defaultProps} />);
      
      // Test alignment options
      fireEvent.click(screen.getByText('Align center'));
      expect(mockOnAction).toHaveBeenCalledWith('alignCenter', defaultProps.selectedCell);
      
      mockOnAction.mockClear();
      
      fireEvent.click(screen.getByText('Align right'));
      expect(mockOnAction).toHaveBeenCalledWith('alignRight', defaultProps.selectedCell);
    });

    it('handles deletion actions', () => {
      render(<TableContextMenu {...defaultProps} />);
      
      // Test delete row
      fireEvent.click(screen.getByText('Delete row'));
      expect(mockOnAction).toHaveBeenCalledWith('deleteRow', defaultProps.selectedCell);
      
      mockOnAction.mockClear();
      
      // Test delete table
      fireEvent.click(screen.getByText('Delete table'));
      expect(mockOnAction).toHaveBeenCalledWith('deleteTable', defaultProps.selectedCell);
    });

    it('closes menu after action', () => {
      render(<TableContextMenu {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Insert row above'));
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Menu Interaction', () => {
    it('closes menu when clicking outside', () => {
      render(<TableContextMenu {...defaultProps} />);
      
      // Simulate click on document
      fireEvent.click(document.body);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('prevents propagation when clicking menu', () => {
      const { container } = render(<TableContextMenu {...defaultProps} />);
      
      const menu = container.querySelector('.pointer-events-auto');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'stopPropagation');
      
      if (menu) {
        fireEvent(menu, clickEvent);
      }
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Menu Item Styling', () => {
    it('applies danger styling to dangerous actions', () => {
      render(<TableContextMenu {...defaultProps} />);
      
      const deleteTableButton = screen.getByText('Delete table');
      // Now using theme-based inline styles instead of hardcoded classes
      expect(deleteTableButton).toHaveStyle({ color: 'hsl(var(--destructive))' });
      
      const deleteRowButton = screen.getByText('Delete row');
      expect(deleteRowButton).toHaveStyle({ color: 'hsl(var(--destructive))' });
    });

    it('renders separators between menu sections', () => {
      const { container } = render(<TableContextMenu {...defaultProps} />);
      
      const separators = container.querySelectorAll('hr');
      expect(separators.length).toBeGreaterThan(0);
    });
  });
});