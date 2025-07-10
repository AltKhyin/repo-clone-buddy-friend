// ABOUTME: Consolidated hook for fetching all community page data (posts + sidebar) with enhanced performance and error handling.

import { useInfiniteQuery } from '@tanstack/react-query';
import { invokeFunctionPost } from '../../src/lib/supabase-functions';
import type { CommunityPageResponse, CommunityPost, SidebarData } from '../../src/types/community';

export const useCommunityPageQuery = (options?: {
  postId?: number;
  categoryId?: string | null;
}) => {
  return useInfiniteQuery({
    queryKey: ['community-page-data', { postId: options?.postId, categoryId: options?.categoryId }],
    queryFn: async ({ pageParam = 0 }) => {
      console.log(
        'Fetching community page data, page:',
        pageParam,
        'postId:',
        options?.postId,
        'categoryId:',
        options?.categoryId
      );

      const data = await invokeFunctionPost<CommunityPageResponse>('get-community-page-data', {
        page: pageParam,
        limit: 20,
        ...(options?.postId && { postId: options.postId }),
        ...(options?.categoryId && { categoryId: options.categoryId }),
      });

      console.log('Community page data fetched successfully:', data);
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
        console.log('getNextPageParam: No more pages available');
        return undefined;
      }

      const nextPage = (lastPage.pagination.page ?? lastPageParam ?? 0) + 1;
      console.log('getNextPageParam: Next page will be:', nextPage);
      return nextPage;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - optimized for community freshness
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    select: data => {
      // Enhanced safety checks for data.pages
      if (!data || !Array.isArray(data.pages)) {
        console.warn('select: data.pages is invalid:', data);
        return {
          posts: [],
          sidebarData: null,
        };
      }

      // Flatten all posts from all pages for infinite scroll
      const posts = data.pages.flatMap(page => {
        if (!page || !Array.isArray(page.posts)) {
          console.warn('select: Invalid page data:', page);
          return [];
        }
        return page.posts;
      });

      // Get sidebar data from the first page (consistent across pages)
      const sidebarData = data.pages.length > 0 ? data.pages[0]?.sidebarData : null;

      return {
        posts,
        sidebarData,
      };
    },
    meta: {
      // Enhanced error context for debugging
      errorMessage: 'Failed to load community content',
    },
  });
};

// Clean type re-exports for backwards compatibility
export type { CommunityPageResponse, CommunityPost, SidebarData };
