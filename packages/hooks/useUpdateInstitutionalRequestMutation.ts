// ABOUTME: TanStack Query mutation hook for updating institutional plan requests

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

interface UpdateInstitutionalRequestPayload {
  id: string;
  status?: 'pending' | 'reviewing' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: string;
}

export const useUpdateInstitutionalRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateInstitutionalRequestPayload>({
    mutationFn: async (payload) => {
      console.log('Updating institutional request:', payload);

      const { error } = await supabase
        .from('institutional_plan_requests')
        .update({
          ...(payload.status && { status: payload.status }),
          ...(payload.admin_notes !== undefined && { admin_notes: payload.admin_notes }),
          ...(payload.reviewed_by && { reviewed_by: payload.reviewed_by }),
          updated_at: new Date().toISOString()
        })
        .eq('id', payload.id);

      if (error) {
        console.error('Failed to update institutional request:', error);
        throw new Error(`Failed to update request: ${error.message}`);
      }

      console.log('Institutional request updated successfully');
    },
    onSuccess: () => {
      console.log('Request update successful, invalidating queries');
      // Invalidate and refetch institutional requests
      queryClient.invalidateQueries({
        queryKey: ['admin', 'institutional-requests']
      });
    },
    onError: (error) => {
      console.error('Request update failed:', error);
    }
  });
};