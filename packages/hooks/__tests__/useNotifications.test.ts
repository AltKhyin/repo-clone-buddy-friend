// ABOUTME: Comprehensive tests for notification hooks ensuring proper functionality and error handling

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useNotifications,
  useNotificationCount,
  useMarkNotificationsRead,
  useDeleteNotifications,
  useCreateAdminNotification,
} from '../useNotifications';
import { invokeFunctionPost, invokeFunctionGet } from '../../src/lib/supabase-functions';

// Mock the supabase functions
vi.mock('../../src/lib/supabase-functions', () => ({
  invokeFunctionPost: vi.fn(),
  invokeFunctionGet: vi.fn(),
}));

const mockInvokeFunctionPost = vi.mocked(invokeFunctionPost);
const mockInvokeFunctionGet = vi.mocked(invokeFunctionGet);

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch notifications successfully', async () => {
    const mockResponse = {
      notifications: [
        {
          id: '1',
          practitioner_id: 'user-1',
          type: 'comment_reply' as const,
          title: 'Nova resposta',
          message: 'Alguém respondeu seu comentário',
          metadata: {},
          is_read: false,
          created_at: '2025-01-08T10:00:00Z',
          link: null,
        },
      ],
      pagination: {
        page: 0,
        hasMore: false,
        total: 1,
        unread_count: 1,
      },
    };

    mockInvokeFunctionPost.mockResolvedValueOnce(mockResponse);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      notifications: mockResponse.notifications,
      unread_count: 1,
      total_count: 1,
    });

    expect(mockInvokeFunctionPost).toHaveBeenCalledWith('manage-notifications', {
      operation: 'list',
      page: 0,
      limit: 20,
    });
  });

  it('should handle empty notifications list', async () => {
    const mockResponse = {
      notifications: [],
      pagination: {
        page: 0,
        hasMore: false,
        total: 0,
        unread_count: 0,
      },
    };

    mockInvokeFunctionPost.mockResolvedValueOnce(mockResponse);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      notifications: [],
      unread_count: 0,
      total_count: 0,
    });
  });

  it('should filter notifications by type', async () => {
    const mockResponse = {
      notifications: [
        {
          id: '1',
          practitioner_id: 'user-1',
          type: 'post_like' as const,
          title: 'Seu post recebeu um like',
          message: 'João curtiu seu post',
          metadata: {},
          is_read: false,
          created_at: '2025-01-08T10:00:00Z',
          link: null,
        },
      ],
      pagination: {
        page: 0,
        hasMore: false,
        total: 1,
        unread_count: 1,
      },
    };

    mockInvokeFunctionPost.mockResolvedValueOnce(mockResponse);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useNotifications({ type: 'post_like' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockInvokeFunctionPost).toHaveBeenCalledWith('manage-notifications', {
      operation: 'list',
      page: 0,
      limit: 20,
      type_filter: 'post_like',
    });
  });
});

describe('useNotificationCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch notification count successfully', async () => {
    const mockResponse = {
      unread_count: 5,
      total_count: 20,
    };

    mockInvokeFunctionGet.mockResolvedValueOnce(mockResponse);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useNotificationCount(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      unread_count: 5,
      total_count: 20,
    });

    expect(mockInvokeFunctionGet).toHaveBeenCalledWith('manage-notifications', {
      operation: 'count',
    });
  });

  it('should handle zero notifications', async () => {
    const mockResponse = {
      unread_count: 0,
      total_count: 0,
    };

    mockInvokeFunctionGet.mockResolvedValueOnce(mockResponse);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useNotificationCount(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      unread_count: 0,
      total_count: 0,
    });
  });
});

describe('useMarkNotificationsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark single notification as read', async () => {
    mockInvokeFunctionPost.mockResolvedValueOnce({ success: true });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMarkNotificationsRead(), { wrapper });

    result.current.mutate('notification-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockInvokeFunctionPost).toHaveBeenCalledWith('manage-notifications', {
      operation: 'mark_read',
      notification_ids: ['notification-1'],
    });
  });

  it('should mark multiple notifications as read', async () => {
    mockInvokeFunctionPost.mockResolvedValueOnce({ success: true });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMarkNotificationsRead(), { wrapper });

    result.current.mutate(['notification-1', 'notification-2']);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockInvokeFunctionPost).toHaveBeenCalledWith('manage-notifications', {
      operation: 'mark_read',
      notification_ids: ['notification-1', 'notification-2'],
    });
  });

  it('should handle mark as read error', async () => {
    mockInvokeFunctionPost.mockRejectedValueOnce(new Error('Network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMarkNotificationsRead(), { wrapper });

    result.current.mutate('notification-1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useDeleteNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete single notification', async () => {
    mockInvokeFunctionPost.mockResolvedValueOnce({ success: true });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useDeleteNotifications(), { wrapper });

    result.current.mutate('notification-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockInvokeFunctionPost).toHaveBeenCalledWith('manage-notifications', {
      operation: 'delete',
      notification_ids: ['notification-1'],
    });
  });

  it('should delete multiple notifications', async () => {
    mockInvokeFunctionPost.mockResolvedValueOnce({ success: true });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useDeleteNotifications(), { wrapper });

    result.current.mutate(['notification-1', 'notification-2']);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockInvokeFunctionPost).toHaveBeenCalledWith('manage-notifications', {
      operation: 'delete',
      notification_ids: ['notification-1', 'notification-2'],
    });
  });
});

describe('useCreateAdminNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create admin notification successfully', async () => {
    mockInvokeFunctionPost.mockResolvedValueOnce({ success: true });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateAdminNotification(), { wrapper });

    const notification = {
      recipient_id: 'user-1',
      title: 'Notificação importante',
      message: 'Esta é uma mensagem importante do administrador',
      metadata: { admin_custom: true },
    };

    result.current.mutate(notification);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockInvokeFunctionPost).toHaveBeenCalledWith('manage-notifications', {
      operation: 'create',
      ...notification,
      type: 'admin_custom',
    });
  });

  it('should handle admin notification creation error', async () => {
    mockInvokeFunctionPost.mockRejectedValueOnce(new Error('Unauthorized'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateAdminNotification(), { wrapper });

    const notification = {
      recipient_id: 'user-1',
      title: 'Test notification',
      message: 'Test message',
    };

    result.current.mutate(notification);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});