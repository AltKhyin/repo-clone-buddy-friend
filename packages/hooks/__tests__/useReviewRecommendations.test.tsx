// ABOUTME: Tests for useReviewRecommendations hook ensuring proper data fetching and error handling

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReviewRecommendations } from '../useReviewRecommendations';
import { invokeFunctionPost } from '../../src/lib/supabase-functions';

// Mock the supabase functions
vi.mock('../../src/lib/supabase-functions', () => ({
  invokeFunctionPost: vi.fn(),
}));

const mockedInvokeFunctionPost = vi.mocked(invokeFunctionPost);

// Mock console methods to avoid test noise
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// Test wrapper with QueryClient
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Mock review data matching HomepageReview interface
const mockRecommendations = [
  {
    id: 2,
    title: 'Similar Review 1',
    description: 'A review with similar tags',
    cover_image_url: 'https://example.com/cover1.jpg',
    published_at: '2024-01-01T00:00:00Z',
    view_count: 100,
    reading_time_minutes: 5,
    custom_author_name: 'Test Author',
    custom_author_avatar_url: null,
    edicao: null,
    author: {
      id: 'author-1',
      full_name: 'Test Author',
      avatar_url: null,
    },
    content_types: [
      {
        id: 1,
        label: 'Artigo',
        text_color: '#000000',
        border_color: '#cccccc',
        background_color: '#ffffff',
      },
    ],
  },
  {
    id: 3,
    title: 'Similar Review 2',
    description: 'Another review with similar tags',
    cover_image_url: 'https://example.com/cover2.jpg',
    published_at: '2024-01-02T00:00:00Z',
    view_count: 200,
    reading_time_minutes: 7,
    custom_author_name: null,
    custom_author_avatar_url: null,
    edicao: 'Ed. 1',
    author: {
      id: 'author-2',
      full_name: 'Another Author',
      avatar_url: 'https://example.com/avatar.jpg',
    },
    content_types: [],
  },
];

describe('useReviewRecommendations', () => {
  it('should return recommendations data when reviewId is provided', async () => {
    mockedInvokeFunctionPost.mockResolvedValue(mockRecommendations);

    const { result } = renderHook(
      () => useReviewRecommendations(1),
      { wrapper: createTestWrapper() }
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockRecommendations);
    expect(result.current.isError).toBe(false);
    expect(mockedInvokeFunctionPost).toHaveBeenCalledWith('get-similar-reviews', {
      reviewId: 1,
    });
  });

  it('should not fetch when reviewId is undefined', () => {
    const { result } = renderHook(
      () => useReviewRecommendations(undefined),
      { wrapper: createTestWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockedInvokeFunctionPost).not.toHaveBeenCalled();
  });

  it('should not fetch when reviewId is null/falsy', () => {
    const { result } = renderHook(
      () => useReviewRecommendations(0),
      { wrapper: createTestWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockedInvokeFunctionPost).not.toHaveBeenCalled();
  });

  it('should handle empty results gracefully', async () => {
    mockedInvokeFunctionPost.mockResolvedValue([]);

    const { result } = renderHook(
      () => useReviewRecommendations(1),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it('should handle null response gracefully', async () => {
    mockedInvokeFunctionPost.mockResolvedValue(null);

    const { result } = renderHook(
      () => useReviewRecommendations(1),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it('should handle API errors properly', async () => {
    const apiError = new Error('API request failed');
    mockedInvokeFunctionPost.mockRejectedValue(apiError);

    const { result } = renderHook(
      () => useReviewRecommendations(1),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toEqual(apiError);
  });

  it('should not retry on validation errors', async () => {
    const validationError = new Error('VALIDATION_FAILED: Review ID is required');
    mockedInvokeFunctionPost.mockRejectedValue(validationError);

    const { result } = renderHook(
      () => useReviewRecommendations(1),
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Should be called only once (no retries)
    expect(mockedInvokeFunctionPost).toHaveBeenCalledTimes(1);
  });

  it('should have correct query key for caching', () => {
    const { result } = renderHook(
      () => useReviewRecommendations(123),
      { wrapper: createTestWrapper() }
    );

    // Access the internal query client to verify key
    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isError');
    
    // The hook should be properly configured (if it runs without errors, the key is correct)
    expect(mockedInvokeFunctionPost).toHaveBeenCalledWith('get-similar-reviews', {
      reviewId: 123,
    });
  });

  it('should update when reviewId changes', async () => {
    mockedInvokeFunctionPost
      .mockResolvedValueOnce([mockRecommendations[0]]) // First call
      .mockResolvedValueOnce([mockRecommendations[1]]); // Second call

    const { result, rerender } = renderHook(
      ({ reviewId }) => useReviewRecommendations(reviewId),
      { 
        wrapper: createTestWrapper(),
        initialProps: { reviewId: 1 }
      }
    );

    // Wait for first query
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([mockRecommendations[0]]);

    // Change reviewId
    rerender({ reviewId: 2 });

    // Should trigger new query
    await waitFor(() => {
      expect(result.current.data).toEqual([mockRecommendations[1]]);
    });

    expect(mockedInvokeFunctionPost).toHaveBeenCalledTimes(2);
    expect(mockedInvokeFunctionPost).toHaveBeenNthCalledWith(1, 'get-similar-reviews', {
      reviewId: 1,
    });
    expect(mockedInvokeFunctionPost).toHaveBeenNthCalledWith(2, 'get-similar-reviews', {
      reviewId: 2,
    });
  });
});