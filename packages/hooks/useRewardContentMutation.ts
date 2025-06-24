
// ABOUTME: TanStack Query mutation hook for rewarding content (admin/editor only).

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

interface RewardContentPayload {
  content_id: number;
}

/**
 * Rewards content by calling the reward-content Edge Function.
 * @param payload The content ID to reward
 */
const rewardContent = async (payload: RewardContentPayload) => {
  const { data, error } = await supabase.functions.invoke('reward-content', {
    body: payload,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Custom hook for rewarding content.
 * Only available to admin/editor users.
 */
export const useRewardContentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rewardContent,
    onSuccess: (data, variables) => {
      // Invalidate relevant queries to show the updated reward status
      queryClient.invalidateQueries({ 
        queryKey: ['postWithComments'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['communityPosts'] 
      });
    },
    onError: (error) => {
      console.error('Failed to reward content:', error);
    },
  });
};
