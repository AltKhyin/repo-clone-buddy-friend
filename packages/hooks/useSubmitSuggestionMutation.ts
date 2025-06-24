
// ABOUTME: TanStack Query mutation hook for submitting suggestions to the next edition poll.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

interface SubmitSuggestionPayload {
  title: string;
  description?: string;
}

interface SubmitSuggestionResponse {
  message: string;
  suggestion_id: number;
  action: string;
}

export const useSubmitSuggestionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SubmitSuggestionResponse, Error, SubmitSuggestionPayload>({
    mutationFn: async (payload) => {
      console.log('Submitting suggestion via Edge Function:', payload);
      
      const { data, error } = await supabase.functions.invoke('submit-suggestion', {
        body: payload
      });

      if (error) {
        console.error('Suggestion submission error:', error);
        throw new Error(error.message || 'Failed to submit suggestion');
      }

      if (data?.error) {
        console.error('Suggestion submission API error:', data.error);
        throw new Error(data.error.message || 'Failed to submit suggestion');
      }

      console.log('Suggestion submitted successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Suggestion submission successful, invalidating queries');
      // Invalidate consolidated homepage feed to refetch suggestions
      queryClient.invalidateQueries({ 
        queryKey: ['consolidated-homepage-feed'] 
      });
    },
    onError: (error) => {
      console.error('Suggestion submission failed:', error);
    }
  });
};
