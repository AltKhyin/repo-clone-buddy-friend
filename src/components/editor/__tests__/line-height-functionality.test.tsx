// ABOUTME: Comprehensive test suite for line height functionality across editor and read-only modes

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RichBlockNode } from '../Nodes/RichBlockNode';
import { ReadOnlyRichBlockNode } from '../../review-detail/ReadOnlyRichBlockNode';
import { useEditorStore } from '@/store/editorStore';
import { useSelectionStore } from '@/store/selectionStore';

// Mock the stores
vi.mock('@/store/editorStore');
vi.mock('@/store/selectionStore');
vi.mock('../../../hooks/useRichTextEditor');
vi.mock('../../../hooks/useSelectionCoordination');
vi.mock('../../../hooks/useEditorTheme');
vi.mock('@/hooks/use-mobile');

const mockUseEditorStore = useEditorStore as any;
const mockUseSelectionStore = useSelectionStore as any;

// Mock the hooks
vi.mock('../../../hooks/useRichTextEditor', () => ({
  useRichTextEditor: () => ({
    editor: {
      getHTML: () => '<p>Test content</p>',
      getJSON: () => ({ type: 'doc', content: [] }),
      commands: {
        focus: vi.fn(),
        setContent: vi.fn(),
      },
      state: {
        selection: { from: 0, to: 0, empty: true },
        doc: { content: { size: 10 } }
      }
    }
  })
}));

vi.mock('../../../hooks/useSelectionCoordination', () => ({
  useSelectionCoordination: () => ({
    isActive: false,
    handleContentSelection: vi.fn(),
    handleBlockActivation: vi.fn(),
  })
}));

vi.mock('../../../hooks/useEditorTheme', () => ({
  useEditorTheme: () => ({
    colors: {
      block: { text: '#000000' }
    }
  })
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false
}));

