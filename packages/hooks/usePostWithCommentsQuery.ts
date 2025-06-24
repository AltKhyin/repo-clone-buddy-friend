
// ABOUTME: TanStack Query hook for fetching a post with its complete comment tree - enhanced debugging and error handling.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import type { CommunityPost } from '../../src/types/community';

interface PostWithCommentsData {
  post: CommunityPost;
  comments: CommunityPost[];
}

/**
 * Fetches a single post with its complete comment tree.
 * Uses multiple fallback strategies for maximum reliability.
 * @param postId The ID of the post to fetch
 */
const fetchPostWithComments = async (postId: number): Promise<PostWithCommentsData> => {
  console.log('=== fetchPostWithComments START ===');
  console.log('Input postId:', postId, 'Type:', typeof postId);
  
  if (!postId || postId <= 0) {
    console.error('Invalid postId provided:', postId);
    throw new Error(`Invalid post ID: ${postId}. Expected a positive number.`);
  }

  // Get the authenticated user ID for personalized data
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('Auth error:', authError);
  }
  
  const userId = user?.id || '00000000-0000-0000-0000-000000000000';
  console.log('Current user ID:', userId);

  // Strategy 1: Try edge function approach
  try {
    console.log('Attempting edge function approach...');
    const { data: postData, error: postError } = await supabase.functions.invoke('get-community-post-detail', {
      body: { post_id: postId }
    });

    if (postError) {
      console.error('Edge function error:', postError);
      throw new Error(`Edge function failed: ${postError.message}`);
    }

    if (!postData) {
      console.error('No post data returned from edge function');
      throw new Error(`Post with ID ${postId} not found via edge function`);
    }

    console.log('Post fetched successfully via edge function:', postData);

    // Fetch comments using the optimized RPC function
    const { data: comments, error: commentsError } = await supabase
      .rpc('get_comments_for_post', {
        p_post_id: postId,
        p_user_id: userId
      });

    if (commentsError) {
      console.error('Comments RPC error:', commentsError);
      // Don't fail the entire query if comments fail
      return { post: postData as CommunityPost, comments: [] };
    }

    console.log('Comments fetched successfully:', comments?.length || 0, 'comments');
    
    return {
      post: postData as CommunityPost,
      comments: (comments || []) as CommunityPost[]
    };
    
  } catch (edgeFunctionError) {
    console.error('Edge function approach failed, trying direct query:', edgeFunctionError);
    
    // Strategy 2: Fallback to direct database query
    try {
      console.log('Attempting direct database query...');
      
      const { data: post, error: postError } = await supabase
        .from('CommunityPosts')
        .select(`
          *,
          author:Practitioners!author_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('id', postId)
        .is('parent_post_id', null) // Ensure it's a top-level post
        .single();

      if (postError) {
        console.error('Direct query post error:', postError);
        throw new Error(`Failed to fetch post via direct query: ${postError.message}`);
      }

      if (!post) {
        console.error('No post found with direct query');
        throw new Error(`Post with ID ${postId} not found via direct query`);
      }

      console.log('Post fetched successfully via direct query:', post);

      // Fetch comments using the optimized RPC function
      const { data: comments, error: commentsError } = await supabase
        .rpc('get_comments_for_post', {
          p_post_id: postId,
          p_user_id: userId
        });

      if (commentsError) {
        console.error('Comments RPC error (fallback):', commentsError);
        // Don't fail the entire query if comments fail
        return { post: post as CommunityPost, comments: [] };
      }

      console.log('=== fetchPostWithComments SUCCESS ===');
      return {
        post: post as CommunityPost,
        comments: (comments || []) as CommunityPost[]
      };
      
    } catch (directQueryError) {
      console.error('Direct query also failed:', directQueryError);
      
      // Strategy 3: Final fallback - try to get just basic post data
      console.log('Attempting minimal post query as last resort...');
      
      const { data: minimalPost, error: minimalError } = await supabase
        .from('CommunityPosts')
        .select('*')
        .eq('id', postId)
        .single();
        
      if (minimalError || !minimalPost) {
        console.error('All fetch strategies failed. Final error:', minimalError);
        throw new Error(`Post with ID ${postId} could not be found using any method. This may indicate the post doesn't exist or you don't have permission to view it.`);
      }
      
      console.log('Minimal post data retrieved as fallback:', minimalPost);
      return {
        post: minimalPost as CommunityPost,
        comments: []
      };
    }
  }
};

/**
 * Custom hook for fetching a post with all its comments.
 * Follows [D3.4] Data Access Layer patterns with enhanced debugging.
 * @param postId The ID of the post to fetch
 */
export const usePostWithCommentsQuery = (postId: number) => {
  console.log('usePostWithCommentsQuery called with postId:', postId, 'Type:', typeof postId);
  
  return useQuery({
    queryKey: ['postWithComments', postId],
    queryFn: () => {
      console.log('Query function executing with postId:', postId);
      return fetchPostWithComments(postId);
    },
    enabled: !!postId && postId > 0 && !isNaN(postId),
    staleTime: 30 * 1000, // 30 seconds - comments change frequently
    retry: (failureCount, error) => {
      console.log(`Query retry attempt ${failureCount}:`, error);
      return failureCount < 3; // Retry up to 3 times
    },
    meta: {
      errorMessage: `Failed to load post details for ID: ${postId}`
    }
  });
};
