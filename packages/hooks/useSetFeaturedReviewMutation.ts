// ABOUTME: TanStack Query mutation for setting the homepage featured review

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invokeFunctionPost } from '../../src/lib/supabase-functions';

interface SetFeaturedReviewData {
  reviewId: number;
}

interface SetFeaturedReviewResponse {
  message: string;
  reviewId: number;
  reviewTitle: string;
}

const setFeaturedReview = async ({ reviewId }: SetFeaturedReviewData): Promise<SetFeaturedReviewResponse> => {
  try {
    const response = await invokeFunctionPost<SetFeaturedReviewResponse>('admin-set-featured-review', {
      reviewId,
    });
    return response;
  } catch (error) {
    console.error('Set featured review failed:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to set featured review'
    );
  }
};

export const useSetFeaturedReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setFeaturedReview,
    onSuccess: (data, variables) => {
      console.log(`Successfully set review ${variables.reviewId} as featured: ${data.reviewTitle}`);
      
      // Invalidate homepage feed cache to reflect the change
      queryClient.invalidateQueries({ 
        queryKey: ['consolidated-homepage-feed'] 
      });
      
      // Invalidate admin content queue to update button states
      queryClient.invalidateQueries({ 
        queryKey: ['admin', 'content-queue'] 
      });

      // Invalidate specific review management data
      queryClient.invalidateQueries({
        queryKey: ['admin', 'review', variables.reviewId.toString()],
      });
    },
    onError: (error) => {
      console.error('Set featured review mutation failed:', error);
    },
    retry: (failureCount, error) => {
      // Don't retry on authorization errors
      if (error instanceof Error && 
          (error.message.includes('Admin access required') || 
           error.message.includes('Authorization') ||
           error.message.includes('not published'))) {
        return false;
      }
      return failureCount < 2;
    },
  });
};