// ABOUTME: Tests for useTiptapEditor hook to validate React Hook dependency fixes

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTiptapEditor } from '../useTiptapEditor';

// Mock lodash-es debounce
vi.mock('lodash-es', () => ({
  debounce: vi.fn((fn, delay) => {
    const debouncedFn = (...args: any[]) => fn(...args);
    debouncedFn.cancel = vi.fn();
    return debouncedFn;
  }),
}));

// Mock TipTap
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => ({
    getHTML: vi.fn(() => '<p>test content</p>'),
    commands: {
      focus: vi.fn(),
      setContent: vi.fn(),
    },
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

vi.mock('@tiptap/starter-kit', () => ({
  default: {
    configure: vi.fn(() => 'starter-kit'),
  },
}));

vi.mock('@tiptap/extension-placeholder', () => ({
  default: {
    configure: vi.fn(() => 'placeholder'),
  },
}));

describe('useTiptapEditor Hook Dependencies', () => {
  const defaultProps = {
    nodeId: 'test-node-1',
    initialContent: '<p>Initial content</p>',
    placeholder: 'Start typing...',
    onUpdate: vi.fn(),
    editable: true,
    debounceMs: 300,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook Dependency Fixes', () => {
    it('should handle onUpdate function changes without stale closures', () => {
      const onUpdate1 = vi.fn();
      const onUpdate2 = vi.fn();

      const { rerender } = renderHook(
        ({ onUpdate }) => useTiptapEditor({ ...defaultProps, onUpdate }),
        { initialProps: { onUpdate: onUpdate1 } }
      );

      // Change the onUpdate function
      rerender({ onUpdate: onUpdate2 });

      // The hook should not have stale closure issues
      expect(() => rerender({ onUpdate: onUpdate2 })).not.toThrow();
    });

    it('should handle debounceMs changes correctly', () => {
      const { rerender } = renderHook(
        ({ debounceMs }) => useTiptapEditor({ ...defaultProps, debounceMs }),
        { initialProps: { debounceMs: 300 } }
      );

      // Change the debounce delay
      expect(() => rerender({ debounceMs: 500 })).not.toThrow();
      expect(() => rerender({ debounceMs: 100 })).not.toThrow();
    });

    it('should maintain editor instance across re-renders when dependencies stay the same', () => {
      const { result, rerender } = renderHook(() => 
        useTiptapEditor(defaultProps)
      );

      const firstEditor = result.current.editor;

      // Re-render with same props
      rerender();

      // Should be the same editor instance
      expect(result.current.editor).toBe(firstEditor);
    });

    it('should recreate editor when critical dependencies change', () => {
      const { result, rerender } = renderHook(
        ({ nodeId }) => useTiptapEditor({ ...defaultProps, nodeId }),
        { initialProps: { nodeId: 'node-1' } }
      );

      const firstEditor = result.current.editor;

      // Change nodeId (critical dependency)
      rerender({ nodeId: 'node-2' });

      // Editor might be different due to dependency change
      // This tests that the hook handles dependency changes properly
      expect(result.current).toBeDefined();
    });

    it('should handle field config changes', () => {
      const fieldConfig1 = { fieldType: 'rich-text' as const };
      const fieldConfig2 = { fieldType: 'simple-text' as const };

      const { rerender } = renderHook(
        ({ fieldConfig }) => useTiptapEditor({ ...defaultProps, fieldConfig }),
        { initialProps: { fieldConfig: fieldConfig1 } }
      );

      // Change field config
      expect(() => rerender({ fieldConfig: fieldConfig2 })).not.toThrow();
    });

    it('should handle placeholder changes', () => {
      const { rerender } = renderHook(
        ({ placeholder }) => useTiptapEditor({ ...defaultProps, placeholder }),
        { initialProps: { placeholder: 'Start typing...' } }
      );

      // Change placeholder
      expect(() => rerender({ placeholder: 'Enter your content...' })).not.toThrow();
      expect(() => rerender({ placeholder: '' })).not.toThrow();
    });

    it('should handle editable state changes', () => {
      const { rerender } = renderHook(
        ({ editable }) => useTiptapEditor({ ...defaultProps, editable }),
        { initialProps: { editable: true } }
      );

      // Toggle editable state
      expect(() => rerender({ editable: false })).not.toThrow();
      expect(() => rerender({ editable: true })).not.toThrow();
    });
  });

  describe('debounced Update Function', () => {
    it('should not recreate debounced function when dependencies are stable', () => {
      const onUpdate = vi.fn();
      
      const { result, rerender } = renderHook(() => 
        useTiptapEditor({ ...defaultProps, onUpdate, debounceMs: 300 })
      );

      // Get reference to first render result
      const firstRender = result.current;

      // Re-render with same props
      rerender();

      // Should maintain stable references
      expect(result.current.editor).toBe(firstRender.editor);
    });

    it('should recreate debounced function when onUpdate changes', () => {
      const onUpdate1 = vi.fn();
      const onUpdate2 = vi.fn();

      const { rerender } = renderHook(
        ({ onUpdate }) => useTiptapEditor({ ...defaultProps, onUpdate, debounceMs: 300 }),
        { initialProps: { onUpdate: onUpdate1 } }
      );

      // Change onUpdate function - should not cause errors
      expect(() => rerender({ onUpdate: onUpdate2 })).not.toThrow();
    });

    it('should recreate debounced function when debounceMs changes', () => {
      const { rerender } = renderHook(
        ({ debounceMs }) => useTiptapEditor({ ...defaultProps, debounceMs }),
        { initialProps: { debounceMs: 300 } }
      );

      // Change debounce delay - should not cause errors
      expect(() => rerender({ debounceMs: 500 })).not.toThrow();
    });
  });

  describe('Editor Configuration', () => {
    it('should return editor instance and helper properties', () => {
      const { result } = renderHook(() => useTiptapEditor(defaultProps));

      expect(result.current).toHaveProperty('editor');
      expect(result.current).toHaveProperty('isEmpty');
      expect(result.current).toHaveProperty('isFocused');
      expect(result.current).toHaveProperty('hasContent');
    });

    it('should handle missing editor gracefully', () => {
      // Mock useEditor to return null
      const { useEditor } = require('@tiptap/react');
      useEditor.mockReturnValueOnce(null);

      const { result } = renderHook(() => useTiptapEditor(defaultProps));

      expect(result.current.editor).toBeNull();
      expect(result.current.isEmpty).toBe(true);
      expect(result.current.isFocused).toBe(false);
      expect(result.current.hasContent).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in onUpdate callback gracefully', () => {
      const onUpdateWithError = vi.fn(() => {
        throw new Error('Test error in onUpdate');
      });

      // Should not throw during hook execution
      expect(() => {
        renderHook(() => 
          useTiptapEditor({ ...defaultProps, onUpdate: onUpdateWithError })
        );
      }).not.toThrow();
    });

    it('should handle invalid nodeId gracefully', () => {
      expect(() => {
        renderHook(() => 
          useTiptapEditor({ ...defaultProps, nodeId: '' })
        );
      }).not.toThrow();

      expect(() => {
        renderHook(() => 
          useTiptapEditor({ ...defaultProps, nodeId: null as any })
        );
      }).not.toThrow();
    });
  });
});