
// ABOUTME: TanStack Query hook for fetching consolidated homepage feed data.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

export interface HomepageReview {
  id: number;
  title: string;
  description: string;
  cover_image_url: string | null;
  published_at: string;
  view_count: number;
}

export interface HomepageSuggestion {
  id: number;
  title: string;
  description: string | null;
  upvotes: number;
  created_at: string;
  Practitioners: { full_name: string } | null;
  user_has_voted?: boolean;
}

// Export alias for backward compatibility
export type Suggestion = HomepageSuggestion;

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  subscription_tier: string;
}

export interface ConsolidatedHomepageData {
  layout: string[];
  featured: HomepageReview | null;
  recent: HomepageReview[];
  popular: HomepageReview[];
  recommendations: HomepageReview[];
  suggestions: HomepageSuggestion[];
  userProfile: UserProfile | null;
  notificationCount: number;
}

export const useConsolidatedHomepageFeedQuery = () => {
  return useQuery<ConsolidatedHomepageData>({
    queryKey: ['consolidated-homepage-feed'],
    queryFn: async () => {
      console.log('Fetching consolidated homepage data...');
      
      const { data, error } = await supabase.functions.invoke('get-homepage-feed', {
        body: {}
      });

      if (error) {
        console.error('Homepage feed error:', error);
        throw new Error(error.message || 'Failed to fetch homepage data');
      }

      if (data?.error) {
        console.error('Homepage feed API error:', data.error);
        throw new Error(data.error.details || data.error || 'Failed to fetch homepage data');
      }

      console.log('Homepage data fetched successfully:', data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.log(`Homepage query retry ${failureCount}:`, error);
      return failureCount < 2;
    },
  });
};
