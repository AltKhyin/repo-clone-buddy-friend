// ABOUTME: TanStack Query mutation hook for executing publication workflow actions with cache invalidation

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

// Publication Action Types (local to this hook for specific response structure)
export interface PublicationAction {
  reviewId: number;
  action: 'submit_for_review' | 'approve' | 'reject' | 'schedule' | 'publish' | 'unpublish' | 'archive' | 'delete';
  reviewerId?: string;
  scheduledDate?: string;
  notes?: string;
}

export interface PublicationActionResponse {
  success: boolean;
  review: {
    id: number;
    review_status?: string;
    reviewed_at?: string | null;
    publication_notes?: string | null;
    scheduled_publish_at?: string;
  };
  message: string;
}

const executePublicationAction = async (
  action: PublicationAction
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
      queryClient.setQueryData(['admin', 'review', variables.reviewId], (oldData: any) => {
        if (oldData && data.review) {
          return { ...oldData, ...data.review };
        }
        return oldData;
      });
    },
    onError: error => {
      console.error('Publication action failed:', error);
    },
  });
};
