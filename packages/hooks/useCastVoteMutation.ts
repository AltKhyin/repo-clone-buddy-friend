
// ABOUTME: Consolidated voting mutation hook that handles all types of votes through the unified cast-vote endpoint

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import { useToast } from '../../src/hooks/use-toast';

interface CastVotePayload {
  entity_id: string;
  vote_type: 'up' | 'down' | 'none';
  entity_type: 'suggestion' | 'community_post' | 'poll';
}

const castVote = async (payload: CastVotePayload) => {
  const { data, error } = await supabase.functions.invoke('cast-vote', {
    body: payload
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useCastVoteMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: castVote,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to prevent optimistic update from being overwritten
      const queryKeysToCancel = [];
      
      switch (variables.entity_type) {
        case 'suggestion':
          queryKeysToCancel.push(['suggestions']);
          break;
        case 'community_post':
          queryKeysToCancel.push(['community-feed'], ['community-page-data']);
          break;
        case 'poll':
          queryKeysToCancel.push(['polls']);
          break;
      }

      // Cancel outgoing queries
      for (const queryKey of queryKeysToCancel) {
        await queryClient.cancelQueries({ queryKey });
      }

      // Snapshot the previous value for rollback
      const previousData = {};
      for (const queryKey of queryKeysToCancel) {
        previousData[queryKey.join('-')] = queryClient.getQueriesData({ queryKey });
      }

      // Optimistically update the cache
      if (variables.entity_type === 'community_post') {
        // Update community post votes optimistically
        queryClient.setQueriesData({ queryKey: ['community-feed'] }, (old: unknown) => {
          if (!old || typeof old !== 'object' || !('pages' in old)) return old;
          
          const data = old as { pages: Array<{ items?: Array<Record<string, unknown>> }> };
          
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items?.map((post: Record<string, unknown>) => {
                if (post.id.toString() === variables.entity_id) {
                  const currentVote = post.user_vote;
                  const newVote = variables.vote_type === 'none' ? null : variables.vote_type;
                  
                  // Calculate new vote counts
                  let upvotes = post.upvotes || 0;
                  let downvotes = post.downvotes || 0;
                  
                  // Remove previous vote
                  if (currentVote === 'up') upvotes--;
                  if (currentVote === 'down') downvotes--;
                  
                  // Add new vote
                  if (newVote === 'up') upvotes++;
                  if (newVote === 'down') downvotes++;
                  
                  return {
                    ...post,
                    user_vote: newVote,
                    upvotes: Math.max(0, upvotes),
                    downvotes: Math.max(0, downvotes)
                  };
                }
                return post;
              })
            }))
          };
        });

        // Also update community page data if available
        queryClient.setQueriesData({ queryKey: ['community-page-data'] }, (old: unknown) => {
          if (!old || typeof old !== 'object' || !('pages' in old)) return old;
          
          const data = old as { pages: Array<{ posts?: Array<Record<string, unknown>> }> };
          
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              posts: page.posts?.map((post: Record<string, unknown>) => {
                if (post.id.toString() === variables.entity_id) {
                  const currentVote = post.user_vote;
                  const newVote = variables.vote_type === 'none' ? null : variables.vote_type;
                  
                  let upvotes = post.upvotes || 0;
                  let downvotes = post.downvotes || 0;
                  
                  if (currentVote === 'up') upvotes--;
                  if (currentVote === 'down') downvotes--;
                  
                  if (newVote === 'up') upvotes++;
                  if (newVote === 'down') downvotes++;
                  
                  return {
                    ...post,
                    user_vote: newVote,
                    upvotes: Math.max(0, upvotes),
                    downvotes: Math.max(0, downvotes)
                  };
                }
                return post;
              })
            }))
          };
        });
      }

      return { previousData };
    },
    onSuccess: (data, variables, context) => {
      // Show success toast but don't invalidate immediately - optimistic update should be sufficient
      toast({
        title: "Voto registrado",
        description: "Seu voto foi registrado com sucesso.",
      });
      
      // Invalidate after a short delay to ensure consistency
      setTimeout(() => {
        switch (variables.entity_type) {
          case 'suggestion':
            queryClient.invalidateQueries({ queryKey: ['suggestions'] });
            break;
          case 'community_post':
            queryClient.invalidateQueries({ queryKey: ['community-feed'] });
            queryClient.invalidateQueries({ queryKey: ['community-page-data'] });
            break;
          case 'poll':
            queryClient.invalidateQueries({ queryKey: ['polls'] });
            break;
        }
      }, 1000);
    },
    onError: (error, variables, context) => {
      console.error('Error casting vote:', error);
      
      // Rollback optimistic updates
      if (context?.previousData) {
        for (const [key, data] of Object.entries(context.previousData)) {
          const queryKey = key.split('-');
          queryClient.setQueriesData({ queryKey }, data);
        }
      }
      
      toast({
        title: "Erro ao votar",
        description: "Ocorreu um erro ao registrar seu voto. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

// Export specific hooks for backwards compatibility
export const useCastCommunityVoteMutation = () => {
  const mutation = useCastVoteMutation();
  
  return {
    ...mutation,
    mutateAsync: (payload: { post_id: string; vote_type: 'up' | 'down' | 'none' }) =>
      mutation.mutateAsync({
        entity_id: payload.post_id,
        vote_type: payload.vote_type,
        entity_type: 'community_post'
      })
  };
};

export const useCastPollVoteMutation = () => {
  const mutation = useCastVoteMutation();
  
  return {
    ...mutation,
    mutateAsync: (payload: { option_id: string; vote_type: 'up' | 'down' | 'none' }) =>
      mutation.mutateAsync({
        entity_id: payload.option_id,
        vote_type: payload.vote_type,
        entity_type: 'poll'
      })
  };
};

export const useCastSuggestionVoteMutation = () => {
  const mutation = useCastVoteMutation();
  
  return {
    ...mutation,
    mutateAsync: (payload: { suggestion_id: string; vote_type: 'up' | 'down' | 'none' }) =>
      mutation.mutateAsync({
        entity_id: payload.suggestion_id,
        vote_type: payload.vote_type,
        entity_type: 'suggestion'
      })
  };
};
