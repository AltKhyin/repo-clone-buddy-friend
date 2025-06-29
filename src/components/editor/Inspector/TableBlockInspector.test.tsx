// ABOUTME: Test suite for TableBlockInspector component ensuring all table editing functionality works correctly

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableBlockInspector } from './TableBlockInspector';
import { useEditorStore } from '@/store/editorStore';

// Mock the editorStore
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn()
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Table: ({ size }: any) => <div data-testid="table-icon" data-size={size} />,
  Settings: ({ size }: any) => <div data-testid="settings-icon" data-size={size} />,
  Rows: ({ size }: any) => <div data-testid="rows-icon" data-size={size} />,
  Columns: ({ size }: any) => <div data-testid="columns-icon" data-size={size} />,
  Plus: ({ size }: any) => <div data-testid="plus-icon" data-size={size} />,
  Minus: ({ size }: any) => <div data-testid="minus-icon" data-size={size} />,
  ArrowUpDown: ({ size }: any) => <div data-testid="arrow-up-down-icon" data-size={size} />,
  Palette: ({ size }: any) => <div data-testid="palette-icon" data-size={size} />,
  RotateCcw: ({ size }: any) => <div data-testid="rotate-ccw-icon" data-size={size} />
}));

const mockUseEditorStore = useEditorStore as any;

