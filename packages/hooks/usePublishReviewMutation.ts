// ABOUTME: TanStack Query mutation for publishing V3 editor content to main Reviews table

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PublishReviewRequest {
  reviewId: number;
  updateMainContent?: boolean;
}

interface PublishReviewResponse {
  success: boolean;
  reviewId: number;
  message: string;
  contentVersion?: string;
  nodeCount?: number;
}

const publishReviewContent = async (request: PublishReviewRequest): Promise<PublishReviewResponse> => {
  console.log('Publishing review content:', request);
  
  const { data, error } = await supabase.functions.invoke('publish-review-content', {
    body: request
  });

  if (error) {
    console.error('Publish review content error:', error);
    throw new Error(error.message || 'Failed to publish review content');
  }

  if (data?.error) {
    console.error('Publish review API error:', data.error);
    
    if (data.error.code === 'REVIEW_NOT_FOUND') {
      throw new Error('Review not found');
    }
    
    if (data.error.code === 'ACCESS_DENIED') {
      throw new Error('You can only publish your own reviews');
    }

    if (data.error.code === 'NO_EDITOR_CONTENT') {
      throw new Error('No editor content found for this review');
    }

    if (data.error.code === 'INVALID_CONTENT') {
      throw new Error('Editor content is not in valid V3 format');
    }
    
    throw new Error(data.error.message || 'Failed to publish review content');
  }

  console.log('Review content published successfully:', data);
  return data;
};

export const usePublishReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishReviewContent,
    onSuccess: (data, variables) => {
      console.log(`Successfully published review ${variables.reviewId}`);
      
      // Invalidate relevant queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ['review-detail', variables.reviewId.toString()],
      });
      
      queryClient.invalidateQueries({
        queryKey: ['review-detail', variables.reviewId],
      });
      
      // Also invalidate editor content queries
      queryClient.invalidateQueries({
        queryKey: ['editor-content', variables.reviewId.toString()],
      });
      
      // Invalidate any reviews list queries
      queryClient.invalidateQueries({
        queryKey: ['reviews'],
      });
    },
    onError: (error, variables) => {
      console.error(`Failed to publish review ${variables.reviewId}:`, error);
    },
    retry: (failureCount, error) => {
      // Don't retry permission or validation errors
      if (error.message.includes('Access denied') || 
          error.message.includes('not found') ||
          error.message.includes('Invalid') ||
          error.message.includes('No editor content')) {
        return false;
      }
      
      // Retry network/server errors up to 2 times
      return failureCount < 2;
    }
  });
};