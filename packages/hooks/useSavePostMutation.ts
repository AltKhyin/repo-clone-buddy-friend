// ABOUTME: TanStack Query mutation hook for saving/unsaving community posts with cache invalidation.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import { SavePostMutationData, SavePostResponse } from '@/types';

/**
 * Mutation function that calls the save-post Edge Function
 * @param mutationData The post ID and optional save status
 */
const savePost = async (mutationData: SavePostMutationData): Promise<SavePostResponse> => {
  console.log('Saving post with data:', mutationData);
  
  const { data, error } = await supabase.functions.invoke('save-post', {
    body: mutationData,
  });

  if (error) {
    console.error('Save post error:', error);
    throw new Error(error.message || 'Failed to save post');
  }

  return data;
};

/**
 * Custom hook for saving/unsaving community posts
 * Automatically invalidates relevant queries on success
 */
export const useSavePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savePost,
    onSuccess: (data, variables) => {
      console.log('Post save successful:', data);
      
      // Invalidate saved posts queries to refresh the list
      queryClient.invalidateQueries({ 
        queryKey: ['savedPosts'] 
      });
      
      // Invalidate community feed queries to update the save status
      queryClient.invalidateQueries({ 
        queryKey: ['communityFeed'] 
      });
      
      // Invalidate community page queries
      queryClient.invalidateQueries({ 
        queryKey: ['communityPageData'] 
      });

      // Optionally update the specific post's cache immediately
      queryClient.setQueriesData(
        { queryKey: ['communityFeed'] },
        (oldData: any) => {
          if (!oldData) return oldData;
          
          // Update posts in paginated data structure
          if (oldData.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                posts: page.posts?.map((post: any) => 
                  post.id === variables.post_id 
                    ? { ...post, is_saved: data.is_saved }
                    : post
                )
              }))
            };
          }
          
          return oldData;
        }
      );
    },
    onError: (error) => {
      console.error('Failed to save/unsave post:', error);
    },
  });
};
