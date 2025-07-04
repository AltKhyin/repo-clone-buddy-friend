// ABOUTME: TanStack Query mutation hook for executing publication workflow actions with cache invalidation

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import { PublicationActionRequest, PublicationActionResponse } from '../../src/types/admin';

const executePublicationAction = async (
  action: PublicationActionRequest
): Promise<PublicationActionResponse> => {
  const { data, error } = await supabase.functions.invoke('admin-manage-publication', {
    body: action,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const usePublicationActionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: executePublicationAction,
    onSuccess: (data, variables) => {
      // Invalidate content queue queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-queue'] });

      // Update specific review in cache if possible
      queryClient.setQueryData(['admin', 'review', variables.reviewId], (oldData: any) =>
        oldData ? { ...oldData, status: data.newStatus, scheduledAt: data.scheduledAt } : undefined
      );
    },
    onError: error => {
      console.error('Publication action failed:', error);
    },
  });
};
