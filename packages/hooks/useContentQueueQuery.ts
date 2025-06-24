
// ABOUTME: TanStack Query hook for fetching paginated content queue with filtering and search capabilities

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

export interface ContentQueueParams {
  status?: 'all' | 'draft' | 'under_review' | 'scheduled' | 'published' | 'archived';
  search?: string;
  authorId?: string;
  reviewerId?: string;
}

export interface ReviewQueueItem {
  id: number;
  title: string;
  description?: string;
  review_status: string;
  status: string;
  created_at: string;
  published_at?: string;
  scheduled_publish_at?: string;
  review_requested_at?: string;
  reviewed_at?: string;
  access_level: string;
  author_id?: string;
  reviewer_id?: string;
  publication_notes?: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  reviewer?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface ContentQueueResponse {
  reviews: ReviewQueueItem[];
  posts: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  stats: {
    totalReviews: number;
    totalPosts: number;
  };
}

const fetchContentQueue = async (params: ContentQueueParams & { page: number }): Promise<ContentQueueResponse> => {
  console.log('Fetching content queue...', params);
  
  const { data, error } = await supabase.functions.invoke('admin-get-content-queue', {
    body: {
      page: params.page,
      limit: 20,
      status: params.status || 'all',
      search: params.search || '',
      authorId: params.authorId,
      reviewerId: params.reviewerId,
    },
  });

  if (error) {
    console.error('Content queue fetch error:', error);
    throw new Error(`Failed to fetch content queue: ${error.message}`);
  }

  return data;
};

export const useContentQueueQuery = (params: ContentQueueParams) => {
  return useInfiniteQuery({
    queryKey: ['admin', 'content-queue', params],
    queryFn: ({ pageParam = 1 }) => fetchContentQueue({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.error('Content queue query failed:', error);
      return failureCount < 2;
    }
  });
};
