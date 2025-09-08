// ABOUTME: TanStack Query hook for fetching similar reviews based on tag overlap scoring

import { useQuery } from '@tanstack/react-query';
import { invokeFunctionPost } from '../../src/lib/supabase-functions';
import { HomepageReview } from './useHomepageFeedQuery';

/**
 * Hook for fetching reviews similar to a given review based on tag overlap
 * @param reviewId - The ID of the current review to find similar reviews for
 * @returns TanStack Query result with similar reviews in HomepageReview format
 */
export const useReviewRecommendations = (reviewId: number | undefined) => {
  return useQuery<HomepageReview[]>({
    queryKey: ['review-recommendations', reviewId],
    queryFn: async () => {
      console.log('Fetching recommendations for review:', reviewId);

      try {
        const data = await invokeFunctionPost<HomepageReview[]>('get-similar-reviews', {
          reviewId
        });

        console.log(`Recommendations fetched successfully: ${data?.length || 0} reviews`);
        return data || [];
      } catch (error) {
        console.error('Recommendations fetch failed:', error);
        console.error('Error details:', {
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
        });
        throw error;
      }
    },
    enabled: !!reviewId,
    staleTime: 15 * 60 * 1000, // 15 minutes - similar reviews don't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.error(`Recommendations query retry ${failureCount}:`, error);
      
      // Don't retry on validation errors or client errors
      if (error?.message?.includes('VALIDATION_FAILED') || 
          error?.message?.includes('Review ID is required')) {
        return false;
      }
      
      return failureCount < 2; // Retry up to 2 times for other errors
    },
    meta: {
      errorMessage: 'Failed to load similar reviews',
    },
  });
};