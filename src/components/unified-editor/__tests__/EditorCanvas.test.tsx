// ABOUTME: Tests for EditorCanvas ensuring viewport management, block orchestration, and canvas interactions

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { createMockData } from '../../../test-utils/test-data-factories';
import { EditorCanvas } from '../EditorCanvas';
import { useUnifiedEditorStore } from '@/store/unifiedEditorStore';
import type { RichContentBlock } from '@/types/unified-editor';

// Mock the store and hooks
vi.mock('@/store/unifiedEditorStore', () => ({
  useUnifiedEditorStore: vi.fn(),
  useEditorActions: vi.fn(),
  useBlocks: vi.fn(),
  useCanvasState: vi.fn(),
}));

// Mock RichContentBlock component
vi.mock('../RichContentBlock', () => ({
  RichContentBlock: ({ block, isPreview }: any) => (
    <div
      data-testid={`rich-content-block-${block.id}`}
      data-preview={isPreview}
      style={{
        position: 'absolute',
        left: block.position.x,
        top: block.position.y,
        width: block.dimensions.width,
        height: block.dimensions.height,
      }}
    >
      Block {block.id}
    </div>
  ),
}));

// Mock theme provider
vi.mock('@/components/theme/CustomThemeProvider', () => ({
  useTheme: () => ({
    theme: {
      name: 'default',
      colors: {
        primary: '#3b82f6',
        background: '#ffffff',
        border: '#e5e7eb',
      },
    },
  }),
}));

