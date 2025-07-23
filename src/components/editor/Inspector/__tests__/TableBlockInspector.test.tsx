// ABOUTME: Comprehensive tests for TableBlockInspector with unified controls and table structure management

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableBlockInspector } from '../TableBlockInspector';
import { TableBlockData } from '@/types/editor';

// Mock dependencies
const mockUpdateNode = vi.fn();

const mockUseEditorStore = {
  nodes: [
    {
      id: 'table-1',
      type: 'tableBlock',
      data: {
        htmlHeaders: ['<p>Header 1</p>', '<p>Header 2</p>'],
        htmlRows: [
          ['<p>Row 1 Col 1</p>', '<p>Row 1 Col 2</p>'],
        ],
        backgroundColor: 'transparent',
        paddingX: 16,
        paddingY: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
      } as TableBlockData,
    },
  ],
  updateNode: mockUpdateNode,
};

// Mock the store module
vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => mockUseEditorStore,
}));

const mockEmptyTableStore = {
  nodes: [
    {
      id: 'empty-table',
      type: 'tableBlock',
      data: {
        htmlHeaders: [],
        htmlRows: [],
      } as TableBlockData,
    },
  ],
  updateNode: mockUpdateNode,
};

// Mock UI components
vi.mock('@/components/ui/label', () => ({
  Label: ({ children, className, ...props }: any) => (
    <label className={className} {...props}>{children}</label>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, disabled, title, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={`${className} ${variant} ${size}`}
      disabled={disabled}
      title={title}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: ({ className }: any) => <div className={`separator ${className}`} />,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={`card ${className}`}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={`card-content ${className}`}>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={`badge ${variant} ${className}`}>{children}</span>
  ),
}));

// Mock unified controls
vi.mock('../shared/UnifiedControls', () => ({
  SpacingControls: ({ data, onChange, compact, enablePresets }: any) => (
    <div data-testid="spacing-controls">
      Spacing Controls
      <button onClick={() => onChange({ paddingX: 20, paddingY: 16 })}>
        Update Spacing
      </button>
    </div>
  ),
  BorderControls: ({ data, onChange, compact, enableCornerRadius }: any) => (
    <div data-testid="border-controls">
      Border Controls
      <button onClick={() => onChange({ borderWidth: 2, borderColor: '#000000' })}>
        Update Border
      </button>
    </div>
  ),
  BackgroundControls: ({ data, onChange, enableImage, colorKey, defaultColor }: any) => (
    <div data-testid="background-controls">
      Background Controls
      <button onClick={() => onChange({ backgroundColor: '#f0f0f0' })}>
        Update Background
      </button>
    </div>
  ),
}));

