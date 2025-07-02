// ABOUTME: Simple test for CoverImageUpload to debug timeout issues
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
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

describe('CoverImageUpload - Simple', () => {
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

  describe('Basic Rendering', () => {
    it('should render upload area', () => {
      renderWithProviders(<CoverImageUpload {...defaultProps} />);

      expect(screen.getByText('Upload Cover Image')).toBeInTheDocument();
    });

    it('should show existing image when provided', () => {
      renderWithProviders(
        <CoverImageUpload {...defaultProps} currentImageUrl="https://example.com/existing.jpg" />
      );

      expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/existing.jpg');
    });
  });
});
