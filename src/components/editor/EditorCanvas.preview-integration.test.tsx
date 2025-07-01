// ABOUTME: Integration tests for PreviewBoundary within EditorCanvas ensuring proper canvas integration

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditorCanvas } from './EditorCanvas';

// Mock the editor store
const mockEditorStore = {
  nodes: [],
  layouts: {
    desktop: { gridSettings: { columns: 12 }, items: [] },
    mobile: { gridSettings: { columns: 4 }, items: [] },
  },
  currentViewport: 'desktop',
  selectedNodeId: null,
  canvasTheme: 'light',
  showGrid: true,
  showRulers: false,
  showGuidelines: false,
  updateNode: vi.fn(),
  updateLayout: vi.fn(),
  selectNode: vi.fn(),
};

vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => mockEditorStore,
}));

// Mock React Flow context dependencies
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react');
  return {
    ...actual,
    useReactFlow: () => ({
      getNodes: () => [],
      setNodes: vi.fn(),
      getEdges: () => [],
      setEdges: vi.fn(),
      fitView: vi.fn(),
    }),
    useNodesState: () => [[], vi.fn()],
    useEdgesState: () => [[], vi.fn()],
  };
});

// Mock other dependencies
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }),
}));

vi.mock('@/hooks/useDragDropReordering', () => ({
  useDragDropReordering: () => ({
    isDragging: false,
    draggedNodeId: null,
    dropZones: [],
    dragState: {
      hoveredNodeId: null,
      dropZonePosition: null,
      draggedPosition: { x: 0, y: 0 },
    },
    handleDropZoneHover: vi.fn(),
    handleDrop: vi.fn(),
  }),
}));

// Create test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ReactFlowProvider>{children}</ReactFlowProvider>
    </QueryClientProvider>
  );
};

describe('EditorCanvas PreviewBoundary Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Preview Boundary Rendering', () => {
    it('should render preview boundary within the canvas', async () => {
      render(
        <TestWrapper>
          <EditorCanvas />
        </TestWrapper>
      );

      // Preview boundary should be present
      const previewBoundary = await screen.findByTestId('preview-boundary');
      expect(previewBoundary).toBeInTheDocument();
    });

    it('should show preview boundary controls', async () => {
      render(
        <TestWrapper>
          <EditorCanvas />
        </TestWrapper>
      );

      // Controls should be visible
      const previewButton = await screen.findByRole('button', { name: 'Preview' });
      expect(previewButton).toBeInTheDocument();

      const measurementsButton = await screen.findByRole('button', { name: 'Toggle Measurements' });
      expect(measurementsButton).toBeInTheDocument();
    });

    it('should render 12 grid columns for desktop view', async () => {
      mockEditorStore.currentViewport = 'desktop';

      render(
        <TestWrapper>
          <EditorCanvas />
        </TestWrapper>
      );

      const gridIndicators = await screen.findAllByTestId('grid-column-indicator');
      expect(gridIndicators).toHaveLength(12);
    });

    it('should render single column for mobile view', async () => {
      mockEditorStore.currentViewport = 'mobile';

      render(
        <TestWrapper>
          <EditorCanvas />
        </TestWrapper>
      );

      const gridIndicators = await screen.findAllByTestId('grid-column-indicator');
      expect(gridIndicators).toHaveLength(1);
    });
  });

  describe('Canvas Layout Integration', () => {
    it('should not interfere with React Flow interactions', async () => {
      render(
        <TestWrapper>
          <EditorCanvas />
        </TestWrapper>
      );

      const previewBoundary = await screen.findByTestId('preview-boundary');
      expect(previewBoundary).toHaveClass('pointer-events-none');
    });

    it('should be positioned above canvas but below controls', async () => {
      render(
        <TestWrapper>
          <EditorCanvas />
        </TestWrapper>
      );

      const previewBoundary = await screen.findByTestId('preview-boundary');
      expect(previewBoundary).toHaveClass('z-[5]');
    });

    it('should show viewport indicator alongside preview controls', async () => {
      render(
        <TestWrapper>
          <EditorCanvas />
        </TestWrapper>
      );

      // Viewport indicator should be present
      const viewportText = await screen.findByText('Desktop View');
      expect(viewportText).toBeInTheDocument();

      // Grid info should be shown
      const gridInfo = await screen.findByText(/12 columns/);
      expect(gridInfo).toBeInTheDocument();
    });
  });

  describe('Responsive Preview Area', () => {
    it('should show desktop layout dimensions', async () => {
      mockEditorStore.currentViewport = 'desktop';

      render(
        <TestWrapper>
          <EditorCanvas />
        </TestWrapper>
      );

      const dimensionLabel = await screen.findByText('Desktop - 12 Columns');
      expect(dimensionLabel).toBeInTheDocument();
    });

    it('should show mobile layout dimensions', async () => {
      mockEditorStore.currentViewport = 'mobile';

      render(
        <TestWrapper>
          <EditorCanvas />
        </TestWrapper>
      );

      const dimensionLabel = await screen.findByText('Mobile - Single Column');
      expect(dimensionLabel).toBeInTheDocument();
    });
  });

  describe('Canvas Theme Integration', () => {
    it('should adapt to light canvas theme', async () => {
      mockEditorStore.canvasTheme = 'light';

      render(
        <TestWrapper>
          <EditorCanvas />
        </TestWrapper>
      );

      const canvas = screen.getByRole('generic');
      expect(canvas.className).toContain('bg-gray-50');
    });

    it('should adapt to dark canvas theme', async () => {
      mockEditorStore.canvasTheme = 'dark';

      render(
        <TestWrapper>
          <EditorCanvas />
        </TestWrapper>
      );

      const canvas = screen.getByRole('generic');
      expect(canvas.className).toContain('bg-zinc-900');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing viewport data gracefully', async () => {
      mockEditorStore.currentViewport = null as any;

      expect(() =>
        render(
          <TestWrapper>
            <EditorCanvas />
          </TestWrapper>
        )
      ).not.toThrow();
    });

    it('should handle invalid grid settings gracefully', async () => {
      mockEditorStore.layouts = null as any;

      expect(() =>
        render(
          <TestWrapper>
            <EditorCanvas />
          </TestWrapper>
        )
      ).not.toThrow();
    });
  });
});
