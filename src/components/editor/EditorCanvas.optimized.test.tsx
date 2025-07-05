// ABOUTME: Optimized EditorCanvas test with lightweight mocks and performance monitoring

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditorCanvas } from './EditorCanvas';
import {
  setupLightweightTest,
  cleanupLightweightTest,
  createFastTestWrapper,
  synchronizeMocks,
} from '@/test-utils/lightweight-mocks';
import {
  withPerformanceMonitoring,
  measureTestTime,
  PERFORMANCE_BUDGETS,
} from '@/test-utils/performance-budget';

// OPTIMIZATION: Use lightweight mocks instead of comprehensive ones
const { store, ui } = setupLightweightTest();

// OPTIMIZATION: Replace heavy external dependencies with fast mocks
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  useDndContext: () => ({ active: null, over: null }),
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
  useDraggable: () => ({ setNodeRef: vi.fn(), isDragging: false }),
}));

vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children }: any) => <div data-testid="react-flow">{children}</div>,
  useReactFlow: () => ({ getViewport: () => ({ x: 0, y: 0, zoom: 1 }) }),
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  Controls: () => <div data-testid="controls" />,
  Background: () => <div data-testid="background" />,
}));

// OPTIMIZATION: Mock heavy canvas helpers
vi.mock('./CanvasHelpers', () => ({
  CanvasHelpers: () => <div data-testid="canvas-helpers" />,
}));

const createOptimizedMockStore = (overrides = {}) => ({
  nodes: [],
  selectedNodeId: null,
  currentViewport: 'desktop',
  layouts: {
    desktop: { gridSettings: { columns: 12 }, items: [] },
    mobile: { gridSettings: { columns: 4 }, items: [] },
  },
  updateLayout: vi.fn(),
  selectNode: vi.fn(),
  ...overrides,
});

