// ABOUTME: Comprehensive test suite for KeyTakeawayBlockNode with theme customization and icon selection

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KeyTakeawayBlockNode } from './KeyTakeawayBlockNode';
import { useEditorStore } from '@/store/editorStore';

// Mock the editorStore
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn(),
}));

// Mock React Flow components
vi.mock('@xyflow/react', () => ({
  NodeResizer: ({ children, ...props }: any) => (
    <div data-testid="node-resizer" {...props}>
      {children}
    </div>
  ),
}));

// Mock UnifiedNodeResizer
vi.mock('../components/UnifiedNodeResizer', () => ({
  UnifiedNodeResizer: ({ isVisible, nodeType }: any) => (
    <div data-testid="unified-node-resizer" data-visible={isVisible} data-node-type={nodeType} />
  ),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Lightbulb: (props: any) => <div data-testid="lightbulb-icon" {...props} />,
  CheckCircle: (props: any) => <div data-testid="check-circle-icon" {...props} />,
  AlertTriangle: (props: any) => <div data-testid="alert-triangle-icon" {...props} />,
  XCircle: (props: any) => <div data-testid="x-circle-icon" {...props} />,
  Info: (props: any) => <div data-testid="info-icon" {...props} />,
  Star: (props: any) => <div data-testid="star-icon" {...props} />,
  Zap: (props: any) => <div data-testid="zap-icon" {...props} />,
  Target: (props: any) => <div data-testid="target-icon" {...props} />,
  TrendingUp: (props: any) => <div data-testid="trending-up-icon" {...props} />,
}));

// Mock theme integration components
vi.mock('@/components/editor/theme/ThemeIntegration', () => ({
  ThemedBlockWrapper: ({ children, className, style, blockType, ...props }: any) => (
    <div
      data-testid="themed-block-wrapper"
      data-block-type={blockType}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </div>
  ),
  useThemedColors: vi.fn(() => null),
}));

const mockUseEditorStore = useEditorStore as any;

const createMockKeyTakeawayData = (overrides = {}) => ({
  content: 'This is a key takeaway message for practitioners',
  theme: 'info' as const,
  icon: 'Lightbulb',
  backgroundColor: undefined,
  ...overrides,
});

const createMockStore = (overrides = {}) => ({
  updateNode: vi.fn(),
  selectNode: vi.fn(),
  canvasTheme: 'light',
  ...overrides,
});

