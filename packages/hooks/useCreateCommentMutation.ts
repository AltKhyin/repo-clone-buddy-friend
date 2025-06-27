
// ABOUTME: TanStack Query mutation hook for creating comments with proper cache invalidation.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

interface CreateCommentPayload {
  content: string;
  parent_post_id: number;
  root_post_id?: number; // The root post ID for cache invalidation
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
 * Follows [D3.4] Data Access Layer patterns with optimistic updates and proper cache invalidation.
 */
export const useCreateCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComment,
    onMutate: async (variables) => {
      // Use root_post_id for cache operations, fallback to parent_post_id for backward compatibility
      const cachePostId = variables.root_post_id || variables.parent_post_id;
      
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ 
        queryKey: ['postWithComments', cachePostId] 
      });

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueryData(['postWithComments', cachePostId]);

      // Optimistically update the cache
      queryClient.setQueryData(['postWithComments', cachePostId], (old: unknown) => {
        console.log('Optimistic update - old data:', old);
        if (!old) {
          console.log('No existing data for optimistic update');
          return old;
        }

        // Create optimistic comment
        const optimisticComment = {
          id: Date.now(), // Temporary ID
          content: variables.content,
          category: variables.category,
          parent_post_id: variables.parent_post_id,
          upvotes: 0,
          downvotes: 0,
          created_at: new Date().toISOString(),
          is_pinned: false,
          is_locked: false,
          reply_count: 0,
          author: {
            id: 'temp',
            full_name: 'Você',
            avatar_url: null
          },
          user_vote: null,
          is_saved: false,
          _isOptimistic: true // Flag to identify optimistic updates
        };

        const updatedData = {
          ...old,
          comments: [...(old.comments || []), optimisticComment]
        };
        
        console.log('Optimistic update - new data:', updatedData);
        console.log('Added optimistic comment:', optimisticComment);
        
        return updatedData;
      });

      // Return context for potential rollback
      return { previousData };
    },
    onSuccess: (data, variables) => {
      const cachePostId = variables.root_post_id || variables.parent_post_id;
      console.log('Comment creation succeeded, invalidating cache for post:', cachePostId);
      console.log('Success data:', data);
      
      // First, remove the optimistic update and refetch with real data
      queryClient.invalidateQueries({ 
        queryKey: ['postWithComments', cachePostId] 
      });
      
      // Force an immediate refetch to ensure UI updates
      queryClient.refetchQueries({ 
        queryKey: ['postWithComments', cachePostId] 
      });
      
      // Also invalidate community feed queries that might include this post
      queryClient.invalidateQueries({ 
        queryKey: ['communityPosts'] 
      });
      
      console.log('Cache invalidation completed for comment creation');
    },
    onError: (error, variables, context) => {
      console.error('Failed to create comment:', error);
      
      // Rollback optimistic update on error
      if (context?.previousData) {
        const cachePostId = variables.root_post_id || variables.parent_post_id;
        queryClient.setQueryData(['postWithComments', cachePostId], context.previousData);
      }
    },
    onSettled: (data, error, variables) => {
      const cachePostId = variables.root_post_id || variables.parent_post_id;
      console.log('Comment mutation settled. Success:', !!data, 'Error:', !!error);
      
      // Always ensure we have the latest data, regardless of success/error
      queryClient.invalidateQueries({ 
        queryKey: ['postWithComments', cachePostId] 
      });
      
      // Also ensure the comment list is properly refreshed
      queryClient.refetchQueries({ 
        queryKey: ['postWithComments', cachePostId],
        type: 'active'
      });
    },
  });
};
