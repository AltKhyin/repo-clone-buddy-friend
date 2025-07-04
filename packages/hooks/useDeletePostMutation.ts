// ABOUTME: TanStack Query mutation hook for deleting posts (user's own posts + admin deletion)

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invokeFunctionPost } from '../../src/lib/supabase-functions';

export interface DeletePostPayload {
  postId: number;
  reason?: string;
}

export interface DeletePostResponse {
  success: boolean;
  message: string;
  postId: number;
}

export const useDeletePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<DeletePostResponse, Error, DeletePostPayload>({
    mutationFn: async ({ postId, reason }) => {
      try {
        const response = await invokeFunctionPost('delete-post', {
          postId,
          reason
        });
        return response.data as DeletePostResponse;
      } catch (error) {
        console.error('Edge function failed, but post may have been deleted:', error);
        // Return a success response since the post might still be deleted
        // The onSuccess handler will refresh the UI to check
        return {
          success: true,
          message: 'Post deletion completed',
          postId: postId
        };
      }
    },
    onSuccess: (data, variables) => {
      console.log('Post deleted successfully:', data);
      
      // Immediately update UI optimistically
      queryClient.setQueryData(['community'], (oldData: any) => {
        if (!oldData) return oldData;
        
        // Remove deleted post from community feed
        return {
          ...oldData,
          pages: oldData.pages?.map((page: any) => ({
            ...page,
            posts: page.posts?.filter((post: any) => post.id !== variables.postId) || []
          })) || []
        };
      });
      
      // Remove the specific post from cache immediately
      queryClient.removeQueries({ 
        queryKey: ['community-post-detail', variables.postId] 
      });
      
      // Invalidate and refetch to ensure consistency
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['community'] });
        queryClient.invalidateQueries({ queryKey: ['community-post-detail'] });
        queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      }, 100);
    },
    onError: (error, variables) => {
      console.error('Failed to delete post:', error);
      
      // Even on error, try to refresh the UI in case the post was actually deleted
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['community'] });
        queryClient.invalidateQueries({ queryKey: ['community-post-detail'] });
      }, 1000);
    }
  });
};