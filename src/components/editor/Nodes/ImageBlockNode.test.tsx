// ABOUTME: Comprehensive test suite for ImageBlockNode with WebP optimization and responsive features

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageBlockNode } from './ImageBlockNode';
import { useEditorStore } from '@/store/editorStore';

// Mock the editorStore
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn()
}));

// Mock React Flow components
vi.mock('@xyflow/react', () => ({
  Handle: ({ children, ...props }: any) => <div data-testid="react-flow-handle" {...props}>{children}</div>,
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right'
  }
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  ImageIcon: ({ size }: any) => <div data-testid="image-icon" data-size={size} />,
  ImageOff: ({ size }: any) => <div data-testid="image-off-icon" data-size={size} />
}));

const mockUseEditorStore = useEditorStore as any;

const createMockImageData = (overrides = {}) => ({
  src: 'https://example.com/image.jpg',
  alt: 'Test image',
  caption: 'Test caption',
  borderRadius: 6,
  width: 500,
  height: 300,
  paddingX: 16,
  paddingY: 16,
  backgroundColor: 'transparent',
  borderWidth: 0,
  borderColor: '#e5e7eb',
  ...overrides
});

const createMockStore = (overrides = {}) => ({
  updateNode: vi.fn(),
  canvasTheme: 'light',
  ...overrides
});

const createMockProps = (dataOverrides = {}, propsOverrides = {}) => ({
  id: 'image-1',
  data: createMockImageData(dataOverrides),
  selected: false,
  ...propsOverrides
});

