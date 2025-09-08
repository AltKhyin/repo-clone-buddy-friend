// ABOUTME: TanStack Query hook for fetching review comments with seamless community post integration

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import { usePostWithCommentsQuery } from './usePostWithCommentsQuery';
import type { CommunityPost } from '../../src/types/community';

interface ReviewCommentsData {
  post: CommunityPost;
  comments: CommunityPost[];
}

interface ReviewData {
  id: number;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  published_at: string;
  author: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  } | null;
  community_post_id: number | null;
}

/**
 * Fetches review data to determine if it has an associated community post
 */
const fetchReviewData = async (reviewId: number): Promise<ReviewData> => {
  const { data, error } = await supabase
    .from('Reviews')
    .select(`
      id,
      title,
      description,
      cover_image_url,
      published_at,
      community_post_id,
      author:Practitioners!Reviews_author_id_fkey(
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('id', reviewId)
    .eq('status', 'published')
    .single();

  if (error) {
    throw new Error(`Failed to fetch review: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Review with ID ${reviewId} not found`);
  }

  return data as ReviewData;
};

/**
 * Creates a virtual community post structure from review data
 */
const createVirtualReviewPost = (reviewData: ReviewData): ReviewCommentsData => {
  // Map review data to CommunityPost interface
  const virtualPost: CommunityPost = {
    id: reviewData.id,
    title: reviewData.title,
    content: reviewData.description || `Discussão sobre: ${reviewData.title}`,
    category: 'review-discussion',
    category_id: 0,
    upvotes: 0,
    downvotes: 0,
    created_at: reviewData.published_at,
    updated_at: reviewData.published_at,
    is_pinned: true, // Review discussions are always "pinned" to the review
    is_locked: false,
    flair_text: 'Review',
    flair_color: 'blue',
    image_url: reviewData.cover_image_url,
    post_type: 'text' as const,
    author_id: reviewData.author?.id,
    author: reviewData.author ? {
      id: reviewData.author.id,
      full_name: reviewData.author.full_name,
      avatar_url: reviewData.author.avatar_url || undefined,
    } : undefined,
    user_vote: null,
    reply_count: 0,
    is_saved: false,
    user_can_moderate: false,
    is_rewarded: false,
    parent_post_id: null,
    nesting_level: 0,
  };

  // Return empty comments array - will be populated when comments are added
  return {
    post: virtualPost,
    comments: []
  };
};

/**
 * Fetches review comments with smart data source switching.
 * Uses community post system if review has community_post_id, otherwise creates virtual post structure.
 * 
 * @param reviewId The ID of the review to fetch comments for
 * @returns ReviewCommentsData in identical format to usePostWithCommentsQuery
 */
export const useReviewCommentsQuery = (reviewId: number | undefined) => {
  // First, fetch review data to determine if it has community_post_id
  const reviewDataQuery = useQuery({
    queryKey: ['reviewData', reviewId],
    queryFn: () => fetchReviewData(reviewId!),
    enabled: !!reviewId && reviewId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - review data doesn't change often
    gcTime: 10 * 60 * 1000,
  });

  // If review has community_post_id, use existing community post system
  const communityPostQuery = usePostWithCommentsQuery(
    reviewDataQuery.data?.community_post_id || 0
  );

  // Main query that returns unified data structure
  return useQuery({
    queryKey: ['reviewComments', reviewId],
    queryFn: async (): Promise<ReviewCommentsData> => {
      if (!reviewDataQuery.data) {
        throw new Error('Review data not available');
      }

      // Strategy: Smart data source switching
      if (reviewDataQuery.data.community_post_id) {
        // Use existing community post system
        console.log(`🔄 REVIEW COMMENTS: Using community post ${reviewDataQuery.data.community_post_id} for review ${reviewId}`);
        
        if (!communityPostQuery.data) {
          throw new Error('Community post data not available');
        }
        
        return {
          post: communityPostQuery.data.post,
          comments: communityPostQuery.data.comments
        };
      } else {
        // Create virtual review post structure
        console.log(`🔄 REVIEW COMMENTS: Using virtual post structure for review ${reviewId}`);
        return createVirtualReviewPost(reviewDataQuery.data);
      }
    },
    enabled: !!reviewId && !!reviewDataQuery.data && 
             ((!reviewDataQuery.data.community_post_id) || !!communityPostQuery.data),
    
    // Performance optimizations matching usePostWithCommentsQuery
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    
    // Reliability optimizations 
    retry: (failureCount, error) => {
      if (error instanceof Error) {
        if (error.message.includes('not found') || 
            error.message.includes('404') || 
            error.message.includes('403')) {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
    
    // UX optimizations
    refetchOnWindowFocus: true,
    refetchOnMount: 'stale',
    refetchInterval: false,
    refetchOnReconnect: true,
    refetchIntervalInBackground: false,
    
    meta: {
      errorMessage: `Failed to load comments for review: ${reviewId}`,
    },
  });
};