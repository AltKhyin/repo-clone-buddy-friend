// ABOUTME: TanStack Query mutation hook for creating review comments with smart community post integration

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import { useCreateCommentMutation } from './useCreateCommentMutation';
import { useAuthStore } from '../../src/store/auth';

interface CreateReviewCommentPayload {
  content: string;
  reviewId: number;
}

interface ReviewData {
  id: number;
  title: string;
  community_post_id: number | null;
  author_id: string | null;
}

/**
 * Creates a community post for a review to enable commenting
 */
const createCommunityPostForReview = async (reviewData: ReviewData): Promise<number> => {
  console.log(`🏗️ REVIEW COMMENTS: Creating community post for review ${reviewData.id}`);
  
  // Create community post via edge function
  const { data, error } = await supabase.functions.invoke('create-community-post', {
    body: {
      title: `Discussão: ${reviewData.title}`,
      content: `Área de discussão para o review "${reviewData.title}". Participe da conversa!`,
      category: 'review-discussion',
      post_type: 'text',
      // Link this post to the review via metadata or custom fields
      review_id: reviewData.id, // This will be handled by the edge function
    }
  });

  if (error) {
    throw new Error(`Failed to create community post: ${error.message}`);
  }

  if (!data?.data?.post_id && !data?.post_id) {
    throw new Error('Community post creation returned no post ID');
  }

  const communityPostId = data?.data?.post_id || data?.post_id;

  // Update the review to link to the new community post
  const { error: updateError } = await supabase
    .from('Reviews')
    .update({ community_post_id: communityPostId })
    .eq('id', reviewData.id);

  if (updateError) {
    console.error(`Failed to link review ${reviewData.id} to community post ${communityPostId}:`, updateError);
    // Don't throw here - the post was created successfully, the link just failed
    // The comment can still be created on the community post
  } else {
    console.log(`✅ REVIEW COMMENTS: Linked review ${reviewData.id} to community post ${communityPostId}`);
  }

  return communityPostId;
};

/**
 * Fetches review data needed for comment creation
 */
const fetchReviewData = async (reviewId: number): Promise<ReviewData> => {
  const { data, error } = await supabase
    .from('Reviews')
    .select('id, title, community_post_id, author_id')
    .eq('id', reviewId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch review: ${error.message}`);
  }

  return data as ReviewData;
};

/**
 * Custom hook for creating comments on reviews.
 * Handles both scenarios: reviews with existing community posts and reviews that need community posts created.
 */
export const useCreateReviewCommentMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const createCommentMutation = useCreateCommentMutation();

  return useMutation({
    mutationFn: async (payload: CreateReviewCommentPayload) => {
      console.log(`💬 REVIEW COMMENTS: Creating comment for review ${payload.reviewId}`);

      // Fetch review data to determine strategy
      const reviewData = await fetchReviewData(payload.reviewId);

      let communityPostId = reviewData.community_post_id;

      // If review doesn't have a community post, create one
      if (!communityPostId) {
        console.log(`🚀 REVIEW COMMENTS: Review ${payload.reviewId} has no community post, creating one`);
        communityPostId = await createCommunityPostForReview(reviewData);
      } else {
        console.log(`✅ REVIEW COMMENTS: Using existing community post ${communityPostId} for review ${payload.reviewId}`);
      }

      // Create the comment on the community post using existing system
      const result = await createCommentMutation.mutateAsync({
        content: payload.content,
        parent_post_id: communityPostId,
        root_post_id: communityPostId,
        category: 'comment',
      });

      // Return both the result and the community post ID for cache invalidation
      return {
        ...result,
        communityPostId
      };
    },

    // No optimistic updates for now - focus on fast cache invalidation
    onMutate: async (variables) => {
      console.log(`🔄 REVIEW COMMENTS: Preparing to create comment for review ${variables.reviewId}`);
      // Just cancel any outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ 
        queryKey: ['reviewComments', variables.reviewId] 
      });
    },

    // Success handling with immediate cache invalidation
    onSuccess: (data, variables, context) => {
      console.log(`✅ REVIEW COMMENTS: Comment created successfully for review ${variables.reviewId}`, data);

      // Invalidate queries immediately without awaiting to prevent loading state issues
      queryClient.invalidateQueries({ 
        queryKey: ['reviewComments', variables.reviewId],
        refetchType: 'active'
      });
      
      // Also invalidate the community post cache if we have the communityPostId
      if (data?.communityPostId) {
        queryClient.invalidateQueries({ 
          queryKey: ['postWithComments', data.communityPostId],
          refetchType: 'active'
        });
      }
      
      // Also invalidate the base review data query in case community_post_id was updated
      queryClient.invalidateQueries({ 
        queryKey: ['reviewData', variables.reviewId],
        refetchType: 'active'
      });

      console.log(`🔄 REVIEW COMMENTS: Cache invalidated for review ${variables.reviewId}`);
    },

    // Error handling
    onError: (error, variables, context) => {
      console.error(`❌ REVIEW COMMENTS: Failed to create comment for review ${variables.reviewId}:`, error);
      // No rollback needed since we're not doing optimistic updates
    },

    // Cleanup on settle
    onSettled: (data, error, variables) => {
      if (error) {
        // Refetch on error to get correct state
        queryClient.refetchQueries({ 
          queryKey: ['reviewComments', variables.reviewId],
          type: 'active'
        });
      }
    },

    // Retry configuration
    retry: (failureCount, error) => {
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403') ||
            error.message.includes('400') || error.message.includes('422')) {
          return false;
        }
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });
};