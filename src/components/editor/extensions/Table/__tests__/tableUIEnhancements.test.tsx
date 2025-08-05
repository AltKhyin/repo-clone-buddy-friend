// ABOUTME: Tests for table UI component enhancements and inline menu functionality

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimpleTableComponent } from '../SimpleTableComponent';
import { HeaderLayout } from '../TableExtension';

// Mock the table commands registry
vi.mock('../tableCommands', () => ({
  tableComponentRegistry: {
    register: vi.fn(),
    unregister: vi.fn(),
  },
}));

// Mock RichTableCell component
vi.mock('../RichTableCell', () => ({
  RichTableCell: React.forwardRef(({ content, isHeader, onContentChange, children }: any, ref: any) => (
    <td 
      ref={ref}
      className={isHeader ? 'header-cell' : 'data-cell'}
      data-testid={`cell-${isHeader ? 'header' : 'data'}`}
    >
      <input 
        value={content || ''}
        onChange={(e) => onContentChange?.(e.target.value)}
        data-testid="cell-input"
      />
      {children}
    </td>
  )),
}));

// Mock table data migration utilities
vi.mock('../tableMigration', () => ({
  migrateTableData: (data: any) => data,
  ensureTableDataIntegrity: (data: any) => data,
  generateRowHeaders: (count: number) => Array.from({ length: count }, (_, i) => `Row ${i + 1}`),
  updateHeaderLayout: (tableData: any, newLayout: HeaderLayout) => ({
    headerLayout: newLayout,
    rowHeaders: newLayout === 'row-only' || newLayout === 'both' 
      ? Array.from({ length: tableData.rows.length }, (_, i) => `Row ${i + 1}`)
      : [],
  }),
}));

// Mock table data migration
vi.mock('../tableDataMigration', () => ({
  ensureRichTableData: (data: any) => data,
  sanitizeTableData: (data: any) => data,
  getCellContentAsString: (content: any) => typeof content === 'string' ? content : content?.content || '',
  getCellContentAsRich: (content: any) => typeof content === 'string' ? content : content?.content || '',
  updateCellContent: (cell: any, content: string) => content,
  createRichCellData: (content: string) => content,
}));

// Mock table editor config
vi.mock('../tableEditorConfig', () => ({
  convertPlainTextToRichContent: (text: string) => text,
  extractPlainTextFromRichContent: (content: any) => content,
  isValidRichContent: () => true,
}));

