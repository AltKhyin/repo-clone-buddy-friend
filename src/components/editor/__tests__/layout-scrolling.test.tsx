// ABOUTME: Tests for fixed header/sidebar layout with canvas-only scrolling behavior

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EditorPage from '@/pages/EditorPage';

// Mock dependencies
const mockUseEditorStore = {
  selectedNodeId: null,
  nodes: [],
  positions: {},
  updateNode: vi.fn(),
  deleteNode: vi.fn(),
  duplicateNode: vi.fn(),
  selectNode: vi.fn(),
  addNode: vi.fn(),
  showGrid: false,
  showSnapGuides: false,
  toggleSnapGuides: vi.fn(),
  canvasZoom: 1.0,
  updateCanvasZoom: vi.fn(),
  isSaving: false,
  isDirty: false,
  lastSaved: null,
  isFullscreen: false,
  setPersistenceCallbacks: vi.fn(),
};

vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => mockUseEditorStore,
}));

vi.mock('@/components/providers/CustomThemeProvider', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock TanStack Query
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  }),
  useMutation: () => ({
    mutate: vi.fn(),
    isLoading: false,
  }),
  useQuery: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
}));

// Mock editor hooks
vi.mock('@/hooks/useEditorSave', () => ({
  useEditorSaveMutation: () => ({
    mutate: vi.fn(),
    isLoading: false,
  }),
  useEditorLoadQuery: () => ({
    data: null,
    isLoading: false,
  }),
}));

// Mock additional hooks
vi.mock('@/hooks/useEditorPersistence', () => ({
  useEditorPersistence: () => ({
    setPersistenceCallbacks: vi.fn(),
    persistenceState: { status: 'idle' },
    persistenceActions: { save: vi.fn(), autoSave: vi.fn() },
  }),
}));

vi.mock('@/hooks/useFullscreen', () => ({
  useFullscreen: () => ({
    isFullscreen: false,
    toggleFullscreen: vi.fn(),
  }),
}));

vi.mock('@/hooks/useEditorBackup', () => ({
  useEditorBackup: () => ({
    showRecoveryDialog: false,
    setShowRecoveryDialog: vi.fn(),
    recoveryState: null,
    recoveryActions: { recover: vi.fn() },
    handleRecovery: vi.fn(),
  }),
}));

// Mock child components
vi.mock('@/components/editor/UnifiedToolbar', () => ({
  UnifiedToolbar: () => <div data-testid="unified-toolbar">Toolbar</div>,
}));

vi.mock('@/components/editor/EditorSidebar', () => ({
  EditorSidebar: () => <div data-testid="editor-sidebar">Sidebar</div>,
}));

vi.mock('@/components/editor/WYSIWYGCanvas', () => ({
  WYSIWYGCanvas: () => <div data-testid="wysiwyg-canvas">Canvas</div>,
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Layout Scrolling Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render main container with fixed height and no overflow', () => {
    const { container } = render(
      <TestWrapper>
        <EditorPage />
      </TestWrapper>
    );

    // Main container should have h-screen and overflow-hidden for fixed layout
    const mainContainer = container.querySelector('.h-screen.overflow-hidden');
    expect(mainContainer).toBeInTheDocument();
  });

  it('should render header and toolbar with fixed positioning', () => {
    render(
      <TestWrapper>
        <EditorPage />
      </TestWrapper>
    );

    const toolbar = screen.getByTestId('unified-toolbar');
    const toolbarContainer = toolbar.closest('.sticky, .fixed');

    // Toolbar container should have sticky or fixed positioning
    expect(toolbarContainer).toBeInTheDocument();
    expect(toolbarContainer).toHaveClass('top-0');
  });

  it('should render sidebar with fixed width and internal scrolling', () => {
    render(
      <TestWrapper>
        <EditorPage />
      </TestWrapper>
    );

    const sidebar = screen.getByTestId('editor-sidebar');
    const sidebarContainer = sidebar.closest('.w-64');

    // Sidebar should have fixed width and overflow-y-auto
    expect(sidebarContainer).toBeInTheDocument();
    expect(sidebarContainer).toHaveClass('overflow-y-auto');
  });

  it('should render canvas with scrollable container', () => {
    render(
      <TestWrapper>
        <EditorPage />
      </TestWrapper>
    );

    const canvas = screen.getByTestId('wysiwyg-canvas');
    const canvasContainer = canvas.closest('.overflow-y-auto');

    // Canvas container should be scrollable
    expect(canvasContainer).toBeInTheDocument();
    expect(canvasContainer).toHaveClass('flex-1');
  });

  it('should maintain responsive design structure', () => {
    const { container } = render(
      <TestWrapper>
        <EditorPage />
      </TestWrapper>
    );

    // Should have flex layout for responsive design
    const flexContainer = container.querySelector('.flex');
    expect(flexContainer).toBeInTheDocument();
  });
});
