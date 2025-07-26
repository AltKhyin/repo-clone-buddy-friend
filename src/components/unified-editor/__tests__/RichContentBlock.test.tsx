// ABOUTME: Tests for RichContentBlock ensuring drag/resize functionality, safe-zone interaction, and theme integration

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { createMockData } from '../../../test-utils/test-data-factories';
import { RichContentBlock } from '../RichContentBlock';
import { useUnifiedEditorStore } from '@/store/unifiedEditorStore';
import {
  InteractionZone,
  type RichContentBlock as RichContentBlockType,
} from '@/types/unified-editor';

// Mock the store
vi.mock('@/store/unifiedEditorStore', () => ({
  useUnifiedEditorStore: vi.fn(),
  useEditorActions: vi.fn(),
  useIsBlockSelected: vi.fn(),
}));

// Mock the TipTap editor
vi.mock('../UnifiedTipTapEditor', () => ({
  UnifiedTipTapEditor: ({ blockId, placeholder, onFocus }: any) => (
    <div
      data-testid={`tiptap-editor-${blockId}`}
      className="ProseMirror"
      onClick={onFocus}
      role="textbox"
      aria-label="Rich text editor"
    >
      {placeholder}
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

describe('RichContentBlock', () => {
  const mockActions = {
    selectBlock: vi.fn(),
    updateBlock: vi.fn(),
    updateContent: vi.fn(),
    focusBlock: vi.fn(),
    clearSelection: vi.fn(),
    deleteBlock: vi.fn(),
    duplicateBlock: vi.fn(),
  };

  const mockBlock: RichContentBlockType = {
    id: 'block_123',
    type: 'richContent',
    position: { x: 100, y: 200 },
    dimensions: { width: 400, height: 200 },
    content: {
      tiptapJSON: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Test content' }],
          },
        ],
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
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock store state
    vi.mocked(useUnifiedEditorStore).mockReturnValue({
      interaction: { focusedBlockId: null },
      config: {
        safeZone: {
          RESIZE_CORNER_SIZE: 12,
          HANDLE_WIDTH: 8,
          SAFE_ZONE_PADDING: 4,
        },
      },
    } as any);

    // Mock hooks
    vi.mocked(require('@/store/unifiedEditorStore').useEditorActions).mockReturnValue(mockActions);
    vi.mocked(require('@/store/unifiedEditorStore').useIsBlockSelected).mockReturnValue(false);
  });

  // 1. HAPPY PATH TESTING
  it('should render with correct data', () => {
    renderWithProviders(<RichContentBlock block={mockBlock} />);

    const blockElement = screen.getByRole('textbox', { name: /rich content block/i });
    expect(blockElement).toBeInTheDocument();
    expect(blockElement).toHaveAttribute('data-block-id', 'block_123');
    expect(screen.getByTestId('tiptap-editor-block_123')).toBeInTheDocument();
  });

  it('should apply correct positioning and dimensions', () => {
    renderWithProviders(<RichContentBlock block={mockBlock} />);

    const blockElement = screen.getByRole('textbox', { name: /rich content block/i });
    expect(blockElement).toHaveStyle({
      position: 'absolute',
      left: '100px',
      top: '200px',
      width: '400px',
      minHeight: '200px',
    });
  });

  // 2. PREVIEW MODE TESTING
  it('should handle preview mode correctly', () => {
    renderWithProviders(<RichContentBlock block={mockBlock} isPreview={true} />);

    const blockElement = screen.getByRole('textbox', { name: /rich content block/i });
    expect(blockElement).toHaveClass('block-preview');

    // Should not show resize handles in preview mode
    fireEvent.mouseEnter(blockElement);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // 3. ERROR STATE TESTING
  it('should handle invalid block data gracefully', () => {
    const invalidBlock = {
      ...mockBlock,
      content: null,
    } as any;

    expect(() => {
      renderWithProviders(<RichContentBlock block={invalidBlock} />);
    }).not.toThrow();
  });

  // 4. EMPTY STATE TESTING
  it('should handle empty content gracefully', () => {
    const emptyBlock = {
      ...mockBlock,
      content: {
        tiptapJSON: {
          type: 'doc',
          content: [],
        },
      },
    };

    renderWithProviders(<RichContentBlock block={emptyBlock} />);

    expect(screen.getByTestId('tiptap-editor-block_123')).toBeInTheDocument();
    expect(screen.getByText('Start typing...')).toBeInTheDocument();
  });

  // 5. INTERACTION TESTING
  it('should handle block selection correctly', async () => {
    renderWithProviders(<RichContentBlock block={mockBlock} />);

    const blockElement = screen.getByRole('textbox', { name: /rich content block/i });

    fireEvent.mouseDown(blockElement, { clientX: 150, clientY: 250 });

    expect(mockActions.selectBlock).toHaveBeenCalledWith('block_123', {
      multiSelect: false,
      rangeSelect: false,
    });
  });

  it('should handle multi-select with modifier keys', async () => {
    renderWithProviders(<RichContentBlock block={mockBlock} />);

    const blockElement = screen.getByRole('textbox', { name: /rich content block/i });

    fireEvent.mouseDown(blockElement, {
      clientX: 150,
      clientY: 250,
      metaKey: true,
    });

    expect(mockActions.selectBlock).toHaveBeenCalledWith('block_123', {
      multiSelect: true,
      rangeSelect: false,
    });
  });

  it('should handle double-click to focus editor', async () => {
    renderWithProviders(<RichContentBlock block={mockBlock} />);

    const blockElement = screen.getByRole('textbox', { name: /rich content block/i });

    fireEvent.doubleClick(blockElement, { clientX: 150, clientY: 250 });

    expect(mockActions.focusBlock).toHaveBeenCalledWith('block_123');
  });

  // 6. RESPONSIVE TESTING
  it('should be responsive and accessible', () => {
    const { container } = renderWithProviders(<RichContentBlock block={mockBlock} />);

    expect(container.firstChild).toBeInTheDocument();

    const blockElement = screen.getByRole('textbox', { name: /rich content block/i });
    expect(blockElement).toHaveAttribute('tabIndex', '0');
    expect(blockElement).toHaveAttribute('aria-label', 'Rich content block block_123');
  });

  // 7. CONDITIONAL RENDERING
  it('should show selection indicator when selected', () => {
    vi.mocked(require('@/store/unifiedEditorStore').useIsBlockSelected).mockReturnValue(true);

    renderWithProviders(<RichContentBlock block={mockBlock} />);

    const blockElement = screen.getByRole('textbox', { name: /rich content block/i });
    expect(blockElement).toHaveClass('block-selected');
  });

  it('should show focus indicator when focused', () => {
    vi.mocked(useUnifiedEditorStore).mockReturnValue({
      interaction: { focusedBlockId: 'block_123' },
      config: {
        safeZone: {
          RESIZE_CORNER_SIZE: 12,
          HANDLE_WIDTH: 8,
          SAFE_ZONE_PADDING: 4,
        },
      },
    } as any);

    renderWithProviders(<RichContentBlock block={mockBlock} />);

    const blockElement = screen.getByRole('textbox', { name: /rich content block/i });
    expect(blockElement).toHaveClass('block-focused');
  });

  describe('Keyboard Shortcuts', () => {
    it('should handle delete key when selected', () => {
      vi.mocked(require('@/store/unifiedEditorStore').useIsBlockSelected).mockReturnValue(true);

      renderWithProviders(<RichContentBlock block={mockBlock} />);

      const blockElement = screen.getByRole('textbox', { name: /rich content block/i });
      fireEvent.keyDown(blockElement, { key: 'Delete' });

      expect(mockActions.deleteBlock).toHaveBeenCalledWith('block_123');
    });

    it('should handle escape key to clear selection', () => {
      vi.mocked(require('@/store/unifiedEditorStore').useIsBlockSelected).mockReturnValue(true);

      renderWithProviders(<RichContentBlock block={mockBlock} />);

      const blockElement = screen.getByRole('textbox', { name: /rich content block/i });
      fireEvent.keyDown(blockElement, { key: 'Escape' });

      expect(mockActions.clearSelection).toHaveBeenCalled();
    });

    it('should handle duplicate shortcut (Cmd+D)', () => {
      vi.mocked(require('@/store/unifiedEditorStore').useIsBlockSelected).mockReturnValue(true);

      renderWithProviders(<RichContentBlock block={mockBlock} />);

      const blockElement = screen.getByRole('textbox', { name: /rich content block/i });
      fireEvent.keyDown(blockElement, { key: 'd', metaKey: true });

      expect(mockActions.duplicateBlock).toHaveBeenCalledWith('block_123');
    });

    it('should not delete when editor is focused', () => {
      vi.mocked(require('@/store/unifiedEditorStore').useIsBlockSelected).mockReturnValue(true);
      vi.mocked(useUnifiedEditorStore).mockReturnValue({
        interaction: { focusedBlockId: 'block_123' },
        config: {
          safeZone: {
            RESIZE_CORNER_SIZE: 12,
            HANDLE_WIDTH: 8,
            SAFE_ZONE_PADDING: 4,
          },
        },
      } as any);

      renderWithProviders(<RichContentBlock block={mockBlock} />);

      const blockElement = screen.getByRole('textbox', { name: /rich content block/i });
      fireEvent.keyDown(blockElement, { key: 'Delete' });

      expect(mockActions.deleteBlock).not.toHaveBeenCalled();
    });
  });

  describe('Theme Integration', () => {
    it('should apply theme-based styling', () => {
      renderWithProviders(<RichContentBlock block={mockBlock} />);

      const blockElement = screen.getByRole('textbox', { name: /rich content block/i });
      expect(blockElement).toHaveStyle({
        backgroundColor: 'hsl(var(--background))',
        borderColor: 'hsl(var(--border))',
      });
    });

    it('should maintain theme responsiveness during interactions', () => {
      renderWithProviders(<RichContentBlock block={mockBlock} />);

      const blockElement = screen.getByRole('textbox', { name: /rich content block/i });

      // Hover should not break theme integration
      fireEvent.mouseEnter(blockElement);
      expect(blockElement).toHaveClass('block-hover');
    });
  });

  describe('Drag and Resize Functionality', () => {
    it('should handle drag start correctly', () => {
      renderWithProviders(<RichContentBlock block={mockBlock} />);

      const blockElement = screen.getByRole('textbox', { name: /rich content block/i });

      // Mock getBoundingClientRect for drag detection
      vi.spyOn(blockElement, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 200,
        right: 500,
        bottom: 400,
        width: 400,
        height: 200,
      } as DOMRect);

      fireEvent.mouseDown(blockElement, {
        clientX: 105, // In drag handle area
        clientY: 205,
      });

      expect(blockElement).toHaveClass('block-dragging');
      expect(mockActions.selectBlock).toHaveBeenCalled();
    });

    it('should prevent interaction in preview mode', () => {
      renderWithProviders(<RichContentBlock block={mockBlock} isPreview={true} />);

      const blockElement = screen.getByRole('textbox', { name: /rich content block/i });
      fireEvent.mouseDown(blockElement, { clientX: 150, clientY: 250 });

      expect(mockActions.selectBlock).not.toHaveBeenCalled();
    });
  });

  describe('Content Integration', () => {
    it('should pass content to TipTap editor', () => {
      renderWithProviders(<RichContentBlock block={mockBlock} />);

      expect(screen.getByTestId('tiptap-editor-block_123')).toBeInTheDocument();
    });

    it('should handle content updates from editor', () => {
      renderWithProviders(<RichContentBlock block={mockBlock} />);

      const editorElement = screen.getByTestId('tiptap-editor-block_123');
      fireEvent.click(editorElement);

      expect(mockActions.focusBlock).toHaveBeenCalledWith('block_123');
    });
  });

  describe('Development Features', () => {
    it('should show debug info in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      renderWithProviders(<RichContentBlock block={mockBlock} />);

      const blockElement = screen.getByRole('textbox', { name: /rich content block/i });
      fireEvent.mouseEnter(blockElement);

      // Should show block ID suffix
      expect(screen.getByText('123')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
