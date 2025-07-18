// ABOUTME: Tests for TextBlockNode heading synchronization to ensure heading blocks don't revert to normal text

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TextBlockNode } from '../TextBlockNode';
import { useEditorStore } from '@/store/editorStore';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { useTiptapEditor } from '@/hooks/useTiptapEditor';

// Mock the store
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn(),
}));

// Mock the theme hook
vi.mock('@/hooks/useEditorTheme', () => ({
  useEditorTheme: vi.fn(),
}));

// Mock the Tiptap editor hook
vi.mock('@/hooks/useTiptapEditor', () => ({
  useTiptapEditor: vi.fn(),
}));

// Mock the content transformers
vi.mock('../../../../utils/contentTransformers', () => ({
  transformContent: vi.fn(),
  needsTransformation: vi.fn(),
  validateContentStructure: vi.fn(),
}));

describe('TextBlockNode - Heading Synchronization', () => {
  const mockUpdateNode = vi.fn();
  const mockEditor = {
    getHTML: vi.fn(),
    commands: {
      setContent: vi.fn(),
    },
  };
  const mockEditorInstance = {
    editor: mockEditor,
    focusEditor: vi.fn(),
    isFocused: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock store
    (useEditorStore as any).mockReturnValue({
      updateNode: mockUpdateNode,
    });

    // Mock theme
    (useEditorTheme as any).mockReturnValue({
      colors: {
        block: {
          text: '#000000',
        },
      },
      theme: 'light',
    });

    // Mock Tiptap editor
    (useTiptapEditor as any).mockReturnValue(mockEditorInstance);

    // Mock content transformers
    const {
      transformContent,
      needsTransformation,
      validateContentStructure,
    } = require('../../../../utils/contentTransformers');
    transformContent.mockImplementation((content, from, to) => {
      if (to === 1) return '<h1>Test content</h1>';
      if (to === null) return '<p>Test content</p>';
      return content;
    });
    needsTransformation.mockReturnValue(true);
    validateContentStructure.mockReturnValue(false);
  });

  const defaultProps = {
    id: 'test-node',
    data: {
      htmlContent: '<p>Test content</p>',
      headingLevel: null as number | null,
    },
    selected: false,
  };

  describe('Heading Level Synchronization', () => {
    it('should synchronize editor content when heading level changes from null to 1', async () => {
      const { rerender } = render(<TextBlockNode {...defaultProps} />);

      // Mock editor returning paragraph content
      mockEditor.getHTML.mockReturnValue('<p>Test content</p>');

      // Change heading level to 1
      const newProps = {
        ...defaultProps,
        data: {
          ...defaultProps.data,
          headingLevel: 1 as const,
        },
      };

      rerender(<TextBlockNode {...newProps} />);

      await waitFor(() => {
        expect(mockEditor.commands.setContent).toHaveBeenCalledWith('<h1>Test content</h1>', false);
      });
    });

    it('should synchronize editor content when heading level changes from 1 to null', async () => {
      const initialProps = {
        ...defaultProps,
        data: {
          ...defaultProps.data,
          headingLevel: 1 as const,
        },
      };

      const { rerender } = render(<TextBlockNode {...initialProps} />);

      // Mock editor returning heading content
      mockEditor.getHTML.mockReturnValue('<h1>Test content</h1>');

      // Change heading level to null (paragraph)
      const newProps = {
        ...defaultProps,
        data: {
          ...defaultProps.data,
          headingLevel: null,
        },
      };

      rerender(<TextBlockNode {...newProps} />);

      await waitFor(() => {
        expect(mockEditor.commands.setContent).toHaveBeenCalledWith('<p>Test content</p>', false);
      });
    });

    it('should synchronize editor content when heading level changes between levels', async () => {
      const initialProps = {
        ...defaultProps,
        data: {
          ...defaultProps.data,
          headingLevel: 1 as const,
        },
      };

      const { rerender } = render(<TextBlockNode {...initialProps} />);

      // Mock editor returning H1 content
      mockEditor.getHTML.mockReturnValue('<h1>Test content</h1>');

      // Mock transformation for H1 to H3
      const { transformContent } = require('../../../../utils/contentTransformers');
      transformContent.mockImplementation((content, from, to) => {
        if (to === 3) return '<h3>Test content</h3>';
        return content;
      });

      // Change heading level to 3
      const newProps = {
        ...defaultProps,
        data: {
          ...defaultProps.data,
          headingLevel: 3 as const,
        },
      };

      rerender(<TextBlockNode {...newProps} />);

      await waitFor(() => {
        expect(mockEditor.commands.setContent).toHaveBeenCalledWith('<h3>Test content</h3>', false);
      });
    });

    it('should not synchronize if heading level remains the same', async () => {
      const props = {
        ...defaultProps,
        data: {
          ...defaultProps.data,
          headingLevel: 1 as const,
        },
      };

      const { rerender } = render(<TextBlockNode {...props} />);

      // Clear the mock calls from initial render
      vi.clearAllMocks();

      // Re-render with same heading level
      rerender(<TextBlockNode {...props} />);

      // Should not call setContent
      expect(mockEditor.commands.setContent).not.toHaveBeenCalled();
    });

    it('should not synchronize if content already matches expected structure', async () => {
      const { needsTransformation } = require('../../../../utils/contentTransformers');
      needsTransformation.mockReturnValue(false);

      const { rerender } = render(<TextBlockNode {...defaultProps} />);

      // Mock editor returning correct content
      mockEditor.getHTML.mockReturnValue('<h1>Test content</h1>');

      // Change heading level to 1
      const newProps = {
        ...defaultProps,
        data: {
          ...defaultProps.data,
          headingLevel: 1 as const,
        },
      };

      rerender(<TextBlockNode {...newProps} />);

      // Should not call setContent if content doesn't need transformation
      expect(mockEditor.commands.setContent).not.toHaveBeenCalled();
    });

    it('should handle editor not being ready', async () => {
      // Mock editor as undefined
      (useTiptapEditor as any).mockReturnValue({
        editor: undefined,
        focusEditor: vi.fn(),
        isFocused: false,
      });

      const { rerender } = render(<TextBlockNode {...defaultProps} />);

      // Change heading level
      const newProps = {
        ...defaultProps,
        data: {
          ...defaultProps.data,
          headingLevel: 1 as const,
        },
      };

      rerender(<TextBlockNode {...newProps} />);

      // Should not crash or call setContent
      expect(mockEditor.commands.setContent).not.toHaveBeenCalled();
    });
  });

  describe('Content Update with Validation', () => {
    it('should validate and transform content during handleContentUpdate', () => {
      const {
        validateContentStructure,
        transformContent,
      } = require('../../../../utils/contentTransformers');

      // Mock validation to return false (content doesn't match expected structure)
      validateContentStructure.mockReturnValue(false);
      transformContent.mockReturnValue('<h1>Corrected content</h1>');

      const props = {
        ...defaultProps,
        data: {
          ...defaultProps.data,
          headingLevel: 1 as const,
        },
      };

      render(<TextBlockNode {...props} />);

      // Get the onUpdate callback from useTiptapEditor call
      const useTiptapCall = (useTiptapEditor as any).mock.calls[0][0];
      const onUpdateCallback = useTiptapCall.onUpdate;

      // Simulate content update from Tiptap
      onUpdateCallback('test-node', '<p>Wrong format</p>');

      // Should validate content
      expect(validateContentStructure).toHaveBeenCalledWith('<p>Wrong format</p>', 1);

      // Should transform content
      expect(transformContent).toHaveBeenCalledWith('<p>Wrong format</p>', null, 1);

      // Should update node with transformed content
      expect(mockUpdateNode).toHaveBeenCalledWith('test-node', {
        data: {
          ...props.data,
          htmlContent: '<h1>Corrected content</h1>',
        },
      });
    });

    it('should not transform content if validation passes', () => {
      const {
        validateContentStructure,
        transformContent,
      } = require('../../../../utils/contentTransformers');

      // Mock validation to return true (content matches expected structure)
      validateContentStructure.mockReturnValue(true);

      const props = {
        ...defaultProps,
        data: {
          ...defaultProps.data,
          headingLevel: 1 as const,
        },
      };

      render(<TextBlockNode {...props} />);

      // Get the onUpdate callback from useTiptapEditor call
      const useTiptapCall = (useTiptapEditor as any).mock.calls[0][0];
      const onUpdateCallback = useTiptapCall.onUpdate;

      // Simulate content update from Tiptap
      onUpdateCallback('test-node', '<h1>Correct format</h1>');

      // Should validate content
      expect(validateContentStructure).toHaveBeenCalledWith('<h1>Correct format</h1>', 1);

      // Should NOT transform content
      expect(transformContent).not.toHaveBeenCalled();

      // Should update node with original content
      expect(mockUpdateNode).toHaveBeenCalledWith('test-node', {
        data: {
          ...props.data,
          htmlContent: '<h1>Correct format</h1>',
        },
      });
    });
  });
});
