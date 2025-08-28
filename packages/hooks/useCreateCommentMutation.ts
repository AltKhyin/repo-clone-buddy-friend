
// ABOUTME: TanStack Query mutation hook for creating comments with proper cache invalidation.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import { useAuthStore } from '../../src/store/auth';

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
 * Follows [D3.4] Data Access Layer patterns with optimized performance and reliability.
 */
export const useCreateCommentMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: createComment,
    
    // OPTIMISTIC UPDATES with improved error handling
    onMutate: async (variables) => {
      const cachePostId = variables.root_post_id || variables.parent_post_id;
      
      try {
        // Cancel any outgoing refetches to avoid race conditions
        await queryClient.cancelQueries({ 
          queryKey: ['postWithComments', cachePostId] 
        });

        // Snapshot the previous value for rollback
        const previousData = queryClient.getQueryData(['postWithComments', cachePostId]);

        // Optimistically update the cache
        queryClient.setQueryData(['postWithComments', cachePostId], (old: unknown) => {
          if (!old || typeof old !== 'object' || !('comments' in old)) {
            return old;
          }

          // Create optimistic comment with better structure and real user data
          const optimisticComment = {
            id: -Date.now(), // Negative temporary ID to avoid conflicts
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
              id: user?.id || 'optimistic',
              full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Enviando...',
              avatar_url: user?.user_metadata?.avatar_url || null
            },
            user_vote: null,
            is_saved: false,
            _isOptimistic: true, // Flag to identify optimistic updates
            _isLoading: true // Flag to show loading state
          };

          return {
            ...old,
            comments: [...(old.comments || []), optimisticComment]
          };
        });

        return { previousData };
      } catch (error) {
        return { previousData: null };
      }
    },
    
    // ENHANCED SUCCESS HANDLING with proper optimistic update resolution
    onSuccess: (data, variables, context) => {
      const cachePostId = variables.root_post_id || variables.parent_post_id;
      
      // Since the API only returns post_id, we need to refetch to get the complete comment data
      // But first, let's create a proper comment object for immediate UI feedback
      queryClient.setQueryData(['postWithComments', cachePostId], (old: unknown) => {
        if (!old || typeof old !== 'object' || !('comments' in old)) {
          return old;
        }

        // Remove optimistic comment
        const filteredComments = (old.comments || []).filter(
          (comment: any) => !comment._isOptimistic
        );

        // Create a real comment object with the returned post_id
        if (data?.data?.post_id || data?.post_id) {
          const realComment = {
            id: data?.data?.post_id || data?.post_id,
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
              id: user?.id || 'current-user',
              full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Você',
              avatar_url: user?.user_metadata?.avatar_url || null
            },
            user_vote: null,
            is_saved: false,
            _isOptimistic: false
          };

          return {
            ...old,
            comments: [...filteredComments, realComment]
          };
        }
        
        return {
          ...old,
          comments: filteredComments
        };
      });
      
      // Schedule a background refetch to get the complete comment data with author info
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['postWithComments', cachePostId],
          refetchType: 'active'
        });
      }, 100);
      
      // Background refresh for community feeds (non-blocking)
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['communityPosts'],
          refetchType: 'none'
        });
      }, 200);
    },
    
    // IMPROVED ERROR HANDLING with retry logic
    onError: (error, variables, context) => {
      
      // Rollback optimistic update
      if (context?.previousData) {
        const cachePostId = variables.root_post_id || variables.parent_post_id;
        queryClient.setQueryData(['postWithComments', cachePostId], context.previousData);
      }
    },
    
    // SIMPLIFIED SETTLED HANDLER - avoid double invalidation
    onSettled: (data, error, variables) => {
      if (error) {
        // Only refetch on error to get the correct state
        const cachePostId = variables.root_post_id || variables.parent_post_id;
        queryClient.refetchQueries({ 
          queryKey: ['postWithComments', cachePostId],
          type: 'active'
        });
      }
    },
    
    // RETRY CONFIGURATION for network issues
    retry: (failureCount, error) => {
      // Don't retry on client errors (400-499)
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403') ||
            error.message.includes('400') || error.message.includes('422')) {
          return false;
        }
      }
      
      // Retry server errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });
};
