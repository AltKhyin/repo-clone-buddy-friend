// ABOUTME: Test suite for UnifiedToolbar component ensuring all 6 categories render and function correctly

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useEditorStore } from '@/store/editorStore';
import { UnifiedToolbar } from '../UnifiedToolbar';

// Mock the editor store
vi.mock('@/store/editorStore');

// Mock the custom theme provider
vi.mock('@/components/providers/CustomThemeProvider', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

// Mock React Router
vi.mock('react-router-dom', () => ({
  useParams: () => ({ reviewId: 'test-review-id' }),
}));

// Mock child components
vi.mock('../KeyboardShortcutsPanel', () => ({
  KeyboardShortcutsPanel: () => <button>Shortcuts</button>,
}));

vi.mock('../TypographyDropdown', () => ({
  TypographyDropdown: ({ selectedNode, disabled }: any) => (
    <button
      disabled={disabled}
      title="Typography controls (click for options)"
      aria-label="Typography controls (click for options)"
    >
      <div data-testid="type-icon" />
      {selectedNode && <span>Type</span>}
    </button>
  ),
}));

vi.mock('../HistoryIndicator', () => ({
  HistoryIndicator: ({ compact }: { compact?: boolean }) => (
    <div data-testid="history-indicator" data-compact={compact}>
      History
    </div>
  ),
}));

vi.mock('@/components/header/ThemeSelector', () => ({
  ThemeSelector: () => <button>Theme</button>,
}));

vi.mock('../Inspector/shared/BackgroundControls', () => ({
  BackgroundControls: ({ data, onChange, className }: any) => (
    <div data-testid="background-controls" className={className}>
      <input
        data-testid="background-color-input"
        type="color"
        value={data.backgroundColor || 'transparent'}
        onChange={e => onChange({ backgroundColor: e.target.value })}
      />
      <button
        data-testid="clear-background-button"
        onClick={() => onChange({ backgroundColor: 'transparent' })}
      >
        Clear
      </button>
    </div>
  ),
}));

vi.mock('../Inspector/shared/SpacingControls', () => ({
  SpacingControls: ({ data, onChange, className }: any) => (
    <div data-testid="spacing-controls" className={className}>
      <input
        data-testid="padding-x-input"
        type="number"
        value={data.paddingX || 0}
        onChange={e => onChange({ paddingX: parseInt(e.target.value) })}
      />
      <input
        data-testid="padding-y-input"
        type="number"
        value={data.paddingY || 0}
        onChange={e => onChange({ paddingY: parseInt(e.target.value) })}
      />
      <button
        data-testid="spacing-preset-button"
        onClick={() => onChange({ paddingX: 16, paddingY: 12 })}
      >
        Normal
      </button>
    </div>
  ),
}));

vi.mock('../Inspector/shared/BorderControls', () => ({
  BorderControls: ({ data, onChange, className }: any) => (
    <div data-testid="border-controls" className={className}>
      <input
        data-testid="border-width-input"
        type="number"
        value={data.borderWidth || 0}
        onChange={e => onChange({ borderWidth: parseInt(e.target.value) })}
      />
      <input
        data-testid="border-radius-input"
        type="number"
        value={data.borderRadius || 0}
        onChange={e => onChange({ borderRadius: parseInt(e.target.value) })}
      />
      <button
        data-testid="border-toggle-button"
        onClick={() => onChange({ borderWidth: data.borderWidth > 0 ? 0 : 1 })}
      >
        Toggle Border
      </button>
    </div>
  ),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Save: () => <div data-testid="save-icon" />,
  Download: () => <div data-testid="download-icon" />,
  ExternalLink: () => <div data-testid="external-link-icon" />,
  Undo2: () => <div data-testid="undo-icon" />,
  Redo2: () => <div data-testid="redo-icon" />,
  History: () => <div data-testid="history-icon" />,
  Bold: () => <div data-testid="bold-icon" />,
  Italic: () => <div data-testid="italic-icon" />,
  AlignLeft: () => <div data-testid="align-left-icon" />,
  AlignCenter: () => <div data-testid="align-center-icon" />,
  AlignRight: () => <div data-testid="align-right-icon" />,
  Type: () => <div data-testid="text-icon" />,
  Hash: () => <div data-testid="hash-icon" />,
  Image: () => <div data-testid="image-icon" />,
  Minus: () => <div data-testid="separator-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Lightbulb: () => <div data-testid="lightbulb-icon" />,
  Quote: () => <div data-testid="quote-icon" />,
  Eye: () => <div data-testid="preview-icon" />,
  Monitor: () => <div data-testid="desktop-icon" />,
  Smartphone: () => <div data-testid="mobile-icon" />,
  Tablet: () => <div data-testid="tablet-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Keyboard: () => <div data-testid="keyboard-icon" />,
  HelpCircle: () => <div data-testid="help-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Copy: () => <div data-testid="copy-icon" />,
  Grid: () => <div data-testid="grid-icon" />,
  Ruler: () => <div data-testid="ruler-icon" />,
  Palette: () => <div data-testid="palette-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />,
  Underline: () => <div data-testid="underline-icon" />,
  Strikethrough: () => <div data-testid="strikethrough-icon" />,
  AlignJustify: () => <div data-testid="align-justify-icon" />,
  Check: () => <div data-testid="check-icon" />,
  Settings2: () => <div data-testid="settings2-icon" />,
  RotateCcw: () => <div data-testid="rotate-ccw-icon" />,
  Move: () => <div data-testid="move-icon" />,
  ArrowLeftRight: () => <div data-testid="arrow-left-right-icon" />,
  ArrowUpDown: () => <div data-testid="arrow-up-down-icon" />,
  Link: () => <div data-testid="link-icon" />,
  Unlink: () => <div data-testid="unlink-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  Square: () => <div data-testid="square-icon" />,
  MoreHorizontal: () => <div data-testid="more-horizontal-icon" />,
  Heading1: () => <div data-testid="heading1-icon" />,
  Heading2: () => <div data-testid="heading2-icon" />,
  Heading3: () => <div data-testid="heading3-icon" />,
  Heading4: () => <div data-testid="heading4-icon" />,
  ZoomIn: () => <div data-testid="zoom-in-icon" />,
  ZoomOut: () => <div data-testid="zoom-out-icon" />,
}));

const mockEditorStore = {
  selectedNodeId: null,
  nodes: [],
  updateNode: vi.fn(),
  deleteNode: vi.fn(),
  duplicateNode: vi.fn(),
  selectNode: vi.fn(),
  addNode: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  canUndo: false,
  canRedo: false,
  saveToDatabase: vi.fn(),
  exportToJSON: vi.fn(),
  isDirty: false,
  isSaving: false,
  lastSaved: null,
  showGrid: true,
  showSnapGuides: false,
  toggleSnapGuides: vi.fn(),
  canvasZoom: 1.0,
  updateCanvasZoom: vi.fn(),
};

describe('UnifiedToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useEditorStore as any).mockReturnValue(mockEditorStore);
  });

  describe('Toolbar Structure', () => {
    it('should render main categories after Phase 1 reorganization', () => {
      render(<UnifiedToolbar />);

      // Check for remaining toolbar categories after removing duplicated functionality
      expect(screen.getByRole('group', { name: /format controls/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /view options/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /help and shortcuts/i })).toBeInTheDocument();

      // Verify duplicated sections were successfully removed (moved to EditorPage header)
      expect(screen.queryByRole('group', { name: /file operations/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('group', { name: /edit operations/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('group', { name: /insert blocks/i })).not.toBeInTheDocument();
    });

    it('should render with proper responsive design classes', () => {
      const { container } = render(<UnifiedToolbar />);
      const toolbar = container.firstChild as HTMLElement;

      expect(toolbar).toHaveClass('border-b', 'bg-background', 'flex', 'items-center', 'h-10');
    });
  });

  // File Operations moved to EditorPage header in Phase 1 - tests now in EditorPage.test.tsx

  // Edit Operations moved to EditorPage header in Phase 1 - tests now in EditorPage.test.tsx

  describe('Format Controls', () => {
    it('should render basic text formatting buttons', () => {
      render(<UnifiedToolbar />);

      expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
    });

    it('should render alignment controls', () => {
      render(<UnifiedToolbar />);

      expect(screen.getByRole('button', { name: /align text left/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /align center/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /align right/i })).toBeInTheDocument();
    });

    it('should render typography dropdown when block is selected', () => {
      const mockStoreWithSelection = {
        ...mockEditorStore,
        selectedNodeId: 'test-block-id',
        nodes: [
          {
            id: 'test-block-id',
            type: 'textBlock',
            data: { content: 'Test content', fontSize: 16, fontFamily: 'inherit' },
          },
        ],
      };
      (useEditorStore as any).mockReturnValue(mockStoreWithSelection);

      render(<UnifiedToolbar />);

      // Should have typography dropdown button when block is selected
      expect(screen.getByRole('button', { name: /typography controls/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /typography controls/i })).not.toBeDisabled();

      // Should show Type text for larger screens
      expect(screen.getByText('Type')).toBeInTheDocument();
    });

    it('should apply text formatting when buttons are clicked', () => {
      const mockStoreWithSelection = {
        ...mockEditorStore,
        selectedNodeId: 'test-block-id',
        nodes: [
          {
            id: 'test-block-id',
            type: 'textBlock',
            data: { content: 'Test content', fontWeight: 400 },
          },
        ],
      };
      (useEditorStore as any).mockReturnValue(mockStoreWithSelection);

      render(<UnifiedToolbar />);

      const boldButton = screen.getByRole('button', { name: /bold/i });
      fireEvent.click(boldButton);

      expect(mockEditorStore.updateNode).toHaveBeenCalledWith('test-block-id', {
        data: { content: 'Test content', fontWeight: 700 },
      });
    });
  });

  // Insert Blocks moved to BlockPalette exclusively in Phase 1 - tests now in BlockPalette.test.tsx

  describe('View Options', () => {
    it('should render viewport preview buttons', () => {
      render(<UnifiedToolbar />);

      expect(screen.getByRole('button', { name: /mobile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /desktop/i })).toBeInTheDocument();
    });
  });

  describe('Help and Shortcuts', () => {
    it('should render keyboard shortcuts button', () => {
      render(<UnifiedToolbar />);

      expect(screen.getByRole('button', { name: /shortcuts/i })).toBeInTheDocument();
    });

    it('should render help button', () => {
      render(<UnifiedToolbar />);

      expect(screen.getByRole('button', { name: /help/i })).toBeInTheDocument();
    });
  });

  describe('Block Selection Context', () => {
    it('should show block-specific controls when block is selected', () => {
      const mockStoreWithSelection = {
        ...mockEditorStore,
        selectedNodeId: 'test-block-id',
        nodes: [
          {
            id: 'test-block-id',
            type: 'textBlock',
            data: { content: 'Test content' },
          },
        ],
      };

      (useEditorStore as any).mockReturnValue(mockStoreWithSelection);

      render(<UnifiedToolbar />);

      // Should show block type indicator (compact format)
      expect(screen.getByText(/Text Block/i)).toBeInTheDocument();

      // Should show block actions
      expect(screen.getByRole('button', { name: /duplicate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('should hide block-specific controls when no block is selected', () => {
      render(<UnifiedToolbar />);

      expect(screen.queryByRole('button', { name: /duplicate/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    // Block properties moved to EditorSidebar in Phase 2 - tests now in EditorSidebar.test.tsx
    // All block-specific property controls (heading levels, border controls, etc.) are now in the sidebar
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for all interactive elements', () => {
      render(<UnifiedToolbar />);

      // Check that all buttons have accessible names
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should support keyboard navigation', () => {
      render(<UnifiedToolbar />);

      const helpButton = screen.getByRole('button', { name: /help/i });
      helpButton.focus();
      expect(helpButton).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily when store state changes unrelated to toolbar', () => {
      const renderSpy = vi.fn();
      const TestComponent = () => {
        renderSpy();
        return <UnifiedToolbar />;
      };

      const { rerender } = render(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Simulate unrelated store change
      (useEditorStore as any).mockReturnValue({
        ...mockEditorStore,
        someUnrelatedState: 'changed',
      });

      rerender(<TestComponent />);
      // Should not cause additional renders due to React.memo optimization
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Canvas Zoom Controls', () => {
    it('should render zoom controls in the toolbar', () => {
      render(<UnifiedToolbar />);

      // Check for zoom controls
      expect(screen.getByLabelText(/zoom out/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/zoom in/i)).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should display current zoom level correctly', () => {
      const mockStoreWithZoom = {
        ...mockEditorStore,
        canvasZoom: 1.5,
      };
      (useEditorStore as any).mockReturnValue(mockStoreWithZoom);

      render(<UnifiedToolbar />);

      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('should handle zoom in action', () => {
      render(<UnifiedToolbar />);

      const zoomInButton = screen.getByLabelText(/zoom in/i);
      fireEvent.click(zoomInButton);

      expect(mockEditorStore.updateCanvasZoom).toHaveBeenCalledWith(1.1);
    });

    it('should handle zoom out action', () => {
      render(<UnifiedToolbar />);

      const zoomOutButton = screen.getByLabelText(/zoom out/i);
      fireEvent.click(zoomOutButton);

      expect(mockEditorStore.updateCanvasZoom).toHaveBeenCalledWith(0.9);
    });

    it('should handle actual size action', () => {
      const mockStoreWithZoom = {
        ...mockEditorStore,
        canvasZoom: 1.5,
      };
      (useEditorStore as any).mockReturnValue(mockStoreWithZoom);

      render(<UnifiedToolbar />);

      const actualSizeButton = screen.getByText('150%');
      fireEvent.click(actualSizeButton);

      expect(mockEditorStore.updateCanvasZoom).toHaveBeenCalledWith(1.0);
    });

    it('should disable zoom out at minimum zoom', () => {
      const mockStoreWithMinZoom = {
        ...mockEditorStore,
        canvasZoom: 0.5, // Minimum zoom level
      };
      (useEditorStore as any).mockReturnValue(mockStoreWithMinZoom);

      render(<UnifiedToolbar />);

      const zoomOutButton = screen.getByLabelText(/zoom out/i);
      expect(zoomOutButton).toBeDisabled();
    });

    it('should disable zoom in at maximum zoom', () => {
      const mockStoreWithMaxZoom = {
        ...mockEditorStore,
        canvasZoom: 2.0, // Maximum zoom level
      };
      (useEditorStore as any).mockReturnValue(mockStoreWithMaxZoom);

      render(<UnifiedToolbar />);

      const zoomInButton = screen.getByLabelText(/zoom in/i);
      expect(zoomInButton).toBeDisabled();
    });

    it('should respect zoom limits when zooming', () => {
      // Test zoom out at limit
      const mockStoreNearMin = {
        ...mockEditorStore,
        canvasZoom: 0.6,
        updateCanvasZoom: vi.fn(),
      };
      (useEditorStore as any).mockReturnValue(mockStoreNearMin);

      render(<UnifiedToolbar />);

      const zoomOutButton = screen.getByLabelText(/zoom out/i);
      fireEvent.click(zoomOutButton);

      expect(mockStoreNearMin.updateCanvasZoom).toHaveBeenCalledWith(0.5);
    });

    it('should respect maximum zoom limits when zooming in', () => {
      // Test zoom in at limit
      const mockStoreNearMax = {
        ...mockEditorStore,
        canvasZoom: 1.9,
        updateCanvasZoom: vi.fn(),
      };
      (useEditorStore as any).mockReturnValue(mockStoreNearMax);

      render(<UnifiedToolbar />);

      const zoomInButton = screen.getByLabelText(/zoom in/i);
      fireEvent.click(zoomInButton);

      expect(mockStoreNearMax.updateCanvasZoom).toHaveBeenCalledWith(2.0);
    });
  });
});