describe('🔵 AI-SAFETY: TableBlockInspector - Unified Controls Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🟢 STRATEGIC: Core Inspector Rendering', () => {
    it('should render inspector header with table info', () => {
      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByText('Table Block')).toBeInTheDocument();
      expect(screen.getByText('2×1')).toBeInTheDocument(); // 2 columns × 1 row
    });

    it('should not render when node is not found', () => {
      vi.mocked(vi.importActual('@/store/editorStore')).useEditorStore = () => ({
        ...mockUseEditorStore,
        nodes: [],
      });
      
      const { container } = render(<TableBlockInspector nodeId="nonexistent" />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when node is not a table block', () => {
      vi.mocked(vi.importActual('@/store/editorStore')).useEditorStore = () => ({
        ...mockUseEditorStore,
        nodes: [
          {
            id: 'text-1',
            type: 'textBlock',
            data: {},
          },
        ],
      });
      
      const { container } = render(<TableBlockInspector nodeId="text-1" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('🟡 CRITICAL: Table Structure Management', () => {
    beforeEach(() => {
      vi.mocked(vi.importActual('@/store/editorStore')).useEditorStore = () => mockUseEditorStore;
    });

    it('should display current table structure info', () => {
      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByText('Columns (2)')).toBeInTheDocument();
      expect(screen.getByText('Rows (1)')).toBeInTheDocument();
      expect(screen.getByText('Size: 2 columns × 1 rows')).toBeInTheDocument();
      expect(screen.getByText('Total cells: 2')).toBeInTheDocument();
    });

    it('should provide structure control buttons', () => {
      render(<TableBlockInspector nodeId="table-1" />);

      // Should have add/remove buttons
      const addButtons = screen.getAllByText('+');
      const removeButtons = screen.getAllByText('−');
      
      expect(addButtons).toHaveLength(2); // Add column, add row
      expect(removeButtons).toHaveLength(0); // No remove buttons when at minimum (1 row)
    });

    it('should handle add column action', async () => {
      const user = userEvent.setup();
      render(<TableBlockInspector nodeId="table-1" />);

      const columnsSection = screen.getByText('Columns (2)').closest('div');
      const addButton = columnsSection?.querySelector('button');
      
      if (addButton) {
        await user.click(addButton);
        
        expect(mockUpdateNode).toHaveBeenCalledWith('table-1', {
          data: expect.objectContaining({
            htmlHeaders: ['<p>Header 1</p>', '<p>Header 2</p>', '<p>New Column</p>'],
            htmlRows: [
              ['<p>Row 1 Col 1</p>', '<p>Row 1 Col 2</p>', '<p></p>'],
            ],
          }),
        });
      }
    });

    it('should handle add row action', async () => {
      const user = userEvent.setup();
      render(<TableBlockInspector nodeId="table-1" />);

      const rowsSection = screen.getByText('Rows (1)').closest('div');
      const addButton = rowsSection?.querySelector('button');
      
      if (addButton) {
        await user.click(addButton);
        
        expect(mockUpdateNode).toHaveBeenCalledWith('table-1', {
          data: expect.objectContaining({
            htmlRows: [
              ['<p>Row 1 Col 1</p>', '<p>Row 1 Col 2</p>'],
              ['<p></p>', '<p></p>'],
            ],
          }),
        });
      }
    });

    it('should handle reset table action', async () => {
      const user = userEvent.setup();
      render(<TableBlockInspector nodeId="table-1" />);

      const resetButton = screen.getByText('Reset to 2×1 Table');
      await user.click(resetButton);

      expect(mockUpdateNode).toHaveBeenCalledWith('table-1', {
        data: expect.objectContaining({
          htmlHeaders: ['<p>Column 1</p>', '<p>Column 2</p>'],
          htmlRows: [['<p></p>', '<p></p>']],
        }),
      });
    });
  });

  describe('🎯 COVERAGE: Empty State Management', () => {
    it('should show empty state when no table exists', () => {
      vi.mocked(vi.importActual('@/store/editorStore')).useEditorStore = () => mockEmptyTableStore;
      
      render(<TableBlockInspector nodeId="empty-table" />);

      expect(screen.getByText('No table created yet')).toBeInTheDocument();
      expect(screen.getByText('Create Table')).toBeInTheDocument();
    });

    it('should handle create table from empty state', async () => {
      vi.mocked(vi.importActual('@/store/editorStore')).useEditorStore = () => mockEmptyTableStore;
      
      const user = userEvent.setup();
      render(<TableBlockInspector nodeId="empty-table" />);

      const createButton = screen.getByText('Create Table');
      await user.click(createButton);

      expect(mockUpdateNode).toHaveBeenCalledWith('empty-table', {
        data: expect.objectContaining({
          htmlHeaders: ['<p>Column 1</p>', '<p>Column 2</p>'],
          htmlRows: [['<p></p>', '<p></p>']],
        }),
      });
    });
  });

  describe('🔴 TDD: Unified Controls Integration', () => {
    beforeEach(() => {
      vi.mocked(vi.importActual('@/store/editorStore')).useEditorStore = () => mockUseEditorStore;
    });

    it('should render all unified control sections', () => {
      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByTestId('spacing-controls')).toBeInTheDocument();
      expect(screen.getByTestId('border-controls')).toBeInTheDocument();
      expect(screen.getByTestId('background-controls')).toBeInTheDocument();
    });

    it('should render typography guidance', () => {
      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByText('Typography')).toBeInTheDocument();
      expect(screen.getByText(/Typography controls are available in the toolbar/)).toBeInTheDocument();
    });

    it('should handle spacing control updates', async () => {
      const user = userEvent.setup();
      render(<TableBlockInspector nodeId="table-1" />);

      const spacingButton = screen.getByText('Update Spacing');
      await user.click(spacingButton);

      expect(mockUpdateNode).toHaveBeenCalledWith('table-1', {
        data: expect.objectContaining({
          paddingX: 20,
          paddingY: 16,
        }),
      });
    });

    it('should handle background control updates', async () => {
      const user = userEvent.setup();
      render(<TableBlockInspector nodeId="table-1" />);

      const backgroundButton = screen.getByText('Update Background');
      await user.click(backgroundButton);

      expect(mockUpdateNode).toHaveBeenCalledWith('table-1', {
        data: expect.objectContaining({
          backgroundColor: '#f0f0f0',
        }),
      });
    });

    it('should handle border control updates', async () => {
      const user = userEvent.setup();
      render(<TableBlockInspector nodeId="table-1" />);

      const borderButton = screen.getByText('Update Border');
      await user.click(borderButton);

      expect(mockUpdateNode).toHaveBeenCalledWith('table-1', {
        data: expect.objectContaining({
          borderWidth: 2,
          borderColor: '#000000',
        }),
      });
    });
  });

  describe('🛡️ ARCHITECTURE: Section Organization', () => {
    beforeEach(() => {
      vi.mocked(vi.importActual('@/store/editorStore')).useEditorStore = () => mockUseEditorStore;
    });

    it('should render all inspector sections in correct order', () => {
      render(<TableBlockInspector nodeId="table-1" />);

      const sections = [
        'Table Structure',
        'Typography',
        'Colors & Background',
        'Spacing & Layout',
        'Border & Style',
        'Table Info',
      ];

      sections.forEach(section => {
        expect(screen.getByText(section)).toBeInTheDocument();
      });
    });

    it('should render separators between sections', () => {
      render(<TableBlockInspector nodeId="table-1" />);

      const separators = document.querySelectorAll('.separator');
      expect(separators.length).toBeGreaterThan(0);
    });

    it('should display helpful tips', () => {
      render(<TableBlockInspector nodeId="table-1" />);

      expect(screen.getByText(/Use Tab to navigate between cells/)).toBeInTheDocument();
    });
  });

  describe('⚡ PERFORMANCE: Large Table Handling', () => {
    it('should handle large table dimensions correctly', () => {
      const largeTableStore = {
        ...mockUseEditorStore,
        nodes: [
          {
            id: 'large-table',
            type: 'tableBlock',
            data: {
              htmlHeaders: Array(10).fill(0).map((_, i) => `<p>Header ${i + 1}</p>`),
              htmlRows: Array(20).fill(0).map(() => 
                Array(10).fill('<p>Cell</p>')
              ),
            } as TableBlockData,
          },
        ],
      };

      vi.mocked(vi.importActual('@/store/editorStore')).useEditorStore = () => largeTableStore;
      
      render(<TableBlockInspector nodeId="large-table" />);

      expect(screen.getByText('10×20')).toBeInTheDocument(); // Badge
      expect(screen.getByText('Size: 10 columns × 20 rows')).toBeInTheDocument();
      expect(screen.getByText('Total cells: 200')).toBeInTheDocument();
    });

    it('should prevent removing last column/row', () => {
      const minimalTableStore = {
        ...mockUseEditorStore,
        nodes: [
          {
            id: 'minimal-table',
            type: 'tableBlock',
            data: {
              htmlHeaders: ['<p>Header</p>'],
              htmlRows: [['<p>Cell</p>']],
            } as TableBlockData,
          },
        ],
      };

      vi.mocked(vi.importActual('@/store/editorStore')).useEditorStore = () => minimalTableStore;
      
      render(<TableBlockInspector nodeId="minimal-table" />);

      // Remove buttons should be disabled for minimal table
      expect(screen.getByText('1×1')).toBeInTheDocument();
      
      // Should not show remove buttons for minimal table
      const removeButtons = screen.queryAllByText('−');
      expect(removeButtons).toHaveLength(0);
    });
  });
});