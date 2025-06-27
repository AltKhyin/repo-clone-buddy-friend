
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
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['community-page-data'] });
      await queryClient.cancelQueries({ queryKey: ['community-feed'] });

      // Snapshot the previous value for rollback
      const previousCommunityData = queryClient.getQueryData(['community-page-data']);
      const previousFeedData = queryClient.getQueryData(['community-feed']);

      // Get current user info for optimistic post
      const { data: { user } } = await supabase.auth.getUser();
      const currentUser = user ? {
        id: user.id,
        full_name: user.user_metadata?.full_name || 'Você',
        avatar_url: user.user_metadata?.avatar_url || null
      } : {
        id: 'temp',
        full_name: 'Você',
        avatar_url: null
      };

      // Create optimistic post
      const optimisticPost = {
        id: Date.now(), // Temporary ID
        title: variables.title || 'Post sem título',
        content: variables.content,
        category: variables.category,
        post_type: variables.post_type || 'text',
        image_url: variables.image_url || null,
        video_url: variables.video_url || null,
        poll_data: variables.poll_data || null,
        upvotes: 1, // Auto-upvote
        downvotes: 0,
        created_at: new Date().toISOString(),
        is_pinned: false,
        is_locked: false,
        reply_count: 0,
        author: currentUser,
        user_vote: 'up', // Auto-upvote
        is_saved: false,
        flair_text: null,
        flair_color: null,
        _isOptimistic: true // Flag to identify optimistic updates
      };

      // Optimistically update community feed
      queryClient.setQueryData(['community-feed'], (old: any) => {
        if (!old) return { pages: [{ items: [optimisticPost] }] };
        
        const newPages = [...old.pages];
        if (newPages.length > 0) {
          newPages[0] = {
            ...newPages[0],
            items: [optimisticPost, ...(newPages[0].items || [])]
          };
        } else {
          newPages.push({ items: [optimisticPost] });
        }
        
        return { ...old, pages: newPages };
      });

      // Optimistically update community page data
      // NOTE: The cache structure after 'select' is { posts: [...], sidebarData: {...} }
      queryClient.setQueryData(['community-page-data'], (old: any) => {
        if (!old) {
          return {
            posts: [optimisticPost],
            sidebarData: null
          };
        }
        
        // Handle both raw infinite query data and selected data
        if (old.pages) {
          // This is the raw infinite query data, update the first page
          const newPages = [...old.pages];
          if (newPages.length > 0) {
            newPages[0] = {
              ...newPages[0],
              posts: [optimisticPost, ...(newPages[0].posts || [])]
            };
          } else {
            newPages.push({ 
              posts: [optimisticPost],
              pagination: { page: 0, limit: 20, hasMore: false },
              sidebarData: null
            });
          }
          
          return { ...old, pages: newPages };
        } else {
          // This is the selected data, update directly
          return {
            ...old,
            posts: [optimisticPost, ...(old.posts || [])]
          };
        }
      });

      // Return context for potential rollback
      return { previousCommunityData, previousFeedData };
    },
    onSuccess: (data, variables) => {
      // Replace optimistic update with real data by invalidating queries
      queryClient.invalidateQueries({ queryKey: ['community-page-data'] });
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
      
      // Also invalidate homepage feed to update recent posts
      queryClient.invalidateQueries({ queryKey: ['consolidated-homepage-feed'] });
    },
    onError: (error, variables, context) => {
      console.error('Failed to create post:', error);
      
      // Rollback optimistic updates on error
      if (context?.previousCommunityData) {
        queryClient.setQueryData(['community-page-data'], context.previousCommunityData);
      }
      if (context?.previousFeedData) {
        queryClient.setQueryData(['community-feed'], context.previousFeedData);
      }
    },
    onSettled: () => {
      // Always refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['community-page-data'] });
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
    }
  });
};
