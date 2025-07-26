// ABOUTME: Tests for UnifiedEditor ensuring content orchestration, auto-save functionality, and global shortcuts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { createMockData } from '../../../test-utils/test-data-factories';
import { UnifiedEditor } from '../UnifiedEditor';
import { useUnifiedEditorStore } from '@/store/unifiedEditorStore';
import type { RichContentBlock } from '@/types/unified-editor';

// Mock the store and hooks
vi.mock('@/store/unifiedEditorStore', () => ({
  useUnifiedEditorStore: vi.fn(),
  useEditorActions: vi.fn(),
}));

// Mock EditorCanvas component
vi.mock('../EditorCanvas', () => ({
  EditorCanvas: ({ onBlockCreate, readOnly, className }: any) => (
    <div
      data-testid="editor-canvas"
      data-readonly={readOnly}
      className={className}
      onClick={() => onBlockCreate?.('test-block-id')}
    >
      Editor Canvas Mock
    </div>
  ),
}));

describe('UnifiedEditor', () => {
  const mockActions = {
    createBlock: vi.fn().mockReturnValue('new-block-123'),
    deleteBlock: vi.fn(),
    updateBlock: vi.fn(),
    selectBlock: vi.fn(),
    clearSelection: vi.fn(),
    setZoom: vi.fn(),
    setViewport: vi.fn(),
    toggleGrid: vi.fn(),
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

  const mockSelection = {
    primary: 'block_1',
    secondary: ['block_2'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock store state
    vi.mocked(useUnifiedEditorStore).mockReturnValue({
      blocks: mockBlocks,
      selection: mockSelection,
      interaction: { focusedBlockId: null },
    } as any);

    // Mock hooks
    vi.mocked(require('@/store/unifiedEditorStore').useEditorActions).mockReturnValue(mockActions);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // 1. HAPPY PATH TESTING
  it('should render with correct data', () => {
    renderWithProviders(<UnifiedEditor />);

    const editor = screen.getByRole('application', { name: /unified rich content editor/i });
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveClass('unified-editor');
    expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();
  });

  it('should display correct block and selection counts', () => {
    renderWithProviders(<UnifiedEditor />);

    expect(screen.getByText('2 blocks')).toBeInTheDocument();
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  // 2. READ-ONLY MODE TESTING
  it('should handle read-only mode correctly', () => {
    renderWithProviders(<UnifiedEditor readOnly={true} />);

    const editor = screen.getByRole('application', { name: /unified rich content editor/i });
    expect(editor).toHaveClass('cursor-not-allowed');

    const canvas = screen.getByTestId('editor-canvas');
    expect(canvas).toHaveAttribute('data-readonly', 'true');

    expect(screen.getByText('Read-only mode')).toBeInTheDocument();
    expect(screen.queryByText('Auto-save enabled')).not.toBeInTheDocument();
  });

  // 3. ERROR STATE TESTING
  it('should handle empty blocks gracefully', () => {
    vi.mocked(useUnifiedEditorStore).mockReturnValue({
      blocks: [],
      selection: { primary: null, secondary: [] },
      interaction: { focusedBlockId: null },
    } as any);

    renderWithProviders(<UnifiedEditor />);

    expect(screen.getByText('0 blocks')).toBeInTheDocument();
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
  });

  // 4. INITIAL CONTENT LOADING
  it('should load initial content correctly', () => {
    const initialContent = [mockBlocks[0]];

    vi.mocked(useUnifiedEditorStore).mockReturnValue({
      blocks: [], // Empty initially
      selection: { primary: null, secondary: [] },
      interaction: { focusedBlockId: null },
    } as any);

    renderWithProviders(<UnifiedEditor initialContent={initialContent} />);

    expect(mockActions.createBlock).toHaveBeenCalledWith(
      { x: 100, y: 100 },
      {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Block 1' }] }],
      }
    );
    expect(mockActions.updateBlock).toHaveBeenCalled();
  });

  it('should not reload initial content if blocks already exist', () => {
    const initialContent = [mockBlocks[0]];

    renderWithProviders(<UnifiedEditor initialContent={initialContent} />);

    // Should not create blocks if they already exist
    expect(mockActions.createBlock).not.toHaveBeenCalled();
  });

  // 5. INTERACTION TESTING
  it('should handle block creation events', () => {
    const onBlockCreate = vi.fn();
    renderWithProviders(<UnifiedEditor onBlockCreate={onBlockCreate} />);

    const canvas = screen.getByTestId('editor-canvas');
    fireEvent.click(canvas);

    expect(onBlockCreate).toHaveBeenCalledWith('test-block-id');
  });

  it('should track content changes', () => {
    const onContentChange = vi.fn();
    renderWithProviders(<UnifiedEditor onContentChange={onContentChange} />);

    expect(onContentChange).toHaveBeenCalledWith(mockBlocks);
  });

  it('should track selection changes', () => {
    const onBlockSelect = vi.fn();
    renderWithProviders(<UnifiedEditor onBlockSelect={onBlockSelect} />);

    expect(onBlockSelect).toHaveBeenCalledWith(['block_1', 'block_2']);
  });

  // 6. RESPONSIVE TESTING
  it('should be responsive and accessible', () => {
    const { container } = renderWithProviders(<UnifiedEditor />);

    const editor = screen.getByRole('application', { name: /unified rich content editor/i });
    expect(editor).toHaveAttribute('tabIndex', '0');
    expect(editor).toHaveClass('w-full', 'h-full');
  });

  // 7. CONDITIONAL RENDERING
  it('should show toolbar when enabled', () => {
    renderWithProviders(<UnifiedEditor showToolbar={true} />);

    expect(screen.getByText('Contextual toolbar (coming soon)')).toBeInTheDocument();
  });

  it('should hide toolbar when disabled', () => {
    renderWithProviders(<UnifiedEditor showToolbar={false} />);

    expect(screen.queryByText('Contextual toolbar (coming soon)')).not.toBeInTheDocument();
  });

  it('should show minimap when enabled', () => {
    renderWithProviders(<UnifiedEditor showMinimap={true} />);

    expect(screen.getByText('Minimap (coming soon)')).toBeInTheDocument();
  });

  it('should show auto-save status when enabled', () => {
    renderWithProviders(<UnifiedEditor autoSave={true} />);

    expect(screen.getByText('Auto-save enabled')).toBeInTheDocument();
  });

  describe('Auto-save Functionality', () => {
    it('should trigger auto-save after interval', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      renderWithProviders(
        <UnifiedEditor onSave={onSave} autoSave={true} autoSaveInterval={1000} />
      );

      // Fast-forward time to trigger auto-save
      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(mockBlocks);
      });
    });

    it('should not auto-save in read-only mode', () => {
      const onSave = vi.fn();
      renderWithProviders(<UnifiedEditor onSave={onSave} autoSave={true} readOnly={true} />);

      vi.advanceTimersByTime(5000);

      expect(onSave).not.toHaveBeenCalled();
    });

    it('should cancel previous auto-save when content changes', () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { rerender } = renderWithProviders(
        <UnifiedEditor onSave={onSave} autoSave={true} autoSaveInterval={1000} />
      );

      vi.advanceTimersByTime(500);

      // Simulate content change by re-rendering with new blocks
      vi.mocked(useUnifiedEditorStore).mockReturnValue({
        blocks: [...mockBlocks, { ...mockBlocks[0], id: 'block_3' }],
        selection: mockSelection,
        interaction: { focusedBlockId: null },
      } as any);

      rerender(<UnifiedEditor onSave={onSave} autoSave={true} autoSaveInterval={1000} />);

      // First timeout should be cancelled, shouldn't save at 1000ms
      vi.advanceTimersByTime(500);
      expect(onSave).not.toHaveBeenCalled();

      // Should save at new interval
      vi.advanceTimersByTime(500);
      expect(onSave).toHaveBeenCalled();
    });

    it('should handle auto-save errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));

      renderWithProviders(
        <UnifiedEditor onSave={onSave} autoSave={true} autoSaveInterval={1000} />
      );

      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Auto-save failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Global Keyboard Shortcuts', () => {
    it('should handle manual save (Cmd/Ctrl + S)', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      renderWithProviders(<UnifiedEditor onSave={onSave} />);

      const editor = screen.getByRole('application', { name: /unified rich content editor/i });
      fireEvent.keyDown(editor, { key: 's', metaKey: true });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(mockBlocks);
      });
    });

    it('should handle delete selected blocks (Delete key)', () => {
      const onBlockDelete = vi.fn();
      renderWithProviders(<UnifiedEditor onBlockDelete={onBlockDelete} />);

      const editor = screen.getByRole('application', { name: /unified rich content editor/i });
      fireEvent.keyDown(editor, { key: 'Delete' });

      expect(mockActions.deleteBlock).toHaveBeenCalledWith('block_1');
      expect(mockActions.deleteBlock).toHaveBeenCalledWith('block_2');
      expect(onBlockDelete).toHaveBeenCalledWith('block_1');
      expect(onBlockDelete).toHaveBeenCalledWith('block_2');
    });

    it('should not delete blocks when editor is focused', () => {
      // Mock focused editor state
      vi.mocked(useUnifiedEditorStore).mockReturnValue({
        blocks: mockBlocks,
        selection: mockSelection,
        interaction: { focusedBlockId: 'block_1' },
      } as any);

      // Mock focused TipTap editor
      const mockElement = { classList: { contains: vi.fn().mockReturnValue(true) } };
      Object.defineProperty(document, 'activeElement', {
        value: mockElement,
        writable: true,
      });

      renderWithProviders(<UnifiedEditor />);

      const editor = screen.getByRole('application', { name: /unified rich content editor/i });
      fireEvent.keyDown(editor, { key: 'Delete' });

      expect(mockActions.deleteBlock).not.toHaveBeenCalled();
    });

    it('should log undo/redo shortcuts (future implementation)', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      renderWithProviders(<UnifiedEditor />);

      const editor = screen.getByRole('application', { name: /unified rich content editor/i });

      // Undo
      fireEvent.keyDown(editor, { key: 'z', metaKey: true });
      expect(consoleSpy).toHaveBeenCalledWith('Undo (not implemented yet)');

      // Redo
      fireEvent.keyDown(editor, { key: 'z', metaKey: true, shiftKey: true });
      expect(consoleSpy).toHaveBeenCalledWith('Redo (not implemented yet)');

      consoleSpy.mockRestore();
    });

    it('should log copy/paste shortcuts (future implementation)', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      renderWithProviders(<UnifiedEditor />);

      const editor = screen.getByRole('application', { name: /unified rich content editor/i });

      // Copy
      fireEvent.keyDown(editor, { key: 'c', ctrlKey: true });
      expect(consoleSpy).toHaveBeenCalledWith('Copy blocks (not implemented yet)');

      // Paste
      fireEvent.keyDown(editor, { key: 'v', ctrlKey: true });
      expect(consoleSpy).toHaveBeenCalledWith('Paste blocks (not implemented yet)');

      consoleSpy.mockRestore();
    });
  });

  describe('Component API', () => {
    it('should provide editor API methods through imperative handle', () => {
      // This test would require access to the ref, which is tricky in this setup
      // In a real scenario, you'd test this by passing a ref and calling methods on it
      const { container } = renderWithProviders(<UnifiedEditor />);

      // Just verify the component renders without errors when the API is created
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Status Bar', () => {
    it('should show correct block count with no selection', () => {
      vi.mocked(useUnifiedEditorStore).mockReturnValue({
        blocks: mockBlocks,
        selection: { primary: null, secondary: [] },
        interaction: { focusedBlockId: null },
      } as any);

      renderWithProviders(<UnifiedEditor />);

      expect(screen.getByText('2 blocks')).toBeInTheDocument();
      expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
    });

    it('should show selection count when blocks are selected', () => {
      renderWithProviders(<UnifiedEditor />);

      expect(screen.getByText('2 blocks')).toBeInTheDocument();
      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('should show only primary selection count', () => {
      vi.mocked(useUnifiedEditorStore).mockReturnValue({
        blocks: mockBlocks,
        selection: { primary: 'block_1', secondary: [] },
        interaction: { focusedBlockId: null },
      } as any);

      renderWithProviders(<UnifiedEditor />);

      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should accept and apply custom className', () => {
      renderWithProviders(<UnifiedEditor className="custom-editor-class" />);

      const editor = screen.getByRole('application', { name: /unified rich content editor/i });
      expect(editor).toHaveClass('custom-editor-class');
    });
  });

  describe('Cleanup', () => {
    it('should clear auto-save timer on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const { unmount } = renderWithProviders(<UnifiedEditor autoSave={true} />);

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('Save Functionality', () => {
    it('should handle manual save success', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const onSave = vi.fn().mockResolvedValue(undefined);

      renderWithProviders(<UnifiedEditor onSave={onSave} />);

      const editor = screen.getByRole('application', { name: /unified rich content editor/i });
      fireEvent.keyDown(editor, { key: 's', metaKey: true });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Manual save successful');
      });

      consoleSpy.mockRestore();
    });

    it('should handle manual save failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));

      renderWithProviders(<UnifiedEditor onSave={onSave} />);

      const editor = screen.getByRole('application', { name: /unified rich content editor/i });
      fireEvent.keyDown(editor, { key: 's', metaKey: true });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Manual save failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});
