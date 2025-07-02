// ABOUTME: Mutation hook for updating review tags with optimistic updates and cache invalidation
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UpdateReviewTagsPayload {
  reviewId: number;
  tagIds: number[];
}

const updateReviewTags = async ({ reviewId, tagIds }: UpdateReviewTagsPayload) => {
  // First, remove all existing tags for this review
  const { error: deleteError } = await supabase
    .from('ReviewTags')
    .delete()
    .eq('review_id', reviewId);

  if (deleteError) {
    throw new Error(`Failed to remove existing tags: ${deleteError.message}`);
  }

  // Then, insert new tags if any are provided
  if (tagIds.length > 0) {
    const reviewTags = tagIds.map(tagId => ({
      review_id: reviewId,
      tag_id: tagId,
    }));

    const { error: insertError } = await supabase.from('ReviewTags').insert(reviewTags);

    if (insertError) {
      throw new Error(`Failed to add new tags: ${insertError.message}`);
    }
  }

  return { reviewId, tagIds };
};

export const useUpdateReviewTagsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateReviewTags,
    onSuccess: ({ reviewId }) => {
      // Invalidate review-specific queries
      queryClient.invalidateQueries({
        queryKey: ['review-management', reviewId],
      });

      // Invalidate general tag queries to update usage counts
      queryClient.invalidateQueries({
        queryKey: ['tags'],
      });

      // Invalidate admin tag queries if they exist
      queryClient.invalidateQueries({
        queryKey: ['admin', 'tags'],
      });
    },
    onError: error => {
      console.error('Failed to update review tags:', error);
    },
  });
};
