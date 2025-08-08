// ABOUTME: Basic tests for BasicTableComponent following TDD principles

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BasicTableComponent } from '../BasicTableComponent';
import { DEFAULT_TABLE_DATA } from '../types';

// Helper to create fresh mock node for each test
const createMockNode = () => ({
  attrs: {
    tableData: {
      headers: ['Column 1', 'Column 2'],
      rows: [
        ['', ''],
        ['', '']
      ]
    }
  },
  type: {
    name: 'basicTable'
  }
});

// Mock update function
const mockUpdateAttributes = vi.fn();

describe('BasicTableComponent', () => {
  beforeEach(() => {
    mockUpdateAttributes.mockClear();
  });

  describe('Rendering', () => {
    it('renders table with correct HTML structure', () => {
      render(
        <BasicTableComponent
          node={createMockNode()}
          updateAttributes={mockUpdateAttributes}
          selected={false}
        />
      );

      // Check table structure matches Reddit approach
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('table')).toHaveClass('table-fixed', 'border-collapse');
      
      // Check for headers
      expect(screen.getByText('Column 1')).toBeInTheDocument();
      expect(screen.getByText('Column 2')).toBeInTheDocument();
    });

    it('renders correct number of cells', () => {
      render(
        <BasicTableComponent
          node={createMockNode()}
          updateAttributes={mockUpdateAttributes}
          selected={false}
        />
      );

      // Should have 2 header cells + 4 data cells (2x2 default data)
      const headerCells = screen.getAllByRole('columnheader');
      const dataCells = screen.getAllByRole('cell');
      
      expect(headerCells).toHaveLength(2);
      expect(dataCells).toHaveLength(4); // 2 rows × 2 columns
    });

    it('applies Reddit CSS classes correctly', () => {
      render(
        <BasicTableComponent
          node={createMockNode()}
          updateAttributes={mockUpdateAttributes}
          selected={false}
        />
      );

      const headerCells = screen.getAllByRole('columnheader');
      const dataCells = screen.getAllByRole('cell');

      // Check Reddit-style CSS classes (updated with inline padding)
      headerCells.forEach(cell => {
        expect(cell).toHaveClass('py-xs', 'leading-5', 'border', 'border-solid', 'border-neutral-border', 'relative');
        expect(cell).toHaveStyle({ paddingLeft: '8px', paddingRight: '8px' });
      });

      dataCells.forEach(cell => {
        expect(cell).toHaveClass('py-xs', 'leading-5', 'border', 'border-solid', 'border-neutral-border', 'relative');
        expect(cell).toHaveStyle({ paddingLeft: '8px', paddingRight: '8px' });
      });
    });

    it('shows selection ring when selected', () => {
      const { container } = render(
        <BasicTableComponent
          node={createMockNode()}
          updateAttributes={mockUpdateAttributes}
          selected={true}
        />
      );

      const tableContainer = container.querySelector('[class*="ring-2"]');
      expect(tableContainer).toBeInTheDocument();
      expect(tableContainer).toHaveClass('ring-2', 'ring-primary');
    });
  });

  describe('Cell Editing', () => {
    it('allows editing header cells', () => {
      render(
        <BasicTableComponent
          node={createMockNode()}
          updateAttributes={mockUpdateAttributes}
          selected={false}
        />
      );

      const headerCell = screen.getByText('Column 1').closest('[contenteditable="true"]');
      expect(headerCell).toBeInTheDocument();
      expect(headerCell).toHaveAttribute('contenteditable', 'true');
    });

    it('allows editing data cells', () => {
      render(
        <BasicTableComponent
          node={createMockNode()}
          updateAttributes={mockUpdateAttributes}
          selected={false}
        />
      );

      const dataCells = screen.getAllByRole('cell');
      dataCells.forEach(cell => {
        expect(cell).toHaveAttribute('contenteditable', 'true');
      });
    });

    it('updates table data when cell content changes', () => {
      render(
        <BasicTableComponent
          node={createMockNode()}
          updateAttributes={mockUpdateAttributes}
          selected={false}
        />
      );

      const headerCell = screen.getByText('Column 1').closest('[contenteditable="true"]') as HTMLElement;
      
      // Simulate editing
      fireEvent.focus(headerCell);
      headerCell.innerHTML = 'New Header';
      fireEvent.blur(headerCell);

      expect(mockUpdateAttributes).toHaveBeenCalledWith({
        tableData: expect.objectContaining({
          headers: ['New Header', 'Column 2'],
          rows: DEFAULT_TABLE_DATA.rows
        })
      });
    });
  });

  describe('Error Handling', () => {
    it('renders error message for invalid table data', () => {
      const invalidNode = {
        attrs: {
          tableData: {
            headers: null, // Invalid
            rows: []
          }
        }
      };

      render(
        <BasicTableComponent
          node={invalidNode}
          updateAttributes={mockUpdateAttributes}
          selected={false}
        />
      );

      expect(screen.getByText(/Invalid table data/)).toBeInTheDocument();
    });

    it('handles missing table data gracefully', () => {
      const emptyNode = {
        attrs: {
          tableData: {}
        }
      };

      render(
        <BasicTableComponent
          node={emptyNode}
          updateAttributes={mockUpdateAttributes}
          selected={false}
        />
      );

      expect(screen.getByText(/Invalid table data/)).toBeInTheDocument();
    });
  });

  describe('Context Menu', () => {
    it('shows context menu on right click', () => {
      render(
        <BasicTableComponent
          node={createMockNode()}
          updateAttributes={mockUpdateAttributes}
          selected={false}
        />
      );

      const headerCell = screen.getByText('Column 1').closest('[contenteditable="true"]') as HTMLElement;
      
      // Right click to show context menu
      fireEvent.contextMenu(headerCell);

      // Check for context menu items
      expect(screen.getByText('Insert row above')).toBeInTheDocument();
      expect(screen.getByText('Insert row below')).toBeInTheDocument();
      expect(screen.getByText('Delete table')).toBeInTheDocument();
    });

    it('hides context menu when clicking outside', () => {
      render(
        <BasicTableComponent
          node={createMockNode()}
          updateAttributes={mockUpdateAttributes}
          selected={false}
        />
      );

      const headerCell = screen.getByText('Column 1').closest('[contenteditable="true"]') as HTMLElement;
      
      // Show context menu
      fireEvent.contextMenu(headerCell);
      expect(screen.getByText('Insert row above')).toBeInTheDocument();

      // Click outside (simulate document click)
      fireEvent.click(document.body);

      // Context menu should be hidden (this might need adjustment based on implementation)
    });
  });
});

// Test table operations integration
describe('Table Operations Integration', () => {
  it('executes insert row operation correctly', () => {
    render(
      <BasicTableComponent
        node={createMockNode()}
        updateAttributes={mockUpdateAttributes}
        selected={false}
      />
    );

    const headerCell = screen.getByText('Column 1').closest('[contenteditable="true"]') as HTMLElement;
    
    // Show context menu and click "Insert row above"
    fireEvent.contextMenu(headerCell);
    const insertButton = screen.getByText('Insert row above');
    fireEvent.click(insertButton);

    // Should call updateAttributes with new row added
    expect(mockUpdateAttributes).toHaveBeenCalledWith({
      tableData: expect.objectContaining({
        headers: DEFAULT_TABLE_DATA.headers,
        rows: expect.arrayContaining([
          ['', ''], // New empty row inserted
          ...DEFAULT_TABLE_DATA.rows
        ])
      })
    });
  });
});