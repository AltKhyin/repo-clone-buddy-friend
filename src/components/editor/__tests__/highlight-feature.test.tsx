// ABOUTME: Test suite for the highlight feature functionality in UnifiedToolbar

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useEditorStore } from '@/store/editorStore';
import { UnifiedToolbar } from '../UnifiedToolbar';

// Mock the editor store
vi.mock('@/store/editorStore');

// Mock lucide-react icons - comprehensive mock to avoid missing icon errors
vi.mock('lucide-react', async (importOriginal) => {
  const MockIcon = ({ size, className, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'mock-icon',
      'data-size': size,
      className,
      ...props,
    });

  return {
    Bold: MockIcon,
    Italic: MockIcon,
    Highlighter: MockIcon,
    Type: MockIcon,
    AlignLeft: MockIcon,
    AlignCenter: MockIcon,
    AlignRight: MockIcon,
    AlignJustify: MockIcon,
    Monitor: MockIcon,
    Smartphone: MockIcon,
    HelpCircle: MockIcon,
    Trash2: MockIcon,
    Copy: MockIcon,
    Ruler: MockIcon,
    Underline: MockIcon,
    Strikethrough: MockIcon,
    ZoomIn: MockIcon,
    ZoomOut: MockIcon,
    Table: MockIcon,
    Plus: MockIcon,
    Image: MockIcon,
    Video: MockIcon,
    MousePointer: MockIcon,
    Hash: MockIcon,
    Lightbulb: MockIcon,
    Quote: MockIcon,
    BarChart3: MockIcon,
    Settings: MockIcon,
    Keyboard: MockIcon,
    Eye: MockIcon,
    Grid: MockIcon,
    ChevronDown: MockIcon,
  };
});

// Mock other components
vi.mock('../KeyboardShortcutsPanel', () => ({
  KeyboardShortcutsPanel: () => <div data-testid="keyboard-shortcuts-panel" />,
}));

vi.mock('@/components/header/ThemeSelector', () => ({
  ThemeSelector: () => <div data-testid="theme-selector" />,
}));

vi.mock('@/hooks/useTextSelection', () => ({
  useTextSelection: () => ({
    textSelection: null,
    applyTypographyToSelection: vi.fn(),
    extractTextProperties: vi.fn(),
  }),
}));

vi.mock('@/components/providers/CustomThemeProvider', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ reviewId: 'test-review-id' }),
}));

const mockTypographyCommands = {
  toggleHighlight: vi.fn(() => ({ success: true, appliedProperties: {}, errors: [] })),
  getCurrentAttributes: vi.fn(() => ({})),
  getActiveMarks: vi.fn(() => ({})),
};

const mockEditorStore = {
  selectedNodeId: 'test-block-id',
  nodes: [
    {
      id: 'test-block-id',
      type: 'textBlock',
      data: { content: 'Test content', backgroundColor: null },
    },
  ],
  updateNode: vi.fn(),
  deleteNode: vi.fn(),
  duplicateNode: vi.fn(),
  selectNode: vi.fn(),
  showGrid: true,
  showSnapGuides: false,
  toggleSnapGuides: vi.fn(),
  canvasZoom: 1.0,
  updateCanvasZoom: vi.fn(),
  getEditor: vi.fn(() => ({
    commands: mockTypographyCommands,
  })),
};

describe('Highlight Feature Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useEditorStore as any).mockReturnValue(mockEditorStore);
  });

  describe('Highlight Button Rendering', () => {
    it('should render highlight button when block supports backgroundColor', () => {
      render(<UnifiedToolbar />);

      const highlightButton = screen.getByRole('button', { name: /highlight text/i });
      expect(highlightButton).toBeInTheDocument();
      expect(highlightButton).toHaveAttribute('title', 'Highlight text (Ctrl+Shift+H)');
      expect(highlightButton).toHaveAttribute('aria-keyshortcuts', 'Ctrl+Shift+H');
    });

    it('should show correct active state when text is highlighted', () => {
      const mockStoreWithHighlight = {
        ...mockEditorStore,
        nodes: [
          {
            id: 'test-block-id',
            type: 'textBlock',
            data: { content: 'Test content', backgroundColor: '#ffeb3b' },
          },
        ],
      };
      (useEditorStore as any).mockReturnValue(mockStoreWithHighlight);

      render(<UnifiedToolbar />);

      const highlightButton = screen.getByRole('button', { name: /highlight text/i });
      expect(highlightButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should show inactive state when text is not highlighted', () => {
      render(<UnifiedToolbar />);

      const highlightButton = screen.getByRole('button', { name: /highlight text/i });
      expect(highlightButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Highlight Button Functionality', () => {
    it('should toggle highlight when clicked', () => {
      render(<UnifiedToolbar />);

      const highlightButton = screen.getByRole('button', { name: /highlight text/i });
      fireEvent.click(highlightButton);

      expect(mockEditorStore.updateNode).toHaveBeenCalledWith('test-block-id', {
        data: { content: 'Test content', backgroundColor: '#ffeb3b' },
      });
    });

    it('should remove highlight when already highlighted', () => {
      const mockStoreWithHighlight = {
        ...mockEditorStore,
        nodes: [
          {
            id: 'test-block-id',
            type: 'textBlock',
            data: { content: 'Test content', backgroundColor: '#ffeb3b' },
          },
        ],
      };
      (useEditorStore as any).mockReturnValue(mockStoreWithHighlight);

      render(<UnifiedToolbar />);

      const highlightButton = screen.getByRole('button', { name: /highlight text/i });
      fireEvent.click(highlightButton);

      expect(mockEditorStore.updateNode).toHaveBeenCalledWith('test-block-id', {
        data: { content: 'Test content', backgroundColor: '' },
      });
    });

    it('should be disabled when no block is selected', () => {
      const mockStoreNoSelection = {
        ...mockEditorStore,
        selectedNodeId: null,
        nodes: [],
      };
      (useEditorStore as any).mockReturnValue(mockStoreNoSelection);

      render(<UnifiedToolbar />);

      const highlightButton = screen.getByRole('button', { name: /highlight text/i });
      expect(highlightButton).toBeDisabled();
    });
  });

  describe('Keyboard Shortcut Integration', () => {
    it('should display correct keyboard shortcut in title and aria attributes', () => {
      render(<UnifiedToolbar />);

      const highlightButton = screen.getByRole('button', { name: /highlight text/i });
      expect(highlightButton).toHaveAttribute('title', 'Highlight text (Ctrl+Shift+H)');
      expect(highlightButton).toHaveAttribute('aria-keyshortcuts', 'Ctrl+Shift+H');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<UnifiedToolbar />);

      const highlightButton = screen.getByRole('button', { name: /highlight text/i });
      expect(highlightButton).toHaveAccessibleName();
      expect(highlightButton).toHaveAttribute('aria-pressed');
      expect(highlightButton).toHaveAttribute('aria-keyshortcuts');
    });

    it('should update aria-label based on highlight state', () => {
      const mockStoreWithHighlight = {
        ...mockEditorStore,
        nodes: [
          {
            id: 'test-block-id',
            type: 'textBlock',
            data: { content: 'Test content', backgroundColor: '#ffeb3b' },
          },
        ],
      };
      (useEditorStore as any).mockReturnValue(mockStoreWithHighlight);

      render(<UnifiedToolbar />);

      const highlightButton = screen.getByRole('button', { name: /highlight text.*currently active/i });
      expect(highlightButton).toBeInTheDocument();
    });
  });
});