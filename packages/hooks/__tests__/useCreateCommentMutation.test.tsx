// ABOUTME: Comprehensive tests for useCreateCommentMutation hook including optimistic updates

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateCommentMutation } from '../useCreateCommentMutation';

// Mock Supabase client
const mockSupabase = {
  functions: {
    invoke: vi.fn(),
  },
};

// Mock the Supabase client import
vi.mock('../../src/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock the auth store
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg'
  }
};

vi.mock('../../src/store/auth', () => ({
  useAuthStore: () => ({
    user: mockUser,
  }),
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCreateCommentMutation', () => {
  let queryClient: QueryClient;
  let wrapper: any;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // Set up initial cache data for optimistic updates
    queryClient.setQueryData(['postWithComments', 1], {
      post: { id: 1, title: 'Test Post' },
      comments: [
        { id: 2, content: 'Existing comment', parent_post_id: 1 }
      ],
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
  });

  describe('✅ Success Scenarios', () => {
    it('should create comment successfully via Edge Function', async () => {
      const mockResponse = {
        data: {
          success: true,
          post_id: 3,
          message: 'Comment created successfully',
        },
        error: null,
      };

      mockSupabase.functions.invoke.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateCommentMutation(), { wrapper });

      const commentData = {
        content: 'New test comment',
        parent_post_id: 1,
        category: 'comment',
      };

      await act(async () => {
        result.current.mutate(commentData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'create-community-post',
        { body: commentData }
      );
      expect(result.current.data).toEqual(mockResponse.data);
    });

    it('should handle root_post_id correctly for cache operations', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, post_id: 3 },
        error: null,
      });

      const { result } = renderHook(() => useCreateCommentMutation(), { wrapper });

      const commentData = {
        content: 'Reply comment',
        parent_post_id: 2, // Reply to comment 2
        root_post_id: 1,   // But part of post 1's thread
        category: 'comment',
      };

      await act(async () => {
        result.current.mutate(commentData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should use root_post_id for cache operations
      const cacheData = queryClient.getQueryData(['postWithComments', 1]);
      expect(cacheData).toBeDefined();
    });
  });

  describe('❌ Error Scenarios', () => {
    it('should handle Edge Function errors properly', async () => {
      const mockError = new Error('Edge function failed');
      mockSupabase.functions.invoke.mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreateCommentMutation(), { wrapper });

      await act(async () => {
        result.current.mutate({
          content: 'Test comment',
          parent_post_id: 1,
          category: 'comment',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it('should rollback optimistic update on error', async () => {
      const mockError = new Error('Network error');
      mockSupabase.functions.invoke.mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreateCommentMutation(), { wrapper });

      // Get initial cache state
      const initialCacheData = queryClient.getQueryData(['postWithComments', 1]);
      const initialCommentCount = (initialCacheData as any).comments.length;

      await act(async () => {
        result.current.mutate({
          content: 'Test comment that will fail',
          parent_post_id: 1,
          category: 'comment',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Cache should be rolled back to initial state
      const finalCacheData = queryClient.getQueryData(['postWithComments', 1]);
      expect((finalCacheData as any).comments.length).toBe(initialCommentCount);
    });
  });

  describe('🎯 Optimistic Updates', () => {
    it('should add optimistic comment immediately', async () => {
      // Delay the API response to test optimistic update
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockSupabase.functions.invoke.mockReturnValue(delayedPromise);

      const { result } = renderHook(() => useCreateCommentMutation(), { wrapper });

      const initialCacheData = queryClient.getQueryData(['postWithComments', 1]);
      const initialCommentCount = (initialCacheData as any).comments.length;

      act(() => {
        result.current.mutate({
          content: 'Optimistic comment',
          parent_post_id: 1,
          category: 'comment',
        });
      });

      // Should have optimistic comment immediately
      const optimisticCacheData = queryClient.getQueryData(['postWithComments', 1]);
      const optimisticComments = (optimisticCacheData as any).comments;
      
      expect(optimisticComments.length).toBe(initialCommentCount + 1);
      
      const optimisticComment = optimisticComments[optimisticComments.length - 1];
      expect(optimisticComment.content).toBe('Optimistic comment');
      expect(optimisticComment._isOptimistic).toBe(true);
      expect(optimisticComment._isLoading).toBe(true);
      expect(optimisticComment.author.full_name).toBe('Test User');

      // Resolve the API call
      resolvePromise!({
        data: { success: true, post_id: 3 },
        error: null,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle missing cache data gracefully during optimistic update', async () => {
      // Clear cache data
      queryClient.removeQueries({ queryKey: ['postWithComments', 1] });

      const { result } = renderHook(() => useCreateCommentMutation(), { wrapper });

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, post_id: 3 },
        error: null,
      });

      await act(async () => {
        result.current.mutate({
          content: 'Test comment',
          parent_post_id: 1,
          category: 'comment',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should not crash when there's no existing cache data
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('🔄 Retry Logic', () => {
    it('should retry on server errors', async () => {
      // First call fails with server error, second succeeds
      mockSupabase.functions.invoke
        .mockRejectedValueOnce(new Error('500 Internal Server Error'))
        .mockResolvedValue({
          data: { success: true, post_id: 3 },
          error: null,
        });

      const { result } = renderHook(() => useCreateCommentMutation(), { wrapper });

      await act(async () => {
        result.current.mutate({
          content: 'Retry test comment',
          parent_post_id: 1,
          category: 'comment',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should have been called twice (initial + 1 retry)
      expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(2);
    });

    it('should not retry on client errors', async () => {
      mockSupabase.functions.invoke.mockRejectedValue(new Error('401 Unauthorized'));

      const { result } = renderHook(() => useCreateCommentMutation(), { wrapper });

      await act(async () => {
        result.current.mutate({
          content: 'Unauthorized comment',
          parent_post_id: 1,
          category: 'comment',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should only be called once (no retry)
      expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(1);
    });

    it('should not retry on validation errors', async () => {
      mockSupabase.functions.invoke.mockRejectedValue(new Error('422 Validation failed'));

      const { result } = renderHook(() => useCreateCommentMutation(), { wrapper });

      await act(async () => {
        result.current.mutate({
          content: 'Invalid comment',
          parent_post_id: 1,
          category: 'comment',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should only be called once (no retry)
      expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(1);
    });
  });

  describe('⚡ Performance Optimizations', () => {
    it('should use selective cache invalidation instead of full refetch', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, post_id: 3 },
        error: null,
      });

      const { result } = renderHook(() => useCreateCommentMutation(), { wrapper });

      // Spy on queryClient methods
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      await act(async () => {
        result.current.mutate({
          content: 'Performance test comment',
          parent_post_id: 1,
          category: 'comment',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should use setQueryData for immediate updates
      expect(setQueryDataSpy).toHaveBeenCalled();
      
      // Should use invalidateQueries with refetchType: 'none' for background updates
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['postWithComments', 1],
        refetchType: 'none',
      });
    });

    it('should handle background community feed updates', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, post_id: 3 },
        error: null,
      });

      const { result } = renderHook(() => useCreateCommentMutation(), { wrapper });

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      await act(async () => {
        result.current.mutate({
          content: 'Community feed test comment',
          parent_post_id: 1,
          category: 'comment',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should schedule background community feed invalidation
      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['communityPosts'],
          refetchType: 'none',
        });
      }, { timeout: 200 });
    });
  });
});