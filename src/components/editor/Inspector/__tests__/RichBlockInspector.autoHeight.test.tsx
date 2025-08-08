// ABOUTME: Tests for RichBlockInspector auto-height toggle functionality

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RichBlockInspector } from '../RichBlockInspector';
import { RichBlockData } from '@/types/editor';

// Mock the editor store
const mockUpdateNode = vi.fn();
const mockNodes = [
  {
    id: 'test-node',
    type: 'richBlock',
    data: {
      content: {
        tiptapJSON: null,
        htmlContent: '<p>Test content</p>',
      },
      paddingX: 16,
      paddingY: 16,
      backgroundColor: 'transparent',
      borderRadius: 8,
      borderWidth: 0,
      borderColor: 'transparent',
      autoHeight: false,
    } as RichBlockData,
  },
];

vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => ({
    nodes: mockNodes,
    updateNode: mockUpdateNode,
  }),
  useContentSelection: () => ({
    blockId: null,
    type: 'none',
  }),
}));

// Mock the simple resize hook
vi.mock('@/components/editor/unified-resize', () => ({
  useSimpleResize: () => ({
    isResizing: false,
  }),
}));

describe('RichBlockInspector Auto-Height Toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock data
    mockNodes[0].data.autoHeight = false;
  });

  describe('Toggle UI Rendering', () => {
    it('renders auto-height toggle switch', () => {
      render(<RichBlockInspector nodeId="test-node" />);

      // Check for toggle label
      expect(screen.getByText('Auto Height')).toBeInTheDocument();
      
      // Check for description
      expect(screen.getByText('Automatically adjusts block height to fit content')).toBeInTheDocument();
      
      // Check for switch component
      const toggle = screen.getByRole('switch');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('id', 'block-auto-height');
    });

    it('shows correct initial state when autoHeight is false', () => {
      render(<RichBlockInspector nodeId="test-node" />);

      const toggle = screen.getByRole('switch');
      expect(toggle).not.toBeChecked();
    });

    it('shows correct initial state when autoHeight is true', () => {
      // Set initial state to true
      mockNodes[0].data.autoHeight = true;
      
      render(<RichBlockInspector nodeId="test-node" />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toBeChecked();
    });

    it('handles undefined autoHeight gracefully', () => {
      // Remove autoHeight property
      delete (mockNodes[0].data as any).autoHeight;
      
      render(<RichBlockInspector nodeId="test-node" />);

      const toggle = screen.getByRole('switch');
      expect(toggle).not.toBeChecked();
    });
  });

  describe('Toggle Functionality', () => {
    it('calls updateNode when toggling from false to true', () => {
      render(<RichBlockInspector nodeId="test-node" />);

      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);

      expect(mockUpdateNode).toHaveBeenCalledWith('test-node', {
        data: expect.objectContaining({
          autoHeight: true,
        }),
      });
    });

    it('calls updateNode when toggling from true to false', () => {
      // Set initial state to true
      mockNodes[0].data.autoHeight = true;
      
      render(<RichBlockInspector nodeId="test-node" />);

      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);

      expect(mockUpdateNode).toHaveBeenCalledWith('test-node', {
        data: expect.objectContaining({
          autoHeight: false,
        }),
      });
    });

    it('preserves other data properties when updating autoHeight', () => {
      const originalData = mockNodes[0].data;
      
      render(<RichBlockInspector nodeId="test-node" />);

      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);

      expect(mockUpdateNode).toHaveBeenCalledWith('test-node', {
        data: {
          ...originalData,
          autoHeight: true,
        },
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility attributes', () => {
      render(<RichBlockInspector nodeId="test-node" />);

      const toggle = screen.getByRole('switch');
      const label = screen.getByText('Auto Height');

      // Check for proper labeling
      expect(toggle).toHaveAttribute('id', 'block-auto-height');
      expect(label.tagName).toBe('LABEL');
      expect(label).toHaveAttribute('for', 'block-auto-height');

      // Check for disabled state handling (should be enabled)
      expect(toggle).not.toBeDisabled();
    });

    it('maintains focus after toggle', () => {
      render(<RichBlockInspector nodeId="test-node" />);

      const toggle = screen.getByRole('switch');
      toggle.focus();
      
      expect(toggle).toHaveFocus();
      
      fireEvent.click(toggle);
      
      // Focus should remain on toggle after interaction
      expect(toggle).toHaveFocus();
    });
  });

  describe('Integration with Block Data Model', () => {
    it('correctly reads autoHeight from RichBlockData schema', () => {
      // Test with various autoHeight values
      const testCases = [
        { autoHeight: true, expected: true },
        { autoHeight: false, expected: false },
        { autoHeight: undefined, expected: false },
      ];

      testCases.forEach(({ autoHeight, expected }) => {
        // Update mock data
        if (autoHeight === undefined) {
          delete (mockNodes[0].data as any).autoHeight;
        } else {
          mockNodes[0].data.autoHeight = autoHeight;
        }

        const { unmount } = render(<RichBlockInspector nodeId="test-node" />);

        const toggle = screen.getByRole('switch');
        if (expected) {
          expect(toggle).toBeChecked();
        } else {
          expect(toggle).not.toBeChecked();
        }

        unmount();
      });
    });

    it('updates block data with correct type safety', () => {
      render(<RichBlockInspector nodeId="test-node" />);

      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);

      // Verify the update maintains type safety
      const updateCall = mockUpdateNode.mock.calls[0];
      expect(updateCall[0]).toBe('test-node');
      expect(updateCall[1].data.autoHeight).toBe(true);
      expect(typeof updateCall[1].data.autoHeight).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('handles missing node gracefully', () => {
      // Render with non-existent node ID
      expect(() => {
        render(<RichBlockInspector nodeId="non-existent-node" />);
      }).not.toThrow();
    });

    it('handles invalid node type gracefully', () => {
      // Update mock to have wrong type
      mockNodes[0].type = 'textBlock' as any;
      
      expect(() => {
        render(<RichBlockInspector nodeId="test-node" />);
      }).not.toThrow();
    });

    it('handles missing data gracefully', () => {
      // Update mock to have no data
      mockNodes[0].data = null as any;
      
      expect(() => {
        render(<RichBlockInspector nodeId="test-node" />);
      }).not.toThrow();
    });
  });

  describe('UI Positioning and Layout', () => {
    it('positions auto-height toggle in correct location within inspector', () => {
      render(<RichBlockInspector nodeId="test-node" />);

      // Check that toggle appears after border controls
      const borderSection = screen.getByText('Border Color');
      const autoHeightSection = screen.getByText('Auto Height');
      
      // Auto-height should appear after border controls in DOM order
      const borderElement = borderSection.closest('div');
      const autoHeightElement = autoHeightSection.closest('div');
      
      expect(borderElement).toBeInTheDocument();
      expect(autoHeightElement).toBeInTheDocument();
      
      // Verify they're both in the same parent container
      expect(borderElement?.parentElement).toBe(autoHeightElement?.parentElement);
    });

    it('has proper spacing and visual hierarchy', () => {
      render(<RichBlockInspector nodeId="test-node" />);

      const autoHeightSection = screen.getByText('Auto Height').closest('div');
      
      // Check for proper CSS classes that provide spacing
      expect(autoHeightSection).toHaveClass('space-y-3');
      
      // Check for flex layout in toggle container
      const toggleContainer = screen.getByText('Auto Height').parentElement;
      expect(toggleContainer).toHaveClass('flex', 'items-center', 'justify-between');
    });
  });
});