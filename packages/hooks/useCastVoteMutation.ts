
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
    onSuccess: (data, variables) => {
      // Invalidate relevant queries based on entity type
      switch (variables.entity_type) {
        case 'suggestion':
          queryClient.invalidateQueries({ queryKey: ['suggestions'] });
          break;
        case 'community_post':
          queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
          queryClient.invalidateQueries({ queryKey: ['community-feed'] });
          break;
        case 'poll':
          queryClient.invalidateQueries({ queryKey: ['polls'] });
          break;
      }

      toast({
        title: "Voto registrado",
        description: "Seu voto foi registrado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error casting vote:', error);
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
