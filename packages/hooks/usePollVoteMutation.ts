// ABOUTME: TanStack Query mutation hook for voting on polls with cache invalidation and optimistic updates.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

interface PollVotePayload {
  post_id: number;
  option_index: number;
}

/**
 * Casts a vote on a poll by calling the poll-vote Edge Function.
 * @param payload The vote data
 */
const castPollVote = async (payload: PollVotePayload) => {
  const { data, error } = await supabase.functions.invoke('poll-vote', {
    body: payload,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Custom hook for voting on polls.
 * Follows [D3.4] Data Access Layer patterns with optimistic updates and proper cache invalidation.
 */
export const usePollVoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: castPollVote,
    onMutate: async (variables) => {
      console.log('Optimistic poll vote update for post:', variables.post_id, 'option:', variables.option_index);
      
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ 
        queryKey: ['postWithComments', variables.post_id] 
      });
      
      // Also cancel community feed queries
      await queryClient.cancelQueries({ 
        queryKey: ['communityPosts'] 
      });

      // Snapshot the previous values for rollback
      const previousPostData = queryClient.getQueryData(['postWithComments', variables.post_id]);
      const previousCommunityData = queryClient.getQueryData(['communityPosts']);

      // Optimistically update the post detail cache
      queryClient.setQueryData(['postWithComments', variables.post_id], (old: any) => {
        if (!old || !old.post || !old.post.poll_data) {
          console.log('No poll data found for optimistic update');
          return old;
        }

        const updatedPollData = {
          ...old.post.poll_data,
          user_vote: variables.option_index.toString(),
          options: old.post.poll_data.options.map((option: any, index: number) => ({
            ...option,
            votes: index === variables.option_index ? (option.votes || 0) + 1 : option.votes || 0
          })),
          total_votes: (old.post.poll_data.total_votes || 0) + 1
        };

        const updatedPost = {
          ...old.post,
          poll_data: updatedPollData
        };

        console.log('Optimistic poll update applied:', updatedPollData);

        return {
          ...old,
          post: updatedPost
        };
      });

      // Optimistically update the community feed cache if the post exists there
      queryClient.setQueryData(['communityPosts'], (old: any) => {
        if (!old || !old.pages) return old;

        const updatedPages = old.pages.map((page: any) => {
          if (!page.items) return page;
          
          const updatedItems = page.items.map((post: any) => {
            if (post.id === variables.post_id && post.poll_data) {
              const updatedPollData = {
                ...post.poll_data,
                user_vote: variables.option_index.toString(),
                options: post.poll_data.options.map((option: any, index: number) => ({
                  ...option,
                  votes: index === variables.option_index ? (option.votes || 0) + 1 : option.votes || 0
                })),
                total_votes: (post.poll_data.total_votes || 0) + 1
              };

              return {
                ...post,
                poll_data: updatedPollData
              };
            }
            return post;
          });

          return {
            ...page,
            items: updatedItems
          };
        });

        return {
          ...old,
          pages: updatedPages
        };
      });

      // Return context for potential rollback
      return { previousPostData, previousCommunityData };
    },
    onSuccess: (data, variables) => {
      console.log('Poll vote succeeded, invalidating cache for post:', variables.post_id);
      console.log('Success data:', data);
      
      // Invalidate and refetch the specific post data
      queryClient.invalidateQueries({ 
        queryKey: ['postWithComments', variables.post_id] 
      });
      
      // Force an immediate refetch to ensure we have the latest data
      queryClient.refetchQueries({ 
        queryKey: ['postWithComments', variables.post_id] 
      });
      
      // Also invalidate community feed queries that might include this post
      queryClient.invalidateQueries({ 
        queryKey: ['communityPosts'] 
      });
      
      console.log('Cache invalidation completed for poll vote');
    },
    onError: (error, variables, context) => {
      console.error('Failed to cast poll vote:', error);
      
      // Rollback optimistic updates on error
      if (context?.previousPostData) {
        queryClient.setQueryData(['postWithComments', variables.post_id], context.previousPostData);
      }
      
      if (context?.previousCommunityData) {
        queryClient.setQueryData(['communityPosts'], context.previousCommunityData);
      }
    },
    onSettled: (data, error, variables) => {
      console.log('Poll vote mutation settled. Success:', !!data, 'Error:', !!error);
      
      // Always ensure we have the latest data, regardless of success/error
      queryClient.invalidateQueries({ 
        queryKey: ['postWithComments', variables.post_id] 
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['communityPosts'] 
      });
      
      // Also ensure the post data is properly refreshed
      queryClient.refetchQueries({ 
        queryKey: ['postWithComments', variables.post_id],
        type: 'active'
      });
    },
  });
};