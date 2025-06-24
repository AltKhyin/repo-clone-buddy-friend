
// ABOUTME: TanStack Query mutation hook for creating community posts with proper response handling.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import type { CreateCommunityPostResponse } from '../../src/types/community';

interface CreatePostPayload {
  title?: string;
  content: string;
  category: string;
  post_type?: 'text' | 'image' | 'poll' | 'video';
  image_url?: string;
  video_url?: string;
  poll_data?: {
    question: string;
    options: Array<{ text: string }>;
  };
}

export const useCreateCommunityPostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePostPayload): Promise<CreateCommunityPostResponse> => {
      console.log('Creating community post with payload:', payload);
      
      const { data, error } = await supabase.functions.invoke('create-community-post', {
        body: payload
      });

      if (error) {
        console.error('Post creation error:', error);
        throw new Error(error.message || 'Failed to create post');
      }

      console.log('Post created successfully:', data);
      return data as CreateCommunityPostResponse;
    },
    onSuccess: () => {
      // Invalidate community feed queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['community-page-data'] });
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
    }
  });
};
