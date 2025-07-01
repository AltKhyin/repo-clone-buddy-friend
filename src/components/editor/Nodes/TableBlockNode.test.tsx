// ABOUTME: Tests for TableBlockNode ensuring enhanced UX and table functionality

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableBlockNode } from './TableBlockNode';

// Mock the editor store
const mockUpdateNode = vi.fn();

vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => ({
    updateNode: mockUpdateNode,
    canvasTheme: 'light',
    selectedNodeId: null,
  }),
}));

// Mock other dependencies
vi.mock('../components/UnifiedNodeResizer', () => ({
  UnifiedNodeResizer: () => <div data-testid="unified-node-resizer" />,
}));

vi.mock('../utils/blockStyling', () => ({
  useUnifiedBlockStyling: () => ({
    selectionClasses: 'selection-class',
    borderStyles: {},
  }),
  getSelectionIndicatorProps: () => ({ 'data-testid': 'selection-indicator' }),
  getThemeAwarePlaceholderClasses: () => 'placeholder-class',
}));

vi.mock('@/components/editor/theme/ThemeIntegration', () => ({
  ThemedBlockWrapper: ({ children, ...props }: any) => (
    <div data-testid="themed-block-wrapper" {...props}>
      {children}
    </div>
  ),
  useThemedStyles: () => ({}),
  useThemedColors: () => null,
}));

// Mock React Flow handles
vi.mock('@xyflow/react', () => ({
  Handle: ({ type, position }: any) => <div data-testid={`handle-${type}-${position}`} />,
  Position: {
    Top: 'top',
    Bottom: 'bottom',
  },
}));

describe('TableBlockNode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State UX Enhancements', () => {
    it('should show enhanced empty state with quick start options when no headers', () => {
      const emptyTableData = {
        headers: [],
        rows: [],
      };

      render(<TableBlockNode id="test-table" data={emptyTableData} selected={false} />);

      // Should show enhanced empty state
      expect(screen.getByText('Create Your Table')).toBeInTheDocument();
      expect(
        screen.getByText('Build data tables with sorting, editing, and customization features')
      ).toBeInTheDocument();

      // Should show quick start buttons
      expect(screen.getByText('Start with Sample Data')).toBeInTheDocument();
      expect(screen.getByText('Create Empty Table (3x2)')).toBeInTheDocument();

      // Should show pro tip
      expect(screen.getByText('Pro tip:')).toBeInTheDocument();
      expect(
        screen.getByText(/Click cells to edit, hover rows\/columns for controls/)
      ).toBeInTheDocument();
    });

    it('should initialize table with sample data when clicking "Start with Sample Data"', async () => {
      const emptyTableData = {
        headers: [],
        rows: [],
      };

      render(<TableBlockNode id="test-table" data={emptyTableData} selected={false} />);

      // Click "Start with Sample Data" button
      const sampleDataButton = screen.getByText('Start with Sample Data');
      await userEvent.click(sampleDataButton);

      // Should call updateNode with sample data
      expect(mockUpdateNode).toHaveBeenCalledWith('test-table', {
        data: expect.objectContaining({
          headers: ['Name', 'Value', 'Notes'],
          rows: [
            ['Item 1', '100', 'First row'],
            ['Item 2', '200', 'Second row'],
            ['Item 3', '300', 'Third row'],
          ],
        }),
      });
    });

    it('should initialize table with empty structure when clicking "Create Empty Table"', async () => {
      const emptyTableData = {
        headers: [],
        rows: [],
      };

      render(<TableBlockNode id="test-table" data={emptyTableData} selected={false} />);

      // Click "Create Empty Table" button
      const emptyTableButton = screen.getByText('Create Empty Table (3x2)');
      await userEvent.click(emptyTableButton);

      // Should call updateNode with empty structure
      expect(mockUpdateNode).toHaveBeenCalledWith('test-table', {
        data: expect.objectContaining({
          headers: ['Column 1', 'Column 2', 'Column 3'],
          rows: [
            ['', '', ''],
            ['', '', ''],
          ],
        }),
      });
    });
  });

  describe('Table Functionality', () => {
    const sampleTableData = {
      headers: ['Name', 'Age', 'City'],
      rows: [
        ['John', '25', 'New York'],
        ['Jane', '30', 'Los Angeles'],
      ],
    };

    it('should render table with data correctly', () => {
      render(<TableBlockNode id="test-table" data={sampleTableData} selected={false} />);

      // Should render headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('City')).toBeInTheDocument();

      // Should render data rows
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText('Jane')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('Los Angeles')).toBeInTheDocument();
    });

    it('should show table controls when selected', () => {
      render(<TableBlockNode id="test-table" data={sampleTableData} selected={true} />);

      // Should show add row and column buttons
      expect(screen.getByText('Row')).toBeInTheDocument();
      expect(screen.getByText('Column')).toBeInTheDocument();
    });

    it('should add new row with correct number of columns', async () => {
      render(<TableBlockNode id="test-table" data={sampleTableData} selected={true} />);

      const addRowButton = screen.getByText('Row');
      await userEvent.click(addRowButton);

      // Should call updateNode with new row that has same number of columns as headers
      expect(mockUpdateNode).toHaveBeenCalledWith('test-table', {
        data: expect.objectContaining({
          rows: expect.arrayContaining([
            ['John', '25', 'New York'],
            ['Jane', '30', 'Los Angeles'],
            ['', '', ''], // New row with 3 columns (same as headers)
          ]),
        }),
      });
    });

    it('should add new column and normalize all rows', async () => {
      render(<TableBlockNode id="test-table" data={sampleTableData} selected={true} />);

      const addColumnButton = screen.getByText('Column');
      await userEvent.click(addColumnButton);

      // Should call updateNode with new column and normalized rows
      expect(mockUpdateNode).toHaveBeenCalledWith('test-table', {
        data: expect.objectContaining({
          headers: ['Name', 'Age', 'City', 'Column 4'],
          rows: expect.arrayContaining([
            ['John', '25', 'New York', ''], // Normalized with 4th column
            ['Jane', '30', 'Los Angeles', ''], // Normalized with 4th column
          ]),
        }),
      });
    });
  });

  describe('Cell Editing', () => {
    const tableData = {
      headers: ['Name', 'Value'],
      rows: [['Test', '123']],
    };

    it('should show placeholder text for empty cells', () => {
      const tableWithEmptyCell = {
        headers: ['Name', 'Value'],
        rows: [['Test', '']],
      };

      render(<TableBlockNode id="test-table" data={tableWithEmptyCell} selected={false} />);

      expect(screen.getByText('Click to edit')).toBeInTheDocument();
    });
  });
});