describe('KeyTakeawayBlockNode', () => {
  beforeEach(() => {
    mockUseEditorStore.mockReturnValue(createMockStore());
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render key takeaway block with content', () => {
      const data = createMockKeyTakeawayData();

      render(<KeyTakeawayBlockNode id="test-takeaway-1" data={data} selected={false} />);

      expect(
        screen.getByText('This is a key takeaway message for practitioners')
      ).toBeInTheDocument();
      expect(screen.getByText('Key Takeaway')).toBeInTheDocument();
    });

    it('should show selection indicator when selected', () => {
      const data = createMockKeyTakeawayData();

      render(<KeyTakeawayBlockNode id="test-takeaway-2" data={data} selected={true} />);

      expect(screen.getByText('Key Takeaway Selected')).toBeInTheDocument();
    });

    it('should render with default theme when no theme specified', () => {
      const data = createMockKeyTakeawayData({ theme: undefined });

      render(<KeyTakeawayBlockNode id="test-takeaway-3" data={data} selected={false} />);

      const themedWrapper = screen.getByTestId('themed-block-wrapper');
      expect(themedWrapper).toHaveAttribute('data-block-type', 'keyTakeawayBlock');
      expect(themedWrapper).toHaveClass('cursor-pointer');
    });
  });

  describe('Theme System', () => {
    it('should apply info theme styling', () => {
      const data = createMockKeyTakeawayData({ theme: 'info' });

      render(<KeyTakeawayBlockNode id="test-takeaway-4" data={data} selected={false} />);

      const themedWrapper = screen.getByTestId('themed-block-wrapper');
      expect(themedWrapper).toHaveClass('border-blue-400');
      expect(themedWrapper).toHaveClass('bg-gradient-to-r', 'from-blue-50', 'to-blue-100');
    });

    it('should apply success theme styling', () => {
      const data = createMockKeyTakeawayData({ theme: 'success' });

      render(<KeyTakeawayBlockNode id="test-takeaway-5" data={data} selected={false} />);

      const themedWrapper = screen.getByTestId('themed-block-wrapper');
      expect(themedWrapper).toHaveClass('border-green-400');
      expect(themedWrapper).toHaveClass('bg-gradient-to-r', 'from-green-50', 'to-green-100');
    });

    it('should apply warning theme styling', () => {
      const data = createMockKeyTakeawayData({ theme: 'warning' });

      render(<KeyTakeawayBlockNode id="test-takeaway-6" data={data} selected={false} />);

      const themedWrapper = screen.getByTestId('themed-block-wrapper');
      expect(themedWrapper).toHaveClass('border-yellow-400');
      expect(themedWrapper).toHaveClass('bg-gradient-to-r', 'from-yellow-50', 'to-yellow-100');
    });

    it('should apply error theme styling', () => {
      const data = createMockKeyTakeawayData({ theme: 'error' });

      render(<KeyTakeawayBlockNode id="test-takeaway-7" data={data} selected={false} />);

      const themedWrapper = screen.getByTestId('themed-block-wrapper');
      expect(themedWrapper).toHaveClass('border-red-400');
      expect(themedWrapper).toHaveClass('bg-gradient-to-r', 'from-red-50', 'to-red-100');
    });

    it('should apply custom background color when provided', () => {
      const data = createMockKeyTakeawayData({
        backgroundColor: '#f0f9ff',
        theme: 'info',
      });

      render(<KeyTakeawayBlockNode id="test-takeaway-8" data={data} selected={false} />);

      const themedWrapper = screen.getByTestId('themed-block-wrapper');
      expect(themedWrapper).toHaveStyle({ backgroundColor: '#f0f9ff' });
    });
  });

  describe('Icon System', () => {
    it('should render Lightbulb icon by default', () => {
      const data = createMockKeyTakeawayData({ icon: 'Lightbulb' });

      render(<KeyTakeawayBlockNode id="test-takeaway-9" data={data} selected={false} />);

      // Icon is rendered via Lucide React component mock
      expect(screen.getByTestId('lightbulb-icon')).toBeInTheDocument();
    });

    it('should handle different icon types', () => {
      const iconTypes = [
        { icon: 'CheckCircle', testId: 'check-circle-icon' },
        { icon: 'AlertTriangle', testId: 'alert-triangle-icon' },
        { icon: 'Info', testId: 'info-icon' },
        { icon: 'Star', testId: 'star-icon' },
        { icon: 'Zap', testId: 'zap-icon' },
        { icon: 'Target', testId: 'target-icon' },
      ];

      iconTypes.forEach(({ icon, testId }, index) => {
        const data = createMockKeyTakeawayData({ icon });

        const { unmount } = render(
          <KeyTakeawayBlockNode id={`test-takeaway-icon-${index}`} data={data} selected={false} />
        );

        expect(screen.getByTestId(testId)).toBeInTheDocument();
        unmount(); // Clean up for next iteration
      });
    });

    it('should fallback to Lightbulb for unknown icon types', () => {
      const data = createMockKeyTakeawayData({ icon: 'UnknownIcon' });

      render(<KeyTakeawayBlockNode id="test-takeaway-10" data={data} selected={false} />);

      // Should fallback to Lightbulb icon
      expect(screen.getByTestId('lightbulb-icon')).toBeInTheDocument();
    });
  });

  describe('Theme Adaptation', () => {
    it('should apply dark theme text color', () => {
      mockUseEditorStore.mockReturnValue(
        createMockStore({
          canvasTheme: 'dark',
        })
      );

      const data = createMockKeyTakeawayData();

      render(<KeyTakeawayBlockNode id="test-takeaway-11" data={data} selected={false} />);

      const themedWrapper = screen.getByTestId('themed-block-wrapper');
      expect(themedWrapper).toHaveClass('dark:from-blue-950/30', 'dark:to-blue-900/20');
    });

    it('should apply light theme styling by default', () => {
      const data = createMockKeyTakeawayData();

      render(<KeyTakeawayBlockNode id="test-takeaway-12" data={data} selected={false} />);

      const themedWrapper = screen.getByTestId('themed-block-wrapper');
      expect(themedWrapper).toHaveClass('from-blue-50', 'to-blue-100');
    });
  });

  describe('Interaction', () => {
    it('should call selectNode when clicked', () => {
      const mockSelectNode = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore());

      // Mock the getState function to return our mock
      (useEditorStore as any).getState = vi.fn().mockReturnValue({
        selectNode: mockSelectNode,
      });

      const data = createMockKeyTakeawayData();

      const { container } = render(
        <KeyTakeawayBlockNode id="test-takeaway-13" data={data} selected={false} />
      );

      // Click on the div with the click handler
      const clickableDiv = container.querySelector('div[data-node-id="test-takeaway-13"]');
      clickableDiv?.click();

      expect(mockSelectNode).toHaveBeenCalledWith('test-takeaway-13');
    });
  });

  describe('UnifiedNodeResizer Integration', () => {
    it('should render UnifiedNodeResizer with correct props when selected', () => {
      const data = createMockKeyTakeawayData();

      render(<KeyTakeawayBlockNode id="test-takeaway-14" data={data} selected={true} />);

      const resizer = screen.getByTestId('unified-node-resizer');
      expect(resizer).toHaveAttribute('data-visible', 'true');
      expect(resizer).toHaveAttribute('data-node-type', 'keyTakeawayBlock');
    });

    it('should hide resizer when not selected', () => {
      const data = createMockKeyTakeawayData();

      render(<KeyTakeawayBlockNode id="test-takeaway-15" data={data} selected={false} />);

      const resizer = screen.getByTestId('unified-node-resizer');
      expect(resizer).toHaveAttribute('data-visible', 'false');
    });
  });

  describe('Content Handling', () => {
    it('should handle empty content gracefully', () => {
      const data = createMockKeyTakeawayData({ content: '' });

      render(<KeyTakeawayBlockNode id="test-takeaway-16" data={data} selected={false} />);

      expect(screen.getByText('Key Takeaway')).toBeInTheDocument();
      // Empty content should still render the block structure
      const contentArea = screen.getByText('Key Takeaway').parentElement?.parentElement;
      expect(contentArea).toBeInTheDocument();
    });

    it('should handle long content text', () => {
      const longContent =
        "This is a very long key takeaway message that should wrap properly and maintain good readability while demonstrating the component's ability to handle extensive text content without breaking the layout or losing visual hierarchy.";
      const data = createMockKeyTakeawayData({ content: longContent });

      render(<KeyTakeawayBlockNode id="test-takeaway-17" data={data} selected={false} />);

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      const specialContent = 'Special chars: @#$%^&*()_+{}|:"<>?[];\'.,/`~';
      const data = createMockKeyTakeawayData({ content: specialContent });

      render(<KeyTakeawayBlockNode id="test-takeaway-18" data={data} selected={false} />);

      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });
  });
});
