// ABOUTME: Tests for SimpleTableComponent Reddit-style table functionality

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimpleTableComponent } from '../SimpleTableComponent';

// Mock TipTap's NodeViewWrapper
vi.mock('@tiptap/react', () => ({
  NodeViewWrapper: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

describe('SimpleTableComponent', () => {
  const mockUpdateAttributes = vi.fn();
  const mockDeleteNode = vi.fn();

  const defaultProps = {
    node: {
      attrs: {
        tableId: 'test-table-1',
        headers: ['Column 1', 'Column 2', 'Column 3'],
        rows: [
          ['Cell 1', 'Cell 2', 'Cell 3'],
          ['Cell 4', 'Cell 5', 'Cell 6'],
        ],
        styling: {
          borderStyle: 'solid',
          borderWidth: 1,
          borderColor: '#e2e8f0',
          backgroundColor: 'transparent',
          headerBackgroundColor: '#f8fafc',
          cellPadding: 12,
          textAlign: 'left',
          fontSize: 14,
          fontWeight: 400,
          striped: false,
          compact: false,
        },
        settings: {
          sortable: false,
          resizable: true,
          showHeaders: true,
          minRows: 1,
          maxRows: 50,
        },
      },
    },
    updateAttributes: mockUpdateAttributes,
    deleteNode: mockDeleteNode,
    selected: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render table with headers and cells', () => {
    render(<SimpleTableComponent {...defaultProps} />);

    // Check headers
    expect(screen.getByText('Column 1')).toBeInTheDocument();
    expect(screen.getByText('Column 2')).toBeInTheDocument();
    expect(screen.getByText('Column 3')).toBeInTheDocument();

    // Check cells
    expect(screen.getByText('Cell 1')).toBeInTheDocument();
    expect(screen.getByText('Cell 2')).toBeInTheDocument();
    expect(screen.getByText('Cell 3')).toBeInTheDocument();
  });

  it('should show controls when selected', () => {
    render(<SimpleTableComponent {...defaultProps} selected={true} />);

    // Check for control buttons
    expect(screen.getByText('Row')).toBeInTheDocument();
    expect(screen.getByText('Col')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /trash/i })).toBeInTheDocument();
  });

  it('should not show controls when not selected', () => {
    render(<SimpleTableComponent {...defaultProps} selected={false} />);

    // Controls should not be visible
    expect(screen.queryByText('Row')).not.toBeInTheDocument();
    expect(screen.queryByText('Col')).not.toBeInTheDocument();
  });

  it('should handle cell click for editing', () => {
    render(<SimpleTableComponent {...defaultProps} />);

    const cellElement = screen.getByText('Cell 1');
    fireEvent.click(cellElement);

    // Should show input field after clicking
    expect(screen.getByDisplayValue('Cell 1')).toBeInTheDocument();
  });

  it('should handle empty cells with placeholder text', () => {
    const propsWithEmptyCell = {
      ...defaultProps,
      node: {
        ...defaultProps.node,
        attrs: {
          ...defaultProps.node.attrs,
          rows: [['', 'Cell 2', 'Cell 3']],
        },
      },
    };

    render(<SimpleTableComponent {...propsWithEmptyCell} />);

    // Should show "Empty" placeholder for empty cells
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });

  it('should call deleteNode when delete button is clicked', () => {
    render(<SimpleTableComponent {...defaultProps} selected={true} />);

    const deleteButton = screen.getByRole('button', { name: /trash/i });
    fireEvent.click(deleteButton);

    expect(mockDeleteNode).toHaveBeenCalled();
  });

  it('should handle keyboard shortcuts in edit mode', () => {
    render(<SimpleTableComponent {...defaultProps} />);

    // Click to edit
    const cellElement = screen.getByText('Cell 1');
    fireEvent.click(cellElement);

    const input = screen.getByDisplayValue('Cell 1');

    // Change value
    fireEvent.change(input, { target: { value: 'New Value' } });

    // Press Enter to save
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should call updateAttributes with new data
    expect(mockUpdateAttributes).toHaveBeenCalled();
  });

  it('should handle Escape key to cancel editing', () => {
    render(<SimpleTableComponent {...defaultProps} />);

    // Click to edit
    const cellElement = screen.getByText('Cell 1');
    fireEvent.click(cellElement);

    const input = screen.getByDisplayValue('Cell 1');

    // Change value
    fireEvent.change(input, { target: { value: 'New Value' } });

    // Press Escape to cancel
    fireEvent.keyDown(input, { key: 'Escape' });

    // Should not call updateAttributes
    expect(mockUpdateAttributes).not.toHaveBeenCalled();

    // Should return to display mode
    expect(screen.queryByDisplayValue('New Value')).not.toBeInTheDocument();
    expect(screen.getByText('Cell 1')).toBeInTheDocument();
  });

  it('should add row when add row button is clicked', () => {
    render(<SimpleTableComponent {...defaultProps} selected={true} />);

    const addRowButton = screen.getByText('Row');
    fireEvent.click(addRowButton);

    expect(mockUpdateAttributes).toHaveBeenCalledWith(
      expect.objectContaining({
        rows: expect.arrayContaining([
          expect.any(Array), // existing rows
          expect.any(Array), // existing rows
          ['', '', ''], // new empty row
        ]),
      })
    );
  });

  it('should add column when add column button is clicked', () => {
    render(<SimpleTableComponent {...defaultProps} selected={true} />);

    const addColButton = screen.getByText('Col');
    fireEvent.click(addColButton);

    expect(mockUpdateAttributes).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: ['Column 1', 'Column 2', 'Column 3', 'Column 4'],
        rows: [
          ['Cell 1', 'Cell 2', 'Cell 3', ''],
          ['Cell 4', 'Cell 5', 'Cell 6', ''],
        ],
      })
    );
  });
});