describe('Table UI Component Enhancements', () => {
  const mockNode = {
    attrs: {
      tableId: 'test-table',
      headers: ['Col 1', 'Col 2'],
      rowHeaders: ['Row 1', 'Row 2'],
      headerLayout: 'column-only' as HeaderLayout,
      rows: [['A', 'B'], ['C', 'D']],
      styling: {
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gridLineColor: '#e2e8f0',
        backgroundColor: 'transparent',
        headerBackgroundColor: '#f8fafc',
        alternatingRowColor: '#f8fafc',
        enableAlternatingRows: false,
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
      isRichContent: true,
    },
  };

  const mockProps = {
    node: mockNode,
    updateAttributes: vi.fn(),
    deleteNode: vi.fn(),
    selected: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Enhanced Inline Menu', () => {
    it('should render header layout dropdown when table is selected', () => {
      render(<SimpleTableComponent {...mockProps} />);
      
      expect(screen.getByText('Layout')).toBeInTheDocument();
    });

    it('should render styling dropdown when table is selected', () => {
      render(<SimpleTableComponent {...mockProps} />);
      
      expect(screen.getByText('Style')).toBeInTheDocument();
    });

    it('should not render enhanced controls when table is not selected', () => {
      render(<SimpleTableComponent {...mockProps} selected={false} />);
      
      expect(screen.queryByText('Layout')).not.toBeInTheDocument();
      expect(screen.queryByText('Style')).not.toBeInTheDocument();
    });

    it('should show all header layout options in dropdown', async () => {
      const user = userEvent.setup();
      render(<SimpleTableComponent {...mockProps} />);
      
      // Click layout dropdown
      await user.click(screen.getByText('Layout'));
      
      await waitFor(() => {
        expect(screen.getByText('Column Headers Only')).toBeInTheDocument();
        expect(screen.getByText('Row Headers Only')).toBeInTheDocument();
        expect(screen.getByText('Both Headers')).toBeInTheDocument();
        expect(screen.getByText('No Headers')).toBeInTheDocument();
      });
    });

    it('should call updateAttributes when header layout is changed', async () => {
      const user = userEvent.setup();
      render(<SimpleTableComponent {...mockProps} />);
      
      // Click layout dropdown
      await user.click(screen.getByText('Layout'));
      
      // Click row headers only option
      await waitFor(async () => {
        await user.click(screen.getByText('Row Headers Only'));
      });
      
      expect(mockProps.updateAttributes).toHaveBeenCalledWith(expect.objectContaining({
        headerLayout: 'row-only',
        rowHeaders: ['Row 1', 'Row 2'],
      }));
    });
  });

  describe('Table Rendering with Header Layouts', () => {
    it('should render column headers only layout', () => {
      const columnOnlyNode = {
        ...mockNode,
        attrs: {
          ...mockNode.attrs,
          headerLayout: 'column-only' as HeaderLayout,
        },
      };
      
      render(<SimpleTableComponent {...mockProps} node={columnOnlyNode} />);
      
      // Should have column headers
      expect(screen.getAllByTestId('cell-header')).toHaveLength(2);
      // Should have data cells
      expect(screen.getAllByTestId('cell-data')).toHaveLength(4);
    });

    it('should render row headers only layout', () => {
      const rowOnlyNode = {
        ...mockNode,
        attrs: {
          ...mockNode.attrs,
          headerLayout: 'row-only' as HeaderLayout,
        },
      };
      
      render(<SimpleTableComponent {...mockProps} node={rowOnlyNode} />);
      
      // Should still render data cells
      expect(screen.getAllByTestId('cell-data')).toHaveLength(4);
    });

    it('should render both headers layout', () => {
      const bothHeadersNode = {
        ...mockNode,
        attrs: {
          ...mockNode.attrs,
          headerLayout: 'both' as HeaderLayout,
        },
      };
      
      render(<SimpleTableComponent {...mockProps} node={bothHeadersNode} />);
      
      // Should have both column and row headers plus data cells
      expect(screen.getAllByTestId('cell-header')).toHaveLength(2);
      expect(screen.getAllByTestId('cell-data')).toHaveLength(4);
    });

    it('should render no headers layout', () => {
      const noHeadersNode = {
        ...mockNode,
        attrs: {
          ...mockNode.attrs,
          headerLayout: 'none' as HeaderLayout,
        },
      };
      
      render(<SimpleTableComponent {...mockProps} node={noHeadersNode} />);
      
      // Should only have data cells
      expect(screen.getAllByTestId('cell-data')).toHaveLength(4);
      expect(screen.queryAllByTestId('cell-header')).toHaveLength(0);
    });
  });

  describe('Styling Features', () => {
    it('should apply custom background color to table', () => {
      const customBgNode = {
        ...mockNode,
        attrs: {
          ...mockNode.attrs,
          styling: {
            ...mockNode.attrs.styling,
            backgroundColor: '#f0f0f0',
          },
        },
      };
      
      render(<SimpleTableComponent {...mockProps} node={customBgNode} />);
      
      const table = document.querySelector('table');
      expect(table).toHaveStyle('background-color: #f0f0f0');
    });

    it('should apply custom grid line color to table border', () => {
      const customGridNode = {
        ...mockNode,
        attrs: {
          ...mockNode.attrs,
          styling: {
            ...mockNode.attrs.styling,
            gridLineColor: '#ff0000',
          },
        },
      };
      
      render(<SimpleTableComponent {...mockProps} node={customGridNode} />);
      
      const table = document.querySelector('table');
      expect(table).toHaveStyle('border: 1px solid #ff0000');
    });

    it('should apply alternating row colors when enabled', () => {
      const alternatingNode = {
        ...mockNode,
        attrs: {
          ...mockNode.attrs,
          styling: {
            ...mockNode.attrs.styling,
            enableAlternatingRows: true,
            alternatingRowColor: '#f9f9f9',
          },
        },
      };
      
      render(<SimpleTableComponent {...mockProps} node={alternatingNode} />);
      
      const rows = document.querySelectorAll('tbody tr');
      // First row should have transparent background (can be 'transparent' or 'rgba(0, 0, 0, 0)')
      const firstRowBg = window.getComputedStyle(rows[0]).backgroundColor;
      expect(['transparent', 'rgba(0, 0, 0, 0)'].includes(firstRowBg)).toBe(true);
      // Second row should have alternating color
      expect(rows[1]).toHaveStyle('background-color: #f9f9f9');
    });
  });

  describe('Row Management with Headers', () => {
    it('should remove corresponding row header when removing a row', async () => {
      const bothHeadersNode = {
        ...mockNode,
        attrs: {
          ...mockNode.attrs,
          headerLayout: 'both' as HeaderLayout,
          rowHeaders: ['Row 1', 'Row 2'],
        },
      };
      
      render(<SimpleTableComponent {...mockProps} node={bothHeadersNode} />);
      
      // Find and click row dropdown menu (first row)
      const rowMenus = screen.getAllByRole('button');
      const rowMenuButton = rowMenus.find(button => button.querySelector('.lucide-more-vertical'));
      if (rowMenuButton) {
        fireEvent.click(rowMenuButton);
        
        await waitFor(() => {
          const removeButton = screen.getByText('Remove Row');
          fireEvent.click(removeButton);
        });
        
        expect(mockProps.updateAttributes).toHaveBeenCalledWith(expect.objectContaining({
          rows: [['C', 'D']], // Should remove first row
          rowHeaders: ['Row 2'], // Should remove corresponding row header
        }));
      }
    });
  });
});