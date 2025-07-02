// ABOUTME: Tests for CoverImageUpload component ensuring proper file handling and Supabase Storage integration
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
import { CoverImageUpload } from './CoverImageUpload';

// Mock Supabase Storage
const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
    },
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        remove: mockRemove,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  },
}));

describe('CoverImageUpload', () => {
  const defaultProps = {
    reviewId: 123,
    currentImageUrl: null,
    onImageChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup auth mock
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    });

    // Setup storage mocks
    mockUpload.mockResolvedValue({ data: { path: 'test-path.jpg' }, error: null });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/test-path.jpg' },
    });
    mockRemove.mockResolvedValue({ error: null });
  });

  describe('Rendering', () => {
    it('should render upload area when no image is provided', () => {
      renderWithProviders(<CoverImageUpload {...defaultProps} />);

      expect(screen.getByText('Upload Cover Image')).toBeInTheDocument();
      expect(screen.getByText(/Drag and drop an image here/)).toBeInTheDocument();
      expect(screen.getByText(/Supports JPEG, PNG, WebP, GIF/)).toBeInTheDocument();
    });

    it('should render current image when provided', () => {
      renderWithProviders(
        <CoverImageUpload {...defaultProps} currentImageUrl="https://example.com/existing.jpg" />
      );

      expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/existing.jpg');
      expect(screen.getByText('Change Image')).toBeInTheDocument();
      expect(screen.getByText('Remove Image')).toBeInTheDocument();
    });

    it('should show loading state during upload', async () => {
      // Make upload promise resolve slowly
      mockUpload.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(<CoverImageUpload {...defaultProps} />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByLabelText(/upload cover image/i);

      await userEvent.upload(input, file);

      expect(screen.getByText('Uploading...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    it('should handle successful file upload', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoverImageUpload {...defaultProps} />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByLabelText(/upload cover image/i);

      await user.upload(input, file);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(
          expect.stringContaining('123/'),
          file,
          expect.objectContaining({
            cacheControl: '3600',
            upsert: true,
          })
        );
      });

      expect(defaultProps.onImageChange).toHaveBeenCalledWith('https://example.com/test-path.jpg');
    });

    it('should validate file type', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoverImageUpload {...defaultProps} />);

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = screen.getByLabelText(/upload cover image/i);

      await user.upload(input, file);

      expect(screen.getByText(/Please select a valid image file/)).toBeInTheDocument();
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('should validate file size (max 10MB)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoverImageUpload {...defaultProps} />);

      // Create a file larger than 10MB
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const input = screen.getByLabelText(/upload cover image/i);

      await user.upload(input, largeFile);

      expect(screen.getByText(/File size must be less than 10MB/)).toBeInTheDocument();
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('should handle upload errors gracefully', async () => {
      mockUpload.mockResolvedValueOnce({
        data: null,
        error: { message: 'Upload failed' },
      });

      const user = userEvent.setup();
      renderWithProviders(<CoverImageUpload {...defaultProps} />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByLabelText(/upload cover image/i);

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/Failed to upload image/)).toBeInTheDocument();
      });
    });
  });

  describe('Image Management', () => {
    it('should remove existing image', async () => {
      mockRemove.mockResolvedValueOnce({ error: null });

      const user = userEvent.setup();
      renderWithProviders(
        <CoverImageUpload {...defaultProps} currentImageUrl="https://example.com/existing.jpg" />
      );

      const removeButton = screen.getByText('Remove Image');
      await user.click(removeButton);

      expect(mockRemove).toHaveBeenCalled();
      expect(defaultProps.onImageChange).toHaveBeenCalledWith(null);
    });

    it('should handle drag and drop upload', async () => {
      renderWithProviders(<CoverImageUpload {...defaultProps} />);

      const dropzone = screen.getByText(/Drag and drop an image here/);
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await userEvent.upload(dropzone, file);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should be accessible', () => {
      renderWithProviders(<CoverImageUpload {...defaultProps} />);

      const uploadArea = screen.getByLabelText(/upload cover image/i);
      expect(uploadArea).toBeAccessible();
    });

    it('should have proper ARIA labels', () => {
      renderWithProviders(<CoverImageUpload {...defaultProps} />);

      expect(screen.getByLabelText(/upload cover image/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('should show proper loading state styling', async () => {
      mockUpload.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(<CoverImageUpload {...defaultProps} />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByLabelText(/upload cover image/i);

      await userEvent.upload(input, file);

      const loadingContainer = screen.getByTestId('upload-loading');
      expect(loadingContainer).toBeInLoadingState();
    });

    it('should show error state styling', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoverImageUpload {...defaultProps} />);

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = screen.getByLabelText(/upload cover image/i);

      await user.upload(input, file);

      const errorMessage = screen.getByText(/Please select a valid image file/);
      expect(errorMessage.parentElement).toBeInErrorState();
    });

    it('should be responsive', () => {
      renderWithProviders(<CoverImageUpload {...defaultProps} />);

      const uploadContainer = screen.getByTestId('cover-image-upload');
      expect(uploadContainer).toBeResponsive();
    });
  });
});
