
// ABOUTME: TanStack Query mutation hook for casting votes on community polls.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

interface CastPollVotePayload {
  poll_id: number;
  option_id: number;
}

interface CastPollVoteResponse {
  success: boolean;
  message: string;
}

export const useCastPollVoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<CastPollVoteResponse, Error, CastPollVotePayload>({
    mutationFn: async (payload) => {
      console.log('Casting poll vote:', payload);
      
      const { data, error } = await supabase.functions.invoke('cast-vote', {
        body: {
          entity_id: payload.option_id,
          vote_type: 'up',
          entity_type: 'poll'
        }
      });

      if (error) {
        console.error('Poll vote error:', error);
        throw new Error(error.message || 'Failed to cast poll vote');
      }

      if (data?.error) {
        console.error('Poll vote API error:', data.error);
        throw new Error(data.error.message || 'Failed to cast poll vote');
      }

      console.log('Poll vote cast successfully:', data);
      return data;
    },
    onSuccess: () => {
      console.log('Poll vote successful, invalidating queries');
      
      // Invalidate relevant queries to update poll results
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      queryClient.invalidateQueries({ queryKey: ['community-sidebar'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-feed'] });
    },
    onError: (error) => {
      console.error('Poll vote failed:', error);
    }
  });
};
