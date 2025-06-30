// ABOUTME: Comprehensive test suite for SeparatorBlockNode with advanced styling options

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SeparatorBlockNode } from './SeparatorBlockNode';
import { useEditorStore } from '@/store/editorStore';

// Mock the editorStore
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn()
}));

// Mock React Flow components
vi.mock('@xyflow/react', () => ({
  NodeResizer: ({ children, ...props }: any) => <div data-testid="node-resizer" {...props}>{children}</div>,
}));

// Mock UnifiedNodeResizer
vi.mock('../components/UnifiedNodeResizer', () => ({
  UnifiedNodeResizer: ({ isVisible, nodeType }: any) => (
    <div data-testid="unified-node-resizer" data-visible={isVisible} data-node-type={nodeType} />
  )
}));

// Mock Lucide React icons (if used)
vi.mock('lucide-react', () => ({
  Minus: (props: any) => <div data-testid="minus-icon" {...props} />,
}));

const mockUseEditorStore = useEditorStore as any;

const createMockSeparatorData = (overrides = {}) => ({
  style: 'solid' as const,
  thickness: 1,
  width: 'full' as const,
  color: undefined,
  ...overrides
});

const createMockStore = (overrides = {}) => ({
  updateNode: vi.fn(),
  selectNode: vi.fn(),
  canvasTheme: 'light',
  ...overrides
});

