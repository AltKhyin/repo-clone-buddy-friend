
// ABOUTME: Consolidated hook for fetching all community page data (posts + sidebar) with enhanced performance and error handling.

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import type { CommunityPageResponse, CommunityPost, SidebarData } from '../../src/types/community';

export const useCommunityPageQuery = () => {
  return useInfiniteQuery({
    queryKey: ['community-page-data'],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('Fetching community page data, page:', pageParam);
      
      const { data, error } = await supabase.functions.invoke('get-community-page-data', {
        body: { page: pageParam, limit: 20 }
      });

      if (error) {
        console.error('Community page data fetch error:', error);
        // Enhanced error context for better debugging
        throw new Error(error.message || `Failed to fetch community page data (page: ${pageParam})`);
      }

      if (!data) {
        throw new Error('No data returned from community page endpoint');
      }

      console.log('Community page data fetched successfully:', data);
      return data as CommunityPageResponse;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage?.pagination?.hasMore) return undefined;
      return lastPage.pagination.page + 1;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - optimized for community freshness
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    select: (data) => {
      // Flatten all posts from all pages for infinite scroll
      const posts = data.pages.flatMap(page => page.posts || []);
      // Get sidebar data from the first page (consistent across pages)
      const sidebarData = data.pages[0]?.sidebarData;
      
      return {
        posts,
        sidebarData
      };
    },
    meta: {
      // Enhanced error context for debugging
      errorMessage: 'Failed to load community content'
    }
  });
};

// Clean type re-exports for backwards compatibility
export type { CommunityPageResponse, CommunityPost, SidebarData };
