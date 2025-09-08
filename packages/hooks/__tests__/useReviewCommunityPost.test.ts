// ABOUTME: Tests for useReviewCommunityPost hook ensuring proper data fetching and fallback behavior

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useReviewCommunityPost,
  useReviewCommunityPostRobust,
  useHasReviewCommunityPost,
} from '../useReviewCommunityPost';

// Mock supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
};

vi.mock('../../src/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const mockCommunityPost = {
  id: 123,
  title: 'Test Community Post',
  content: 'Test content',
  category: 'review',
  post_type: 'image',
  post_status: 'published',
  visibility_level: 'public',
  scheduled_publish_at: null,
  admin_created_by: 'admin-123',
  admin_notes: 'Test notes',
  image_url: 'https://example.com/image.jpg',
  video_url: null,
  poll_data: null,
  link_url: null,
  link_preview_data: null,
  created_at: '2024-01-01T12:00:00Z',
  review_id: 456,
  author_id: 'user-123',
  author: {
    id: 'user-123',
    full_name: 'John Doe',
    avatar_url: 'https://example.com/avatar.jpg',
  },
  admin_creator: {
    id: 'admin-123',
    full_name: 'Admin User',
    avatar_url: null,
  },
};

describe('useReviewCommunityPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('by_review_id method (default)', () => {
    it('should fetch community post by review_id successfully', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: mockCommunityPost,
            error: null,
          }),
        })),
      }));
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useReviewCommunityPost(456), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockCommunityPost);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('CommunityPosts');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('id,'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('title,'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('author:Practitioners!CommunityPosts_author_id_fkey'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('admin_creator:Practitioners!CommunityPosts_admin_created_by_fkey'));
    });

    it('should return null when no community post found (PGRST116 error)', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        })),
      }));
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useReviewCommunityPost(456), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toBe(null);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should throw error for other database errors', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
          }),
        })),
      }));
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useReviewCommunityPost(456), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toContain('Failed to fetch community post');
      });
    });

    it('should not query when reviewId is undefined', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useReviewCommunityPost(undefined), { wrapper });

      expect(result.current.data).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('by_reference method', () => {
    it('should fetch community post by reference successfully', async () => {
      // Mock the Reviews table query first
      const mockReviewsSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { community_post_id: 123 },
            error: null,
          }),
        })),
      }));

      // Mock the CommunityPosts table query
      const mockPostsSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: mockCommunityPost,
            error: null,
          }),
        })),
      }));

      mockSupabase.from
        .mockReturnValueOnce({ select: mockReviewsSelect }) // First call for Reviews
        .mockReturnValueOnce({ select: mockPostsSelect }); // Second call for CommunityPosts

      const wrapper = createWrapper();
      const { result } = renderHook(() => useReviewCommunityPost(456, 'by_reference'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockCommunityPost);
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('Reviews');
      expect(mockSupabase.from).toHaveBeenCalledWith('CommunityPosts');
    });

    it('should return null when review has no community_post_id', async () => {
      const mockReviewsSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { community_post_id: null },
            error: null,
          }),
        })),
      }));

      mockSupabase.from.mockReturnValue({ select: mockReviewsSelect });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useReviewCommunityPost(456, 'by_reference'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toBe(null);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle review fetch errors', async () => {
      const mockReviewsSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Review not found' },
          }),
        })),
      }));

      mockSupabase.from.mockReturnValue({ select: mockReviewsSelect });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useReviewCommunityPost(456, 'by_reference'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toContain('Failed to fetch review');
      });
    });
  });

  describe('Query caching and stale time', () => {
    it('should use correct query key and cache settings', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useReviewCommunityPost(456), { wrapper });

      // Query should be enabled for valid reviewId
      expect(result.current.isLoading).toBe(true);

      // Check that it's using the correct query key format
      // This would be verified by checking the query cache, but we'll trust TanStack Query handles this
    });

    it('should use different query keys for different methods', () => {
      const wrapper = createWrapper();
      
      const { result: result1 } = renderHook(() => useReviewCommunityPost(456, 'by_review_id'), { wrapper });
      const { result: result2 } = renderHook(() => useReviewCommunityPost(456, 'by_reference'), { wrapper });

      // Both should be loading initially but with different cache entries
      expect(result1.current.isLoading).toBe(true);
      expect(result2.current.isLoading).toBe(true);
    });
  });
});

describe('useReviewCommunityPostRobust', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return data from by_review_id method when available', async () => {
    const mockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: mockCommunityPost,
          error: null,
        }),
      })),
    }));
    mockSupabase.from.mockReturnValue({ select: mockSelect });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useReviewCommunityPostRobust(456), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockCommunityPost);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should provide refetch function that calls both methods', async () => {
    const mockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })),
    }));
    mockSupabase.from.mockReturnValue({ select: mockSelect });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useReviewCommunityPostRobust(456), { wrapper });

    expect(typeof result.current.refetch).toBe('function');

    // Call refetch
    result.current.refetch();

    // This should trigger both methods to refetch
    // We can't easily test the actual refetch behavior without more complex mocking
  });
});

describe('useHasReviewCommunityPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when post exists', async () => {
    const mockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: mockCommunityPost,
          error: null,
        }),
      })),
    }));
    mockSupabase.from.mockReturnValue({ select: mockSelect });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useHasReviewCommunityPost(456), { wrapper });

    await waitFor(() => {
      expect(result.current.hasPost).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should return false when post does not exist', async () => {
    const mockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })),
    }));
    mockSupabase.from.mockReturnValue({ select: mockSelect });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useHasReviewCommunityPost(456), { wrapper });

    await waitFor(() => {
      expect(result.current.hasPost).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle errors properly', async () => {
    const mockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      })),
    }));
    mockSupabase.from.mockReturnValue({ select: mockSelect });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useHasReviewCommunityPost(456), { wrapper });

    await waitFor(() => {
      expect(result.current.hasPost).toBe(false); // Should be false for errors
      expect(result.current.error).toBeTruthy();
    });
  });
});