const createMockTableNode = (overrides = {}) => ({
  id: 'table-1',
  type: 'tableBlock',
  data: {
    headers: ['Column 1', 'Column 2', 'Column 3'],
    rows: [
      ['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
      ['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3']
    ],
    headerStyle: {
      backgroundColor: '#f3f4f6',
      textColor: '#374151'
    },
    alternatingRowColors: false,
    sortable: true,
    paddingX: 16,
    paddingY: 16,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    ...overrides
  }
});

const createMockStore = (nodes: any[] = []) => ({
  nodes,
  updateNode: vi.fn()
});

describe('TableBlockInspector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render table block inspector when correct node type is provided', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByText('Table Block')).toBeInTheDocument();
      expect(screen.getByTestId('table-icon')).toBeInTheDocument();
    });

    it('should not render when node is not found', () => {
      const store = createMockStore([]);
      mockUseEditorStore.mockReturnValue(store);

      const { container } = render(<TableBlockInspector nodeId="nonexistent" />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should not render when node is not a table block', () => {
      const textNode = {
        id: 'text-1',
        type: 'textBlock',
        data: { htmlContent: 'Test' }
      };
      const store = createMockStore([textNode]);
      mockUseEditorStore.mockReturnValue(store);

      const { container } = render(<TableBlockInspector nodeId="text-1" />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Table Structure Section', () => {
    it('should display current table size information', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByText('Size: 3 columns × 2 rows')).toBeInTheDocument();
      expect(screen.getByText('Total cells: 6')).toBeInTheDocument();
    });

    it('should have row management controls', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByText('Add Row')).toBeInTheDocument();
      expect(screen.getByText('Remove Row')).toBeInTheDocument();
    });

    it('should have column management controls', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByText('Add Column')).toBeInTheDocument();
      expect(screen.getByText('Remove Column')).toBeInTheDocument();
    });

    it('should have clear all data button', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByText('Clear All Data')).toBeInTheDocument();
    });

    it('should disable remove row button when only one row exists', () => {
      const tableNode = createMockTableNode({
        rows: [['Single row']]
      });
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      const removeRowButton = screen.getByText('Remove Row').closest('button');
      expect(removeRowButton).toBeDisabled();
    });

    it('should disable remove column button when only one column exists', () => {
      const tableNode = createMockTableNode({
        headers: ['Single column'],
        rows: [['Cell 1'], ['Cell 2']]
      });
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      const removeColumnButton = screen.getByText('Remove Column').closest('button');
      expect(removeColumnButton).toBeDisabled();
    });
  });

  describe('Table Behavior Section', () => {
    it('should have sortable toggle switch', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByLabelText('Enable Column Sorting')).toBeInTheDocument();
    });

    it('should have alternating row colors toggle', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByLabelText('Alternating Row Colors')).toBeInTheDocument();
    });

    it('should display appropriate help text for behavior toggles', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByText('Allow users to click column headers to sort data')).toBeInTheDocument();
      expect(screen.getByText('Alternate background colors for better readability')).toBeInTheDocument();
    });
  });

  describe('Header Styling Section', () => {
    it('should have header background color controls', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByLabelText('Header Background')).toBeInTheDocument();
    });

    it('should have header text color controls', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByLabelText('Header Text Color')).toBeInTheDocument();
    });

    it('should have reset buttons for header styling', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      const resetButtons = screen.getAllByText('Reset');
      expect(resetButtons).toHaveLength(2); // One for background, one for text color
    });
  });

  describe('Spacing & Borders Section', () => {
    it('should have padding controls', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByText('Horizontal Padding')).toBeInTheDocument();
      expect(screen.getByText('Vertical Padding')).toBeInTheDocument();
    });

    it('should have background color controls', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByLabelText('Background Color')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('should have border radius control', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByText('Border Radius')).toBeInTheDocument();
    });

    it('should have border toggle switch', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByLabelText('Enable Border')).toBeInTheDocument();
    });

    it('should hide border controls when border is disabled', () => {
      const tableNode = createMockTableNode({ borderWidth: 0 });
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.queryByText('Border Width')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Border Color')).not.toBeInTheDocument();
    });

    it('should show border controls when border is enabled', () => {
      const tableNode = createMockTableNode({ borderWidth: 2 });
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByText('Border Width')).toBeInTheDocument();
      expect(screen.getByLabelText('Border Color')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call updateNode when sortable toggle is changed', async () => {
      const user = userEvent.setup();
      const tableNode = createMockTableNode({ sortable: false });
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      const sortableToggle = screen.getByLabelText('Enable Column Sorting');
      await user.click(sortableToggle);

      expect(store.updateNode).toHaveBeenCalledWith('table-1', {
        data: expect.objectContaining({
          sortable: true
        })
      });
    });

    it('should call updateNode when alternating colors toggle is changed', async () => {
      const user = userEvent.setup();
      const tableNode = createMockTableNode({ alternatingRowColors: false });
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      const alternatingToggle = screen.getByLabelText('Alternating Row Colors');
      await user.click(alternatingToggle);

      expect(store.updateNode).toHaveBeenCalledWith('table-1', {
        data: expect.objectContaining({
          alternatingRowColors: true
        })
      });
    });

    it('should call updateNode when border toggle is changed', async () => {
      const user = userEvent.setup();
      const tableNode = createMockTableNode({ borderWidth: 0 });
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      const borderToggle = screen.getByLabelText('Enable Border');
      await user.click(borderToggle);

      expect(store.updateNode).toHaveBeenCalledWith('table-1', {
        data: expect.objectContaining({
          borderWidth: 1
        })
      });
    });

    it('should call updateNode when background clear button is clicked', async () => {
      const user = userEvent.setup();
      const tableNode = createMockTableNode({ backgroundColor: '#ff0000' });
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);

      expect(store.updateNode).toHaveBeenCalledWith('table-1', {
        data: expect.objectContaining({
          backgroundColor: 'transparent'
        })
      });
    });
  });

  describe('Form Validation', () => {
    it('should accept valid color values', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      const colorInputs = screen.getAllByDisplayValue('#f3f4f6');
      expect(colorInputs.length).toBeGreaterThan(0);
    });

    it('should handle numeric inputs for padding and border values', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      const allNumberInputs = screen.getAllByDisplayValue('16') as HTMLInputElement[];
      expect(allNumberInputs.length).toBeGreaterThan(0);
      expect(allNumberInputs[0].type).toBe('number');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all form controls', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      // Check that all major sections have proper headings
      expect(screen.getByText('Table Structure')).toBeInTheDocument();
      expect(screen.getByText('Table Behavior')).toBeInTheDocument();
      expect(screen.getByText('Header Styling')).toBeInTheDocument();
      expect(screen.getByText('Spacing & Borders')).toBeInTheDocument();
    });

    it('should have descriptive help text for complex features', () => {
      const tableNode = createMockTableNode();
      const store = createMockStore([tableNode]);
      mockUseEditorStore.mockReturnValue(store);

      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByText('Allow users to click column headers to sort data')).toBeInTheDocument();
      expect(screen.getByText('Alternate background colors for better readability')).toBeInTheDocument();
    });
  });
});