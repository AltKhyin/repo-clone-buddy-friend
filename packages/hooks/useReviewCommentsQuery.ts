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
 * Fetches review comments ONLY if review has an associated community post.
 * Returns null if no community post exists, hiding the comment section.
 * Supports both public and hidden community posts (hidden posts show comments but not in feed).
 * 
 * @param reviewId The ID of the review to fetch comments for
 * @returns ReviewCommentsData if community post exists, null otherwise
 */
export const useReviewCommentsQuery = (reviewId: number | undefined) => {
  // First, check if review has an associated community post (either by community_post_id or review_id)
  const communityPostCheckQuery = useQuery({
    queryKey: ['reviewCommunityPostCheck', reviewId],
    queryFn: async (): Promise<{ postId: number | null }> => {
      if (!reviewId) return { postId: null };

      // Method 1: Check by review's community_post_id field
      const { data: reviewData } = await supabase
        .from('Reviews')
        .select('community_post_id')
        .eq('id', reviewId)
        .single();

      if (reviewData?.community_post_id) {
        return { postId: reviewData.community_post_id };
      }

      // Method 2: Check for community post with this review_id (admin-created posts)
      const { data: communityPost } = await supabase
        .from('CommunityPosts')
        .select('id')
        .eq('review_id', reviewId)
        .single();

      return { postId: communityPost?.id || null };
    },
    enabled: !!reviewId && reviewId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - community post association doesn't change often
    gcTime: 10 * 60 * 1000,
  });

  // If no community post found, return null (no comments)
  const communityPostId = communityPostCheckQuery.data?.postId;

  // Fetch community post comments only if community post exists
  const communityPostQuery = usePostWithCommentsQuery(communityPostId || 0);

  // Main query that returns comments data only if community post exists
  return useQuery({
    queryKey: ['reviewComments', reviewId],
    queryFn: async (): Promise<ReviewCommentsData | null> => {
      if (!communityPostId) {
        console.log(`🔄 REVIEW COMMENTS: No community post found for review ${reviewId} - hiding comment section`);
        return null;
      }

      if (!communityPostQuery.data) {
        throw new Error('Community post data not available');
      }

      console.log(`🔄 REVIEW COMMENTS: Using community post ${communityPostId} for review ${reviewId}`);
      
      return {
        post: communityPostQuery.data.post,
        comments: communityPostQuery.data.comments
      };
    },
    enabled: !!reviewId && communityPostCheckQuery.data !== undefined && 
             (!communityPostId || !!communityPostQuery.data),
    
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