describe('SeparatorBlockNode', () => {
  beforeEach(() => {
    mockUseEditorStore.mockReturnValue(createMockStore());
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render separator block with default styling', () => {
      const data = createMockSeparatorData();
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-1"
          data={data}
          selected={false}
        />
      );

      // Check for separator line element (it's a div with border, not hr)
      const separatorLine = container.querySelector('div[class*="border-t"]');
      expect(separatorLine).toBeInTheDocument();
      expect(separatorLine).toHaveClass('border-solid');
    });

    it('should show selection indicator when selected', () => {
      const data = createMockSeparatorData();
      
      render(
        <SeparatorBlockNode
          id="test-separator-2"
          data={data}
          selected={true}
        />
      );

      // Check for actual selection indicator text
      expect(screen.getByText(/Separator \(solid, full, 1px\)/)).toBeInTheDocument();
    });

    it('should render separator line with correct default styling', () => {
      const data = createMockSeparatorData();
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-3"
          data={data}
          selected={false}
        />
      );

      const separatorLine = container.querySelector('div[class*="border-t"]');
      expect(separatorLine).toBeInTheDocument();
      expect(separatorLine).toHaveClass('border-solid');
    });
  });

  describe('Style Options', () => {
    it('should apply solid line style', () => {
      const data = createMockSeparatorData({ style: 'solid' });
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-4"
          data={data}
          selected={false}
        />
      );

      const separatorLine = container.querySelector('div[class*="border-t"]');
      expect(separatorLine).toHaveClass('border-solid');
    });

    it('should apply dashed line style', () => {
      const data = createMockSeparatorData({ style: 'dashed' });
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-5"
          data={data}
          selected={false}
        />
      );

      const separatorLine = container.querySelector('div[class*="border-t"]');
      expect(separatorLine).toHaveClass('border-dashed');
    });

    it('should apply dotted line style', () => {
      const data = createMockSeparatorData({ style: 'dotted' });
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-6"
          data={data}
          selected={false}
        />
      );

      const separatorLine = container.querySelector('div[class*="border-t"]');
      expect(separatorLine).toHaveClass('border-dotted');
    });
  });

  describe('Width Options', () => {
    it('should apply full width styling', () => {
      const data = createMockSeparatorData({ width: 'full' });
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-7"
          data={data}
          selected={false}
        />
      );

      const separatorLine = container.querySelector('div[class*="border-t"]');
      expect(separatorLine).toHaveClass('w-full');
    });

    it('should apply half width styling', () => {
      const data = createMockSeparatorData({ width: 'half' });
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-8"
          data={data}
          selected={false}
        />
      );

      const separatorLine = container.querySelector('div[class*="border-t"]');
      expect(separatorLine).toHaveClass('w-1/2');
    });

    it('should apply quarter width styling', () => {
      const data = createMockSeparatorData({ width: 'quarter' });
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-9"
          data={data}
          selected={false}
        />
      );

      const separatorLine = container.querySelector('div[class*="border-t"]');
      expect(separatorLine).toHaveClass('w-1/4');
    });
  });

  describe('Thickness Control', () => {
    it('should apply default thickness (1px)', () => {
      const data = createMockSeparatorData({ thickness: 1 });
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-10"
          data={data}
          selected={false}
        />
      );

      const separatorLine = container.querySelector('div[class*="border-t"]');
      expect(separatorLine).toHaveClass('border-t-1');
    });

    it('should apply custom thickness (3px)', () => {
      const data = createMockSeparatorData({ thickness: 3 });
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-11"
          data={data}
          selected={false}
        />
      );

      const separatorLine = container.querySelector('div[class*="border-t"]');
      expect(separatorLine).toHaveClass('border-t-3');
    });

    it('should apply maximum thickness (10px)', () => {
      const data = createMockSeparatorData({ thickness: 10 });
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-12"
          data={data}
          selected={false}
        />
      );

      const separatorLine = container.querySelector('div[class*="border-t"]');
      expect(separatorLine).toHaveClass('border-t-10');
    });

    it('should handle thickness bounds gracefully', () => {
      const data = createMockSeparatorData({ thickness: 0 });
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-13"
          data={data}
          selected={false}
        />
      );

      const separatorLine = container.querySelector('div[class*="border-t"]');
      expect(separatorLine).toHaveClass('border-t-1'); // Should fallback to minimum
    });
  });

  describe('Color Customization', () => {
    it('should apply default theme color when no custom color provided', () => {
      const data = createMockSeparatorData({ color: undefined });
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-14"
          data={data}
          selected={false}
        />
      );

      const separatorLine = container.querySelector('div[class*="border-t"]');
      expect(separatorLine).toHaveClass('border-border');
    });

    it('should apply custom color when provided', () => {
      const data = createMockSeparatorData({ color: '#3b82f6' });
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-15"
          data={data}
          selected={false}
        />
      );

      const separatorLine = container.querySelector('div[class*="border-t"]');
      expect(separatorLine).toHaveStyle({ borderTopColor: '#3b82f6' });
    });

    it('should handle dark theme color', () => {
      mockUseEditorStore.mockReturnValue(createMockStore({
        canvasTheme: 'dark'
      }));

      const data = createMockSeparatorData({ color: undefined });
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-16"
          data={data}
          selected={false}
        />
      );

      const separatorLine = container.querySelector('div[class*="border-t"]');
      expect(separatorLine).toHaveClass('border-border');
    });
  });

  describe('Theme Adaptation', () => {
    it('should apply dark theme styling', () => {
      mockUseEditorStore.mockReturnValue(createMockStore({
        canvasTheme: 'dark'
      }));

      const data = createMockSeparatorData();
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-17"
          data={data}
          selected={false}
        />
      );

      const separatorBlock = container.querySelector('.bg-muted\\/30');
      expect(separatorBlock).toBeInTheDocument();
    });

    it('should apply light theme styling by default', () => {
      const data = createMockSeparatorData();
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-18"
          data={data}
          selected={false}
        />
      );

      const separatorBlock = container.querySelector('.bg-muted\\/30');
      expect(separatorBlock).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should call selectNode when clicked', () => {
      const mockSelectNode = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore());
      
      // Mock the getState function to return our mock
      useEditorStore.getState = vi.fn().mockReturnValue({
        selectNode: mockSelectNode
      });

      const data = createMockSeparatorData();
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-19"
          data={data}
          selected={false}
        />
      );

      const separatorContainer = container.querySelector('.cursor-pointer');
      separatorContainer?.click();

      expect(mockSelectNode).toHaveBeenCalledWith('test-separator-19');
    });
  });

  describe('UnifiedNodeResizer Integration', () => {
    it('should render UnifiedNodeResizer with correct props when selected', () => {
      const data = createMockSeparatorData();
      
      render(
        <SeparatorBlockNode
          id="test-separator-20"
          data={data}
          selected={true}
        />
      );

      const resizer = screen.getByTestId('unified-node-resizer');
      expect(resizer).toHaveAttribute('data-visible', 'true');
      expect(resizer).toHaveAttribute('data-node-type', 'separatorBlock');
    });

    it('should hide resizer when not selected', () => {
      const data = createMockSeparatorData();
      
      render(
        <SeparatorBlockNode
          id="test-separator-21"
          data={data}
          selected={false}
        />
      );

      const resizer = screen.getByTestId('unified-node-resizer');
      expect(resizer).toHaveAttribute('data-visible', 'false');
    });
  });

  describe('Complex Styling Combinations', () => {
    it('should handle multiple styling options combined', () => {
      const data = createMockSeparatorData({
        style: 'dashed',
        thickness: 5,
        width: 'half',
        color: '#ef4444'
      });
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-22"
          data={data}
          selected={false}
        />
      );

      const separatorLine = container.querySelector('div[class*="border-t"]');
      expect(separatorLine).toHaveClass('border-dashed');
      expect(separatorLine).toHaveClass('border-t-5');
      expect(separatorLine).toHaveClass('w-1/2');
      expect(separatorLine).toHaveStyle({ borderTopColor: '#ef4444' });
    });

    it('should handle edge case styling combinations', () => {
      const data = createMockSeparatorData({
        style: 'dotted',
        thickness: 10,
        width: 'quarter',
        color: 'transparent'
      });
      
      const { container } = render(
        <SeparatorBlockNode
          id="test-separator-23"
          data={data}
          selected={false}
        />
      );

      const separatorLine = container.querySelector('div[class*="border-t"]');
      expect(separatorLine).toHaveClass('border-dotted');
      expect(separatorLine).toHaveClass('border-t-10');
      expect(separatorLine).toHaveClass('w-1/4');
      expect(separatorLine).toHaveStyle({ borderTopColor: 'transparent' });
    });
  });

  describe('Visual Preview', () => {
    it('should show style preview in metadata', () => {
      const data = createMockSeparatorData({
        style: 'dashed',
        thickness: 3,
        width: 'half'
      });
      
      render(
        <SeparatorBlockNode
          id="test-separator-24"
          data={data}
          selected={true}
        />
      );

      expect(screen.getByText('Style:')).toBeInTheDocument();
      expect(screen.getByText('dashed')).toBeInTheDocument();
      expect(screen.getByText('Width:')).toBeInTheDocument();
      expect(screen.getByText('half')).toBeInTheDocument();
      expect(screen.getByText('Thickness:')).toBeInTheDocument();
      expect(screen.getByText('3px')).toBeInTheDocument();
    });

    it('should show style preview for all width options', () => {
      const widthOptions = [
        { width: 'full', display: 'full' },
        { width: 'half', display: 'half' },
        { width: 'quarter', display: 'quarter' }
      ];

      widthOptions.forEach(({ width, display }, index) => {
        const data = createMockSeparatorData({ width: width as any });
        
        const { unmount } = render(
          <SeparatorBlockNode
            id={`test-separator-width-${index}`}
            data={data}
            selected={true}
          />
        );

        expect(screen.getByText('Width:')).toBeInTheDocument();
        expect(screen.getByText(display)).toBeInTheDocument();
        
        unmount(); // Clean up for next iteration
      });
    });
  });
});