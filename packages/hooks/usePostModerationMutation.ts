// ABOUTME: TanStack Query mutation hook for post moderation actions (pin, lock, hide, etc.)

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invokeFunctionPost } from '../../src/lib/supabase-functions';

export interface ModerationActionPayload {
  postId: number;
  action: 'pin' | 'unpin' | 'delete';
  reason?: string;
}

export interface ModerationActionResponse {
  success: boolean;
  message: string;
  action: string;
  postId: number;
}

export const usePostModerationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<ModerationActionResponse, Error, ModerationActionPayload>({
    mutationFn: async ({ postId, action, reason }) => {
      const response = await invokeFunctionPost('moderate-post', {
        postId,
        action,
        reason
      });
      return response.data as ModerationActionResponse;
    },
    onSuccess: (data, variables) => {
      console.log(`Post ${variables.action} successful:`, data);
      
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['community'] });
      queryClient.invalidateQueries({ queryKey: ['community-post-detail'] });
      
      // If the post was deleted, also invalidate user's own posts
      if (variables.action === 'delete') {
        queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      }
    },
    onError: (error, variables) => {
      console.error(`Failed to ${variables.action} post:`, error);
    }
  });
};