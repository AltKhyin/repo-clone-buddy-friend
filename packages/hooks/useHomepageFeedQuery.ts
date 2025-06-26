
// ABOUTME: TanStack Query hook for fetching consolidated homepage feed data.

import { useQuery } from '@tanstack/react-query';
import { invokeFunctionGet } from '../../src/lib/supabase-functions';

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
      
      try {
        const data = await invokeFunctionGet<ConsolidatedHomepageData>('get-homepage-feed');
        console.log('Homepage data fetched successfully:', data);
        return data;
      } catch (error) {
        console.error('Homepage data fetch failed:', error);
        console.error('Error details:', {
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.error(`Homepage query retry ${failureCount}:`, error);
      console.error('Error type:', typeof error, 'Error:', error);
      return failureCount < 2;
    },
  });
};
