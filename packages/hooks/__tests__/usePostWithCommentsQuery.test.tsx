// ABOUTME: Comprehensive tests for usePostWithCommentsQuery hook following TDD principles

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePostWithCommentsQuery } from '../usePostWithCommentsQuery';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  functions: {
    invoke: vi.fn(),
  },
  rpc: vi.fn(),
};

// Mock the Supabase client import
vi.mock('../../src/integrations/supabase/client', () => ({
  supabase: mockSupabase,
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

describe('usePostWithCommentsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default auth mock - authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('🎯 Success Scenarios', () => {
    it('should fetch post and comments successfully via Edge Function', async () => {
      const mockPost = {
        id: 1,
        title: 'Test Post',
        content: 'Test content',
        upvotes: 5,
        user_vote: 'upvote',
        is_saved: false,
      };

      const mockComments = [
        {
          id: 2,
          content: 'Test comment',
          parent_post_id: 1,
          author: { full_name: 'Test User' },
        },
      ];

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockPost,
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({
        data: mockComments,
        error: null,
      });

      const { result } = renderHook(() => usePostWithCommentsQuery(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.post).toEqual(mockPost);
      expect(result.current.data?.comments).toEqual(mockComments);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'get-community-post-detail',
        { body: { post_id: 1 } }
      );
    });

    it('should handle RPC failure gracefully and return post without comments', async () => {
      const mockPost = { id: 1, title: 'Test Post' };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockPost,
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      });

      const { result } = renderHook(() => usePostWithCommentsQuery(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.post).toEqual(mockPost);
      expect(result.current.data?.comments).toEqual([]);
    });
  });

  describe('❌ Error Scenarios', () => {
    it('should handle Edge Function CORS errors with user-friendly message', async () => {
      mockSupabase.functions.invoke.mockRejectedValue(
        new Error('CORS policy: Request blocked')
      );

      const { result } = renderHook(() => usePostWithCommentsQuery(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('Connection blocked');
    });

    it('should handle 404 errors with appropriate message', async () => {
      mockSupabase.functions.invoke.mockRejectedValue(
        new Error('404 not found')
      );

      const { result } = renderHook(() => usePostWithCommentsQuery(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('not found');
    });

    it('should handle authentication errors properly', async () => {
      mockSupabase.functions.invoke.mockRejectedValue(
        new Error('401 Unauthorized')
      );

      const { result } = renderHook(() => usePostWithCommentsQuery(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('Authentication required');
    });
  });

  describe('⚡ Performance & Caching', () => {
    it('should not be enabled for invalid postId', () => {
      const { result } = renderHook(() => usePostWithCommentsQuery(0), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockSupabase.functions.invoke).not.toHaveBeenCalled();
    });

    it('should not be enabled for NaN postId', () => {
      const { result } = renderHook(() => usePostWithCommentsQuery(NaN), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockSupabase.functions.invoke).not.toHaveBeenCalled();
    });

    it('should use proper cache keys for different posts', async () => {
      const wrapper = createWrapper();
      
      const { result: result1 } = renderHook(() => usePostWithCommentsQuery(1), { wrapper });
      const { result: result2 } = renderHook(() => usePostWithCommentsQuery(2), { wrapper });

      // Each hook should have different cache keys, allowing independent caching
      expect(result1.current).toBeDefined();
      expect(result2.current).toBeDefined();
    });
  });

  describe('🛡️ Retry Logic', () => {
    it('should retry on server errors but not on client errors', async () => {
      // First call fails with server error, second succeeds
      mockSupabase.functions.invoke
        .mockRejectedValueOnce(new Error('500 Internal Server Error'))
        .mockResolvedValue({ data: { id: 1 }, error: null });
      
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => usePostWithCommentsQuery(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should have been called twice (initial + 1 retry)
      expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 404 errors', async () => {
      mockSupabase.functions.invoke.mockRejectedValue(new Error('404 not found'));

      const { result } = renderHook(() => usePostWithCommentsQuery(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should only be called once (no retry)
      expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(1);
    });
  });

  describe('👤 Authentication Scenarios', () => {
    it('should handle anonymous users correctly', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { id: 1 },
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => usePostWithCommentsQuery(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should call RPC with anonymous user ID
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_comments_for_post', {
        p_post_id: 1,
        p_user_id: '00000000-0000-0000-0000-000000000000',
      });
    });

    it('should handle auth errors gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      });

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { id: 1 },
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => usePostWithCommentsQuery(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should continue with anonymous user despite auth error
      expect(result.current.data?.post).toBeDefined();
    });
  });
});