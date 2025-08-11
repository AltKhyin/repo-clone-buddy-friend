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

  describe('Cursor-Based Positioning', () => {
    // Mock window dimensions for viewport boundary tests
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    beforeEach(() => {
      // Set mock window dimensions
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
    });

    afterEach(() => {
      // Restore original dimensions
      Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, writable: true });
    });

    it('positions menu at exact cursor coordinates when space available', () => {
      const position = { x: 150, y: 200 };
      const { container } = render(
        <TableContextMenu {...defaultProps} position={position} />
      );
      
      const menu = container.querySelector('.absolute');
      expect(menu).toHaveStyle({ left: '150px', top: '200px' });
    });

    it('adjusts horizontal position when menu would overflow right edge', () => {
      // Position near right edge of viewport (1200px wide)
      const position = { x: 1150, y: 200 }; // Menu width is 192px + 8px padding
      const { container } = render(
        <TableContextMenu {...defaultProps} position={position} />
      );
      
      const menu = container.querySelector('.absolute');
      // Should be repositioned to fit within viewport
      expect(menu).not.toHaveStyle({ left: '1150px' });
      // Should be positioned at viewport width - menu width - padding
      expect(menu).toHaveStyle({ left: '1000px' }); // 1200 - 192 - 8 = 1000
    });

    it('adjusts vertical position when menu would overflow bottom edge', () => {
      // Position near bottom edge of viewport (800px high)
      const position = { x: 100, y: 750 }; // Menu height is ~300px + 8px padding
      const { container } = render(
        <TableContextMenu {...defaultProps} position={position} />
      );
      
      const menu = container.querySelector('.absolute');
      // Should be repositioned to fit within viewport
      expect(menu).not.toHaveStyle({ top: '750px' });
      // Should be positioned at viewport height - menu height - padding
      expect(menu).toHaveStyle({ top: '492px' }); // 800 - 300 - 8 = 492
    });

    it('prevents menu from going off left edge', () => {
      const position = { x: -50, y: 200 }; // Negative x position
      const { container } = render(
        <TableContextMenu {...defaultProps} position={position} />
      );
      
      const menu = container.querySelector('.absolute');
      // Should be repositioned to padding distance from left
      expect(menu).toHaveStyle({ left: '8px' });
    });

    it('prevents menu from going off top edge', () => {
      const position = { x: 100, y: -50 }; // Negative y position
      const { container } = render(
        <TableContextMenu {...defaultProps} position={position} />
      );
      
      const menu = container.querySelector('.absolute');
      // Should be repositioned to padding distance from top
      expect(menu).toHaveStyle({ top: '8px' });
    });

    it('handles corner cases when both x and y need adjustment', () => {
      const position = { x: 1150, y: 750 }; // Both near edges
      const { container } = render(
        <TableContextMenu {...defaultProps} position={position} />
      );
      
      const menu = container.querySelector('.absolute');
      // Both coordinates should be adjusted
      expect(menu).toHaveStyle({ 
        left: '1000px', // Adjusted for right edge
        top: '492px'    // Adjusted for bottom edge
      });
    });
  });

  describe('Typography Controls', () => {
    it('renders typography section with font family and size dropdowns', () => {
      const { container } = render(<TableContextMenu {...defaultProps} />);
      
      expect(screen.getByLabelText('Font Family')).toBeInTheDocument();
      expect(screen.getByLabelText('Text Size')).toBeInTheDocument();
      
      // Check dropdown options exist
      const fontFamilyDropdown = screen.getByLabelText('Font Family');
      expect(fontFamilyDropdown.tagName).toBe('SELECT');
      
      const fontSizeDropdown = screen.getByLabelText('Text Size');  
      expect(fontSizeDropdown.tagName).toBe('SELECT');
    });

    it('shows current font family value in dropdown', () => {
      const tableDataWithFont = { 
        ...mockTableData, 
        fontFamily: 'Georgia, serif' 
      };
      render(<TableContextMenu {...defaultProps} tableData={tableDataWithFont} />);
      
      const fontFamilyDropdown = screen.getByLabelText('Font Family') as HTMLSelectElement;
      expect(fontFamilyDropdown.value).toBe('Georgia, serif');
    });

    it('shows current font size value in dropdown', () => {
      const tableDataWithSize = { 
        ...mockTableData, 
        fontSize: '18px' 
      };
      render(<TableContextMenu {...defaultProps} tableData={tableDataWithSize} />);
      
      const fontSizeDropdown = screen.getByLabelText('Text Size') as HTMLSelectElement;
      expect(fontSizeDropdown.value).toBe('18px');
    });

    it('calls onAction with setFontFamily when font family changed', () => {
      render(<TableContextMenu {...defaultProps} />);
      
      const fontFamilyDropdown = screen.getByLabelText('Font Family');
      fireEvent.change(fontFamilyDropdown, { target: { value: 'Georgia, serif' } });
      
      expect(mockOnAction).toHaveBeenCalledWith('setFontFamily', {
        ...defaultProps.selectedCell,
        value: 'Georgia, serif'
      });
    });

    it('calls onAction with setFontSize when font size changed', () => {
      render(<TableContextMenu {...defaultProps} />);
      
      const fontSizeDropdown = screen.getByLabelText('Text Size');
      fireEvent.change(fontSizeDropdown, { target: { value: '20px' } });
      
      expect(mockOnAction).toHaveBeenCalledWith('setFontSize', {
        ...defaultProps.selectedCell,
        value: '20px'
      });
    });

    it('closes menu after typography selection', () => {
      render(<TableContextMenu {...defaultProps} />);
      
      const fontFamilyDropdown = screen.getByLabelText('Font Family');
      fireEvent.change(fontFamilyDropdown, { target: { value: 'Monaco, monospace' } });
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles default font family selection correctly', () => {
      render(<TableContextMenu {...defaultProps} />);
      
      const fontFamilyDropdown = screen.getByLabelText('Font Family');
      fireEvent.change(fontFamilyDropdown, { target: { value: '' } }); // Empty = default
      
      expect(mockOnAction).toHaveBeenCalledWith('setFontFamily', {
        ...defaultProps.selectedCell,
        value: undefined
      });
    });

    it('uses theme colors for typography controls', () => {
      render(<TableContextMenu {...defaultProps} />);
      
      const fontFamilyDropdown = screen.getByLabelText('Font Family');
      const fontSizeDropdown = screen.getByLabelText('Text Size');
      
      // Both dropdowns should have inline styles applied from theme
      expect(fontFamilyDropdown).toHaveAttribute('style');
      expect(fontSizeDropdown).toHaveAttribute('style');
      
      // Verify they have background color styling
      const fontFamilyStyle = fontFamilyDropdown.getAttribute('style');
      const fontSizeStyle = fontSizeDropdown.getAttribute('style');
      
      expect(fontFamilyStyle).toContain('background-color');
      expect(fontSizeStyle).toContain('background-color');
    });
  });

});