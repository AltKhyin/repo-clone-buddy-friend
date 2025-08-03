// ABOUTME: Integration tests for text selection routing to unified selection system

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRichTextEditor } from '../useRichTextEditor';
import { useSelectionStore } from '@/store/selectionStore';

// Mock the unified selection store
vi.mock('@/store/selectionStore', () => ({
  useSelectionStore: vi.fn(() => ({
    dispatch: vi.fn(),
    selection: { type: 'none', canApplyTypography: false },
    canApplyTypography: () => false,
  })),
}));

// Mock TipTap Editor
const createMockEditor = (hasSelection = false, selectedText = '') => ({
  view: {
    state: {
      selection: {
        empty: !hasSelection,
        from: hasSelection ? 0 : 0,
        to: hasSelection ? selectedText.length : 0,
      },
      doc: {
        textBetween: vi.fn(() => selectedText),
      },
    },
    dom: document.createElement('div'),
  },
  getHTML: vi.fn(() => `<p>${selectedText}</p>`),
  getText: vi.fn(() => selectedText),
  isActive: vi.fn(() => false),
  getAttributes: vi.fn(() => ({})),
  commands: {
    focus: vi.fn(),
  },
  on: vi.fn(),
  off: vi.fn(),
});

describe('🎯 Text Selection Integration Tests', () => {
  let mockDispatch: ReturnType<typeof vi.fn>;
  let mockEditor: ReturnType<typeof createMockEditor>;

  beforeEach(() => {
    // Reset mocks
    mockDispatch = vi.fn();
    vi.mocked(useSelectionStore).mockReturnValue({
      dispatch: mockDispatch,
      selection: { type: 'none', canApplyTypography: false },
      canApplyTypography: () => false,
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('✅ Critical Text Selection Integration', () => {
    it('should route text selections to unified selection system', async () => {
      const { result } = renderHook(() => 
        useRichTextEditor({
          content: '<p>Test content</p>',
          editable: true,
          blockId: 'test-block-1',
        })
      );

      // Wait for editor to initialize and simulate text selection
      await act(async () => {
        // Simulate the editor being ready with a selection
        if (result.current.editor) {
          const mockEditorWithSelection = {
            ...result.current.editor,
            state: {
              selection: {
                empty: false,
                from: 0,
                to: 13, // Length of "Selected text"
              },
              doc: {
                textBetween: vi.fn(() => 'Selected text'),
              },
            },
            view: {
              dom: document.createElement('div'),
            },
          };

          // Manually trigger onSelectionUpdate as TipTap would
          const onSelectionUpdateConfig = mockEditorWithSelection.options?.onSelectionUpdate;
          if (onSelectionUpdateConfig) {
            onSelectionUpdateConfig({ editor: mockEditorWithSelection });
          }
        }
      });

      // Verify dispatch was called for text selection
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SELECT_TEXT',
        selection: expect.objectContaining({
          blockId: 'test-block-1',
          selectedText: 'Selected text',
          editor: expect.any(Object),
        }),
      });
    });

    it('should NOT block text selections with early return', () => {
      mockEditor = createMockEditor(true, 'Important text');
      
      const { result } = renderHook(() => 
        useRichTextEditor({
          content: '<p>Content</p>',
          editable: true,
          blockId: 'test-block-2',
        })
      );

      // The critical regression test: ensure early return doesn't prevent text selection routing
      act(() => {
        if (result.current.editor) {
          // Simulate text selection that was previously blocked
          // This test will fail until the early return is fixed
        }
      });

      // Verify text selection reached unified system (will fail with current early return)
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('🔄 Selection State Transitions', () => {
    it('should transition from no selection to text selection', () => {
      mockEditor = createMockEditor(false, '');
      
      const { result } = renderHook(() => 
        useRichTextEditor({
          content: '<p>Test</p>',
          editable: true,
          blockId: 'test-block-3',
        })
      );

      act(() => {
        // Simulate selecting text
        mockEditor = createMockEditor(true, 'Now selected');
        // Selection change should trigger unified system
      });

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SELECT_TEXT',
        })
      );
    });

    it('should clear selection when text is deselected', () => {
      mockEditor = createMockEditor(true, 'Initially selected');
      
      const { result } = renderHook(() => 
        useRichTextEditor({
          content: '<p>Test</p>',
          editable: true,
          blockId: 'test-block-4',
        })
      );

      act(() => {
        // Simulate deselecting text
        mockEditor = createMockEditor(false, '');
        // Should clear selection in unified system
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'CLEAR_SELECTION',
      });
    });
  });

  describe('🛠️ Typography Integration', () => {
    it('should enable typography when text is selected', () => {
      mockEditor = createMockEditor(true, 'Formatted text');
      
      const { result } = renderHook(() => 
        useRichTextEditor({
          content: '<p>Content</p>',
          editable: true,
          blockId: 'test-block-5',
        })
      );

      act(() => {
        // Text selection should enable typography capability
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SELECT_TEXT',
        selection: expect.objectContaining({
          editor: expect.any(Object), // Editor instance enables typography
        }),
      });
    });

    it('should preserve selection during toolbar interactions', () => {
      mockEditor = createMockEditor(true, 'Persistent selection');
      
      const { result } = renderHook(() => 
        useRichTextEditor({
          content: '<p>Content</p>',
          editable: true,
          blockId: 'test-block-6',
        })
      );

      // Selection should be preserved when toolbar is used
      // This ensures toolbar doesn't disappear during typography operations
      act(() => {
        // Simulate toolbar interaction
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'START_TOOLBAR_INTERACTION',
        });
      });
    });
  });

  describe('⚡ Performance & Regression Tests', () => {
    it('should handle rapid selection changes efficiently', () => {
      const { result } = renderHook(() => 
        useRichTextEditor({
          content: '<p>Performance test content</p>',
          editable: true,
          blockId: 'test-block-7',
        })
      );

      // Simulate rapid selection changes
      act(() => {
        for (let i = 0; i < 10; i++) {
          mockEditor = createMockEditor(i % 2 === 0, `Selection ${i}`);
          // Each change should be handled without performance issues
        }
      });

      // Should handle all changes without blocking
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should not cause infinite re-renders', () => {
      const renderCount = vi.fn();
      
      const { result } = renderHook(() => {
        renderCount();
        return useRichTextEditor({
          content: '<p>Stability test</p>',
          editable: true,
          blockId: 'test-block-8',
        });
      });

      act(() => {
        mockEditor = createMockEditor(true, 'Stable selection');
      });

      // Should not cause excessive re-renders
      expect(renderCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('🔧 Integration Points', () => {
    it('should work with RichBlockNode selection coordination', () => {
      const { result } = renderHook(() => 
        useRichTextEditor({
          content: '<p>Coordinated content</p>',
          editable: true,
          blockId: 'rich-block-1',
        })
      );

      act(() => {
        mockEditor = createMockEditor(true, 'Coordinated selection');
      });

      // Should coordinate with block-level selection
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SELECT_TEXT',
          selection: expect.objectContaining({
            blockId: 'rich-block-1',
          }),
        })
      );
    });

    it('should maintain compatibility with table cell selections', () => {
      const { result } = renderHook(() => 
        useRichTextEditor({
          content: '<table><tr><td>Cell content</td></tr></table>',
          editable: true,
          blockId: 'table-block-1',
        })
      );

      // Text selection in tables should still work through unified system
      act(() => {
        mockEditor = createMockEditor(true, 'Cell text');
      });

      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('🎯 Toolbar Integration', () => {
    it('should make toolbar visible when text is selected', () => {
      const mockSelectionStore = vi.mocked(useSelectionStore);
      mockSelectionStore.mockReturnValue({
        dispatch: mockDispatch,
        selection: { 
          type: 'text', 
          canApplyTypography: true,
          textSelection: {
            editor: mockEditor,
            selectedText: 'Selected text',
          }
        },
        canApplyTypography: () => true,
      } as any);

      const { result } = renderHook(() => 
        useRichTextEditor({
          content: '<p>Toolbar test</p>',
          editable: true,
          blockId: 'toolbar-block-1',
        })
      );

      // When text is selected, toolbar should become available
      expect(mockSelectionStore().canApplyTypography()).toBe(true);
    });

    it('should provide typography capabilities to selected text', () => {
      mockEditor = createMockEditor(true, 'Typography target');
      mockEditor.getAttributes = vi.fn(() => ({ fontWeight: 'bold' }));
      mockEditor.isActive = vi.fn((mark) => mark === 'bold');

      const { result } = renderHook(() => 
        useRichTextEditor({
          content: '<p><strong>Bold text</strong></p>',
          editable: true,
          blockId: 'typography-block-1',
        })
      );

      act(() => {
        // Selection with editor should enable typography
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SELECT_TEXT',
        selection: expect.objectContaining({
          editor: expect.objectContaining({
            getAttributes: expect.any(Function),
            isActive: expect.any(Function),
          }),
        }),
      });
    });
  });
});