describe('EditorCanvas', () => {
  const mockActions = {
    clearSelection: vi.fn(),
    createBlock: vi.fn().mockReturnValue('new-block-123'),
    focusBlock: vi.fn(),
    setZoom: vi.fn(),
    setViewport: vi.fn(),
    toggleGrid: vi.fn(),
    selectBlock: vi.fn(),
  };

  const mockBlocks: RichContentBlock[] = [
    {
      id: 'block_1',
      type: 'richContent',
      position: { x: 100, y: 100 },
      dimensions: { width: 300, height: 150 },
      content: {
        tiptapJSON: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Block 1' }] }],
        },
      },
      styling: {
        borderWidth: 1,
        borderRadius: 8,
        padding: { x: 16, y: 12 },
        opacity: 1,
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    {
      id: 'block_2',
      type: 'richContent',
      position: { x: 500, y: 200 },
      dimensions: { width: 300, height: 150 },
      content: {
        tiptapJSON: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Block 2' }] }],
        },
      },
      styling: {
        borderWidth: 1,
        borderRadius: 8,
        padding: { x: 16, y: 12 },
        opacity: 1,
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  ];

  const mockCanvasState = {
    zoom: 1,
    viewport: { x: 0, y: 0 },
    gridEnabled: true,
  };

  const mockGridConfig = {
    size: 20,
    visualStyle: 'dots' as const,
    opacity: 0.3,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock store state
    vi.mocked(useUnifiedEditorStore).mockReturnValue({
      config: {
        grid: mockGridConfig,
      },
    } as any);

    // Mock hooks
    vi.mocked(require('@/store/unifiedEditorStore').useEditorActions).mockReturnValue(mockActions);
    vi.mocked(require('@/store/unifiedEditorStore').useBlocks).mockReturnValue(mockBlocks);
    vi.mocked(require('@/store/unifiedEditorStore').useCanvasState).mockReturnValue(
      mockCanvasState
    );
  });

  // 1. HAPPY PATH TESTING
  it('should render with correct data', () => {
    renderWithProviders(<EditorCanvas />);

    const canvas = screen.getByRole('application', { name: /editor canvas/i });
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass('editor-canvas');
  });

  it('should render all blocks correctly', () => {
    renderWithProviders(<EditorCanvas />);

    expect(screen.getByTestId('rich-content-block-block_1')).toBeInTheDocument();
    expect(screen.getByTestId('rich-content-block-block_2')).toBeInTheDocument();
    expect(screen.getByText('Block block_1')).toBeInTheDocument();
    expect(screen.getByText('Block block_2')).toBeInTheDocument();
  });

  // 2. READ-ONLY MODE TESTING
  it('should handle read-only mode correctly', () => {
    renderWithProviders(<EditorCanvas readOnly={true} />);

    const blocks = screen.getAllByTestId(/rich-content-block-/);
    blocks.forEach(block => {
      expect(block).toHaveAttribute('data-preview', 'true');
    });

    // Should not show canvas instructions in read-only mode
    expect(screen.queryByText('Start creating')).not.toBeInTheDocument();
  });

  // 3. ERROR STATE TESTING
  it('should handle empty blocks gracefully', () => {
    vi.mocked(require('@/store/unifiedEditorStore').useBlocks).mockReturnValue([]);

    renderWithProviders(<EditorCanvas />);

    const canvas = screen.getByRole('application', { name: /editor canvas/i });
    expect(canvas).toBeInTheDocument();
    expect(screen.queryByTestId(/rich-content-block-/)).not.toBeInTheDocument();
  });

  // 4. EMPTY STATE TESTING
  it('should show canvas instructions when empty and not read-only', () => {
    vi.mocked(require('@/store/unifiedEditorStore').useBlocks).mockReturnValue([]);

    renderWithProviders(<EditorCanvas />);

    expect(screen.getByText('Start creating')).toBeInTheDocument();
    expect(screen.getByText('Double-click to create a new block')).toBeInTheDocument();
    expect(screen.getByText(/Cmd\+N/)).toBeInTheDocument();
  });

  it('should not show instructions in read-only mode even when empty', () => {
    vi.mocked(require('@/store/unifiedEditorStore').useBlocks).mockReturnValue([]);

    renderWithProviders(<EditorCanvas readOnly={true} />);

    expect(screen.queryByText('Start creating')).not.toBeInTheDocument();
  });

  // 5. INTERACTION TESTING
  it('should clear selection on canvas click', async () => {
    renderWithProviders(<EditorCanvas />);

    const canvas = screen.getByRole('application', { name: /editor canvas/i });

    fireEvent.click(canvas);

    expect(mockActions.clearSelection).toHaveBeenCalled();
  });

  it('should create new block on double-click', async () => {
    const onBlockCreate = vi.fn();
    renderWithProviders(<EditorCanvas onBlockCreate={onBlockCreate} />);

    const canvas = screen.getByRole('application', { name: /editor canvas/i });

    // Mock getBoundingClientRect
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    } as DOMRect);

    fireEvent.click(canvas, { detail: 2, clientX: 400, clientY: 300 });

    expect(mockActions.createBlock).toHaveBeenCalledWith({
      x: 200, // (400 - 0 - 0) / 1 - 200
      y: 200, // (300 - 0 - 0) / 1 - 100
    });
    expect(onBlockCreate).toHaveBeenCalledWith('new-block-123');

    // Should focus the new block after creation
    await waitFor(
      () => {
        expect(mockActions.focusBlock).toHaveBeenCalledWith('new-block-123');
      },
      { timeout: 200 }
    );
  });

  it('should not create block on double-click in read-only mode', () => {
    renderWithProviders(<EditorCanvas readOnly={true} />);

    const canvas = screen.getByRole('application', { name: /editor canvas/i });
    fireEvent.click(canvas, { detail: 2, clientX: 400, clientY: 300 });

    expect(mockActions.createBlock).not.toHaveBeenCalled();
  });

  // 6. RESPONSIVE TESTING
  it('should be responsive and accessible', () => {
    const { container } = renderWithProviders(<EditorCanvas />);

    const canvas = screen.getByRole('application', { name: /editor canvas/i });
    expect(canvas).toHaveAttribute('tabIndex', '0');
    expect(canvas).toHaveAttribute('aria-label', 'Editor canvas');
    expect(canvas).toHaveClass('w-full', 'h-full');
  });

  // 7. CONDITIONAL RENDERING
  it('should show grid controls when grid is enabled', () => {
    renderWithProviders(<EditorCanvas />);

    const gridButton = screen.getByRole('button', { name: /toggle grid/i });
    expect(gridButton).toBeInTheDocument();
    expect(gridButton).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-700');
  });

  it('should show correct zoom percentage', () => {
    vi.mocked(require('@/store/unifiedEditorStore').useCanvasState).mockReturnValue({
      ...mockCanvasState,
      zoom: 1.5,
    });

    renderWithProviders(<EditorCanvas />);

    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  describe('Keyboard Shortcuts', () => {
    it('should handle zoom in (Cmd/Ctrl + =)', () => {
      renderWithProviders(<EditorCanvas />);

      const canvas = screen.getByRole('application', { name: /editor canvas/i });
      fireEvent.keyDown(canvas, { key: '=', metaKey: true });

      expect(mockActions.setZoom).toHaveBeenCalledWith(1.1); // 1 * 1.1
    });

    it('should handle zoom out (Cmd/Ctrl + -)', () => {
      renderWithProviders(<EditorCanvas />);

      const canvas = screen.getByRole('application', { name: /editor canvas/i });
      fireEvent.keyDown(canvas, { key: '-', ctrlKey: true });

      expect(mockActions.setZoom).toHaveBeenCalledWith(0.9090909090909091); // 1 / 1.1
    });

    it('should handle reset zoom (Cmd/Ctrl + 0)', () => {
      renderWithProviders(<EditorCanvas />);

      const canvas = screen.getByRole('application', { name: /editor canvas/i });
      fireEvent.keyDown(canvas, { key: '0', metaKey: true });

      expect(mockActions.setZoom).toHaveBeenCalledWith(1);
      expect(mockActions.setViewport).toHaveBeenCalledWith({ x: 0, y: 0 });
    });

    it('should handle grid toggle (G)', () => {
      renderWithProviders(<EditorCanvas />);

      const canvas = screen.getByRole('application', { name: /editor canvas/i });
      fireEvent.keyDown(canvas, { key: 'g' });

      expect(mockActions.toggleGrid).toHaveBeenCalled();
    });

    it('should handle new block creation (Cmd/Ctrl + N)', () => {
      const onBlockCreate = vi.fn();
      renderWithProviders(<EditorCanvas onBlockCreate={onBlockCreate} />);

      const canvas = screen.getByRole('application', { name: /editor canvas/i });

      // Mock getBoundingClientRect for center calculation
      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        width: 800,
        height: 600,
      } as DOMRect);

      fireEvent.keyDown(canvas, { key: 'n', metaKey: true });

      expect(mockActions.createBlock).toHaveBeenCalled();
      expect(onBlockCreate).toHaveBeenCalledWith('new-block-123');
      expect(mockActions.focusBlock).toHaveBeenCalledWith('new-block-123');
    });

    it('should handle select all (Cmd/Ctrl + A)', () => {
      renderWithProviders(<EditorCanvas />);

      const canvas = screen.getByRole('application', { name: /editor canvas/i });
      fireEvent.keyDown(canvas, { key: 'a', ctrlKey: true });

      expect(mockActions.selectBlock).toHaveBeenCalledWith('block_1');
      expect(mockActions.selectBlock).toHaveBeenCalledWith('block_2', { multiSelect: true });
    });

    it('should not create block in read-only mode with Cmd+N', () => {
      renderWithProviders(<EditorCanvas readOnly={true} />);

      const canvas = screen.getByRole('application', { name: /editor canvas/i });
      fireEvent.keyDown(canvas, { key: 'n', metaKey: true });

      expect(mockActions.createBlock).not.toHaveBeenCalled();
    });
  });

  describe('Wheel/Scroll Handling', () => {
    it('should handle zoom with Ctrl + wheel', () => {
      renderWithProviders(<EditorCanvas />);

      const canvas = screen.getByRole('application', { name: /editor canvas/i });

      // Zoom in
      fireEvent.wheel(canvas, { deltaY: -100, ctrlKey: true });
      expect(mockActions.setZoom).toHaveBeenCalledWith(1.1);

      // Zoom out
      fireEvent.wheel(canvas, { deltaY: 100, metaKey: true });
      expect(mockActions.setZoom).toHaveBeenCalledWith(0.9);
    });

    it('should handle pan with wheel', () => {
      renderWithProviders(<EditorCanvas />);

      const canvas = screen.getByRole('application', { name: /editor canvas/i });
      fireEvent.wheel(canvas, { deltaX: 50, deltaY: 100 });

      expect(mockActions.setViewport).toHaveBeenCalledWith({
        x: -50, // 0 - 50
        y: -100, // 0 - 100
      });
    });

    it('should constrain zoom within bounds', () => {
      renderWithProviders(<EditorCanvas />);

      const canvas = screen.getByRole('application', { name: /editor canvas/i });

      // Mock current zoom at minimum
      vi.mocked(require('@/store/unifiedEditorStore').useCanvasState).mockReturnValue({
        ...mockCanvasState,
        zoom: 0.1,
      });

      // Try to zoom out beyond minimum
      fireEvent.wheel(canvas, { deltaY: 100, ctrlKey: true });
      expect(mockActions.setZoom).toHaveBeenCalledWith(0.1); // Should stay at minimum
    });
  });

  describe('Panning Functionality', () => {
    it('should handle middle mouse button panning', () => {
      renderWithProviders(<EditorCanvas />);

      const canvas = screen.getByRole('application', { name: /editor canvas/i });

      // Start panning with middle mouse button
      fireEvent.mouseDown(canvas, { button: 1, clientX: 100, clientY: 100 });
      expect(canvas).toHaveClass('cursor-grabbing');
    });

    it('should handle Shift + drag panning', () => {
      renderWithProviders(<EditorCanvas />);

      const canvas = screen.getByRole('application', { name: /editor canvas/i });

      // Start panning with Shift + left click
      fireEvent.mouseDown(canvas, { button: 0, shiftKey: true, clientX: 100, clientY: 100 });
      expect(canvas).toHaveClass('cursor-grabbing');
    });
  });

  describe('Grid System', () => {
    it('should render grid with dots style', () => {
      renderWithProviders(<EditorCanvas />);

      const canvas = screen.getByRole('application', { name: /editor canvas/i });
      const styles = window.getComputedStyle(canvas);

      // Grid should be applied via inline styles
      expect(canvas.style.backgroundImage).toContain('radial-gradient');
    });

    it('should handle lines grid style', () => {
      vi.mocked(useUnifiedEditorStore).mockReturnValue({
        config: {
          grid: {
            ...mockGridConfig,
            visualStyle: 'lines',
          },
        },
      } as any);

      renderWithProviders(<EditorCanvas />);

      const canvas = screen.getByRole('application', { name: /editor canvas/i });
      expect(canvas.style.backgroundImage).toContain('linear-gradient');
    });

    it('should hide grid when disabled', () => {
      vi.mocked(require('@/store/unifiedEditorStore').useCanvasState).mockReturnValue({
        ...mockCanvasState,
        gridEnabled: false,
      });

      renderWithProviders(<EditorCanvas />);

      const gridButton = screen.getByRole('button', { name: /toggle grid/i });
      expect(gridButton).not.toHaveClass('bg-blue-50');
    });

    it('should toggle grid on button click', () => {
      renderWithProviders(<EditorCanvas />);

      const gridButton = screen.getByRole('button', { name: /toggle grid/i });
      fireEvent.click(gridButton);

      expect(mockActions.toggleGrid).toHaveBeenCalled();
    });
  });

  describe('Canvas Transform', () => {
    it('should apply correct transform styles based on zoom and viewport', () => {
      vi.mocked(require('@/store/unifiedEditorStore').useCanvasState).mockReturnValue({
        zoom: 1.5,
        viewport: { x: -100, y: -50 },
        gridEnabled: true,
      });

      renderWithProviders(<EditorCanvas />);

      const canvasContent = document.querySelector('.editor-canvas-content');
      expect(canvasContent).toHaveStyle({
        transform: 'scale(1.5) translate(-66.66666666666667px, -33.333333333333336px)',
        transformOrigin: '0 0',
      });
    });
  });

  describe('Development Features', () => {
    it('should show development indicators in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      renderWithProviders(<EditorCanvas />);

      // Should show block count
      expect(screen.getByText('2 blocks')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not show development indicators in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      renderWithProviders(<EditorCanvas />);

      // Should not show block count
      expect(screen.queryByText('2 blocks')).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Theme Integration', () => {
    it('should apply theme-based styling', () => {
      renderWithProviders(<EditorCanvas />);

      const canvas = screen.getByRole('application', { name: /editor canvas/i });
      expect(canvas).toHaveStyle({
        backgroundColor: 'hsl(var(--background))',
      });
    });
  });
});
