// ABOUTME: Simple test to verify basic movement functionality

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WYSIWYGCanvas } from '../WYSIWYGCanvas';
import { useEditorStore } from '@/store/editorStore';
import { CustomThemeProvider } from '@/components/theme/CustomThemeProvider';

// Mock the editor store
vi.mock('@/store/editorStore');

// Mock DnD kit
vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({ isOver: false, setNodeRef: vi.fn() }),
}));

// Mock intersection observer
vi.mock('@/hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: () => [vi.fn(), true],
}));

// Mock editor theme
vi.mock('@/hooks/useEditorTheme', () => ({
  useEditorTheme: () => ({
    colors: {
      block: { textSecondary: '#666' },
      grid: '#e5e7eb',
    },
    getImagePlaceholderColors: () => ({
      background: '#f5f5f5',
      text: '#666',
      border: '#ddd',
    }),
  }),
}));

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <CustomThemeProvider>{children}</CustomThemeProvider>
);

describe('Simple Movement Test', () => {
  let mockStore: any;
  let mockUpdateNodePosition: any;

  beforeEach(() => {
    mockUpdateNodePosition = vi.fn();

    mockStore = {
      nodes: [
        {
          id: 'test-block',
          type: 'textBlock',
          data: { htmlContent: '<p>Test</p>' },
        },
      ],
      positions: {
        'test-block': {
          id: 'test-block',
          x: 100,
          y: 100,
          width: 300,
          height: 100,
        },
      },
      selectedNodeId: 'test-block',
      canvasZoom: 1.0,
      selectNode: vi.fn(),
      addNode: vi.fn(),
      updateNodePosition: mockUpdateNodePosition,
      initializeNodePosition: vi.fn(),
      updateCanvasZoom: vi.fn(),
    };

    (useEditorStore as any).mockReturnValue(mockStore);
  });

  it('should render a basic canvas with block', () => {
    render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

    // Check if canvas exists
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Zoom: 100%')).toBeInTheDocument();
  });

  it('should handle basic mouse interactions', async () => {
    render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

    // Find the block content
    const blockContent = screen.getByText('Test');
    expect(blockContent).toBeInTheDocument();

    // Find the draggable container (parent of the content)
    const draggableBlock = blockContent.closest('[style*="left: 100px"]');
    expect(draggableBlock).toBeInTheDocument();

    if (draggableBlock) {
      console.log('Found draggable block, testing interaction...');

      // Test mouse down
      fireEvent.mouseDown(draggableBlock, {
        button: 0,
        clientX: 200,
        clientY: 150,
      });

      // Test mouse move
      fireEvent.mouseMove(document, {
        clientX: 250,
        clientY: 200,
      });

      // Wait for debounced update
      await waitFor(
        () => {
          expect(mockUpdateNodePosition).toHaveBeenCalled();
        },
        { timeout: 100 }
      );

      // Test mouse up
      fireEvent.mouseUp(document);

      console.log('Position update calls:', mockUpdateNodePosition.mock.calls);
      expect(mockUpdateNodePosition).toHaveBeenCalledWith(
        'test-block',
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        })
      );
    }
  });
});
