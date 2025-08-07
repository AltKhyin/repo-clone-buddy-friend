// ABOUTME: Comprehensive TDD tests validating NodeViewWrapper and schema fixes for BasicTable TipTap integration

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Editor } from '@tiptap/react';
import { BasicTableExtension } from '../BasicTableExtension';
import { BasicTableComponent } from '../BasicTableComponent';
import { DEFAULT_TABLE_DATA } from '../types';

// Mock dependencies
vi.mock('@/store/selectionStore', () => ({
  useSelectionActions: () => ({
    dispatch: vi.fn()
  })
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}));

describe('🚨 CRITICAL: BasicTable TipTap Integration Fixes', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('🔴 CRITICAL: NodeViewWrapper Integration', () => {
    it('should render without "Please use NodeViewWrapper" errors', () => {
      const mockNode = {
        attrs: { tableData: DEFAULT_TABLE_DATA }
      };
      
      const mockProps = {
        node: mockNode,
        updateAttributes: vi.fn(),
        selected: false,
        editor: null,
        deleteNode: vi.fn()
      };

      render(<BasicTableComponent {...mockProps} />);
      
      // CRITICAL: Verify no NodeViewWrapper console errors
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('NodeViewWrapper')
      );
      
      // CRITICAL: Verify component renders with wrapper
      const wrapper = screen.getByRole('table');
      expect(wrapper.closest('.basic-table-node-wrapper')).toBeInTheDocument();
    });

    it('should properly wrap table content in NodeViewWrapper', () => {
      const mockNode = {
        attrs: { tableData: DEFAULT_TABLE_DATA }
      };
      
      const mockProps = {
        node: mockNode,
        updateAttributes: vi.fn(),
        selected: false
      };

      render(<BasicTableComponent {...mockProps} />);
      
      // Verify table is contained within NodeViewWrapper
      const table = screen.getByRole('table');
      const wrapper = table.closest('.basic-table-node-wrapper');
      
      expect(wrapper).toBeInTheDocument();
      expect(table).toBeInTheDocument();
    });
  });

  describe('🔴 CRITICAL: Schema Configuration Fixes', () => {
    it('should have atom: false to allow content editing', () => {
      const extension = BasicTableExtension;
      const config = extension.config;
      
      // CRITICAL: atom should be false to prevent leaf node conflicts
      expect(config.atom).toBe(false);
    });

    it('should have isolating: true for proper content boundaries', () => {
      const extension = BasicTableExtension;
      const config = extension.config;
      
      // CRITICAL: isolating prevents unwanted interactions
      expect(config.isolating).toBe(true);
    });

    it('should parse and render table elements consistently', () => {
      const extension = BasicTableExtension;
      
      // CRITICAL: parseHTML should look for table elements
      const parseRules = extension.config.parseHTML?.() || [];
      expect(parseRules).toContainEqual({
        tag: 'table[data-type="basic-table"]'
      });
      
      // CRITICAL: renderHTML configuration should exist
      expect(extension.config.renderHTML).toBeDefined();
      
      // Note: renderHTML requires TipTap context with this.options
      // We verify the function exists rather than calling it directly in tests
    });
  });

  describe('🔴 CRITICAL: Transparent Background Implementation', () => {
    it('should render table cells with transparent backgrounds', () => {
      const mockNode = {
        attrs: { tableData: DEFAULT_TABLE_DATA }
      };
      
      const mockProps = {
        node: mockNode,
        updateAttributes: vi.fn(),
        selected: false
      };

      render(<BasicTableComponent {...mockProps} />);
      
      // CRITICAL: Verify all table cells have bg-transparent
      const headerCells = screen.getAllByRole('columnheader');
      headerCells.forEach(cell => {
        expect(cell).toHaveClass('bg-transparent');
        expect(cell).not.toHaveClass('bg-white');
      });
      
      const dataCells = screen.getAllByRole('cell');
      dataCells.forEach(cell => {
        expect(cell).toHaveClass('bg-transparent');
        expect(cell).not.toHaveClass('bg-white');
      });
    });

    it('should render table element with transparent background', () => {
      const mockNode = {
        attrs: { tableData: DEFAULT_TABLE_DATA }
      };
      
      const mockProps = {
        node: mockNode,
        updateAttributes: vi.fn(),
        selected: false
      };

      render(<BasicTableComponent {...mockProps} />);
      
      const table = screen.getByRole('table');
      expect(table).toHaveClass('bg-transparent');
      expect(table).not.toHaveClass('bg-white');
    });
  });

  describe('🟡 CRITICAL: Content Editing Integration', () => {
    it('should allow contentEditable cells without leaf node conflicts', () => {
      const mockNode = {
        attrs: { tableData: DEFAULT_TABLE_DATA }
      };
      
      const mockProps = {
        node: mockNode,
        updateAttributes: vi.fn(),
        selected: false
      };

      render(<BasicTableComponent {...mockProps} />);
      
      // Verify cells are contentEditable
      const headerCells = screen.getAllByRole('columnheader');
      headerCells.forEach(cell => {
        expect(cell).toHaveAttribute('contenteditable', 'true');
      });
      
      const dataCells = screen.getAllByRole('cell');
      dataCells.forEach(cell => {
        expect(cell).toHaveAttribute('contenteditable', 'true');
      });
      
      // CRITICAL: No schema conflict errors should occur
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Content hole not allowed in a leaf node spec')
      );
    });
  });

  describe('🟢 STRATEGIC: Error Prevention Validation', () => {
    it('should not generate any TipTap-related console errors', () => {
      const mockNode = {
        attrs: { tableData: DEFAULT_TABLE_DATA }
      };
      
      const mockProps = {
        node: mockNode,
        updateAttributes: vi.fn(),
        selected: false
      };

      render(<BasicTableComponent {...mockProps} />);
      
      // Comprehensive error checking
      const tiptapErrors = [
        'Please use the NodeViewWrapper',
        'Content hole not allowed in a leaf node spec',
        'Invalid content',
        'Schema violation',
        'ReactNodeViewRenderer'
      ];
      
      tiptapErrors.forEach(errorText => {
        expect(consoleSpy).not.toHaveBeenCalledWith(
          expect.stringContaining(errorText)
        );
      });
    });

    it('should maintain proper component lifecycle without mount/unmount errors', () => {
      const mockNode = {
        attrs: { tableData: DEFAULT_TABLE_DATA }
      };
      
      const mockProps = {
        node: mockNode,
        updateAttributes: vi.fn(),
        selected: false
      };

      const { unmount } = render(<BasicTableComponent {...mockProps} />);
      
      // Should mount without errors
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // Should unmount without errors
      act(() => {
        unmount();
      });
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('🔵 AI-SAFETY: Architecture Validation', () => {
    it('should maintain proper separation between TipTap schema and React component', () => {
      // Verify extension configuration integrity
      const extension = BasicTableExtension;
      expect(extension.name).toBe('basicTable');
      expect(extension.config.group).toBe('block');
      
      // Verify component props interface integrity
      const mockNode = {
        attrs: { tableData: DEFAULT_TABLE_DATA }
      };
      
      const mockProps = {
        node: mockNode,
        updateAttributes: vi.fn(),
        selected: false
      };

      expect(() => render(<BasicTableComponent {...mockProps} />)).not.toThrow();
    });

    it('should prevent architectural regression in future modifications', () => {
      // This test documents the correct architecture to prevent AI from breaking it
      const extension = BasicTableExtension;
      
      // CRITICAL ARCHITECTURE REQUIREMENTS:
      expect(extension.config.atom).toBe(false); // Must not be atomic for contentEditable
      expect(extension.config.isolating).toBe(true); // Must be isolated for proper boundaries
      expect(extension.config.group).toBe('block'); // Must be block-level element
      
      // NodeView must use ReactNodeViewRenderer
      expect(extension.config.addNodeView).toBeDefined();
      
      // Component must be wrapped in NodeViewWrapper (verified by rendering)
      const mockNode = { attrs: { tableData: DEFAULT_TABLE_DATA } };
      const mockProps = {
        node: mockNode,
        updateAttributes: vi.fn(),
        selected: false
      };

      render(<BasicTableComponent {...mockProps} />);
      expect(screen.getByRole('table').closest('.basic-table-node-wrapper')).toBeInTheDocument();
    });
  });
});