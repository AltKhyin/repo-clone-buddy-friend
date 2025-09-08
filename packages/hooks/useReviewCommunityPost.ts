// ABOUTME: TanStack Query hook for fetching a review's associated community post with admin fields

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

// Interface for the community post data with admin fields
export interface ReviewCommunityPost {
  id: number;
  title: string;
  content?: string;
  category: string;
  post_type: 'text' | 'image' | 'video' | 'poll' | 'link';
  // Admin-specific fields
  post_status: 'draft' | 'published' | 'scheduled' | 'hidden';
  visibility_level: 'public' | 'hidden';
  scheduled_publish_at?: string;
  admin_created_by?: string;
  admin_notes?: string;
  // Multimedia fields
  image_url?: string;
  video_url?: string;
  poll_data?: Record<string, any>;
  link_url?: string;
  link_preview_data?: Record<string, any>;
  // Metadata
  created_at: string;
  // Review relationship
  review_id: number;
  author_id: string; // Original author of the post
  // Author information
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  // Admin information
  admin_creator?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

const fetchReviewCommunityPost = async (reviewId: number): Promise<ReviewCommunityPost | null> => {
  // First try to find community post by review_id
  const { data: communityPost, error } = await supabase
    .from('CommunityPosts')
    .select(`
      id,
      title,
      content,
      category,
      post_type,
      post_status,
      visibility_level,
      scheduled_publish_at,
      admin_created_by,
      admin_notes,
      image_url,
      video_url,
      poll_data,
      link_url,
      link_preview_data,
      created_at,
      review_id,
      author_id,
      author:Practitioners!CommunityPosts_author_id_fkey(id, full_name, avatar_url),
      admin_creator:Practitioners!CommunityPosts_admin_created_by_fkey(id, full_name, avatar_url)
    `)
    .eq('review_id', reviewId)
    .single();

  if (error) {
    // If no community post found, return null (this is expected for reviews without posts)
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch community post: ${error.message}`);
  }

  return communityPost as ReviewCommunityPost;
};

// Alternative approach: find by review's community_post_id field
const fetchReviewCommunityPostByReference = async (reviewId: number): Promise<ReviewCommunityPost | null> => {
  // First get the review to find its community_post_id
  const { data: review, error: reviewError } = await supabase
    .from('Reviews')
    .select('community_post_id')
    .eq('id', reviewId)
    .single();

  if (reviewError) {
    throw new Error(`Failed to fetch review: ${reviewError.message}`);
  }

  // If no community post linked, return null
  if (!review.community_post_id) {
    return null;
  }

  // Fetch the community post
  const { data: communityPost, error } = await supabase
    .from('CommunityPosts')
    .select(`
      id,
      title,
      content,
      category,
      post_type,
      post_status,
      visibility_level,
      scheduled_publish_at,
      admin_created_by,
      admin_notes,
      image_url,
      video_url,
      poll_data,
      link_url,
      link_preview_data,
      created_at,
      review_id,
      author_id,
      author:Practitioners!CommunityPosts_author_id_fkey(id, full_name, avatar_url),
      admin_creator:Practitioners!CommunityPosts_admin_created_by_fkey(id, full_name, avatar_url)
    `)
    .eq('id', review.community_post_id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch community post: ${error.message}`);
  }

  return communityPost as ReviewCommunityPost;
};

export const useReviewCommunityPost = (reviewId: number | undefined, method: 'by_review_id' | 'by_reference' = 'by_review_id') => {
  return useQuery({
    queryKey: ['review-community-post', reviewId, method],
    queryFn: () => {
      if (!reviewId) return null;
      
      if (method === 'by_reference') {
        return fetchReviewCommunityPostByReference(reviewId);
      } else {
        return fetchReviewCommunityPost(reviewId);
      }
    },
    enabled: !!reviewId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Convenience hook that checks both methods and returns the most reliable result
export const useReviewCommunityPostRobust = (reviewId: number | undefined) => {
  const byReviewIdQuery = useReviewCommunityPost(reviewId, 'by_review_id');
  const byReferenceQuery = useReviewCommunityPost(reviewId, 'by_reference');

  return {
    data: byReviewIdQuery.data || byReferenceQuery.data,
    isLoading: byReviewIdQuery.isLoading || byReferenceQuery.isLoading,
    error: byReviewIdQuery.error || byReferenceQuery.error,
    refetch: () => {
      byReviewIdQuery.refetch();
      byReferenceQuery.refetch();
    },
  };
};

// Helper hook to check if a review has an associated community post
export const useHasReviewCommunityPost = (reviewId: number | undefined) => {
  const query = useReviewCommunityPost(reviewId);
  
  return {
    hasPost: !!query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
};