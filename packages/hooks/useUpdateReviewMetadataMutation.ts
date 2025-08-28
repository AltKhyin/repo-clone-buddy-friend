// ABOUTME: TanStack Query mutation for updating review metadata including new fields and content types

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
    // New metadata fields
    edicao?: string | null;
    original_article_title?: string | null;
    original_article_authors?: string | null;
    original_article_publication_date?: string | null;
    study_type?: string | null;
    // Dynamic review card fields
    reading_time_minutes?: number | null;
    custom_author_name?: string | null;
    custom_author_avatar_url?: string | null;
    content_types?: number[];
  };
}

const updateReviewMetadata = async ({ reviewId, metadata }: UpdateMetadataData) => {
  const { tags, content_types, ...reviewData } = metadata;

  // First, check if this review is already published
  const { data: currentReview, error: fetchError } = await supabase
    .from('Reviews')
    .select('review_status, published_at')
    .eq('id', reviewId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch review status: ${fetchError.message}`);
  }

  // Clean up data before sending to database
  const cleanedReviewData = { ...reviewData };

  // If review is published, ensure we preserve the published status and date
  if (currentReview?.review_status === 'published' && currentReview?.published_at) {
    cleanedReviewData.review_status = 'published';
    // Note: We don't set published_at here because we want to preserve the original date
    // The database will keep the existing published_at value
  }

  // Convert empty date strings to null for PostgreSQL
  if (cleanedReviewData.original_article_publication_date === '') {
    cleanedReviewData.original_article_publication_date = null;
  }

  // Convert empty strings to null for other optional fields
  if (cleanedReviewData.edicao === '') {
    cleanedReviewData.edicao = null;
  }
  if (cleanedReviewData.original_article_title === '') {
    cleanedReviewData.original_article_title = null;
  }
  if (cleanedReviewData.original_article_authors === '') {
    cleanedReviewData.original_article_authors = null;
  }
  if (cleanedReviewData.study_type === '') {
    cleanedReviewData.study_type = null;
  }
  if (cleanedReviewData.custom_author_name === '') {
    cleanedReviewData.custom_author_name = null;
  }
  if (cleanedReviewData.custom_author_avatar_url === '') {
    cleanedReviewData.custom_author_avatar_url = null;
  }

  // Convert empty strings to null for integer fields
  if (cleanedReviewData.reading_time_minutes === '' || 
      cleanedReviewData.reading_time_minutes === undefined || 
      (typeof cleanedReviewData.reading_time_minutes === 'string' && cleanedReviewData.reading_time_minutes.trim() === '') ||
      (cleanedReviewData.reading_time_minutes !== null && isNaN(Number(cleanedReviewData.reading_time_minutes)))) {
    cleanedReviewData.reading_time_minutes = null;
  } else if (cleanedReviewData.reading_time_minutes !== null && cleanedReviewData.reading_time_minutes !== undefined) {
    // Ensure it's a proper number
    const parsedValue = Number(cleanedReviewData.reading_time_minutes);
    cleanedReviewData.reading_time_minutes = parsedValue > 0 ? parsedValue : null;
  }

  // Update review metadata (including new fields)
  const { error: reviewError } = await supabase
    .from('Reviews')
    .update(cleanedReviewData)
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

  // Update content types if provided (following same pattern as tags)
  if (content_types !== undefined) {
    // Remove existing content types
    await supabase.from('ReviewContentTypes').delete().eq('review_id', reviewId);

    // Add new content types
    if (content_types.length > 0) {
      const contentTypeInserts = content_types.map(contentTypeId => ({
        review_id: reviewId,
        content_type_id: contentTypeId,
      }));

      const { error: contentTypesError } = await supabase
        .from('ReviewContentTypes')
        .insert(contentTypeInserts);

      if (contentTypesError) {
        throw new Error(`Failed to update content types: ${contentTypesError.message}`);
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
      // Invalidate review management query (correct key)
      queryClient.invalidateQueries({
        queryKey: ['admin', 'review', variables.reviewId.toString()],
      });

      // Invalidate content queue
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-queue'] });

      // Invalidate content types cache since usage might have changed
      queryClient.invalidateQueries({ queryKey: ['content-types'] });

      // IMPORTANT: If review was published, invalidate public-facing caches
      // This ensures published content updates are reflected immediately
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['homepage'] });
      queryClient.invalidateQueries({ queryKey: ['review-detail'] });

      console.log('Review metadata updated successfully');
    },
    onError: error => {
      console.error('Update metadata failed:', error);
    },
    retry: (failureCount, error) => {
      // Don't retry on client errors
      if (error instanceof Error && error.message.includes('Failed to update')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};
