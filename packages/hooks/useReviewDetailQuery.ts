
// ABOUTME: TanStack Query hook for fetching individual review details by slug with enhanced error handling and RLS enforcement.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

export interface ReviewAuthor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface ReviewDetail {
  id: number;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  structured_content: any;
  published_at: string;
  author: ReviewAuthor | null;
  access_level: string;
  community_post_id: number | null;
  view_count: number | null;
  tags: string[];
}

const fetchReviewBySlug = async (slug: string): Promise<ReviewDetail> => {
  console.log('Fetching review detail for slug:', slug);
  
  const { data, error } = await supabase.functions.invoke('get-review-by-slug', {
    body: { slug }
  });

  if (error) {
    console.error('Review detail fetch error:', error);
    throw new Error(error.message || 'Failed to fetch review details');
  }

  if (data?.error) {
    console.error('Review detail API error:', data.error);
    
    if (data.error.code === 'REVIEW_NOT_FOUND') {
      throw new Error('Review not found');
    }
    
    if (data.error.code === 'ACCESS_DENIED') {
      throw new Error(`Access denied. This content requires: ${data.error.required_tier}`);
    }
    
    throw new Error(data.error.message || 'Failed to fetch review details');
  }

  console.log('Review detail fetched successfully:', data.title);
  return data;
};

export const useReviewDetailQuery = (slug: string | undefined) => {
  return useQuery<ReviewDetail>({
    queryKey: ['review-detail', slug],
    queryFn: () => {
      if (!slug) {
        throw new Error('Review slug is required');
      }
      return fetchReviewBySlug(slug);
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes - reviews don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 404 or 403 errors
      if (error.message.includes('not found') || error.message.includes('Access denied')) {
        return false;
      }
      return failureCount < 3;
    }
  });
};
