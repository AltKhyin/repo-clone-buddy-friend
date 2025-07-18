// ABOUTME: Diagnostic test to identify the exact cause of movement/resize blocking

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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
    },
    getImagePlaceholderColors: () => ({
      background: '#f5f5f5',
      text: '#666',
      border: '#ddd',
    }),
  }),
}));

// Test wrapper with theme provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <CustomThemeProvider>{children}</CustomThemeProvider>
);

describe('Movement Diagnostic Tests', () => {
  let mockStore: any;
  let mockUpdateNodePosition: any;
  let mockSelectNode: any;

  beforeEach(() => {
    mockUpdateNodePosition = vi.fn();
    mockSelectNode = vi.fn();

    mockStore = {
      nodes: [
        {
          id: 'test-block-1',
          type: 'textBlock',
          data: { htmlContent: '<p>Test content</p>' },
        },
      ],
      positions: {
        'test-block-1': {
          id: 'test-block-1',
          x: 100,
          y: 100,
          width: 400,
          height: 120,
        },
      },
      selectedNodeId: 'test-block-1',
      canvasZoom: 1.0,
      selectNode: mockSelectNode,
      addNode: vi.fn(),
      updateNodePosition: mockUpdateNodePosition,
      initializeNodePosition: vi.fn(),
      updateCanvasZoom: vi.fn(),
    };

    (useEditorStore as any).mockReturnValue(mockStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Operation Lock Deadlock Investigation', () => {
    it('should demonstrate the operation lock preventing position updates', async () => {
      render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

      // Find the draggable block
      const blockElement = screen.getByTestId('draggable-block-test-block-1');
      expect(blockElement).toBeInTheDocument();

      // Start drag operation
      fireEvent.mouseDown(blockElement, {
        button: 0,
        clientX: 300,
        clientY: 160,
      });

      // Simulate drag movement
      fireEvent.mouseMove(document, {
        clientX: 350,
        clientY: 200,
      });

      // Check if position update is called immediately (it shouldn't due to debounce)
      expect(mockUpdateNodePosition).not.toHaveBeenCalled();

      // Wait for debounced update (16ms + buffer)
      await waitFor(
        () => {
          expect(mockUpdateNodePosition).toHaveBeenCalled();
        },
        { timeout: 100 }
      );

      // End drag
      fireEvent.mouseUp(document);

      // Verify that position was actually updated
      expect(mockUpdateNodePosition).toHaveBeenCalledWith(
        'test-block-1',
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        })
      );
    });

    it('should demonstrate resize blocking', async () => {
      render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

      // Find resize handle
      const resizeHandle = screen.getByTitle('Resize southeast');
      expect(resizeHandle).toBeInTheDocument();

      // Start resize operation
      fireEvent.mouseDown(resizeHandle, {
        button: 0,
        clientX: 500,
        clientY: 220,
      });

      // Simulate resize movement
      fireEvent.mouseMove(document, {
        clientX: 550,
        clientY: 270,
      });

      // Wait for debounced update
      await waitFor(
        () => {
          expect(mockUpdateNodePosition).toHaveBeenCalled();
        },
        { timeout: 100 }
      );

      // End resize
      fireEvent.mouseUp(document);

      // Verify that size was actually updated
      expect(mockUpdateNodePosition).toHaveBeenCalledWith(
        'test-block-1',
        expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
        })
      );
    });

    it('should test operation lock state during interaction', async () => {
      render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

      const blockElement = screen.getByTestId('draggable-block-test-block-1');
      const resizeHandle = screen.getByTitle('Resize southeast');

      // Start drag
      fireEvent.mouseDown(blockElement, {
        button: 0,
        clientX: 300,
        clientY: 160,
      });

      // Try to start resize while dragging (should be blocked)
      fireEvent.mouseDown(resizeHandle, {
        button: 0,
        clientX: 500,
        clientY: 220,
      });

      // Move mouse for drag
      fireEvent.mouseMove(document, {
        clientX: 350,
        clientY: 200,
      });

      // Wait for updates
      await waitFor(
        () => {
          expect(mockUpdateNodePosition).toHaveBeenCalled();
        },
        { timeout: 100 }
      );

      // Should only have drag updates, not resize
      const calls = mockUpdateNodePosition.mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][1]).toHaveProperty('x');
      expect(calls[0][1]).toHaveProperty('y');
      // Should not have width/height (resize) properties
      expect(calls[0][1]).not.toHaveProperty('width');
      expect(calls[0][1]).not.toHaveProperty('height');
    });
  });

  describe('Debounce and Timing Issues', () => {
    it('should test if debounce is blocking rapid interactions', async () => {
      render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

      const blockElement = screen.getByTestId('draggable-block-test-block-1');

      // Start drag
      fireEvent.mouseDown(blockElement, {
        button: 0,
        clientX: 300,
        clientY: 160,
      });

      // Rapid movements
      for (let i = 0; i < 5; i++) {
        fireEvent.mouseMove(document, {
          clientX: 300 + i * 10,
          clientY: 160 + i * 10,
        });
      }

      // Wait for debounced update
      await waitFor(
        () => {
          expect(mockUpdateNodePosition).toHaveBeenCalled();
        },
        { timeout: 100 }
      );

      // Should only have been called once due to debouncing
      expect(mockUpdateNodePosition).toHaveBeenCalledTimes(1);

      // End drag
      fireEvent.mouseUp(document);
    });
  });
});

// Helper to simulate real user interaction timing
async function simulateUserDrag(
  element: HTMLElement,
  startPos: { x: number; y: number },
  endPos: { x: number; y: number }
) {
  // Start drag
  fireEvent.mouseDown(element, {
    button: 0,
    clientX: startPos.x,
    clientY: startPos.y,
  });

  // Simulate gradual movement
  const steps = 5;
  for (let i = 1; i <= steps; i++) {
    const x = startPos.x + (endPos.x - startPos.x) * (i / steps);
    const y = startPos.y + (endPos.y - startPos.y) * (i / steps);

    fireEvent.mouseMove(document, { clientX: x, clientY: y });
    await new Promise(resolve => setTimeout(resolve, 5)); // Small delay between moves
  }

  // End drag
  fireEvent.mouseUp(document);
}

export { simulateUserDrag };
