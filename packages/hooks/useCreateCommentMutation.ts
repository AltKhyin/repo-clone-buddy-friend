
// ABOUTME: TanStack Query mutation hook for creating comments with proper cache invalidation.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

interface CreateCommentPayload {
  content: string;
  parent_post_id: number;
  category: string;
}

/**
 * Creates a new comment by calling the create-community-post Edge Function.
 * @param payload The comment data
 */
const createComment = async (payload: CreateCommentPayload) => {
  const { data, error } = await supabase.functions.invoke('create-community-post', {
    body: payload,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Custom hook for creating comments.
 * Follows [D3.4] Data Access Layer patterns with proper cache invalidation.
 */
export const useCreateCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComment,
    onSuccess: (data, variables) => {
      // Invalidate the post with comments query to trigger a refetch
      queryClient.invalidateQueries({ 
        queryKey: ['postWithComments', variables.parent_post_id] 
      });
      
      // Also invalidate community feed queries that might include this post
      queryClient.invalidateQueries({ 
        queryKey: ['communityPosts'] 
      });
    },
    onError: (error) => {
      console.error('Failed to create comment:', error);
    },
  });
};