describe('ImageBlockNode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering States', () => {
    it('should render image when src is provided', async () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ src: 'https://example.com/test.jpg' });

      render(<ImageBlockNode {...props} />);

      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/test.jpg');
      expect(image).toHaveAttribute('alt', 'Test image');
    });

    it('should render empty state when no src is provided', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ src: '' });

      render(<ImageBlockNode {...props} />);

      expect(screen.getByText('No image selected')).toBeInTheDocument();
      expect(screen.getByText('Select this block and add an image URL in the inspector')).toBeInTheDocument();
      expect(screen.getByTestId('image-icon')).toBeInTheDocument();
    });

    it('should render loading state initially', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps();

      render(<ImageBlockNode {...props} />);

      // Should show loading state with image icon
      expect(screen.getByTestId('image-icon')).toBeInTheDocument();
    });

    it('should render error state when image fails to load', async () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ src: 'https://invalid-url.com/nonexistent.jpg' });

      render(<ImageBlockNode {...props} />);

      const image = screen.getByRole('img');
      fireEvent.error(image);

      await waitFor(() => {
        expect(screen.getByText('Failed to load image')).toBeInTheDocument();
        expect(screen.getByText('Check the URL and try again')).toBeInTheDocument();
        expect(screen.getByTestId('image-off-icon')).toBeInTheDocument();
      });
    });

    it('should render caption when provided', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ caption: 'This is a test caption' });

      render(<ImageBlockNode {...props} />);

      expect(screen.getByText('This is a test caption')).toBeInTheDocument();
    });

    it('should not render caption when not provided', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ caption: '' });

      render(<ImageBlockNode {...props} />);

      expect(screen.queryByText(/caption/i)).not.toBeInTheDocument();
    });
  });

  describe('WebP Optimization', () => {
    it('should convert imgur URLs to WebP format', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ src: 'https://i.imgur.com/test.jpg' });

      render(<ImageBlockNode {...props} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'https://i.imgur.com/test.webp');
    });

    it('should add WebP format parameter to Unsplash URLs', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ src: 'https://unsplash.com/photos/test.jpg' });

      render(<ImageBlockNode {...props} />);

      const image = screen.getByRole('img');
      const srcAttribute = image.getAttribute('src');
      expect(srcAttribute).toContain('fm=webp');
      expect(srcAttribute).toContain('q=80');
    });

    it('should not modify already WebP URLs', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const originalUrl = 'https://example.com/image.webp';
      const props = createMockProps({ src: originalUrl });

      render(<ImageBlockNode {...props} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', originalUrl);
    });

    it('should handle invalid URLs gracefully', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const invalidUrl = 'not-a-valid-url';
      const props = createMockProps({ src: invalidUrl });

      render(<ImageBlockNode {...props} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', invalidUrl);
    });

    it('should provide fallback image when WebP fails', async () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const originalUrl = 'https://i.imgur.com/test.jpg';
      const props = createMockProps({ src: originalUrl });

      render(<ImageBlockNode {...props} />);

      // First image should be WebP version
      const webpImage = screen.getByRole('img');
      expect(webpImage).toHaveAttribute('src', 'https://i.imgur.com/test.webp');

      // Simulate WebP load failure
      fireEvent.error(webpImage);

      await waitFor(() => {
        // Should still have the original image as fallback (though hidden initially)
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Styling and Theming', () => {
    it('should apply light theme styles by default', () => {
      mockUseEditorStore.mockReturnValue(createMockStore({ canvasTheme: 'light' }));
      const props = createMockProps();

      render(<ImageBlockNode {...props} />);

      const container = screen.getByTestId('image-block-container');
      expect(container).toHaveClass('bg-white', 'border-gray-200');
    });

    it('should apply dark theme styles when theme is dark', () => {
      mockUseEditorStore.mockReturnValue(createMockStore({ canvasTheme: 'dark' }));
      const props = createMockProps();

      render(<ImageBlockNode {...props} />);

      const container = screen.getByTestId('image-block-container');
      expect(container).toHaveClass('bg-gray-800', 'border-gray-600');
    });

    it('should apply selected styles when selected prop is true', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({}, { selected: true });

      render(<ImageBlockNode {...props} />);

      const container = screen.getByTestId('image-block-container');
      expect(container).toHaveClass('border-blue-500', 'shadow-lg');
    });

    it('should apply custom padding from data', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ paddingX: 20, paddingY: 24 });

      render(<ImageBlockNode {...props} />);

      const container = screen.getByTestId('image-block-container');
      expect(container).toHaveStyle({ padding: '24px 20px' });
    });

    it('should apply custom border when borderWidth > 0', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ 
        borderWidth: 2, 
        borderColor: '#ff0000' 
      });

      render(<ImageBlockNode {...props} />);

      const container = screen.getByTestId('image-block-container');
      expect(container).toHaveStyle({ 
        borderWidth: '2px',
        borderColor: '#ff0000',
        borderStyle: 'solid'
      });
    });

    it('should hide border when borderWidth is 0', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ borderWidth: 0 });

      render(<ImageBlockNode {...props} />);

      const container = screen.getByTestId('image-block-container');
      expect(container).toHaveStyle({ borderStyle: 'none' });
    });

    it('should apply custom background color', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ backgroundColor: '#f0f0f0' });

      render(<ImageBlockNode {...props} />);

      const container = screen.getByTestId('image-block-container');
      expect(container).toHaveStyle({ backgroundColor: '#f0f0f0' });
    });

    it('should not apply background when set to transparent', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ backgroundColor: 'transparent' });

      render(<ImageBlockNode {...props} />);

      const container = screen.getByTestId('image-block-container');
      expect(container).not.toHaveStyle({ backgroundColor: 'transparent' });
    });
  });

  describe('Responsive Sizing', () => {
    it('should apply custom width and height when specified', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ width: 600, height: 400 });

      render(<ImageBlockNode {...props} />);

      const image = screen.getByRole('img');
      expect(image).toHaveStyle({ 
        width: '600px',
        height: '400px'
      });
    });

    it('should use auto sizing when dimensions not specified', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ width: undefined, height: undefined });

      render(<ImageBlockNode {...props} />);

      const image = screen.getByRole('img');
      expect(image).toHaveStyle({ 
        width: '100%',
        height: 'auto'
      });
    });

    it('should apply border radius to image', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ borderRadius: 12 });

      render(<ImageBlockNode {...props} />);

      const image = screen.getByRole('img');
      expect(image).toHaveStyle({ borderRadius: '12px' });
    });

    it('should constrain max width based on data.width', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ width: 400 });

      render(<ImageBlockNode {...props} />);

      const container = screen.getByTestId('image-block-container');
      expect(container).toHaveClass('max-w-[400px]');
    });
  });

  describe('User Interactions', () => {
    it('should call updateNode when image is clicked', async () => {
      const updateNodeMock = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode: updateNodeMock }));
      const props = createMockProps();

      const user = userEvent.setup();
      render(<ImageBlockNode {...props} />);

      const container = screen.getByTestId('image-block-container');
      await user.click(container!);

      expect(updateNodeMock).toHaveBeenCalledWith('image-1', {});
    });

    it('should handle image load event', async () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps();

      render(<ImageBlockNode {...props} />);

      const image = screen.getByRole('img');
      fireEvent.load(image);

      await waitFor(() => {
        // Image should be visible after loading
        expect(image).toHaveClass('opacity-100');
      });
    });

    it('should handle image error gracefully', async () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps();

      render(<ImageBlockNode {...props} />);

      const image = screen.getByRole('img');
      fireEvent.error(image);

      await waitFor(() => {
        expect(screen.getByTestId('image-off-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should include alt text in image element', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ alt: 'Descriptive alt text' });

      render(<ImageBlockNode {...props} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Descriptive alt text');
    });

    it('should have screen reader accessible label when alt text is provided', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ alt: 'Test image description' });

      render(<ImageBlockNode {...props} />);

      expect(screen.getByText('Image: Test image description')).toHaveClass('sr-only');
    });

    it('should have empty alt when no alt text provided', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ alt: '' });

      render(<ImageBlockNode {...props} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', '');
    });

    it('should have proper loading attribute for performance', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps();

      render(<ImageBlockNode {...props} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('loading', 'lazy');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing data properties gracefully', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = {
        id: 'image-1',
        data: { src: 'test.jpg', alt: 'test' },
        selected: false
      };

      expect(() => render(<ImageBlockNode {...props} />)).not.toThrow();
    });

    it('should handle empty image source', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const props = createMockProps({ src: '' });

      render(<ImageBlockNode {...props} />);

      expect(screen.getByText('No image selected')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should handle very long URLs', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const longUrl = 'https://example.com/' + 'a'.repeat(500) + '.jpg';
      const props = createMockProps({ src: longUrl });

      expect(() => render(<ImageBlockNode {...props} />)).not.toThrow();
    });

    it('should handle special characters in alt text', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      const specialAlt = 'Image with "quotes" & <tags> and émojis 🎨';
      const props = createMockProps({ alt: specialAlt });

      render(<ImageBlockNode {...props} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', specialAlt);
    });
  });
});