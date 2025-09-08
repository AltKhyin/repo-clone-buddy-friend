// ABOUTME: TanStack Query hooks for managing notifications with infinite pagination and optimistic updates

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invokeFunctionPost, invokeFunctionGet } from '../../src/lib/supabase-functions';

// Notification types from our Edge Function
export type NotificationType = 'comment_reply' | 'post_like' | 'comment_like' | 'new_review' | 'admin_custom';

export interface Notification {
  id: string;
  practitioner_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
  link?: string | null;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    hasMore: boolean;
    total: number;
    unread_count: number;
  };
}

export interface NotificationCountResponse {
  unread_count: number;
  total_count: number;
}

/**
 * Hook for fetching notifications with infinite pagination
 */
export const useNotifications = (options?: {
  includeRead?: boolean;
  type?: NotificationType;
}) => {
  return useInfiniteQuery({
    queryKey: ['notifications', { includeRead: options?.includeRead, type: options?.type }],
    queryFn: async ({ pageParam = 0 }) => {
      console.log(
        'Fetching notifications, page:',
        pageParam,
        'includeRead:',
        options?.includeRead,
        'type:',
        options?.type
      );

      const data = await invokeFunctionPost<NotificationListResponse>('manage-notifications', {
        operation: 'list',
        page: pageParam,
        limit: 20,
        ...(options?.includeRead !== undefined && { include_read: options.includeRead }),
        ...(options?.type && { type_filter: options.type }),
      });

      console.log('Notifications fetched successfully:', data);
      return data;
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // Enhanced safety checks to prevent undefined errors
      if (!lastPage || typeof lastPage !== 'object') {
        console.warn('getNextPageParam: lastPage is invalid:', lastPage);
        return undefined;
      }

      if (!lastPage.pagination || typeof lastPage.pagination !== 'object') {
        console.warn('getNextPageParam: pagination is invalid:', lastPage.pagination);
        return undefined;
      }

      if (!lastPage.pagination.hasMore) {
        console.log('getNextPageParam: No more notifications available');
        return undefined;
      }

      const nextPage = (lastPage.pagination.page ?? lastPageParam ?? 0) + 1;
      console.log('getNextPageParam: Next page will be:', nextPage);
      return nextPage;
    },
    initialPageParam: 0,
    staleTime: 30 * 1000, // 30 seconds - notifications should be fresh
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    refetchOnWindowFocus: true, // Refetch when user returns to app
    select: data => {
      // Enhanced safety checks for data.pages
      if (!data || !Array.isArray(data.pages)) {
        console.warn('select: data.pages is invalid:', data);
        return {
          notifications: [],
          unread_count: 0,
          total_count: 0,
        };
      }

      // Flatten all notifications from all pages for infinite scroll
      const notifications = data.pages.flatMap(page => {
        if (!page || !Array.isArray(page.notifications)) {
          console.warn('select: Invalid page data:', page);
          return [];
        }
        return page.notifications;
      });

      // Get unread count from the first page (consistent across pages)
      const unread_count = data.pages.length > 0 ? data.pages[0]?.pagination?.unread_count || 0 : 0;
      const total_count = data.pages.length > 0 ? data.pages[0]?.pagination?.total || 0 : 0;

      return {
        notifications,
        unread_count,
        total_count,
      };
    },
    meta: {
      // Enhanced error context for debugging
      errorMessage: 'Failed to load notifications',
    },
  });
};

/**
 * Hook for getting notification count (unread/total)
 */
export const useNotificationCount = () => {
  return useInfiniteQuery({
    queryKey: ['notification-count'],
    queryFn: async () => {
      const data = await invokeFunctionGet<NotificationCountResponse>('manage-notifications', {
        operation: 'count'
      });

      return data;
    },
    getNextPageParam: () => undefined, // No pagination for count
    initialPageParam: 0,
    staleTime: 10 * 1000, // 10 seconds - counts should be very fresh
    gcTime: 30 * 1000, // 30 seconds garbage collection
    refetchOnWindowFocus: true,
    select: data => {
      if (!data || !Array.isArray(data.pages) || data.pages.length === 0) {
        return { unread_count: 0, total_count: 0 };
      }
      
      return data.pages[0] || { unread_count: 0, total_count: 0 };
    }
  });
};

