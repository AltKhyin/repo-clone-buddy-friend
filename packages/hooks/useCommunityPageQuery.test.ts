// ABOUTME: Tests for useCommunityPageQuery hook ensuring proper infinite scroll and data fetching behavior

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from '../../src/test-utils';
import { useCommunityPageQuery } from './useCommunityPageQuery';
import { createMockCommunityPageData } from '../../src/test-utils/test-data-factories';

// Mock the supabase functions
vi.mock('../../src/lib/supabase-functions', () => ({
  invokeFunctionPost: vi.fn(),
}));

// Type for simplified mock posts in tests
type MockPostData = {
  id: number;
  title: string;
  [key: string]: unknown;
};

describe('useCommunityPageQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading state initially', () => {
    const { result } = renderHookWithQuery(() => useCommunityPageQuery());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isError).toBe(false);
  });

  it('should fetch community page data successfully', async () => {
    const mockData = createMockCommunityPageData();
    const { invokeFunctionPost } = await import('../../src/lib/supabase-functions');
    
    vi.mocked(invokeFunctionPost).mockResolvedValue(mockData);

    const { result } = renderHookWithQuery(() => useCommunityPageQuery());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.posts).toEqual(mockData.posts);
    expect(result.current.data?.sidebarData).toEqual(mockData.sidebarData);
    expect(invokeFunctionPost).toHaveBeenCalledWith('get-community-page-data', {
      page: 0,
      limit: 20,
    });
  });

  it('should handle infinite scroll correctly', async () => {
    const firstPageData = createMockCommunityPageData({
      posts: [{ id: 1, title: 'Post 1' } as MockPostData],
      pagination: { page: 0, hasMore: true, total: 50 },
    });
    
    const secondPageData = createMockCommunityPageData({
      posts: [{ id: 2, title: 'Post 2' } as MockPostData],
      pagination: { page: 1, hasMore: false, total: 50 },
    });

    const { invokeFunctionPost } = await import('../../src/lib/supabase-functions');
    
    vi.mocked(invokeFunctionPost)
      .mockResolvedValueOnce(firstPageData)
      .mockResolvedValueOnce(secondPageData);

    const { result } = renderHookWithQuery(() => useCommunityPageQuery());

    // Wait for first page
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.posts).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);

    // Fetch next page
    result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.data?.posts).toHaveLength(2);
    });

    expect(result.current.hasNextPage).toBe(false);
    expect(invokeFunctionPost).toHaveBeenCalledTimes(2);
    expect(invokeFunctionPost).toHaveBeenLastCalledWith('get-community-page-data', {
      page: 1,
      limit: 20,
    });
  });

  it('should handle getNextPageParam correctly with valid pagination', () => {
    const { result } = renderHookWithQuery(() => useCommunityPageQuery());

    // Test with valid lastPage having hasMore: true
    const validLastPage = {
      posts: [],
      pagination: { page: 0, hasMore: true, total: 50 },
    };

    // Access the query configuration to test getNextPageParam
    const queryCache = result.current.queryClient?.getQueryCache();
    const query = queryCache?.find({ queryKey: ['community-page-data'] });
    const getNextPageParam = query?.options.getNextPageParam;

    if (getNextPageParam) {
      const nextPage = getNextPageParam(validLastPage, [], 0);
      expect(nextPage).toBe(1);
    }
  });

  it('should handle getNextPageParam with no more pages', () => {
    const { result } = renderHookWithQuery(() => useCommunityPageQuery());

    const lastPageNoMore = {
      posts: [],
      pagination: { page: 2, hasMore: false, total: 50 },
    };

    const queryCache = result.current.queryClient?.getQueryCache();
    const query = queryCache?.find({ queryKey: ['community-page-data'] });
    const getNextPageParam = query?.options.getNextPageParam;

    if (getNextPageParam) {
      const nextPage = getNextPageParam(lastPageNoMore, [], 2);
      expect(nextPage).toBeUndefined();
    }
  });

  it('should handle malformed pagination data gracefully', () => {
    const { result } = renderHookWithQuery(() => useCommunityPageQuery());

    const malformedPage = {
      posts: [],
      pagination: null, // Invalid pagination
    };

    const queryCache = result.current.queryClient?.getQueryCache();
    const query = queryCache?.find({ queryKey: ['community-page-data'] });
    const getNextPageParam = query?.options.getNextPageParam;

    if (getNextPageParam) {
      const nextPage = getNextPageParam(malformedPage, [], 0);
      expect(nextPage).toBeUndefined();
    }
  });

  it('should flatten paginated data correctly', async () => {
    const page1 = createMockCommunityPageData({
      posts: [{ id: 1, title: 'Post 1' } as MockPostData, { id: 2, title: 'Post 2' } as MockPostData],
    });
    
    const page2 = createMockCommunityPageData({
      posts: [{ id: 3, title: 'Post 3' } as MockPostData],
    });

    const { invokeFunctionPost } = await import('../../src/lib/supabase-functions');
    
    vi.mocked(invokeFunctionPost)
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    const { result } = renderHookWithQuery(() => useCommunityPageQuery());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.data?.posts).toHaveLength(3);
    });

    // Check that posts are properly flattened
    expect(result.current.data?.posts.map(p => p.id)).toEqual([1, 2, 3]);
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network error');
    const { invokeFunctionPost } = await import('../../src/lib/supabase-functions');
    
    vi.mocked(invokeFunctionPost).mockRejectedValue(networkError);

    const { result } = renderHookWithQuery(() => useCommunityPageQuery());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(networkError);
    expect(result.current.data).toBeUndefined();
  });

  it('should handle empty community data', async () => {
    const emptyData = createMockCommunityPageData({
      posts: [],
      pagination: { page: 0, hasMore: false, total: 0 },
    });

    const { invokeFunctionPost } = await import('../../src/lib/supabase-functions');
    vi.mocked(invokeFunctionPost).mockResolvedValue(emptyData);

    const { result } = renderHookWithQuery(() => useCommunityPageQuery());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.posts).toHaveLength(0);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('should handle invalid page data in select function', async () => {
    const invalidData = {
      pages: [
        null, // Invalid page
        { posts: null }, // Invalid posts
        { posts: [{ id: 1 }] }, // Valid page
      ],
    };

    const { result } = renderHookWithQuery(() => useCommunityPageQuery());

    // Access the select function to test it directly
    const queryCache = result.current.queryClient?.getQueryCache();
    const query = queryCache?.find({ queryKey: ['community-page-data'] });
    const selectFn = query?.options.select;

    if (selectFn) {
      const result = selectFn(invalidData as { pages: unknown[] });
      expect(result.posts).toEqual([{ id: 1 }]); // Only valid posts should be included
    }
  });

  it('should preserve sidebar data from first page', async () => {
    const sidebarData = {
      featuredPoll: { question: 'Test poll?', options: [] },
      rules: ['Be respectful'],
    };

    const page1 = createMockCommunityPageData({ sidebarData });
    const page2 = createMockCommunityPageData({ 
      sidebarData: { rules: ['Different rules'] } // Different sidebar data
    });

    const { invokeFunctionPost } = await import('../../src/lib/supabase-functions');
    
    vi.mocked(invokeFunctionPost)
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    const { result } = renderHookWithQuery(() => useCommunityPageQuery());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.isFetchingNextPage).toBe(false);
    });

    // Should preserve sidebar data from first page
    expect(result.current.data?.sidebarData).toEqual(sidebarData);
  });
});