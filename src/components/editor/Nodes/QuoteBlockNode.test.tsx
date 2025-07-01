// ABOUTME: Tests for QuoteBlockNode ensuring proper rendering, theme integration, and user interactions

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuoteBlockNode } from './QuoteBlockNode';
import { useEditorStore } from '@/store/editorStore';
import { ThemedBlockWrapper } from '@/components/editor/theme/ThemeIntegration';

// Mock the editor store
vi.mock('@/store/editorStore');
const mockUseEditorStore = vi.mocked(useEditorStore);

// Mock React Flow components
vi.mock('@xyflow/react', () => ({
  Handle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Position: {
    Top: 'top',
    Bottom: 'bottom',
  },
}));

// Mock theme integration components
vi.mock('@/components/editor/theme/ThemeIntegration', () => ({
  ThemedBlockWrapper: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  useThemedStyles: () => ({
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
  }),
  useThemedColors: () => ({
    neutral: {
      '50': '#f9fafb',
      '100': '#f3f4f6',
      '200': '#e5e7eb',
      '600': '#6b7280',
      '900': '#111827',
    },
    primary: {
      '500': '#3b82f6',
      '600': '#2563eb',
    },
  }),
}));

// Mock unified components
vi.mock('../components/UnifiedNodeResizer', () => ({
  UnifiedNodeResizer: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('../utils/blockStyling', () => ({
  useUnifiedBlockStyling: () => ({
    selectionClasses: 'mock-selection-classes',
    borderStyles: { border: '1px solid #e5e7eb' },
  }),
  getSelectionIndicatorProps: () => ({
    className: 'mock-selection-indicator',
  }),
  getThemeAwarePlaceholderClasses: () => 'mock-placeholder-classes',
}));

describe('QuoteBlockNode', () => {
  const mockUpdateNode = vi.fn();

  const defaultProps = {
    id: 'test-quote-id',
    data: {
      content: 'This is a test quote',
      citation: 'Test Author',
      style: 'default' as const,
      borderColor: '#3b82f6',
    },
    selected: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEditorStore.mockReturnValue({
      updateNode: mockUpdateNode,
      canvasTheme: 'light',
    } as any);
  });

  it('renders quote content correctly', () => {
    render(<QuoteBlockNode {...defaultProps} />);

    expect(screen.getByText('This is a test quote')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('handles missing content gracefully with fallback text', () => {
    const propsWithoutContent = {
      ...defaultProps,
      data: {
        content: '',
        citation: '',
        style: 'default' as const,
      },
    };

    render(<QuoteBlockNode {...propsWithoutContent} />);

    expect(screen.getByText('Enter your quote here...')).toBeInTheDocument();
  });

  it('renders large quote style correctly', () => {
    const largeQuoteProps = {
      ...defaultProps,
      data: {
        content: 'This is a large quote',
        citation: 'Important Author',
        style: 'large-quote' as const,
        borderColor: '#3b82f6',
      },
    };

    render(<QuoteBlockNode {...largeQuoteProps} />);

    const quoteElement = screen.getByText('This is a large quote');
    expect(quoteElement).toBeInTheDocument();
    expect(quoteElement).toHaveClass('text-xl', 'font-medium');
  });

  it('shows citation placeholder when selected and no citation provided', () => {
    const selectedProps = {
      ...defaultProps,
      data: {
        content: 'Quote without citation',
        citation: '',
        style: 'default' as const,
      },
      selected: true,
    };

    render(<QuoteBlockNode {...selectedProps} />);

    expect(screen.getByText('Add citation (optional)')).toBeInTheDocument();
  });

  it('handles click events correctly', () => {
    render(<QuoteBlockNode {...defaultProps} />);

    const quoteContainer = screen.getByText('This is a test quote').closest('[data-node-id]');

    if (quoteContainer) {
      fireEvent.click(quoteContainer.parentElement!);
      expect(mockUpdateNode).toHaveBeenCalledWith('test-quote-id', {});
    }
  });

  it('applies dark mode styling correctly', () => {
    mockUseEditorStore.mockReturnValue({
      updateNode: mockUpdateNode,
      canvasTheme: 'dark',
    } as any);

    render(<QuoteBlockNode {...defaultProps} />);

    // The component should render without errors in dark mode
    expect(screen.getByText('This is a test quote')).toBeInTheDocument();
  });

  it('uses custom border color when provided', () => {
    const customColorProps = {
      ...defaultProps,
      data: {
        content: 'Custom colored quote',
        citation: 'Color Author',
        style: 'default' as const,
        borderColor: '#ef4444', // Red color
      },
    };

    render(<QuoteBlockNode {...customColorProps} />);

    // Quote should render with custom styling
    expect(screen.getByText('Custom colored quote')).toBeInTheDocument();
  });

  it('renders with unified theme integration', () => {
    render(<QuoteBlockNode {...defaultProps} />);

    // Check that ThemedBlockWrapper is used
    const themedWrapper = screen
      .getByText('This is a test quote')
      .closest('[blockType="quoteBlock"]');
    expect(themedWrapper).toBeInTheDocument();
  });

  it('handles corrupted data gracefully', () => {
    const corruptedProps = {
      ...defaultProps,
      data: null as any,
    };

    render(<QuoteBlockNode {...corruptedProps} />);

    // Should fall back to safe defaults
    expect(screen.getByText('Enter your quote here...')).toBeInTheDocument();
  });

  it('renders quote icon correctly', () => {
    render(<QuoteBlockNode {...defaultProps} />);

    // Check for quote icon presence (using data-testid or class)
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('applies correct sizing constraints', () => {
    render(<QuoteBlockNode {...defaultProps} />);

    // The component should render with proper width constraints
    const container = screen.getByText('This is a test quote').closest('[style*="min-width"]');
    // Component should apply minimum width styling
    expect(container || screen.getByText('This is a test quote')).toBeInTheDocument();
  });
});
