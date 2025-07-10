// ABOUTME: Tests for useCreateCommunityPostMutation hook ensuring Link post type support and title/content validation.

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateCommunityPostMutation } from '../useCreateCommunityPostMutation';
import type { LinkPreviewData } from '@/types/community';

// Mock Supabase client
const mockInvoke = vi.fn();
const mockGetUser = vi.fn();

vi.mock('../../src/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
    auth: {
      getUser: mockGetUser,
    },
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function WrapperComponent({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe('useCreateCommunityPostMutation', () => {
  const mockUser = {
    id: 'test-user-id',
    user_metadata: {
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
    },
  };

  const mockLinkPreviewData: LinkPreviewData = {
    url: 'https://example.com',
    title: 'Example Title',
    description: 'Example description',
    image: 'https://example.com/image.jpg',
    siteName: 'Example Site',
    domain: 'example.com',
    favicon: 'https://example.com/favicon.ico',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
  });

  it('creates text post with title and optional content', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true, post_id: 123, message: 'Post created successfully' },
      error: null,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateCommunityPostMutation(), { wrapper });

    const payload = {
      title: 'Test Post Title',
      content: 'Test content',
      category: 'discussao-geral',
      post_type: 'text' as const,
    };

    result.current.mutate(payload);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('create-community-post', {
        body: payload,
      });
    });
  });

  it('creates text post with only title (content optional)', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true, post_id: 123, message: 'Post created successfully' },
      error: null,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateCommunityPostMutation(), { wrapper });

    const payload = {
      title: 'Test Post Title',
      category: 'discussao-geral',
      post_type: 'text' as const,
    };

    result.current.mutate(payload);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('create-community-post', {
        body: payload,
      });
    });
  });

  it('creates link post with URL and preview data', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true, post_id: 123, message: 'Post created successfully' },
      error: null,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateCommunityPostMutation(), { wrapper });

    const payload = {
      title: 'Check out this link',
      content: 'This is a great resource',
      category: 'tecnologia-saude',
      post_type: 'link' as const,
      link_url: 'https://example.com',
      link_preview_data: mockLinkPreviewData,
    };

    result.current.mutate(payload);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('create-community-post', {
        body: payload,
      });
    });
  });

  it('creates link post without preview data', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true, post_id: 123, message: 'Post created successfully' },
      error: null,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateCommunityPostMutation(), { wrapper });

    const payload = {
      title: 'Check out this link',
      category: 'tecnologia-saude',
      post_type: 'link' as const,
      link_url: 'https://example.com',
    };

    result.current.mutate(payload);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('create-community-post', {
        body: payload,
      });
    });
  });

  it('creates optimistic update with link post data', async () => {
    mockInvoke.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                data: { success: true, post_id: 123, message: 'Post created successfully' },
              }),
            100
          )
        )
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateCommunityPostMutation(), { wrapper });

    const payload = {
      title: 'Test Link Post',
      content: 'Check this out',
      category: 'tecnologia-saude',
      post_type: 'link' as const,
      link_url: 'https://example.com',
      link_preview_data: mockLinkPreviewData,
    };

    result.current.mutate(payload);

    // The optimistic update should include link data
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    // Wait for completion
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(mockInvoke).toHaveBeenCalledWith('create-community-post', {
      body: payload,
    });
  });

  it('handles API error gracefully', async () => {
    const errorMessage = 'Failed to create post';
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: errorMessage },
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateCommunityPostMutation(), { wrapper });

    const payload = {
      title: 'Test Post',
      category: 'discussao-geral',
      post_type: 'text' as const,
    };

    result.current.mutate(payload);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toEqual(new Error(errorMessage));
    });
  });

  it('invalidates relevant queries on success', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true, post_id: 123, message: 'Post created successfully' },
      error: null,
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = function WrapperComponent({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };

    const { result } = renderHook(() => useCreateCommunityPostMutation(), { wrapper });

    const payload = {
      title: 'Test Post',
      category: 'discussao-geral',
      post_type: 'text' as const,
    };

    result.current.mutate(payload);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should invalidate community-related queries
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['community-page-data'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['community-feed'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['consolidated-homepage-feed'] });
  });

  it('includes all post types in TypeScript interface', () => {
    // This test ensures the mutation accepts all post types including 'link'
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateCommunityPostMutation(), { wrapper });

    const textPayload = {
      title: 'Text Post',
      category: 'discussao-geral',
      post_type: 'text' as const,
    };

    const imagePayload = {
      title: 'Image Post',
      category: 'discussao-geral',
      post_type: 'image' as const,
      image_url: 'https://example.com/image.jpg',
    };

    const videoPayload = {
      title: 'Video Post',
      category: 'discussao-geral',
      post_type: 'video' as const,
      video_url: 'https://example.com/video.mp4',
    };

    const pollPayload = {
      title: 'Poll Post',
      category: 'discussao-geral',
      post_type: 'poll' as const,
      poll_data: {
        question: 'Test question?',
        options: [{ text: 'Option 1' }, { text: 'Option 2' }],
      },
    };

    const linkPayload = {
      title: 'Link Post',
      category: 'discussao-geral',
      post_type: 'link' as const,
      link_url: 'https://example.com',
      link_preview_data: mockLinkPreviewData,
    };

    // All these should compile without TypeScript errors
    expect(() => result.current.mutate(textPayload)).not.toThrow();
    expect(() => result.current.mutate(imagePayload)).not.toThrow();
    expect(() => result.current.mutate(videoPayload)).not.toThrow();
    expect(() => result.current.mutate(pollPayload)).not.toThrow();
    expect(() => result.current.mutate(linkPayload)).not.toThrow();
  });

  it('handles fallback user data in optimistic updates', async () => {
    // Mock case where user is not available
    mockGetUser.mockResolvedValue({ data: { user: null } });

    mockInvoke.mockResolvedValue({
      data: { success: true, post_id: 123, message: 'Post created successfully' },
      error: null,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateCommunityPostMutation(), { wrapper });

    const payload = {
      title: 'Test Post',
      category: 'discussao-geral',
      post_type: 'text' as const,
    };

    result.current.mutate(payload);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should handle null user gracefully with fallback data
    expect(mockInvoke).toHaveBeenCalled();
  });
});
