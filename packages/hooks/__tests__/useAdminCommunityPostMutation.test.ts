// ABOUTME: Tests for admin community post mutation hooks ensuring proper API integration and cache management

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useAdminCommunityPostMutation,
  useCreateAdminCommunityPost,
  useUpdateAdminCommunityPost,
  usePublishAdminCommunityPost,
  useScheduleAdminCommunityPost,
  useHideAdminCommunityPost,
  useUnhideAdminCommunityPost,
  useDeleteAdminCommunityPost,
} from '../useAdminCommunityPostMutation';

// Mock supabase client
const mockSupabase = {
  functions: {
    invoke: vi.fn(),
  },
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

describe('useAdminCommunityPostMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Mutation Functionality', () => {
    it('should call admin-community-post-management edge function with correct payload', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, data: { id: 123 } },
        error: null,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAdminCommunityPostMutation(), { wrapper });

      const request = {
        operation: 'create' as const,
        review_id: 1,
        data: {
          title: 'Test Post',
          content: 'Test content',
          category: 'review',
          post_type: 'image' as const,
        },
      };

      await result.current.mutateAsync(request);

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'admin-community-post-management',
        { body: request }
      );
    });

    it('should handle edge function errors properly', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Validation failed' },
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAdminCommunityPostMutation(), { wrapper });

      const request = {
        operation: 'create' as const,
        review_id: 1,
        data: { title: 'Test Post' },
      };

      await expect(result.current.mutateAsync(request)).rejects.toThrow('Validation failed');
    });

    it('should handle missing error message gracefully', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: {},
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAdminCommunityPostMutation(), { wrapper });

      const request = {
        operation: 'create' as const,
        review_id: 1,
        data: { title: 'Test Post' },
      };

      await expect(result.current.mutateAsync(request)).rejects.toThrow(
        'Failed to execute admin community post operation'
      );
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate relevant queries on successful mutation', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, message: 'Post created' },
        error: null,
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useAdminCommunityPostMutation(), { wrapper });

      const request = {
        operation: 'create' as const,
        review_id: 123,
        data: { title: 'Test Post' },
      };

      await result.current.mutateAsync(request);

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['admin', 'review', '123'],
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['admin', 'content-queue'],
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['community-page-data'],
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['community-feed'],
        });
      });
    });

    it('should invalidate homepage queries for publish operations', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useAdminCommunityPostMutation(), { wrapper });

      const request = {
        operation: 'publish' as const,
        review_id: 123,
        post_id: 456,
      };

      await result.current.mutateAsync(request);

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['homepage'],
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['consolidated-homepage-feed'],
        });
      });
    });

    it('should invalidate homepage queries for hide/delete operations', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useAdminCommunityPostMutation(), { wrapper });

      const request = {
        operation: 'hide' as const,
        review_id: 123,
        post_id: 456,
      };

      await result.current.mutateAsync(request);

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['homepage'],
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['consolidated-homepage-feed'],
        });
      });
    });
  });

  describe('Retry Logic', () => {
    it('should not retry on authentication errors', async () => {
      mockSupabase.functions.invoke.mockRejectedValue(new Error('UNAUTHORIZED'));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAdminCommunityPostMutation(), { wrapper });

      const request = {
        operation: 'create' as const,
        review_id: 1,
        data: { title: 'Test Post' },
      };

      expect(result.current.retry(0, new Error('UNAUTHORIZED'))).toBe(false);
      expect(result.current.retry(1, new Error('FORBIDDEN'))).toBe(false);
      expect(result.current.retry(0, new Error('VALIDATION_FAILED'))).toBe(false);
    });

    it('should retry on network errors up to 2 times', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAdminCommunityPostMutation(), { wrapper });

      expect(result.current.retry(0, new Error('Network error'))).toBe(true);
      expect(result.current.retry(1, new Error('Network error'))).toBe(true);
      expect(result.current.retry(2, new Error('Network error'))).toBe(false);
    });
  });
});

describe('Convenience Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCreateAdminCommunityPost', () => {
    it('should create post with proper parameters', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, data: { id: 123 } },
        error: null,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateAdminCommunityPost(), { wrapper });

      const postData = {
        title: 'Test Post',
        content: 'Test content',
        category: 'review',
        post_type: 'image' as const,
      };

      await result.current.createPost(456, postData);

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'admin-community-post-management',
        {
          body: {
            operation: 'create',
            review_id: 456,
            data: postData,
          },
        }
      );
    });
  });

  describe('useUpdateAdminCommunityPost', () => {
    it('should update post with proper parameters', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateAdminCommunityPost(), { wrapper });

      const postData = {
        title: 'Updated Post',
        content: 'Updated content',
      };

      await result.current.updatePost(456, postData, 789);

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'admin-community-post-management',
        {
          body: {
            operation: 'update',
            review_id: 456,
            data: postData,
            post_id: 789,
          },
        }
      );
    });
  });

  describe('usePublishAdminCommunityPost', () => {
    it('should publish post with proper parameters', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => usePublishAdminCommunityPost(), { wrapper });

      await result.current.publishPost(456, 789);

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'admin-community-post-management',
        {
          body: {
            operation: 'publish',
            review_id: 456,
            post_id: 789,
          },
        }
      );
    });
  });

  describe('useScheduleAdminCommunityPost', () => {
    it('should schedule post with proper parameters', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useScheduleAdminCommunityPost(), { wrapper });

      const scheduledAt = '2024-01-01T12:00:00Z';
      await result.current.schedulePost(456, scheduledAt, 789);

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'admin-community-post-management',
        {
          body: {
            operation: 'schedule',
            review_id: 456,
            data: { scheduled_publish_at: scheduledAt },
            post_id: 789,
          },
        }
      );
    });
  });

  describe('useHideAdminCommunityPost', () => {
    it('should hide post with proper parameters', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useHideAdminCommunityPost(), { wrapper });

      await result.current.hidePost(456, 789);

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'admin-community-post-management',
        {
          body: {
            operation: 'hide',
            review_id: 456,
            post_id: 789,
          },
        }
      );
    });
  });

  describe('useUnhideAdminCommunityPost', () => {
    it('should unhide post with proper parameters', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUnhideAdminCommunityPost(), { wrapper });

      await result.current.unhidePost(456, 789);

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'admin-community-post-management',
        {
          body: {
            operation: 'unhide',
            review_id: 456,
            post_id: 789,
          },
        }
      );
    });
  });

  describe('useDeleteAdminCommunityPost', () => {
    it('should delete post with proper parameters', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeleteAdminCommunityPost(), { wrapper });

      await result.current.deletePost(456, 789);

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'admin-community-post-management',
        {
          body: {
            operation: 'delete',
            review_id: 456,
            post_id: 789,
          },
        }
      );
    });
  });
});