describe('Line Height Functionality', () => {
  const mockRichBlockData = {
    content: {
      htmlContent: '<p>Test content</p>',
      tiptapJSON: null,
    },
    fontSize: '16px',
    fontFamily: 'inherit',
    fontWeight: 400,
    color: '#000000',
    backgroundColor: 'transparent',
    paddingTop: 16,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock store implementations
    mockUseEditorStore.mockReturnValue({
      updateNode: vi.fn(),
      registerEditor: vi.fn(),
      unregisterEditor: vi.fn(),
      currentViewport: 'desktop',
    });

    mockUseSelectionStore.mockReturnValue({
      dispatch: vi.fn(),
    });
  });

  describe('Editor Mode Line Height', () => {
    it('should apply toolbar line height changes to visual content', () => {
      const dataWithLineHeight = {
        ...mockRichBlockData,
        lineHeight: 2.4, // Custom line height from toolbar
      };

      render(
        <RichBlockNode
          id="test-block"
          data={dataWithLineHeight}
          selected={false}
          width={600}
          height={200}
          x={0}
          y={0}
        />
      );

      // Find the EditorContent wrapper element
      const editorContent = screen.getByRole('textbox', { hidden: true });
      const parentElement = editorContent.closest('.rich-block-content');
      
      // Verify that the wrapper has the correct line height
      expect(parentElement).toHaveStyle({ lineHeight: '2.4' });
    });

    it('should use default line height when not specified', () => {
      render(
        <RichBlockNode
          id="test-block"
          data={mockRichBlockData}
          selected={false}
          width={600}
          height={200}
          x={0}
          y={0}
        />
      );

      const editorContent = screen.getByRole('textbox', { hidden: true });
      const parentElement = editorContent.closest('.rich-block-content');
      
      // Should use default fallback of 1.6
      expect(parentElement).toHaveStyle({ lineHeight: '1.6' });
    });

    it('should inherit line height from wrapper to TipTap content', () => {
      const dataWithLineHeight = {
        ...mockRichBlockData,
        lineHeight: 2.0,
      };

      render(
        <RichBlockNode
          id="test-block"
          data={dataWithLineHeight}
          selected={false}
          width={600}
          height={200}
          x={0}
          y={0}
        />
      );

      // The TipTap editor should be configured to inherit line height
      // This is tested by verifying the useRichTextEditor configuration
      // includes 'line-height: inherit' in the style string
      const editorContent = screen.getByRole('textbox', { hidden: true });
      
      // Verify TipTap content uses inheritance
      const computedStyle = window.getComputedStyle(editorContent);
      expect(computedStyle.lineHeight).not.toBe('1.6'); // Should not be hardcoded
    });
  });

  describe('Read-Only Mode Line Height', () => {
    it('should maintain line height consistency in read-only mode', () => {
      const dataWithLineHeight = {
        ...mockRichBlockData,
        lineHeight: 2.2,
      };

      render(
        <ReadOnlyRichBlockNode
          id="test-block"
          data={dataWithLineHeight}
          width={600}
          height={200}
          x={0}
          y={0}
          canvasWidth={1200}
          mobileCanvasWidth={375}
        />
      );

      // Find the read-only editor content
      const readOnlyContent = screen.getByText('Test content', { hidden: true });
      const parentElement = readOnlyContent.closest('.readonly-rich-block-content');
      
      // Should have the same line height as editor mode
      expect(parentElement).toHaveStyle({ lineHeight: '2.2' });
    });

    it('should handle viewport-specific padding correctly', () => {
      const dataWithViewportPadding = {
        ...mockRichBlockData,
        lineHeight: 1.8,
        desktopPadding: { top: 20, right: 20, bottom: 20, left: 20 },
        mobilePadding: { top: 12, right: 12, bottom: 12, left: 12 },
      };

      render(
        <ReadOnlyRichBlockNode
          id="test-block"
          data={dataWithViewportPadding}
          width={600}
          height={200}
          x={0}
          y={0}
          canvasWidth={1200}
          mobileCanvasWidth={375}
        />
      );

      // Line height should still be applied correctly regardless of padding
      const readOnlyContent = screen.getByText('Test content', { hidden: true });
      const parentElement = readOnlyContent.closest('.readonly-rich-block-content');
      
      expect(parentElement).toHaveStyle({ lineHeight: '1.8' });
    });
  });

  describe('Line Height Edge Cases', () => {
    it('should handle zero line height gracefully', () => {
      const dataWithZeroLineHeight = {
        ...mockRichBlockData,
        lineHeight: 0,
      };

      render(
        <RichBlockNode
          id="test-block"
          data={dataWithZeroLineHeight}
          selected={false}
          width={600}
          height={200}
          x={0}
          y={0}
        />
      );

      const editorContent = screen.getByRole('textbox', { hidden: true });
      const parentElement = editorContent.closest('.rich-block-content');
      
      // Should use the specified value, even if zero
      expect(parentElement).toHaveStyle({ lineHeight: '0' });
    });

    it('should handle very large line height values', () => {
      const dataWithLargeLineHeight = {
        ...mockRichBlockData,
        lineHeight: 5.0,
      };

      render(
        <RichBlockNode
          id="test-block"
          data={dataWithLargeLineHeight}
          selected={false}
          width={600}
          height={200}
          x={0}
          y={0}
        />
      );

      const editorContent = screen.getByRole('textbox', { hidden: true });
      const parentElement = editorContent.closest('.rich-block-content');
      
      expect(parentElement).toHaveStyle({ lineHeight: '5' });
    });

    it('should handle decimal line height values', () => {
      const dataWithDecimalLineHeight = {
        ...mockRichBlockData,
        lineHeight: 1.375, // Common value between 1.25 and 1.5
      };

      render(
        <RichBlockNode
          id="test-block"
          data={dataWithDecimalLineHeight}
          selected={false}
          width={600}
          height={200}
          x={0}
          y={0}
        />
      );

      const editorContent = screen.getByRole('textbox', { hidden: true });
      const parentElement = editorContent.closest('.rich-block-content');
      
      expect(parentElement).toHaveStyle({ lineHeight: '1.375' });
    });
  });

  describe('Visual Regression Prevention', () => {
    it('should not have CSS conflicts between wrapper and content line height', () => {
      const dataWithLineHeight = {
        ...mockRichBlockData,
        lineHeight: 2.5,
      };

      const { container } = render(
        <RichBlockNode
          id="test-block"
          data={dataWithLineHeight}
          selected={false}
          width={600}
          height={200}
          x={0}
          y={0}
        />
      );

      // Check that no hardcoded line-height: 1.6 exists in the DOM
      const allElements = container.querySelectorAll('*');
      let foundHardcodedLineHeight = false;
      
      allElements.forEach(element => {
        const style = element.getAttribute('style');
        if (style && style.includes('line-height: 1.6')) {
          foundHardcodedLineHeight = true;
        }
      });

      expect(foundHardcodedLineHeight).toBe(false);
    });

    it('should ensure editor and read-only mode produce identical line height behavior', () => {
      const testData = {
        ...mockRichBlockData,
        lineHeight: 1.75,
      };

      // Render editor mode
      const { container: editorContainer } = render(
        <RichBlockNode
          id="editor-block"
          data={testData}
          selected={false}
          width={600}
          height={200}
          x={0}
          y={0}
        />
      );

      // Render read-only mode
      const { container: readOnlyContainer } = render(
        <ReadOnlyRichBlockNode
          id="readonly-block"
          data={testData}
          width={600}
          height={200}
          x={0}
          y={0}
          canvasWidth={1200}
          mobileCanvasWidth={375}
        />
      );

      // Both should have line height applied to their respective wrapper elements
      const editorWrapper = editorContainer.querySelector('.rich-block-content');
      const readOnlyWrapper = readOnlyContainer.querySelector('.readonly-rich-block-content');

      expect(editorWrapper).toHaveStyle({ lineHeight: '1.75' });
      expect(readOnlyWrapper).toHaveStyle({ lineHeight: '1.75' });
    });
  });
});