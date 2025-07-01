// ABOUTME: TanStack Query mutation for updating review metadata

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

interface UpdateMetadataData {
  reviewId: number;
  metadata: {
    title?: string;
    description?: string;
    access_level?: string;
    cover_image_url?: string;
    tags?: number[];
  };
}

const updateReviewMetadata = async ({ reviewId, metadata }: UpdateMetadataData) => {
  const { tags, ...reviewData } = metadata;

  // Update review metadata
  const { error: reviewError } = await supabase
    .from('Reviews')
    .update(reviewData)
    .eq('id', reviewId);

  if (reviewError) {
    throw new Error(`Failed to update review: ${reviewError.message}`);
  }

  // Update tags if provided
  if (tags !== undefined) {
    // Remove existing tags
    await supabase.from('ReviewTags').delete().eq('review_id', reviewId);

    // Add new tags
    if (tags.length > 0) {
      const tagInserts = tags.map(tagId => ({
        review_id: reviewId,
        tag_id: tagId,
      }));

      const { error: tagsError } = await supabase.from('ReviewTags').insert(tagInserts);

      if (tagsError) {
        throw new Error(`Failed to update tags: ${tagsError.message}`);
      }
    }
  }

  return { success: true };
};

export const useUpdateReviewMetadataMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateReviewMetadata,
    onSuccess: (_, variables) => {
      // Invalidate review management query
      queryClient.invalidateQueries({
        queryKey: ['admin', 'review-management', variables.reviewId.toString()],
      });

      // Invalidate content queue
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-queue'] });
    },
    onError: error => {
      console.error('Update metadata failed:', error);
    },
  });
};
