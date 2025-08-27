// ABOUTME: Tests for featured review mutation hook with admin authentication

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useSetFeaturedReviewMutation } from '../useSetFeaturedReviewMutation';

// Mock the supabase functions helper
const mockInvokeFunctionPost = vi.fn();
vi.mock('../../src/lib/supabase-functions', () => ({
  invokeFunctionPost: mockInvokeFunctionPost,
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useSetFeaturedReviewMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful featured review setting', () => {
    it('should call admin-set-featured-review endpoint with correct data', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSetFeaturedReviewMutation(), { wrapper });

      const mockResponse = {
        success: true,
        data: {
          message: 'Featured review updated successfully',
          reviewId: 42,
          reviewTitle: 'Test Review Title',
        },
      };

      mockInvokeFunctionPost.mockResolvedValue(mockResponse);

      await result.current.mutateAsync({ reviewId: 42 });

      expect(mockInvokeFunctionPost).toHaveBeenCalledWith('admin-set-featured-review', {
        reviewId: 42,
      });
    });

    it('should return the response data on success', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSetFeaturedReviewMutation(), { wrapper });

      const mockResponse = {
        success: true,
        data: {
          message: 'Featured review updated successfully',
          reviewId: 42,
          reviewTitle: 'Test Review Title',
        },
      };

      mockInvokeFunctionPost.mockResolvedValue(mockResponse);

      const response = await result.current.mutateAsync({ reviewId: 42 });

      expect(response).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should throw error when endpoint fails', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSetFeaturedReviewMutation(), { wrapper });

      const mockError = new Error('Admin access required');
      mockInvokeFunctionPost.mockRejectedValue(mockError);

      await expect(
        result.current.mutateAsync({ reviewId: 42 })
      ).rejects.toThrow('Admin access required');
    });

    it('should throw generic error for unknown error types', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSetFeaturedReviewMutation(), { wrapper });

      mockInvokeFunctionPost.mockRejectedValue('Unknown error');

      await expect(
        result.current.mutateAsync({ reviewId: 42 })
      ).rejects.toThrow('Failed to set featured review');
    });

    it('should not retry on authorization errors', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSetFeaturedReviewMutation(), { wrapper });

      const authError = new Error('Admin access required');
      mockInvokeFunctionPost.mockRejectedValue(authError);

      // Call mutate and wait for it to settle
      const promise = result.current.mutateAsync({ reviewId: 42 });
      await expect(promise).rejects.toThrow();

      // Verify it was only called once (no retry)
      expect(mockInvokeFunctionPost).toHaveBeenCalledTimes(1);
    });

    it('should not retry on review not published errors', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSetFeaturedReviewMutation(), { wrapper });

      const notPublishedError = new Error('Review not found or not published');
      mockInvokeFunctionPost.mockRejectedValue(notPublishedError);

      const promise = result.current.mutateAsync({ reviewId: 42 });
      await expect(promise).rejects.toThrow();

      // Verify it was only called once (no retry)
      expect(mockInvokeFunctionPost).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate homepage feed and admin queries on success', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useSetFeaturedReviewMutation(), { wrapper });

      const mockResponse = {
        success: true,
        data: {
          message: 'Featured review updated successfully',
          reviewId: 42,
          reviewTitle: 'Test Review Title',
        },
      };

      mockInvokeFunctionPost.mockResolvedValue(mockResponse);

      await result.current.mutateAsync({ reviewId: 42 });

      await waitFor(() => {
        // Verify homepage feed cache is invalidated
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['consolidated-homepage-feed'],
        });
        
        // Verify admin content queue cache is invalidated
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['admin', 'content-queue'],
        });
        
        // Verify specific review management cache is invalidated
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['admin', 'review', '42'],
        });
      });
    });
  });

  describe('loading states', () => {
    it('should indicate pending state during mutation', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSetFeaturedReviewMutation(), { wrapper });

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockInvokeFunctionPost.mockReturnValue(pendingPromise);

      // Start the mutation
      const mutationPromise = result.current.mutateAsync({ reviewId: 42 });

      // Check that it's pending
      expect(result.current.isPending).toBe(true);

      // Resolve the promise
      resolvePromise!({
        success: true,
        data: {
          message: 'Success',
          reviewId: 42,
          reviewTitle: 'Test',
        },
      });

      // Wait for completion
      await mutationPromise;

      // Check that it's no longer pending
      expect(result.current.isPending).toBe(false);
    });
  });
});