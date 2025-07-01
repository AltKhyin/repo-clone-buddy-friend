// ABOUTME: Tests to detect infinite update loops in editor components
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { InspectorPanel } from './Inspector/InspectorPanel';
import { TopToolbar } from './TopToolbar';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

// Mock Zustand stores
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn(() => ({
    selectedNodeId: null,
    selectNode: vi.fn(),
    nodes: {},
    setNodeProperty: vi.fn(),
    history: [],
    historyIndex: 0,
    undo: vi.fn(),
    redo: vi.fn(),
    isGridVisible: false,
    toggleGrid: vi.fn(),
    isRulerVisible: false,
    toggleRuler: vi.fn(),
    guidelines: { horizontal: [], vertical: [] },
    showGuidelines: false,
    toggleGuidelines: vi.fn(),
    clearGuidelines: vi.fn(),
  })),
}));

vi.mock('@/store/themeStore', () => ({
  useThemeStore: vi.fn(() => ({
    currentTheme: {
      name: 'default',
      colors: { primary: '#000000' },
      typography: { fontFamilies: { primary: { name: 'Arial' } } },
      spacing: { unit: 8 },
      effects: { shadows: {}, borders: {} },
    },
  })),
  useCustomThemes: vi.fn(() => []),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Infinite Loop Detection', () => {
  let consoleErrorSpy: any;
  let renderingErrors: string[] = [];

  beforeEach(() => {
    renderingErrors = [];
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(message => {
      if (typeof message === 'string' && message.includes('Maximum update depth exceeded')) {
        renderingErrors.push(message);
      }
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should not cause infinite loops in InspectorPanel', async () => {
    const { unmount } = render(
      <TestWrapper>
        <InspectorPanel />
      </TestWrapper>
    );

    // Wait for component to settle
    await waitFor(
      () => {
        expect(screen.getByText('No Block Selected')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Check for infinite loop errors
    expect(renderingErrors).toHaveLength(0);

    unmount();
  });

  it('should not cause infinite loops in TopToolbar', async () => {
    const { unmount } = render(
      <TestWrapper>
        <TopToolbar />
      </TestWrapper>
    );

    // Wait for component to render
    await waitFor(
      () => {
        expect(screen.getByRole('toolbar')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Check for infinite loop errors
    expect(renderingErrors).toHaveLength(0);

    unmount();
  });

  it('should detect Maximum update depth exceeded errors', async () => {
    // Simulate a component that would cause infinite loops
    const ProblematicComponent = () => {
      const [state, setState] = React.useState(0);

      // This would cause infinite loop
      React.useEffect(() => {
        setState(prev => prev + 1);
      }, [state]);

      return <div>Problematic: {state}</div>;
    };

    // This test should catch the infinite loop
    try {
      render(
        <TestWrapper>
          <ProblematicComponent />
        </TestWrapper>
      );

      await waitFor(
        () => {
          expect(renderingErrors.length).toBeGreaterThan(0);
        },
        { timeout: 2000 }
      );
    } catch (error) {
      // Expected to fail due to infinite loop
      expect(error.toString()).toContain('Maximum update depth exceeded');
    }
  });
});
