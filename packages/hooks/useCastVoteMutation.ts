
// ABOUTME: TanStack Query mutation hook for casting votes with optimistic updates.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import { ConsolidatedHomepageData, Suggestion } from './useHomepageFeedQuery';

interface CastVotePayload {
  suggestion_id: number;
  action: 'upvote' | 'remove_vote';
}

interface CastVoteResponse {
  message: string;
  new_vote_count: number;
  user_has_voted: boolean;
}

// Define the context type for the mutation
interface MutationContext {
  previousData?: ConsolidatedHomepageData;
}

export const useCastVoteMutation = () => {
  const queryClient = useQueryClient();
  const queryKey = ['consolidated-homepage-feed'];

  return useMutation<CastVoteResponse, Error, CastVotePayload, MutationContext>({
    mutationFn: async (payload) => {
      console.log('Casting vote via Edge Function:', payload);
      
      const { data, error } = await supabase.functions.invoke('cast-suggestion-vote', {
        body: payload
      });

      if (error) {
        console.error('Vote casting error:', error);
        throw new Error(error.message || 'Failed to cast vote');
      }

      if (data?.error) {
        console.error('Vote casting API error:', data.error);
        throw new Error(data.error.message || 'Failed to cast vote');
      }

      console.log('Vote cast successfully:', data);
      return data;
    },

    // Optimistic update: immediately update the UI
    onMutate: async (newVote) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<ConsolidatedHomepageData>(queryKey);

      // Optimistically update to the new value
      if (previousData) {
        const newData = {
          ...previousData,
          suggestions: previousData.suggestions.map((suggestion: Suggestion) => {
            if (suggestion.id === newVote.suggestion_id) {
              return {
                ...suggestion,
                upvotes: suggestion.upvotes + (newVote.action === 'upvote' ? 1 : -1),
                user_has_voted: newVote.action === 'upvote',
              };
            }
            return suggestion;
          }),
        };
        queryClient.setQueryData(queryKey, newData);
      }
      
      // Return a context object with the snapshotted value
      return { previousData };
    },

    // If the mutation fails, use the context to roll back
    onError: (err, newVote, context) => {
      console.error('Vote casting failed, rolling back:', err);
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },

    // Always refetch after error or success to ensure authoritative state
    onSettled: () => {
      console.log('Vote casting settled, invalidating queries');
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
