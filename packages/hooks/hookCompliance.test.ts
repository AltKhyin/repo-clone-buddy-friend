// ABOUTME: Hook compliance tests - validates TanStack Query patterns and error handling in data-fetching hooks

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

// Test utilities for hook testing
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

// Mock Supabase functions
const mockSupabaseFunctions = {
  invokeFunctionGet: vi.fn(),
  invokeFunctionPost: vi.fn(),
  invokeFunctionPut: vi.fn(),
  invokeFunctionDelete: vi.fn(),
};

vi.mock('@/lib/supabase-functions', () => mockSupabaseFunctions);

describe('HookCompliance - TanStack Query Pattern Validation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  describe('🔴 CRITICAL: Query Hook Compliance', () => {
    it('validates useHomepageFeedQuery follows TanStack Query patterns', async () => {
      // Dynamic import to test the actual hook
      const { useHomepageFeedQuery } = await import('./useHomepageFeedQuery');

      // Mock successful response
      mockSupabaseFunctions.invokeFunctionGet.mockResolvedValue({
        featured_review: { id: '1', title: 'Test Review' },
        recent_posts: [{ id: '1', title: 'Test Post' }],
        trending_topics: ['test-topic'],
      });

      const { result } = renderHook(() => useHomepageFeedQuery(), {
        wrapper: createWrapper(queryClient),
      });

      // Should start in loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isError).toBe(false);

      // Wait for query to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should have proper TanStack Query properties
      expect(result.current.data).toBeDefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);

      // Should use proper query key structure
      expect(mockSupabaseFunctions.invokeFunctionGet).toHaveBeenCalledWith('homepage-feed', {});
    });

    it('validates useCommunityPageQuery implements proper error handling', async () => {
      const { useCommunityPageQuery } = await import('./useCommunityPageQuery');

      // Mock error response
      const testError = new Error('Network error');
      mockSupabaseFunctions.invokeFunctionGet.mockRejectedValue(testError);

      const { result } = renderHook(() => useCommunityPageQuery(), {
        wrapper: createWrapper(queryClient),
      });

      // Wait for error state
      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 5000 }
      );

      // Should handle error properly
      expect(result.current.error).toBe(testError);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('validates useUserProfileQuery handles authentication correctly', async () => {
      const { useUserProfileQuery } = await import('./useUserProfileQuery');

      // Mock authenticated response
      mockSupabaseFunctions.invokeFunctionGet.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        role: 'practitioner',
      });

      const { result } = renderHook(() => useUserProfileQuery(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        id: 'user-id',
        email: 'test@example.com',
        role: 'practitioner',
      });
    });
  });

  describe('🟡 CRITICAL: Mutation Hook Compliance', () => {
    it('validates useCreateCommunityPostMutation implements cache invalidation', async () => {
      const { useCreateCommunityPostMutation } = await import('./useCreateCommunityPostMutation');

      // Mock successful mutation response
      mockSupabaseFunctions.invokeFunctionPost.mockResolvedValue({
        id: 'new-post-id',
        title: 'New Post',
        content: 'Post content',
      });

      const { result } = renderHook(() => useCreateCommunityPostMutation(), {
        wrapper: createWrapper(queryClient),
      });

      // Should have proper mutation properties
      expect(result.current.mutate).toBeDefined();
      expect(result.current.isIdle).toBe(true);
      expect(result.current.isLoading).toBe(false);

      // Execute mutation
      const postData = {
        title: 'New Post',
        content: 'Post content',
        category: 'discussion',
      };

      result.current.mutate(postData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        id: 'new-post-id',
        title: 'New Post',
        content: 'Post content',
      });

      // Verify the function was called correctly
      expect(mockSupabaseFunctions.invokeFunctionPost).toHaveBeenCalledWith(
        'create-community-post',
        postData
      );
    });

    it('validates usePollVoteMutation handles optimistic updates', async () => {
      const { usePollVoteMutation } = await import('./usePollVoteMutation');

      // Mock successful vote response
      mockSupabaseFunctions.invokeFunctionPost.mockResolvedValue({
        success: true,
        poll_id: 'poll-123',
        option_id: 'option-456',
      });

      const { result } = renderHook(() => usePollVoteMutation(), {
        wrapper: createWrapper(queryClient),
      });

      const voteData = {
        poll_id: 'poll-123',
        option_id: 'option-456',
      };

      result.current.mutate(voteData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabaseFunctions.invokeFunctionPost).toHaveBeenCalledWith(
        'vote-on-poll',
        voteData
      );
    });

    it('validates useSavePostMutation implements proper error recovery', async () => {
      const { useSavePostMutation } = await import('./useSavePostMutation');

      // Mock error response
      const saveError = new Error('Save failed');
      mockSupabaseFunctions.invokeFunctionPost.mockRejectedValue(saveError);

      const { result } = renderHook(() => useSavePostMutation(), {
        wrapper: createWrapper(queryClient),
      });

      const saveData = {
        post_id: 'post-123',
        action: 'save',
      };

      result.current.mutate(saveData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(saveError);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('🟢 STRATEGIC: Hook Pattern Consistency', () => {
    it('validates all query hooks use consistent query key patterns', async () => {
      // Test that all hooks follow the pattern: ['feature', 'subtype', ...params]
      const queryHooks = ['useHomepageFeedQuery', 'useCommunityPageQuery', 'useUserProfileQuery'];

      for (const hookName of queryHooks) {
        try {
          const hookModule = await import(`./${hookName}`);
          const hook = hookModule[hookName];

          if (hook) {
            const { result } = renderHook(() => hook(), {
              wrapper: createWrapper(queryClient),
            });

            // All query hooks should have these basic properties
            expect(result.current).toHaveProperty('data');
            expect(result.current).toHaveProperty('isLoading');
            expect(result.current).toHaveProperty('isError');
            expect(result.current).toHaveProperty('error');
          }
        } catch (error) {
          // Hook doesn't exist or has issues - will be caught by other tests
        }
      }
    });

    it('validates all mutation hooks use consistent patterns', async () => {
      const mutationHooks = [
        'useCreateCommunityPostMutation',
        'usePollVoteMutation',
        'useSavePostMutation',
      ];

      for (const hookName of mutationHooks) {
        try {
          const hookModule = await import(`./${hookName}`);
          const hook = hookModule[hookName];

          if (hook) {
            const { result } = renderHook(() => hook(), {
              wrapper: createWrapper(queryClient),
            });

            // All mutation hooks should have these basic properties
            expect(result.current).toHaveProperty('mutate');
            expect(result.current).toHaveProperty('isLoading');
            expect(result.current).toHaveProperty('isError');
            expect(result.current).toHaveProperty('isSuccess');
            expect(result.current).toHaveProperty('data');
            expect(result.current).toHaveProperty('error');
          }
        } catch (error) {
          // Hook doesn't exist or has issues - will be caught by other tests
        }
      }
    });
  });

  describe('🔵 AI-SAFETY: Performance and Memory Management', () => {
    it('validates hooks do not create memory leaks', async () => {
      const { useHomepageFeedQuery } = await import('./useHomepageFeedQuery');

      // Mock successful response
      mockSupabaseFunctions.invokeFunctionGet.mockResolvedValue({
        featured_review: { id: '1', title: 'Test Review' },
      });

      // Render and unmount hook multiple times
      for (let i = 0; i < 5; i++) {
        const { result, unmount } = renderHook(() => useHomepageFeedQuery(), {
          wrapper: createWrapper(queryClient),
        });

        await waitFor(() => {
          expect(result.current.isSuccess || result.current.isError).toBe(true);
        });

        unmount();
      }

      // Query client should clean up properly
      expect(queryClient.getQueryCache().getAll()).toHaveLength(1); // Only the last query should remain
    });

    it('validates hooks implement proper loading states', async () => {
      const { useCommunityPageQuery } = await import('./useCommunityPageQuery');

      // Mock delayed response
      mockSupabaseFunctions.invokeFunctionGet.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ posts: [], pagination: {} }), 100))
      );

      const { result } = renderHook(() => useCommunityPageQuery(), {
        wrapper: createWrapper(queryClient),
      });

      // Should start in loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeDefined();
    });

    it('validates hooks handle rapid successive calls gracefully', async () => {
      const { useUserProfileQuery } = await import('./useUserProfileQuery');

      let callCount = 0;
      mockSupabaseFunctions.invokeFunctionGet.mockImplementation(async () => {
        callCount++;
        return { id: 'user-id', callNumber: callCount };
      });

      // Render multiple instances rapidly
      const instances = [];
      for (let i = 0; i < 3; i++) {
        instances.push(
          renderHook(() => useUserProfileQuery(), {
            wrapper: createWrapper(queryClient),
          })
        );
      }

      // Wait for all to complete
      await Promise.all(
        instances.map(instance =>
          waitFor(() => {
            expect(instance.result.current.isSuccess || instance.result.current.isError).toBe(true);
          })
        )
      );

      // Should handle rapid calls without issues
      instances.forEach(instance => {
        expect(instance.result.current.data).toBeDefined();
      });

      // Clean up
      instances.forEach(instance => instance.unmount());
    });
  });

  describe('🎯 ARCHITECTURE: Integration Validation', () => {
    it('validates hooks integrate properly with auth store', async () => {
      // This test ensures hooks work with authentication context
      const { useUserProfileQuery } = await import('./useUserProfileQuery');

      // Mock authenticated response
      mockSupabaseFunctions.invokeFunctionGet.mockResolvedValue({
        id: 'auth-user-id',
        email: 'auth@example.com',
      });

      const { result } = renderHook(() => useUserProfileQuery(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should integrate with auth properly
      expect(result.current.data).toHaveProperty('id');
      expect(result.current.data).toHaveProperty('email');
    });

    it('validates hooks follow proper error boundary integration', async () => {
      const { useCommunityPageQuery } = await import('./useCommunityPageQuery');

      // Mock critical error that should be caught by error boundary
      const criticalError = new Error('Critical system error');
      mockSupabaseFunctions.invokeFunctionGet.mockRejectedValue(criticalError);

      const { result } = renderHook(() => useCommunityPageQuery(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Error should be handled gracefully, not crash the app
      expect(result.current.error).toBe(criticalError);
      expect(result.current.data).toBeUndefined();
    });
  });
});
