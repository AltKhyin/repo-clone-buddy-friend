
// ABOUTME: Hook for fetching individual community post details with enhanced error handling and performance optimization.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import type { CommunityPost } from '../../src/types/community';

export const usePostDetailQuery = (postId: number) => {
  return useQuery({
    queryKey: ['community-post-detail', postId],
    queryFn: async (): Promise<CommunityPost> => {
      console.log('Fetching post detail for ID:', postId);
      
      const { data, error } = await supabase.functions.invoke('get-community-post-detail', {
        body: { post_id: postId }
      });

      if (error) {
        console.error('Post detail fetch error:', error);
        throw new Error(error.message || `Failed to fetch post details for ID: ${postId}`);
      }

      if (!data) {
        throw new Error(`Post with ID ${postId} not found`);
      }

      console.log('Post detail fetched successfully:', data);
      return data as CommunityPost;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - posts change less frequently
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    enabled: !!postId && !isNaN(postId) && postId > 0,
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    meta: {
      errorMessage: `Failed to load post details`
    }
  });
};
