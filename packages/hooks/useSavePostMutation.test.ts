// ABOUTME: Tests for useSavePostMutation ensuring proper post saving/unsaving with cache management

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from '../../src/test-utils';
import { useSavePostMutation } from './useSavePostMutation';
import { createMockCommunityPost, resetIdCounter } from '../../src/test-utils/test-data-factories';

// Mock Supabase client
vi.mock('../../src/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('useSavePostMutation', () => {
  let mockInvoke: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    resetIdCounter();

    // Get reference to the mocked function
    const { supabase } = await import('../../src/integrations/supabase/client');
    mockInvoke = vi.mocked(supabase.functions.invoke);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Mutation Function', () => {
    it('should save a post successfully', async () => {
      const mockResponse = {
        success: true,
        is_saved: true,
        post_id: 123,
        message: 'Post saved successfully',
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result } = renderHookWithQuery(() => useSavePostMutation());

      const payload = {
        post_id: 123,
        save: true,
      };

      let mutationResult: any;
      await waitFor(async () => {
        mutationResult = await result.current.mutateAsync(payload);
      });

      expect(mutationResult).toEqual(mockResponse);
      expect(mockInvoke).toHaveBeenCalledWith('save-post', {
        body: payload,
      });
    });

    it('should unsave a post successfully', async () => {
      const mockResponse = {
        success: true,
        is_saved: false,
        post_id: 123,
        message: 'Post unsaved successfully',
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result } = renderHookWithQuery(() => useSavePostMutation());

      const payload = {
        post_id: 123,
        save: false,
      };

      let mutationResult: any;
      await waitFor(async () => {
        mutationResult = await result.current.mutateAsync(payload);
      });

      expect(mutationResult).toEqual(mockResponse);
      expect(mockInvoke).toHaveBeenCalledWith('save-post', {
        body: payload,
      });
    });

    it('should save a post without explicit save flag (defaults to save)', async () => {
      const mockResponse = {
        success: true,
        is_saved: true,
        post_id: 123,
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result } = renderHookWithQuery(() => useSavePostMutation());

      const payload = {
        post_id: 123,
        // No save flag - should default to saving behavior
      };

      let mutationResult: any;
      await waitFor(async () => {
        mutationResult = await result.current.mutateAsync(payload);
      });

      expect(mutationResult).toEqual(mockResponse);
      expect(mockInvoke).toHaveBeenCalledWith('save-post', {
        body: payload,
      });
    });

    it('should handle Edge Function errors', async () => {
      const errorMessage = 'Post not found';
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      const { result } = renderHookWithQuery(() => useSavePostMutation());

      const payload = {
        post_id: 999, // Non-existent post
      };

      await expect(async () => {
        await result.current.mutateAsync(payload);
      }).rejects.toThrow(errorMessage);

      expect(mockInvoke).toHaveBeenCalledWith('save-post', {
        body: payload,
      });
    });

    it('should handle generic Edge Function errors', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: {}, // Error without message
      });

      const { result } = renderHookWithQuery(() => useSavePostMutation());

      const payload = {
        post_id: 123,
      };

      await expect(async () => {
        await result.current.mutateAsync(payload);
      }).rejects.toThrow('Failed to save post');
    });

    it('should handle network errors', async () => {
      mockInvoke.mockRejectedValue(new Error('Network connection failed'));

      const { result } = renderHookWithQuery(() => useSavePostMutation());

      const payload = {
        post_id: 123,
      };

      await expect(async () => {
        await result.current.mutateAsync(payload);
      }).rejects.toThrow('Network connection failed');
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate all relevant queries on successful save', async () => {
      const mockResponse = {
        success: true,
        is_saved: true,
        post_id: 123,
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result, queryClient } = renderHookWithQuery(() => useSavePostMutation());

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const payload = {
        post_id: 123,
      };

      await waitFor(async () => {
        await result.current.mutateAsync(payload);
      });

      // Check that all relevant queries were invalidated
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['savedPosts'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['communityFeed'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['communityPageData'],
      });
    });

    it('should invalidate queries on successful unsave', async () => {
      const mockResponse = {
        success: true,
        is_saved: false,
        post_id: 123,
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result, queryClient } = renderHookWithQuery(() => useSavePostMutation());

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const payload = {
        post_id: 123,
        save: false,
      };

      await waitFor(async () => {
        await result.current.mutateAsync(payload);
      });

      // Same queries should be invalidated for unsave
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['savedPosts'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['communityFeed'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['communityPageData'],
      });
    });

    it('should not invalidate queries on error', async () => {
      const errorMessage = 'Save failed';
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      const { result, queryClient } = renderHookWithQuery(() => useSavePostMutation());

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const payload = {
        post_id: 123,
      };

      await expect(async () => {
        await result.current.mutateAsync(payload);
      }).rejects.toThrow(errorMessage);

      // No queries should be invalidated on error
      expect(invalidateQueriesSpy).not.toHaveBeenCalled();
    });
  });

  describe('Optimistic Cache Updates', () => {
    it('should update community feed cache immediately on save', async () => {
      const mockResponse = {
        success: true,
        is_saved: true,
        post_id: 123,
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const mockPost = createMockCommunityPost({
        id: 123,
        title: 'Test Post',
        is_saved: false, // Initially not saved
      });

      const { result, queryClient } = renderHookWithQuery(() => useSavePostMutation());

      // Set up community feed cache
      queryClient.setQueryData(['communityFeed'], {
        pages: [
          {
            posts: [mockPost, createMockCommunityPost({ id: 124 })],
          },
        ],
      });

      const payload = {
        post_id: 123,
      };

      await waitFor(async () => {
        await result.current.mutateAsync(payload);
      });

      // Check that the specific post's save status was updated
      const updatedCache = queryClient.getQueryData(['communityFeed']) as any;
      const updatedPost = updatedCache?.pages[0]?.posts?.find((p: any) => p.id === 123);

      expect(updatedPost?.is_saved).toBe(true);
    });

    it('should update community feed cache immediately on unsave', async () => {
      const mockResponse = {
        success: true,
        is_saved: false,
        post_id: 123,
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const mockPost = createMockCommunityPost({
        id: 123,
        title: 'Test Post',
        is_saved: true, // Initially saved
      });

      const { result, queryClient } = renderHookWithQuery(() => useSavePostMutation());

      // Set up community feed cache
      queryClient.setQueryData(['communityFeed'], {
        pages: [
          {
            posts: [mockPost],
          },
        ],
      });

      const payload = {
        post_id: 123,
        save: false,
      };

      await waitFor(async () => {
        await result.current.mutateAsync(payload);
      });

      // Check that the post's save status was updated to false
      const updatedCache = queryClient.getQueryData(['communityFeed']) as any;
      const updatedPost = updatedCache?.pages[0]?.posts?.find((p: any) => p.id === 123);

      expect(updatedPost?.is_saved).toBe(false);
    });

    it('should handle multiple pages in community feed', async () => {
      const mockResponse = {
        success: true,
        is_saved: true,
        post_id: 123,
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const targetPost = createMockCommunityPost({
        id: 123,
        is_saved: false,
      });

      const { result, queryClient } = renderHookWithQuery(() => useSavePostMutation());

      // Set up multiple pages
      queryClient.setQueryData(['communityFeed'], {
        pages: [
          { posts: [createMockCommunityPost({ id: 124 })] }, // First page
          { posts: [targetPost, createMockCommunityPost({ id: 125 })] }, // Second page with target
          { posts: [createMockCommunityPost({ id: 126 })] }, // Third page
        ],
      });

      const payload = {
        post_id: 123,
      };

      await waitFor(async () => {
        await result.current.mutateAsync(payload);
      });

      // Check that only the target post was updated
      const updatedCache = queryClient.getQueryData(['communityFeed']) as any;
      const pages = updatedCache?.pages;

      expect(pages[0].posts[0].is_saved).toBeUndefined(); // First page unchanged
      expect(pages[1].posts[0].is_saved).toBe(true); // Target post updated
      expect(pages[1].posts[1].is_saved).toBeUndefined(); // Other post in same page unchanged
      expect(pages[2].posts[0].is_saved).toBeUndefined(); // Third page unchanged
    });

    it('should handle empty or missing cache gracefully', async () => {
      const mockResponse = {
        success: true,
        is_saved: true,
        post_id: 123,
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result, queryClient } = renderHookWithQuery(() => useSavePostMutation());

      // No existing cache data
      const payload = {
        post_id: 123,
      };

      // Should not throw error
      await expect(async () => {
        await result.current.mutateAsync(payload);
      }).resolves.not.toThrow();
    });

    it('should handle cache without pages structure', async () => {
      const mockResponse = {
        success: true,
        is_saved: true,
        post_id: 123,
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result, queryClient } = renderHookWithQuery(() => useSavePostMutation());

      // Set up cache in non-paginated format
      queryClient.setQueryData(['communityFeed'], {
        posts: [createMockCommunityPost({ id: 123, is_saved: false })],
      });

      const payload = {
        post_id: 123,
      };

      await waitFor(async () => {
        await result.current.mutateAsync(payload);
      });

      // Cache should remain unchanged since it doesn't have pages structure
      const updatedCache = queryClient.getQueryData(['communityFeed']) as any;
      expect(updatedCache?.posts[0].is_saved).toBe(false); // Unchanged
    });

    it('should not affect other posts when updating specific post', async () => {
      const mockResponse = {
        success: true,
        is_saved: true,
        post_id: 123,
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const targetPost = createMockCommunityPost({ id: 123, is_saved: false });
      const otherPost = createMockCommunityPost({ id: 124, is_saved: true });

      const { result, queryClient } = renderHookWithQuery(() => useSavePostMutation());

      queryClient.setQueryData(['communityFeed'], {
        pages: [
          {
            posts: [targetPost, otherPost],
          },
        ],
      });

      const payload = {
        post_id: 123,
      };

      await waitFor(async () => {
        await result.current.mutateAsync(payload);
      });

      const updatedCache = queryClient.getQueryData(['communityFeed']) as any;
      const posts = updatedCache?.pages[0]?.posts;

      expect(posts[0].is_saved).toBe(true); // Target post updated
      expect(posts[1].is_saved).toBe(true); // Other post unchanged
    });
  });

  describe('Error Handling', () => {
    it('should log errors appropriately', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errorMessage = 'Save operation failed';
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      const { result } = renderHookWithQuery(() => useSavePostMutation());

      const payload = {
        post_id: 123,
      };

      await expect(async () => {
        await result.current.mutateAsync(payload);
      }).rejects.toThrow(errorMessage);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Save post error:', { message: errorMessage });

      consoleErrorSpy.mockRestore();
    });

    it('should handle mutation errors in onError callback', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errorMessage = 'Network failure';
      mockInvoke.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHookWithQuery(() => useSavePostMutation());

      const payload = {
        post_id: 123,
      };

      await expect(async () => {
        await result.current.mutateAsync(payload);
      }).rejects.toThrow(errorMessage);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save/unsave post:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Type Safety', () => {
    it('should enforce required payload fields', () => {
      const { result } = renderHookWithQuery(() => useSavePostMutation());

      // TypeScript should enforce post_id is required
      // @ts-expect-error - missing post_id
      result.current.mutate({});

      // This should be valid
      result.current.mutate({ post_id: 123 });
      result.current.mutate({ post_id: 123, save: true });
      result.current.mutate({ post_id: 123, save: false });
    });

    it('should accept valid save flag values', () => {
      const { result } = renderHookWithQuery(() => useSavePostMutation());

      // These should be valid
      result.current.mutate({ post_id: 123, save: true });
      result.current.mutate({ post_id: 123, save: false });
      result.current.mutate({ post_id: 123 }); // save is optional
    });
  });

  describe('Console Logging', () => {
    it('should log successful save operations', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockResponse = {
        success: true,
        is_saved: true,
        post_id: 123,
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result } = renderHookWithQuery(() => useSavePostMutation());

      const payload = {
        post_id: 123,
      };

      await waitFor(async () => {
        await result.current.mutateAsync(payload);
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('Saving post with data:', payload);
      expect(consoleLogSpy).toHaveBeenCalledWith('Post save successful:', mockResponse);

      consoleLogSpy.mockRestore();
    });
  });
});
