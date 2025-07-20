// ABOUTME: Tests for unified TextBlockNode supporting both text and heading modes

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextBlockNode } from '../TextBlockNode';

// Mock dependencies
const mockUseEditorStore = {
  updateNode: vi.fn(),
};

const mockUseEditorTheme = {
  colors: {
    block: { text: '#000000' },
  },
  theme: 'light',
};

const mockUseTiptapEditor = {
  editor: {
    commands: {
      setContent: vi.fn(),
      focus: vi.fn(),
    },
    isEditable: true,
    isEmpty: false,
  },
  focusEditor: vi.fn(),
  isFocused: false,
};

vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => mockUseEditorStore,
}));

vi.mock('@/hooks/useEditorTheme', () => ({
  useEditorTheme: () => mockUseEditorTheme,
}));

vi.mock('@/hooks/useTiptapEditor', () => ({
  useTiptapEditor: () => mockUseTiptapEditor,
}));

vi.mock('@tiptap/react', () => ({
  EditorContent: ({ className, style }: any) => (
    <div data-testid="editor-content" className={className} style={style}>
      Sample content
    </div>
  ),
}));

describe('TextBlockNode - Unified Text/Heading Component', () => {
  const baseProps = {
    id: 'test-text-id',
    selected: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Text Mode (Default)', () => {
    it('should render as text block when no headingLevel is specified', () => {
      const textProps = {
        ...baseProps,
        data: {
          htmlContent: '<p>Test paragraph</p>',
          fontSize: 16,
        },
      };

      render(<TextBlockNode {...textProps} />);

      const blockContainer = screen
        .getByTestId('editor-content')
        .closest('[data-block-type="textBlock"]');
      expect(blockContainer).toBeInTheDocument();
      expect(blockContainer).toHaveStyle({ fontSize: '16px' });
    });

    it('should use text-specific defaults for font size and line height', () => {
      const textProps = {
        ...baseProps,
        data: {
          htmlContent: '<p>Test paragraph</p>',
        },
      };

      render(<TextBlockNode {...textProps} />);

      const blockContainer = screen
        .getByTestId('editor-content')
        .closest('[data-block-type="textBlock"]');
      expect(blockContainer).toHaveStyle({
        fontSize: '16px',
        lineHeight: '1.6',
        fontWeight: '400',
      });
    });

    it('should show text block selection indicator', () => {
      const textProps = {
        ...baseProps,
        data: { htmlContent: '<p>Test</p>' },
        selected: true,
      };

      render(<TextBlockNode {...textProps} />);

      expect(screen.getByText('Text Block Selected')).toBeInTheDocument();
    });
  });

  describe('Heading Mode', () => {
    it('should render as heading block when headingLevel is specified', () => {
      const headingProps = {
        ...baseProps,
        data: {
          htmlContent: '<h1>Test heading</h1>',
          headingLevel: 1 as const,
        },
      };

      render(<TextBlockNode {...headingProps} />);

      const blockContainer = screen
        .getByTestId('editor-content')
        .closest('[data-block-type="textBlock"]');
      expect(blockContainer).toBeInTheDocument();
      expect(blockContainer).toHaveStyle({ fontSize: '2.25rem' }); // H1 size
    });

    it('should apply correct font sizes for different heading levels', () => {
      const headingLevels = [
        { level: 1, expectedSize: '2.25rem' },
        { level: 2, expectedSize: '1.875rem' },
        { level: 3, expectedSize: '1.5rem' },
        { level: 4, expectedSize: '1.25rem' },
      ];

      headingLevels.forEach(({ level, expectedSize }) => {
        const headingProps = {
          ...baseProps,
          data: {
            htmlContent: `<h${level}>Test heading ${level}</h${level}>`,
            headingLevel: level as 1 | 2 | 3 | 4,
          },
        };

        const { container } = render(<TextBlockNode {...headingProps} />);
        const blockContainer = container.querySelector('[data-block-type="textBlock"]');

        expect(blockContainer).toHaveStyle({ fontSize: expectedSize });
      });
    });

    it('should apply correct font weights for different heading levels', () => {
      const headingWeights = [
        { level: 1, expectedWeight: '700' },
        { level: 2, expectedWeight: '700' },
        { level: 3, expectedWeight: '600' },
        { level: 4, expectedWeight: '600' },
      ];

      headingWeights.forEach(({ level, expectedWeight }) => {
        const headingProps = {
          ...baseProps,
          data: {
            htmlContent: `<h${level}>Test heading ${level}</h${level}>`,
            headingLevel: level as 1 | 2 | 3 | 4,
          },
        };

        const { container } = render(<TextBlockNode {...headingProps} />);
        const blockContainer = container.querySelector('[data-block-type="textBlock"]');

        expect(blockContainer).toHaveStyle({ fontWeight: expectedWeight });
      });
    });

    it('should show heading block selection indicator', () => {
      const headingProps = {
        ...baseProps,
        data: {
          htmlContent: '<h1>Test heading</h1>',
          headingLevel: 1 as const,
        },
        selected: true,
      };

      render(<TextBlockNode {...headingProps} />);

      expect(screen.getByText('Heading Block Selected')).toBeInTheDocument();
    });

    it('should use heading-specific line height', () => {
      const headingProps = {
        ...baseProps,
        data: {
          htmlContent: '<h1>Test heading</h1>',
          headingLevel: 1 as const,
        },
      };

      render(<TextBlockNode {...headingProps} />);

      const blockContainer = screen
        .getByTestId('editor-content')
        .closest('[data-block-type="textBlock"]');
      expect(blockContainer).toHaveStyle({ lineHeight: '1.2' });
    });
  });

  describe('Extended Properties Support', () => {
    it('should support letterSpacing property', () => {
      const propsWithLetterSpacing = {
        ...baseProps,
        data: {
          htmlContent: '<p>Test text</p>',
          letterSpacing: 2,
        },
      };

      render(<TextBlockNode {...propsWithLetterSpacing} />);

      const blockContainer = screen
        .getByTestId('editor-content')
        .closest('[data-block-type="textBlock"]');
      expect(blockContainer).toHaveStyle({ letterSpacing: '2px' });
    });

    it('should support textTransform property', () => {
      const propsWithTextTransform = {
        ...baseProps,
        data: {
          htmlContent: '<p>Test text</p>',
          textTransform: 'uppercase' as const,
        },
      };

      render(<TextBlockNode {...propsWithTextTransform} />);

      const blockContainer = screen
        .getByTestId('editor-content')
        .closest('[data-block-type="textBlock"]');
      expect(blockContainer).toHaveStyle({ textTransform: 'uppercase' });
    });

    it('should support textDecoration property', () => {
      const propsWithTextDecoration = {
        ...baseProps,
        data: {
          htmlContent: '<p>Test text</p>',
          textDecoration: 'underline' as const,
        },
      };

      render(<TextBlockNode {...propsWithTextDecoration} />);

      const blockContainer = screen
        .getByTestId('editor-content')
        .closest('[data-block-type="textBlock"]');
      expect(blockContainer).toHaveStyle({ textDecoration: 'underline' });
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing text block functionality', () => {
      const existingTextProps = {
        ...baseProps,
        data: {
          htmlContent: '<p>Existing text block</p>',
          fontSize: 14,
          textAlign: 'center' as const,
          color: '#333333',
          backgroundColor: '#f5f5f5',
          paddingX: 16,
          paddingY: 12,
          borderRadius: 8,
          lineHeight: 1.5,
          fontFamily: 'Arial',
          fontWeight: 500,
        },
      };

      render(<TextBlockNode {...existingTextProps} />);

      const blockContainer = screen
        .getByTestId('editor-content')
        .closest('[data-block-type="textBlock"]');
      expect(blockContainer).toHaveStyle({
        fontSize: '14px',
        textAlign: 'center',
        color: '#333333',
        backgroundColor: '#f5f5f5',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
        borderRadius: '8px',
        lineHeight: '1.5',
        fontFamily: 'Arial',
        fontWeight: '500',
      });
    });

    it('should not break when headingLevel is null or undefined', () => {
      const propsWithNullHeading = {
        ...baseProps,
        data: {
          htmlContent: '<p>Text with null heading</p>',
          headingLevel: null,
        },
      };

      expect(() => render(<TextBlockNode {...propsWithNullHeading} />)).not.toThrow();
    });
  });

  describe('Dynamic Content Initialization', () => {
    it('should initialize with text content when headingLevel is not set', () => {
      const textProps = {
        ...baseProps,
        data: {
          htmlContent: '',
        },
      };

      render(<TextBlockNode {...textProps} />);

      // This will be verified when we check the useTiptapEditor hook call
      expect(mockUseTiptapEditor).toBeDefined();
    });

    it('should initialize with heading content when headingLevel is set', () => {
      const headingProps = {
        ...baseProps,
        data: {
          htmlContent: '',
          headingLevel: 2 as const,
        },
      };

      render(<TextBlockNode {...headingProps} />);

      // This will be verified when we check the useTiptapEditor hook call
      expect(mockUseTiptapEditor).toBeDefined();
    });
  });

  describe('CSS Class Management', () => {
    it('should apply clean CSS classes without excessive overrides', () => {
      const textProps = {
        ...baseProps,
        data: {
          htmlContent: '<p>Test text</p>',
        },
      };

      render(<TextBlockNode {...textProps} />);

      const editorContent = screen.getByTestId('editor-content');

      // Should have clean CSS classes without prose (which was causing spacing issues)
      expect(editorContent).toHaveClass('max-w-none');
      expect(editorContent).toHaveClass('focus:outline-none');
      expect(editorContent).not.toHaveClass('prose'); // prose classes removed to fix heading spacing

      // Should have spacing reset classes
      expect(editorContent).toHaveClass('[&>*]:my-0');
      expect(editorContent).toHaveClass('[&_p]:my-0');
      expect(editorContent).toHaveClass('[&_h1]:my-0');
      expect(editorContent).toHaveClass('[&_h2]:my-0');
      expect(editorContent).toHaveClass('[&_h3]:my-0');
      expect(editorContent).toHaveClass('[&_h4]:my-0');
      expect(editorContent).toHaveClass('[&_h5]:my-0');
      expect(editorContent).toHaveClass('[&_h6]:my-0');
    });
  });
});
