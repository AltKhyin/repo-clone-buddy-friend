// ABOUTME: Tests for useConsolidatedHomepageFeedQuery hook ensuring proper data fetching and error handling

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery, mockQuerySuccess, mockQueryError } from '../../src/test-utils';
import { useConsolidatedHomepageFeedQuery } from './useHomepageFeedQuery';
import { createMockHomepageData } from '../../src/test-utils/test-data-factories';

// Mock the supabase functions
vi.mock('../../src/lib/supabase-functions', () => ({
  invokeFunctionGet: vi.fn(),
}));

describe('useConsolidatedHomepageFeedQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading state initially', () => {
    const { result } = renderHookWithQuery(() => useConsolidatedHomepageFeedQuery());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isError).toBe(false);
  });

  it('should fetch consolidated homepage data successfully', async () => {
    const mockData = createMockHomepageData();
    const { invokeFunctionGet } = await import('../../src/lib/supabase-functions');
    
    vi.mocked(invokeFunctionGet).mockResolvedValue(mockData);

    const { result } = renderHookWithQuery(() => useConsolidatedHomepageFeedQuery());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(invokeFunctionGet).toHaveBeenCalledWith('get-homepage-feed');
  });

  it('should handle network errors gracefully', async () => {
    const networkError = new Error('Network error occurred');
    const { invokeFunctionGet } = await import('../../src/lib/supabase-functions');
    
    vi.mocked(invokeFunctionGet).mockRejectedValue(networkError);

    const { result } = renderHookWithQuery(() => useConsolidatedHomepageFeedQuery());

    // Wait longer for retries to complete and final error state
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    }, { timeout: 5000 });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toEqual(networkError);
    expect(result.current.isLoading).toBe(false);
  });

  it('should have proper query key for caching', () => {
    const { result } = renderHookWithQuery(() => useConsolidatedHomepageFeedQuery());

    expect(result.current).toBeValidQueryResult();
  });

  it('should use correct stale time configuration', async () => {
    const mockData = createMockHomepageData();
    const { invokeFunctionGet } = await import('../../src/lib/supabase-functions');
    
    vi.mocked(invokeFunctionGet).mockResolvedValue(mockData);

    const { result, queryClient } = renderHookWithQuery(() => useConsolidatedHomepageFeedQuery());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check that the query has the correct configuration
    const query = queryClient.getQueryCache().find({
      queryKey: ['consolidated-homepage-feed'],
    });

    expect(query?.options.staleTime).toBe(5 * 60 * 1000); // 5 minutes
    expect(query?.options.gcTime).toBe(10 * 60 * 1000); // 10 minutes
  });

  it('should handle empty data gracefully', async () => {
    const emptyData = createMockHomepageData({
      featured: null,
      recent: [],
      popular: [],
      recommendations: [],
      suggestions: [],
    });
    
    const { invokeFunctionGet } = await import('../../src/lib/supabase-functions');
    vi.mocked(invokeFunctionGet).mockResolvedValue(emptyData);

    const { result } = renderHookWithQuery(() => useConsolidatedHomepageFeedQuery());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(emptyData);
    expect(result.current.data?.featured).toBeNull();
    expect(result.current.data?.recent).toHaveLength(0);
  });

  it('should retry failed requests according to configuration', async () => {
    const { invokeFunctionGet } = await import('../../src/lib/supabase-functions');
    
    // First call fails, second succeeds
    vi.mocked(invokeFunctionGet)
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockResolvedValueOnce(createMockHomepageData());

    const { result } = renderHookWithQuery(() => useConsolidatedHomepageFeedQuery());

    // Wait longer for retry logic to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    }, { timeout: 5000 });

    // Should have been called twice (initial + 1 retry)
    expect(invokeFunctionGet).toHaveBeenCalledTimes(2);
  });

  it('should handle malformed response data', async () => {
    const malformedData = { invalid: 'response' };
    const { invokeFunctionGet } = await import('../../src/lib/supabase-functions');
    
    vi.mocked(invokeFunctionGet).mockResolvedValue(malformedData);

    const { result } = renderHookWithQuery(() => useConsolidatedHomepageFeedQuery());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should still return the data as received, but components should handle gracefully
    expect(result.current.data).toEqual(malformedData);
  });

  it('should refetch data when refetch is called', async () => {
    const initialData = createMockHomepageData({ notificationCount: 0 });
    const updatedData = createMockHomepageData({ notificationCount: 5 });
    
    const { invokeFunctionGet } = await import('../../src/lib/supabase-functions');
    
    vi.mocked(invokeFunctionGet)
      .mockResolvedValueOnce(initialData)
      .mockResolvedValueOnce(updatedData);

    const { result } = renderHookWithQuery(() => useConsolidatedHomepageFeedQuery());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.notificationCount).toBe(0);

    // Trigger refetch
    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.data?.notificationCount).toBe(5);
    });

    expect(invokeFunctionGet).toHaveBeenCalledTimes(2);
  });
});