/**
 * Mutation for marking notifications as read
 */
export const useMarkNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds: string | string[]) => {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      
      await invokeFunctionPost('manage-notifications', {
        operation: 'mark_read',
        notification_ids: ids
      });

      return { success: true, ids };
    },
    onMutate: async (notificationIds) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      await queryClient.cancelQueries({ queryKey: ['notification-count'] });

      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData(['notifications']);
      const previousCount = queryClient.getQueryData(['notification-count']);

      // Optimistically update notifications to read
      queryClient.setQueriesData(
        { queryKey: ['notifications'], exact: false },
        (old: any) => {
          if (!old?.pages) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              notifications: page.notifications?.map((notification: Notification) => {
                if (ids.includes(notification.id)) {
                  return { ...notification, is_read: true };
                }
                return notification;
              }) || [],
              pagination: {
                ...page.pagination,
                unread_count: Math.max(0, (page.pagination?.unread_count || 0) - ids.length)
              }
            }))
          };
        }
      );

      // Optimistically update count
      queryClient.setQueriesData(
        { queryKey: ['notification-count'], exact: false },
        (old: any) => {
          if (!old?.pages) return old;
          
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              unread_count: Math.max(0, (page.unread_count || 0) - ids.length)
            }))
          };
        }
      );

      return { previousNotifications, previousCount };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(['notification-count'], context.previousCount);
      }
    },
    onSettled: () => {
      // Always refetch after mutation to sync with server
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });
};

/**
 * Mutation for deleting notifications
 */
export const useDeleteNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds: string | string[]) => {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      
      await invokeFunctionPost('manage-notifications', {
        operation: 'delete',
        notification_ids: ids
      });

      return { success: true, ids };
    },
    onMutate: async (notificationIds) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      await queryClient.cancelQueries({ queryKey: ['notification-count'] });

      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData(['notifications']);
      const previousCount = queryClient.getQueryData(['notification-count']);

      // Count unread notifications being deleted
      let deletedUnreadCount = 0;
      queryClient.getQueriesData({ queryKey: ['notifications'], exact: false }).forEach(([, old]: any) => {
        if (old?.pages) {
          old.pages.forEach((page: any) => {
            page.notifications?.forEach((notification: Notification) => {
              if (ids.includes(notification.id) && !notification.is_read) {
                deletedUnreadCount++;
              }
            });
          });
        }
      });

      // Optimistically remove notifications
      queryClient.setQueriesData(
        { queryKey: ['notifications'], exact: false },
        (old: any) => {
          if (!old?.pages) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              notifications: page.notifications?.filter((notification: Notification) => 
                !ids.includes(notification.id)
              ) || [],
              pagination: {
                ...page.pagination,
                total: Math.max(0, (page.pagination?.total || 0) - ids.length),
                unread_count: Math.max(0, (page.pagination?.unread_count || 0) - deletedUnreadCount)
              }
            }))
          };
        }
      );

      // Optimistically update count
      queryClient.setQueriesData(
        { queryKey: ['notification-count'], exact: false },
        (old: any) => {
          if (!old?.pages) return old;
          
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              total_count: Math.max(0, (page.total_count || 0) - ids.length),
              unread_count: Math.max(0, (page.unread_count || 0) - deletedUnreadCount)
            }))
          };
        }
      );

      return { previousNotifications, previousCount };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(['notification-count'], context.previousCount);
      }
    },
    onSettled: () => {
      // Always refetch after mutation to sync with server
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });
};

/**
 * Mutation for creating custom admin notifications
 */
export const useCreateAdminNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: {
      recipient_id: string;
      title: string;
      message: string;
      metadata?: Record<string, any>;
    }) => {
      await invokeFunctionPost('manage-notifications', {
        operation: 'create',
        ...notification,
        type: 'admin_custom'
      });

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate notifications for the recipient
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });
};

// Clean type re-exports
export type { NotificationListResponse, NotificationCountResponse };