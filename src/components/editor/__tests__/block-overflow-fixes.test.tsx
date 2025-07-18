// ABOUTME: Tests for block overflow fixes ensuring inline editing tools are visible

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableBlockNode } from '../Nodes/TableBlockNode';

// Mock dependencies
const mockUpdateNode = vi.fn();
const mockUseEditorStore = {
  updateNode: mockUpdateNode,
};

const mockUseEditorTheme = {
  colors: {
    semantic: {
      table: {
        headerBackground: '#f8f9fa',
        headerText: '#333',
        cellBackground: '#fff',
        cellText: '#333',
        rowAlternate: '#f8f9fa',
        border: '#e5e7eb',
      },
    },
    block: {
      textSecondary: '#666',
      backgroundSecondary: '#f8f9fa',
    },
  },
};

vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => mockUseEditorStore,
}));

vi.mock('@/hooks/useEditorTheme', () => ({
  useEditorTheme: () => mockUseEditorTheme,
}));

const sampleTableData = {
  headers: ['Name', 'Value', 'Notes'],
  rows: [
    ['Item 1', '100', 'First row'],
    ['Item 2', '200', 'Second row'],
  ],
  sortable: true,
  alternatingRowColors: true,
  headerStyle: {
    backgroundColor: '#f8f9fa',
    textColor: '#333',
  },
  paddingX: 16,
  paddingY: 16,
  backgroundColor: 'transparent',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#e5e7eb',
};

describe('Block Overflow Fixes', () => {
  it('should render table actions with proper z-index when selected', () => {
    render(<TableBlockNode id="test-table" data={sampleTableData} selected={true} />);

    // Find the table actions container by title attribute for the "Add row" button
    const addRowButton = screen.getByTitle('Add row');
    const tableActions = addRowButton.parentElement;

    // Check that it has the proper z-index class
    expect(tableActions).toHaveClass('z-50');
    expect(tableActions).toHaveClass('absolute');
    expect(tableActions).toHaveClass('-top-12');
  });

  it('should not render table actions when not selected', () => {
    render(<TableBlockNode id="test-table" data={sampleTableData} selected={false} />);

    // Table actions should not be visible when not selected
    expect(screen.queryByTitle('Add row')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Add column')).not.toBeInTheDocument();
  });

  it('should render table with proper structure for inline editing', () => {
    render(<TableBlockNode id="test-table" data={sampleTableData} selected={true} />);

    // Check that table exists
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Check that header cells exist and are clickable for editing
    const headerCells = screen.getAllByRole('columnheader');
    expect(headerCells).toHaveLength(3);
    expect(headerCells[0]).toHaveTextContent('Name');
    expect(headerCells[1]).toHaveTextContent('Value');
    expect(headerCells[2]).toHaveTextContent('Notes');

    // Check that data cells exist
    const dataCells = screen.getAllByRole('cell');
    expect(dataCells).toHaveLength(6); // 2 rows × 3 columns
  });

  it('should render with responsive overflow container', () => {
    render(<TableBlockNode id="test-table" data={sampleTableData} selected={true} />);

    // Find the responsive table container
    const overflowContainer = screen.getByRole('table').parentElement;

    // Should have overflow-x-auto for horizontal scrolling of table content
    expect(overflowContainer).toHaveClass('overflow-x-auto');
  });

  it('should handle empty table state correctly', () => {
    const emptyTableData = {
      ...sampleTableData,
      headers: [],
      rows: [],
    };

    render(<TableBlockNode id="test-table" data={emptyTableData} selected={true} />);

    // Should show empty state
    expect(screen.getByText('Create Your Table')).toBeInTheDocument();
    expect(screen.getByText('Start with Sample Data')).toBeInTheDocument();
    expect(screen.getByText('Create Empty Table (3x2)')).toBeInTheDocument();
  });

  it('should apply correct styling for block positioning', () => {
    const { container } = render(
      <TableBlockNode id="test-table" data={sampleTableData} selected={true} />
    );

    // Find the main block container
    const blockContainer = container.querySelector('[data-block-type="tableBlock"]');

    // Should have relative positioning for absolute child elements
    expect(blockContainer).toHaveClass('relative');
    expect(blockContainer).toHaveClass('cursor-pointer');
  });
});
