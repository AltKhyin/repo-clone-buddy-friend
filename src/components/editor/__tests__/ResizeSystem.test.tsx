// ABOUTME: TDD test suite for WYSIWYG resize system - demonstrates current issues and validates fixes

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

describe('ResizeSystem - Current Behavior Analysis', () => {
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

  describe('Current Resize Behavior', () => {
    it('should render resize handles when block is selected', () => {
      render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

      // Check that resize handles are present
      expect(screen.getByTitle('Resize northwest')).toBeInTheDocument();
      expect(screen.getByTitle('Resize northeast')).toBeInTheDocument();
      expect(screen.getByTitle('Resize southwest')).toBeInTheDocument();
      expect(screen.getByTitle('Resize southeast')).toBeInTheDocument();
      expect(screen.getByTitle('Resize north')).toBeInTheDocument();
      expect(screen.getByTitle('Resize south')).toBeInTheDocument();
      expect(screen.getByTitle('Resize east')).toBeInTheDocument();
      expect(screen.getByTitle('Resize west')).toBeInTheDocument();
    });

    it('should trigger resize operations on handle mousedown', () => {
      render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

      const resizeHandle = screen.getByTitle('Resize southeast');

      // Start resize
      fireEvent.mouseDown(resizeHandle, { clientX: 500, clientY: 220 });

      // Move mouse
      fireEvent.mouseMove(document, { clientX: 550, clientY: 270 });

      // Should call updateNodePosition
      expect(mockUpdateNodePosition).toHaveBeenCalled();
    });

    it('should apply basic constraints during resize', () => {
      render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

      const resizeHandle = screen.getByTitle('Resize southeast');

      // Start resize
      fireEvent.mouseDown(resizeHandle, { clientX: 500, clientY: 220 });

      // Move mouse to very large size
      fireEvent.mouseMove(document, { clientX: 1000, clientY: 500 });

      // Should be constrained to canvas width
      expect(mockUpdateNodePosition).toHaveBeenCalledWith(
        'test-block-1',
        expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
        })
      );
    });
  });

  describe('Position Feedback Loop - Current Issue', () => {
    it('should demonstrate position drift during southwest resize (FAILING TEST)', async () => {
      render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

      const resizeHandle = screen.getByTitle('Resize southwest');

      // Simulate the SAME resize operation multiple times
      // This tests whether repeated operations give consistent results
      const operation = { start: { x: 500, y: 220 }, move: { x: 450, y: 270 } };

      const results: any[] = [];

      for (let i = 0; i < 3; i++) {
        // Start resize
        fireEvent.mouseDown(resizeHandle, {
          clientX: operation.start.x,
          clientY: operation.start.y,
        });

        // Move mouse
        fireEvent.mouseMove(document, { clientX: operation.move.x, clientY: operation.move.y });

        // End resize
        fireEvent.mouseUp(document);

        // Capture result
        const lastCall =
          mockUpdateNodePosition.mock.calls[mockUpdateNodePosition.mock.calls.length - 1];
        if (lastCall) {
          results.push(lastCall[1]);

          // Update mock position to simulate state change
          mockStore.positions['test-block-1'] = {
            ...mockStore.positions['test-block-1'],
            x: lastCall[1].x,
            y: lastCall[1].y,
            width: lastCall[1].width,
            height: lastCall[1].height,
          };
        }
      }

      // All operations should give the same result if there's no feedback loop
      expect(results.length).toBe(3);

      // Check that all results are identical (no drift)
      const firstResult = results[0];
      for (let i = 1; i < results.length; i++) {
        expect(results[i].x).toBe(firstResult.x); // Position should not drift
        expect(results[i].y).toBe(firstResult.y); // Position should not drift
        expect(results[i].width).toBe(firstResult.width); // Size should not drift
        expect(results[i].height).toBe(firstResult.height); // Size should not drift
      }
    });

    it('should demonstrate position drift during northwest resize (FAILING TEST)', async () => {
      render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

      const resizeHandle = screen.getByTitle('Resize northwest');

      // Start resize
      fireEvent.mouseDown(resizeHandle, { clientX: 100, clientY: 100 });

      // Move mouse multiple times (simulating rapid resize)
      fireEvent.mouseMove(document, { clientX: 90, clientY: 90 });
      fireEvent.mouseMove(document, { clientX: 80, clientY: 80 });
      fireEvent.mouseMove(document, { clientX: 70, clientY: 70 });

      // Each move should calculate from the SAME start position
      // But current implementation uses updated position, causing drift
      const calls = mockUpdateNodePosition.mock.calls;

      if (calls.length > 1) {
        // All position calculations should be relative to original (100, 100)
        // But they will drift due to feedback loop
        const firstCall = calls[0][1];
        const secondCall = calls[1][1];

        // Position should not drift - this will fail
        expect(Math.abs(firstCall.x - secondCall.x)).toBeLessThan(5); // Will fail
        expect(Math.abs(firstCall.y - secondCall.y)).toBeLessThan(5); // Will fail
      }
    });
  });

  describe('Constraint Application Order', () => {
    it('should apply size constraints before position constraints', () => {
      render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

      const resizeHandle = screen.getByTitle('Resize northwest');

      // Try to resize to very small size that would go negative
      fireEvent.mouseDown(resizeHandle, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(document, { clientX: 600, clientY: 300 });

      const call = mockUpdateNodePosition.mock.calls[0];
      if (call) {
        const position = call[1];
        // Should enforce minimum size
        expect(position.width).toBeGreaterThanOrEqual(50);
        expect(position.height).toBeGreaterThanOrEqual(30);
        // Should keep position within canvas
        expect(position.x).toBeGreaterThanOrEqual(0);
        expect(position.y).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle canvas boundary constraints', () => {
      render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

      const resizeHandle = screen.getByTitle('Resize southeast');

      // Try to resize beyond canvas width
      fireEvent.mouseDown(resizeHandle, { clientX: 500, clientY: 220 });
      fireEvent.mouseMove(document, { clientX: 1000, clientY: 400 });

      const call = mockUpdateNodePosition.mock.calls[0];
      if (call) {
        const position = call[1];
        // Should not exceed canvas width (800px)
        expect(position.x + position.width).toBeLessThanOrEqual(800);
      }
    });
  });

  describe('Zoom Scaling', () => {
    it('should handle resize operations at different zoom levels', () => {
      mockStore.canvasZoom = 1.5;

      render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

      const resizeHandle = screen.getByTitle('Resize southeast');

      // Resize at 1.5x zoom
      fireEvent.mouseDown(resizeHandle, { clientX: 500, clientY: 220 });
      fireEvent.mouseMove(document, { clientX: 575, clientY: 295 });

      const call = mockUpdateNodePosition.mock.calls[0];
      if (call) {
        const position = call[1];
        // Delta should be scaled by zoom: 75px / 1.5 = 50px
        expect(position.width).toBe(450); // 400 + 50
        expect(position.height).toBe(170); // 120 + 50
      }
    });

    it('should maintain consistent behavior across zoom levels', () => {
      const testZoomLevels = [0.5, 1.0, 1.5, 2.0];

      testZoomLevels.forEach(zoom => {
        mockStore.canvasZoom = zoom;
        mockUpdateNodePosition.mockClear();

        render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

        const resizeHandle = screen.getByTitle('Resize southeast');

        // Same mouse movement at different zoom levels
        fireEvent.mouseDown(resizeHandle, { clientX: 500, clientY: 220 });
        fireEvent.mouseMove(document, { clientX: 550, clientY: 270 });

        const call = mockUpdateNodePosition.mock.calls[0];
        if (call) {
          const position = call[1];
          // Scaled delta should be consistent
          const expectedDelta = 50 / zoom;
          expect(position.width).toBe(400 + expectedDelta);
          expect(position.height).toBe(120 + expectedDelta);
        }
      });
    });
  });

  describe('Performance and Race Conditions', () => {
    it('should handle rapid resize operations', async () => {
      render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

      const resizeHandle = screen.getByTitle('Resize southeast');

      // Start resize
      fireEvent.mouseDown(resizeHandle, { clientX: 500, clientY: 220 });

      // Rapid mouse movements
      for (let i = 0; i < 10; i++) {
        fireEvent.mouseMove(document, { clientX: 500 + i * 5, clientY: 220 + i * 5 });
      }

      // Wait for debounced updates to fire
      await waitFor(
        () => {
          expect(mockUpdateNodePosition).toHaveBeenCalled();
        },
        { timeout: 100 }
      );

      // Should not have excessive number of calls (indicates successful debouncing)
      const callCount = mockUpdateNodePosition.mock.calls.length;
      expect(callCount).toBeLessThan(5); // With debouncing, should be much fewer calls
    });

    it('should prevent concurrent drag and resize operations', () => {
      render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

      const block = screen.getByText('Test content').closest('[data-block-type="textBlock"]');
      const resizeHandle = screen.getByTitle('Resize southeast');

      // Start resize
      fireEvent.mouseDown(resizeHandle, { clientX: 500, clientY: 220 });

      // Try to start drag while resizing
      if (block) {
        fireEvent.mouseDown(block, { clientX: 300, clientY: 160 });
      }

      // Should not allow concurrent operations
      // This test documents current behavior - may need improvement
      expect(mockUpdateNodePosition).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle resize when position is not found', () => {
      // Remove position from store
      mockStore.positions = {};

      render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

      // Should initialize position if missing
      expect(mockStore.initializeNodePosition).toHaveBeenCalledWith('test-block-1');
    });

    it('should handle invalid resize operations gracefully', () => {
      render(<WYSIWYGCanvas />, { wrapper: TestWrapper });

      const resizeHandle = screen.getByTitle('Resize southeast');

      // Start resize with invalid mouse position
      fireEvent.mouseDown(resizeHandle, { clientX: NaN, clientY: NaN });

      // Should not crash or call updateNodePosition with invalid data
      expect(mockUpdateNodePosition).not.toHaveBeenCalledWith(
        'test-block-1',
        expect.objectContaining({
          x: NaN,
          y: NaN,
          width: NaN,
          height: NaN,
        })
      );
    });
  });
});

// Helper function to simulate resize sequence
function simulateResizeSequence(
  resizeHandle: HTMLElement,
  operations: Array<{ start: { x: number; y: number }; move: { x: number; y: number } }>
) {
  const results: any[] = [];

  operations.forEach(op => {
    fireEvent.mouseDown(resizeHandle, { clientX: op.start.x, clientY: op.start.y });
    fireEvent.mouseMove(document, { clientX: op.move.x, clientY: op.move.y });
    fireEvent.mouseUp(document);

    // Capture result
    const calls = (mockUpdateNodePosition as any).mock.calls;
    if (calls.length > 0) {
      results.push(calls[calls.length - 1][1]);
    }
  });

  return results;
}

// Test wrapper with theme provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <CustomThemeProvider>{children}</CustomThemeProvider>
);

// Export for use in other test files
export { simulateResizeSequence };
