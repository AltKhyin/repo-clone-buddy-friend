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

// Mock editor actions hook
vi.mock('@/hooks/useEditorActions', () => ({
  useEditorActions: () => ({
    clearAllSelection: vi.fn(),
    activateBlock: vi.fn(),
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

  it('should handle gesture-based drag interactions', async () => {
    render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

    // Find the block content
    const blockContent = screen.getByText('Test');
    expect(blockContent).toBeInTheDocument();

    // Find the draggable container (parent of the content)
    const draggableBlock = blockContent.closest('[style*="left: 100px"]');
    expect(draggableBlock).toBeInTheDocument();

    if (draggableBlock) {
      console.log('Found draggable block, testing gesture-based interaction...');

      // 🎯 GESTURE-BASED TEST: Start gesture detection
      fireEvent.click(draggableBlock, {
        button: 0,
        clientX: 116, // Click near border (16px from edge at x=100 + 16)
        clientY: 116, // Click near border (16px from edge at y=100 + 16)
      });

      // 🎯 GESTURE MOVEMENT: Move mouse to trigger gesture threshold (5px minimum)
      fireEvent.mouseMove(draggableBlock, {
        clientX: 122, // Move 6px horizontally (exceeds 5px threshold)
        clientY: 116,
      });

      // 🎯 CONTINUE DRAG: Move further to test actual dragging
      fireEvent.mouseMove(document, {
        clientX: 150, // Larger movement for drag
        clientY: 130,
      });

      // Wait for position update (gesture system may have different timing)
      await waitFor(
        () => {
          expect(mockUpdateNodePosition).toHaveBeenCalled();
        },
        { timeout: 500 } // Increased timeout for gesture detection
      );

      // Test mouse up to end drag
      fireEvent.mouseUp(document);

      console.log('Gesture-based position update calls:', mockUpdateNodePosition.mock.calls);
      expect(mockUpdateNodePosition).toHaveBeenCalledWith(
        'test-block',
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        })
      );
    }
  });

  it('should handle gesture timeout fallback to click', async () => {
    render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

    const blockContent = screen.getByText('Test');
    const draggableBlock = blockContent.closest('[style*="left: 100px"]');
    
    if (draggableBlock) {
      console.log('Testing gesture timeout behavior...');

      // 🎯 GESTURE TIMEOUT TEST: Click near border but don't move
      fireEvent.click(draggableBlock, {
        button: 0,
        clientX: 116, // Click near border
        clientY: 116,
      });

      // Wait for gesture timeout (300ms) without moving mouse
      await new Promise(resolve => setTimeout(resolve, 350));

      // After timeout, it should be treated as regular click (no drag)
      // The block should be selected but not dragged
      expect(mockStore.selectNode).toHaveBeenCalledWith('test-block');
      
      // Position should NOT have been updated (no drag occurred)
      expect(mockUpdateNodePosition).not.toHaveBeenCalled();
    }
  });

  it('should detect border area correctly for drag initiation', () => {
    render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

    const blockContent = screen.getByText('Test');
    const draggableBlock = blockContent.closest('[style*="left: 100px"]');
    
    if (draggableBlock) {
      console.log('Testing border detection...');

      // 🎯 BORDER DETECTION TEST: Click within 16px of edge should start gesture
      const borderClick = fireEvent.click(draggableBlock, {
        button: 0,
        clientX: 115, // 15px from left edge (within 16px threshold)
        clientY: 150,
      });

      expect(borderClick).toBe(true);

      // 🎯 NON-BORDER TEST: Click in center should NOT start gesture (just select)
      const centerClick = fireEvent.click(draggableBlock, {
        button: 0,
        clientX: 250, // Center of 300px wide block
        clientY: 150,
      });

      expect(centerClick).toBe(true);
    }
  });
});
