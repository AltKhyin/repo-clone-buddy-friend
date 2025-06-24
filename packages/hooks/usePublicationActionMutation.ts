
// ABOUTME: TanStack Query mutation hook for executing publication workflow actions with cache invalidation

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

export interface PublicationAction {
  reviewId: number;
  action: 'submit_for_review' | 'approve' | 'reject' | 'schedule' | 'publish_now' | 'unpublish' | 'archive';
  scheduledDate?: string;
  notes?: string;
  reviewerId?: string;
}

export interface PublicationActionResponse {
  success: boolean;
  review: {
    id: number;
    review_status: string;
    scheduled_publish_at?: string;
    reviewed_at?: string;
    publication_notes?: string;
  };
  message: string;
}

const executePublicationAction = async (action: PublicationAction): Promise<PublicationActionResponse> => {
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
      
      // Invalidate analytics if they exist
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      
      // Update specific review in cache if possible
      queryClient.setQueryData(
        ['admin', 'review', variables.reviewId],
        (oldData: any) => oldData ? { ...oldData, ...data.review } : undefined
      );
    },
    onError: (error) => {
      console.error('Publication action failed:', error);
    },
  });
};
