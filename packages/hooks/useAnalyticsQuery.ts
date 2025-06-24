
// ABOUTME: TanStack Query hooks for admin analytics data fetching via Edge Functions

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  userStats: {
    totalUsers: number;
    activeToday: number;
    newThisWeek: number;
    premiumUsers: number;
  };
  contentStats: {
    totalReviews: number;
    publishedReviews: number;
    draftReviews: number;
    totalPosts: number;
  };
  engagementStats: {
    totalViews: number;
    totalVotes: number;
    avgEngagement: number;
    topContent: Array<{
      id: number;
      title: string;
      views: number;
      type: 'review' | 'post';
    }>;
  };
  systemStats: {
    dbSize: string;
    apiCalls: number;
    errorRate: number;
    uptime: string;
  };
}

export const useAnalyticsQuery = () => {
  return useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async (): Promise<AnalyticsData> => {
      console.log('Fetching analytics data via Edge Function...');
      
      // Use Edge Function instead of direct RPC calls per Blueprint 09
      const { data, error } = await supabase.functions.invoke('get-analytics-dashboard-data');
      
      if (error) {
        console.error('Error fetching analytics via Edge Function:', error);
        throw new Error(`Analytics fetch failed: ${error.message}`);
      }

      return data as AnalyticsData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.error('Analytics query failed:', error);
      return failureCount < 2;
    }
  });
};

export const useAnalyticsExportMutation = () => {
  return useQuery({
    queryKey: ['analytics-export'],
    queryFn: async () => {
      console.log('Exporting analytics data via Edge Function...');
      
      // Use Edge Function for exports as well
      const { data, error } = await supabase.functions.invoke('get-analytics-dashboard-data', {
        body: { export: true }
      });
      
      if (error) {
        console.error('Error exporting analytics:', error);
        throw error;
      }
      
      return data;
    },
    enabled: false, // Only run when explicitly called
    staleTime: 0, // Always fresh for exports
  });
};
