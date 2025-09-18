// ABOUTME: TanStack Query mutation hook for submitting institutional plan requests.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

interface SubmitInstitutionalRequestPayload {
  name: string;
  phone: string;
  email: string;
  business_name: string;
  specific_needs: string;
}

interface SubmitInstitutionalRequestResponse {
  message: string;
  request_id: string;
}

export const useSubmitInstitutionalRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SubmitInstitutionalRequestResponse, Error, SubmitInstitutionalRequestPayload>({
    mutationFn: async (payload) => {
      console.log('Submitting institutional request via Edge Function:', payload);

      const { data, error } = await supabase.functions.invoke('submit-institutional-request', {
        body: payload
      });

      if (error) {
        console.error('Institutional request submission error:', error);
        throw new Error(error.message || 'Failed to submit institutional request');
      }

      if (data?.error) {
        console.error('Institutional request submission API error:', data.error);
        throw new Error(data.error.message || 'Failed to submit institutional request');
      }

      console.log('Institutional request submitted successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Institutional request submission successful, invalidating queries');
      // Invalidate admin queries to refresh institutional requests list
      queryClient.invalidateQueries({
        queryKey: ['admin', 'institutional-requests']
      });
    },
    onError: (error) => {
      console.error('Institutional request submission failed:', error);
    }
  });
};