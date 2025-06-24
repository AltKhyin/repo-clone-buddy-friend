
// ABOUTME: TanStack Query mutation hook for moderating community posts (admin/editor actions).

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

interface ModerationPayload {
  post_id: number;
  action_type: 'pin' | 'unpin' | 'lock' | 'unlock' | 'flair' | 'hide';
  reason?: string;
  flair_text?: string;
  flair_color?: string;
}

interface ModerationResponse {
  success: boolean;
  message: string;
}

export const useModerateCommunityPostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<ModerationResponse, Error, ModerationPayload>({
    mutationFn: async (payload) => {
      console.log('Moderating community post:', payload);
      
      const { data, error } = await supabase.functions.invoke('moderate-community-post', {
        body: payload
      });

      if (error) {
        console.error('Post moderation error:', error);
        throw new Error(error.message || 'Failed to moderate post');
      }

      if (data?.error) {
        console.error('Post moderation API error:', data.error);
        throw new Error(data.error.message || 'Failed to moderate post');
      }

      console.log('Post moderated successfully:', data);
      return data;
    },
    onSuccess: () => {
      console.log('Post moderation successful, invalidating queries');
      
      // Invalidate community feed to reflect moderation changes
      queryClient.invalidateQueries({ 
        queryKey: ['community-feed'] 
      });
      
      // Invalidate sidebar data to update trending discussions
      queryClient.invalidateQueries({ 
        queryKey: ['community-sidebar'] 
      });
    },
    onError: (error) => {
      console.error('Post moderation failed:', error);
    }
  });
};
