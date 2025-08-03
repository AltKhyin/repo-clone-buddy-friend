// ABOUTME: Integration tests for complete typography controls implementation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnifiedToolbar } from '../UnifiedToolbar';
import { useEditorStore } from '@/store/editorStore';
import { TEXT_TRANSFORMS, FONT_WEIGHTS, FONT_FAMILIES } from '../shared/typography-system';

// Mock dependencies
vi.mock('@/store/editorStore');
vi.mock('../../../hooks/useTextSelection', () => ({
  useTextSelection: () => ({
    applyTypographyToSelection: vi.fn().mockReturnValue(true),
    extractTextProperties: vi.fn().mockReturnValue({}),
  }),
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Bold: () => <div data-testid="bold-icon" />,
    Italic: () => <div data-testid="italic-icon" />,  
    Underline: () => <div data-testid="underline-icon" />,
    Type: () => <div data-testid="type-icon" />,
    Strikethrough: () => <div data-testid="strikethrough-icon" />,
  };
});

const mockUseEditorStore = vi.mocked(useEditorStore);

const createMockNode = (type: string, data: any = {}) => ({
  id: 'test-node-1',
  type,
  data,
  x: 100,
  y: 100,
  width: 400,
  height: 200,
});

describe('Typography Controls Integration', () => {
  const mockUpdateNode = vi.fn();
  const mockSelectNode = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseEditorStore.mockReturnValue({
      nodes: [createMockNode('richBlock', {
        content: '<p>Test content</p>',
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.4,
        color: '#000000',
        textTransform: 'none',
      })],
      selectedNodeId: 'test-node-1',
      updateNode: mockUpdateNode,
      selectNode: mockSelectNode,
      canvasZoom: 1,
      updateCanvasZoom: vi.fn(),
      getEditor: vi.fn(),
      deleteNode: vi.fn(),
      duplicateNode: vi.fn(),
    });
  });

  describe('Typography Control Presence', () => {
    it('should render all typography controls when richBlock is selected', () => {
      render(<UnifiedToolbar />);
      
      // Check for Line Height control (new addition)
      const lineHeightInput = screen.getByDisplayValue('1.4');
      expect(lineHeightInput).toBeInTheDocument();
      expect(screen.getByText('lh')).toBeInTheDocument();
      
      // Check for Text Transform control (new addition)
      const textTransformSelect = screen.getByDisplayValue('None');
      expect(textTransformSelect).toBeInTheDocument();
      
      // Check for existing controls
      expect(screen.getByDisplayValue('16')).toBeInTheDocument(); // Font size
      expect(screen.getByDisplayValue('Normal')).toBeInTheDocument(); // Font weight
      expect(screen.getByTitle('Text color')).toBeInTheDocument(); // Color picker
      expect(screen.getByTitle('Reset color')).toBeInTheDocument(); // Color reset
    });

    it('should show enhanced font weight options with values', async () => {
      render(<UnifiedToolbar />);
      
      const fontWeightSelect = screen.getByDisplayValue('Normal');
      await userEvent.click(fontWeightSelect);
      
      // Should show enhanced labels with values
      await waitFor(() => {
        expect(screen.getByText('Thin (100)')).toBeInTheDocument();
        expect(screen.getByText('Bold (700)')).toBeInTheDocument();
        expect(screen.getByText('Black (900)')).toBeInTheDocument();
      });
    });

    it('should show text transform options with visual examples', async () => {
      render(<UnifiedToolbar />);
      
      // Find and click the text transform select
      const textTransformSelects = screen.getAllByRole('combobox');
      const textTransformSelect = textTransformSelects.find(select => 
        select.getAttribute('aria-expanded') !== null && 
        screen.getByDisplayValue('None')
      );
      
      if (textTransformSelect) {
        await userEvent.click(textTransformSelect);
        
        await waitFor(() => {
          TEXT_TRANSFORMS.forEach(transform => {
            expect(screen.getByText(transform.label)).toBeInTheDocument();
          });
        });
      }
    });
  });

  describe('Typography Functionality', () => {
    it('should handle line height changes', async () => {
      render(<UnifiedToolbar />);
      
      const lineHeightInput = screen.getByDisplayValue('1.4');
      await userEvent.clear(lineHeightInput);
      await userEvent.type(lineHeightInput, '2.0');
      
      await waitFor(() => {
        expect(mockUpdateNode).toHaveBeenCalledWith('test-node-1', {
          data: expect.objectContaining({
            lineHeight: 2.0,
          }),
        });
      });
    });

    it('should handle text transform changes', async () => {
      render(<UnifiedToolbar />);
      
      const textTransformSelects = screen.getAllByRole('combobox');
      const textTransformSelect = textTransformSelects.find(select => 
        select.getAttribute('aria-expanded') !== null
      );
      
      if (textTransformSelect) {
        await userEvent.click(textTransformSelect);
        
        await waitFor(() => {
          const uppercaseOption = screen.getByText('UPPERCASE');
          userEvent.click(uppercaseOption);
        });
        
        await waitFor(() => {
          expect(mockUpdateNode).toHaveBeenCalledWith('test-node-1', {
            data: expect.objectContaining({
              textTransform: 'uppercase',
            }),
          });
        });
      }
    });

    it('should handle font weight changes with enhanced feedback', async () => {
      render(<UnifiedToolbar />);
      
      const fontWeightSelect = screen.getByDisplayValue('Normal');
      await userEvent.click(fontWeightSelect);
      
      await waitFor(() => {
        const boldOption = screen.getByText('Bold (700)');
        userEvent.click(boldOption);
      });
      
      await waitFor(() => {
        expect(mockUpdateNode).toHaveBeenCalledWith('test-node-1', {
          data: expect.objectContaining({
            fontWeight: 700,
          }),
        });
      });
    });

    it('should handle color reset functionality', async () => {
      render(<UnifiedToolbar />);
      
      const colorResetButton = screen.getByTitle('Reset color');
      await userEvent.click(colorResetButton);
      
      await waitFor(() => {
        expect(mockUpdateNode).toHaveBeenCalledWith('test-node-1', {
          data: expect.objectContaining({
            color: '',
          }),
        });
      });
    });
  });

  describe('Typography Control Validation', () => {
    it('should enforce line height constraints (0.5 - 3.0)', async () => {
      render(<UnifiedToolbar />);
      
      const lineHeightInput = screen.getByDisplayValue('1.4');
      
      // Test minimum constraint
      await userEvent.clear(lineHeightInput);
      await userEvent.type(lineHeightInput, '0.1');
      fireEvent.blur(lineHeightInput);
      
      await waitFor(() => {
        expect(mockUpdateNode).toHaveBeenCalledWith('test-node-1', {
          data: expect.objectContaining({
            lineHeight: 0.5, // Should be clamped to minimum
          }),
        });
      });
      
      // Test maximum constraint
      await userEvent.clear(lineHeightInput);
      await userEvent.type(lineHeightInput, '5.0');
      fireEvent.blur(lineHeightInput);
      
      await waitFor(() => {
        expect(mockUpdateNode).toHaveBeenCalledWith('test-node-1', {
          data: expect.objectContaining({
            lineHeight: 3.0, // Should be clamped to maximum
          }),
        });
      });
    });

    it('should show all supported typography properties for richBlock', () => {
      render(<UnifiedToolbar />);
      
      // Verify all expected controls are present
      expect(screen.getByDisplayValue('Inherit')).toBeInTheDocument(); // Font family
      expect(screen.getByDisplayValue('16')).toBeInTheDocument(); // Font size
      expect(screen.getByDisplayValue('Normal')).toBeInTheDocument(); // Font weight
      expect(screen.getByDisplayValue('1.4')).toBeInTheDocument(); // Line height
      expect(screen.getByTitle('Text color')).toBeInTheDocument(); // Color picker
      expect(screen.getByDisplayValue('None')).toBeInTheDocument(); // Text transform
    });
  });

  describe('Error Resilience', () => {
    it('should handle missing node data gracefully', () => {
      mockUseEditorStore.mockReturnValue({
        nodes: [createMockNode('richBlock')], // No data property
        selectedNodeId: 'test-node-1',
        updateNode: mockUpdateNode,
        selectNode: mockSelectNode,
        canvasZoom: 1,
        updateCanvasZoom: vi.fn(),
        getEditor: vi.fn(),
        deleteNode: vi.fn(),
        duplicateNode: vi.fn(),
      });
      
      expect(() => render(<UnifiedToolbar />)).not.toThrow();
    });

    it('should handle no selected node gracefully', () => {
      mockUseEditorStore.mockReturnValue({
        nodes: [],
        selectedNodeId: null,
        updateNode: mockUpdateNode,
        selectNode: mockSelectNode,
        canvasZoom: 1,
        updateCanvasZoom: vi.fn(),
        getEditor: vi.fn(),
        deleteNode: vi.fn(),
        duplicateNode: vi.fn(),
      });
      
      expect(() => render(<UnifiedToolbar />)).not.toThrow();
      
      // Typography controls should not be visible
      expect(screen.queryByDisplayValue('1.4')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Text color')).not.toBeInTheDocument();
    });
  });
});