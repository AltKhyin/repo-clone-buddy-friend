
// ABOUTME: TanStack Query hooks for advanced analytics data via specialized Edge Functions

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  granularity?: 'daily' | 'weekly' | 'monthly';
  userId?: string;
}

interface ContentAnalyticsFilters extends AnalyticsFilters {
  contentType?: 'reviews' | 'community_posts' | 'all';
}

// Hook for user analytics
export const useUserAnalyticsQuery = (
  type: 'growth' | 'engagement' | 'roles' | 'activity' | 'geographic' | 'comprehensive',
  filters?: AnalyticsFilters
) => {
  return useQuery({
    queryKey: ['admin-analytics', 'users', type, filters],
    queryFn: async () => {
      console.log('Fetching user analytics via Edge Function...', { type, filters });
      
      const params = new URLSearchParams();
      params.append('type', type);
      if (filters?.startDate) params.append('start_date', filters.startDate);
      if (filters?.endDate) params.append('end_date', filters.endDate);
      if (filters?.granularity) params.append('granularity', filters.granularity);
      if (filters?.userId) params.append('user_id', filters.userId);

      const { data, error } = await supabase.functions.invoke('admin-user-analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: params.toString()
      });
      
      if (error) {
        console.error('Error fetching user analytics:', error);
        throw new Error(`Failed to fetch user analytics: ${error.message}`);
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (analytics can be slightly stale)
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.error('User analytics query failed:', error);
      return failureCount < 2;
    }
  });
};

// Hook for content analytics
export const useContentAnalyticsQuery = (
  type: 'performance' | 'trends' | 'authors' | 'categories' | 'workflow' | 'comprehensive',
  filters?: ContentAnalyticsFilters
) => {
  return useQuery({
    queryKey: ['admin-analytics', 'content', type, filters],
    queryFn: async () => {
      console.log('Fetching content analytics via Edge Function...', { type, filters });
      
      const params = new URLSearchParams();
      params.append('type', type);
      if (filters?.contentType) params.append('content_type', filters.contentType);
      if (filters?.startDate) params.append('start_date', filters.startDate);
      if (filters?.endDate) params.append('end_date', filters.endDate);
      if (filters?.granularity) params.append('granularity', filters.granularity);

      const { data, error } = await supabase.functions.invoke('admin-content-analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: params.toString()
      });
      
      if (error) {
        console.error('Error fetching content analytics:', error);
        throw new Error(`Failed to fetch content analytics: ${error.message}`);
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.error('Content analytics query failed:', error);
      return failureCount < 2;
    }
  });
};

// Hook for bulk content operations
export const useBulkContentMutation = () => {
  return useMutation({
    mutationFn: async (payload: {
      action: 'bulk_approve' | 'bulk_reject' | 'bulk_archive' | 'bulk_delete' | 'bulk_publish' | 'bulk_tag';
      contentIds: number[];
      contentType: 'reviews' | 'community_posts';
      metadata?: {
        tagIds?: number[];
        publishDate?: string;
        reason?: string;
      };
    }) => {
      console.log('Performing bulk content operation...', payload);
      
      const { data, error } = await supabase.functions.invoke('admin-bulk-content-actions', {
        body: payload
      });
      
      if (error) {
        console.error('Error performing bulk operation:', error);
        throw new Error(`Bulk operation failed: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Bulk operation completed:', data);
    },
    onError: (error) => {
      console.error('Bulk operation failed:', error);
    }
  });
};

// Hook for comprehensive dashboard analytics (combines user + content analytics)
export const useDashboardAnalyticsQuery = (filters?: AnalyticsFilters) => {
  return useQuery({
    queryKey: ['admin-analytics', 'dashboard', filters],
    queryFn: async () => {
      console.log('Fetching comprehensive dashboard analytics...');
      
      // Fetch both user and content comprehensive analytics in parallel
      const [userAnalytics, contentAnalytics] = await Promise.all([
        supabase.functions.invoke('admin-user-analytics', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: new URLSearchParams({
            type: 'comprehensive',
            start_date: filters?.startDate || '',
            end_date: filters?.endDate || '',
            granularity: filters?.granularity || 'daily'
          }).toString()
        }),
        supabase.functions.invoke('admin-content-analytics', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: new URLSearchParams({
            type: 'comprehensive',
            content_type: 'all',
            start_date: filters?.startDate || '',
            end_date: filters?.endDate || '',
            granularity: filters?.granularity || 'daily'
          }).toString()
        })
      ]);

      if (userAnalytics.error) {
        throw new Error(`User analytics failed: ${userAnalytics.error.message}`);
      }

      if (contentAnalytics.error) {
        throw new Error(`Content analytics failed: ${contentAnalytics.error.message}`);
      }

      return {
        userAnalytics: userAnalytics.data,
        contentAnalytics: contentAnalytics.data,
        generatedAt: new Date().toISOString()
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.error('Dashboard analytics query failed:', error);
      return failureCount < 2;
    }
  });
};
