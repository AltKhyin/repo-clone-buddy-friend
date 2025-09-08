// ABOUTME: TanStack Query mutation hook for admin community post management with comprehensive CRUD operations

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

// Request interfaces
interface AdminCommunityPostRequest {
  operation: 'create' | 'update' | 'delete' | 'publish' | 'schedule' | 'hide' | 'unhide';
  review_id: number;
  data?: {
    title?: string;
    content?: string;
    post_type?: 'text' | 'image' | 'video' | 'poll' | 'link';
    category?: string;
    post_status?: 'draft' | 'published' | 'scheduled' | 'hidden';
    visibility_level?: 'public' | 'hidden';
    scheduled_publish_at?: string;
    admin_notes?: string;
    // Multimedia data
    image_url?: string;
    video_url?: string;
    poll_data?: Record<string, any>;
    link_url?: string;
    link_preview_data?: Record<string, any>;
  };
  post_id?: number;
}

// Response interface
interface AdminCommunityPostResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

// Execute admin community post operation
const executeAdminCommunityPostOperation = async (
  request: AdminCommunityPostRequest
): Promise<AdminCommunityPostResponse> => {
  console.log('Executing admin community post operation:', request);

  const { data, error } = await supabase.functions.invoke('admin-community-post-management', {
    body: request,
  });

  if (error) {
    console.error('Admin community post operation error:', error);
    throw new Error(error.message || 'Failed to execute admin community post operation');
  }

  console.log('Admin community post operation completed:', data);
  return data;
};

export const useAdminCommunityPostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: executeAdminCommunityPostOperation,
    onSuccess: (data, variables) => {
      // Invalidate admin review management query for the specific review
      queryClient.invalidateQueries({
        queryKey: ['admin', 'review', variables.review_id.toString()],
      });

      // Invalidate general admin content queue
      queryClient.invalidateQueries({ 
        queryKey: ['admin', 'content-queue'] 
      });

      // Invalidate community data to reflect post changes
      queryClient.invalidateQueries({ 
        queryKey: ['community-page-data'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['community-feed'] 
      });

      // If post was published or made visible, invalidate public-facing caches
      if (variables.operation === 'publish' || 
          variables.operation === 'unhide' || 
          (variables.operation === 'create' && variables.data?.post_status === 'published') ||
          (variables.operation === 'update' && variables.data?.visibility_level === 'public')) {
        queryClient.invalidateQueries({ queryKey: ['homepage'] });
        queryClient.invalidateQueries({ queryKey: ['consolidated-homepage-feed'] });
      }

      // If post was hidden or deleted, also invalidate to remove from feeds
      if (variables.operation === 'hide' || variables.operation === 'delete') {
        queryClient.invalidateQueries({ queryKey: ['homepage'] });
        queryClient.invalidateQueries({ queryKey: ['consolidated-homepage-feed'] });
      }

      // Invalidate review detail query to update comment visibility
      queryClient.invalidateQueries({ 
        queryKey: ['review-detail', variables.review_id] 
      });

      // Log successful operation
      console.log(`Admin community post ${variables.operation} completed:`, {
        reviewId: variables.review_id,
        postId: variables.post_id || data?.data?.id,
        message: data?.message,
      });
    },
    onError: (error, variables) => {
      console.error(`Admin community post ${variables.operation} failed:`, {
        error: error.message,
        reviewId: variables.review_id,
        operation: variables.operation,
      });
    },
    retry: (failureCount, error) => {
      // Don't retry on authentication/authorization errors
      if (error instanceof Error) {
        if (error.message.includes('UNAUTHORIZED') || 
            error.message.includes('FORBIDDEN') ||
            error.message.includes('VALIDATION_FAILED')) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
};

// Convenience hooks for specific operations
export const useCreateAdminCommunityPost = () => {
  const mutation = useAdminCommunityPostMutation();
  
  return {
    ...mutation,
    createPost: (reviewId: number, postData: NonNullable<AdminCommunityPostRequest['data']>) => 
      mutation.mutateAsync({ 
        operation: 'create', 
        review_id: reviewId, 
        data: postData 
      }),
  };
};

export const useUpdateAdminCommunityPost = () => {
  const mutation = useAdminCommunityPostMutation();
  
  return {
    ...mutation,
    updatePost: (reviewId: number, postData: NonNullable<AdminCommunityPostRequest['data']>, postId?: number) => 
      mutation.mutateAsync({ 
        operation: 'update', 
        review_id: reviewId, 
        data: postData,
        post_id: postId
      }),
  };
};

export const usePublishAdminCommunityPost = () => {
  const mutation = useAdminCommunityPostMutation();
  
  return {
    ...mutation,
    publishPost: (reviewId: number, postId?: number) => 
      mutation.mutateAsync({ 
        operation: 'publish', 
        review_id: reviewId,
        post_id: postId
      }),
  };
};

export const useScheduleAdminCommunityPost = () => {
  const mutation = useAdminCommunityPostMutation();
  
  return {
    ...mutation,
    schedulePost: (reviewId: number, scheduledAt: string, postId?: number) => 
      mutation.mutate({ 
        operation: 'schedule', 
        review_id: reviewId,
        data: { scheduled_publish_at: scheduledAt },
        post_id: postId
      }),
  };
};

export const useHideAdminCommunityPost = () => {
  const mutation = useAdminCommunityPostMutation();
  
  return {
    ...mutation,
    hidePost: (reviewId: number, postId?: number) => 
      mutation.mutateAsync({ 
        operation: 'hide', 
        review_id: reviewId,
        post_id: postId
      }),
  };
};

export const useUnhideAdminCommunityPost = () => {
  const mutation = useAdminCommunityPostMutation();
  
  return {
    ...mutation,
    unhidePost: (reviewId: number, postId?: number) => 
      mutation.mutateAsync({ 
        operation: 'unhide', 
        review_id: reviewId,
        post_id: postId
      }),
  };
};

export const useDeleteAdminCommunityPost = () => {
  const mutation = useAdminCommunityPostMutation();
  
  return {
    ...mutation,
    deletePost: (reviewId: number, postId?: number) => 
      mutation.mutate({ 
        operation: 'delete', 
        review_id: reviewId,
        post_id: postId
      }),
  };
};