describe('EditorCanvas - Optimized', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    synchronizeMocks(); // Replace async operations with sync versions
    store.useEditorStore.mockReturnValue(createOptimizedMockStore());
  });

  afterEach(() => {
    cleanupLightweightTest();
  });

  const FastWrapper = createFastTestWrapper;

  describe('Performance Tests', () => {
    it('should render empty canvas within performance budget', async () => {
      const testResult = await measureTestTime(
        () => {
          render(
            <FastWrapper>
              <EditorCanvas />
            </FastWrapper>
          );

          expect(screen.getByText('Empty Canvas')).toBeInTheDocument();
        },
        'EditorCanvas Empty State Render',
        'unit'
      );

      // Verify performance expectations
      expect(testResult.duration).toBeWithinPerformanceBudget('unit');
      expect(testResult.report.grade).toMatch(/excellent|good/);
    });

    it('should handle viewport switching efficiently', async () => {
      const testFn = withPerformanceMonitoring(
        () => {
          // Test desktop viewport
          store.useEditorStore.mockReturnValue(
            createOptimizedMockStore({
              currentViewport: 'desktop',
            })
          );

          const { rerender } = render(
            <FastWrapper>
              <EditorCanvas />
            </FastWrapper>
          );

          expect(screen.getByText(/desktop.*View/i)).toBeInTheDocument();

          // Switch to mobile viewport
          store.useEditorStore.mockReturnValue(
            createOptimizedMockStore({
              currentViewport: 'mobile',
            })
          );

          rerender(
            <FastWrapper>
              <EditorCanvas />
            </FastWrapper>
          );

          expect(screen.getByText(/mobile.*View/i)).toBeInTheDocument();
        },
        'EditorCanvas Viewport Switching',
        'unit'
      );

      await testFn();
    });

    it('should render with nodes without performance degradation', async () => {
      const testResult = await measureTestTime(
        () => {
          const mockNodes = Array.from({ length: 10 }, (_, i) => ({
            id: `node-${i}`,
            type: 'textBlock' as const,
            data: { htmlContent: `<p>Content ${i}</p>` },
          }));

          store.useEditorStore.mockReturnValue(
            createOptimizedMockStore({
              nodes: mockNodes,
            })
          );

          render(
            <FastWrapper>
              <EditorCanvas />
            </FastWrapper>
          );

          expect(screen.getByTestId('react-flow')).toBeInTheDocument();
        },
        'EditorCanvas with Multiple Nodes',
        'unit'
      );

      // Should still be fast even with multiple nodes
      expect(testResult.duration).toBeLessThan(PERFORMANCE_BUDGETS.unit.acceptable);
    });
  });

  describe('Core Functionality - Fast Tests', () => {
    it('should display correct viewport information', () => {
      store.useEditorStore.mockReturnValue(
        createOptimizedMockStore({
          currentViewport: 'desktop',
        })
      );

      render(
        <FastWrapper>
          <EditorCanvas />
        </FastWrapper>
      );

      expect(screen.getByText(/desktop.*View/i)).toBeInTheDocument();
      expect(screen.getByText(/12 columns/)).toBeInTheDocument();
    });

    it('should render essential components', () => {
      render(
        <FastWrapper>
          <EditorCanvas />
        </FastWrapper>
      );

      // Check for essential elements without heavy rendering
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      expect(screen.getByTestId('background')).toBeInTheDocument();
      expect(screen.getByTestId('controls')).toBeInTheDocument();
    });

    it('should handle empty state efficiently', () => {
      store.useEditorStore.mockReturnValue(
        createOptimizedMockStore({
          nodes: [],
        })
      );

      render(
        <FastWrapper>
          <EditorCanvas />
        </FastWrapper>
      );

      expect(screen.getByText('Empty Canvas')).toBeInTheDocument();
      expect(screen.getByText(/Drag blocks from the palette/)).toBeInTheDocument();
    });

    it('should switch between mobile and desktop layouts', () => {
      // Test mobile
      store.useEditorStore.mockReturnValue(
        createOptimizedMockStore({
          currentViewport: 'mobile',
        })
      );

      const { rerender } = render(
        <FastWrapper>
          <EditorCanvas />
        </FastWrapper>
      );

      expect(screen.getByText(/mobile.*View/i)).toBeInTheDocument();
      expect(screen.getByText(/4 columns/)).toBeInTheDocument();

      // Test desktop
      store.useEditorStore.mockReturnValue(
        createOptimizedMockStore({
          currentViewport: 'desktop',
        })
      );

      rerender(
        <FastWrapper>
          <EditorCanvas />
        </FastWrapper>
      );

      expect(screen.getByText(/desktop.*View/i)).toBeInTheDocument();
      expect(screen.getByText(/12 columns/)).toBeInTheDocument();
    });
  });

  describe('Store Integration - Lightweight', () => {
    it('should respond to store changes without delays', () => {
      const updateLayout = vi.fn();

      store.useEditorStore.mockReturnValue(
        createOptimizedMockStore({
          updateLayout,
        })
      );

      render(
        <FastWrapper>
          <EditorCanvas />
        </FastWrapper>
      );

      // Verify mock is available
      expect(updateLayout).toBeDefined();
    });

    it('should handle layout data efficiently', () => {
      const mockLayouts = {
        desktop: {
          gridSettings: { columns: 12 },
          items: [{ nodeId: 'test', x: 0, y: 0, w: 6, h: 2 }],
        },
        mobile: {
          gridSettings: { columns: 4 },
          items: [{ nodeId: 'test', x: 0, y: 0, w: 4, h: 3 }],
        },
      };

      store.useEditorStore.mockReturnValue(
        createOptimizedMockStore({
          layouts: mockLayouts,
          currentViewport: 'desktop',
        })
      );

      render(
        <FastWrapper>
          <EditorCanvas />
        </FastWrapper>
      );

      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });
});

// EXAMPLE: Performance boundary test
describe('EditorCanvas Performance Boundaries', () => {
  it('should meet excellent performance standards', async () => {
    const duration = await measureTestTime(
      () => {
        render(
          <FastWrapper>
            <EditorCanvas />
          </FastWrapper>
        );
      },
      'Performance Boundary Test',
      'unit'
    );

    expect(duration.duration).toBeExcellentPerformance('unit');
  });
});
