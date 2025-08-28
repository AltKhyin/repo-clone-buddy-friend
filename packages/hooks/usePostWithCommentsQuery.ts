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
 * Uses Edge Function approach only, following [C6.2] Data Access Layer principles.
 * @param postId The ID of the post to fetch
 */
const fetchPostWithComments = async (postId: number): Promise<PostWithCommentsData> => {
  if (!postId || postId <= 0) {
    throw new Error(`Invalid post ID: ${postId}. Expected a positive number.`);
  }

  // Get the authenticated user ID for personalized data
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  
  const userId = user?.id || '00000000-0000-0000-0000-000000000000';
  
  try {
    // Fetch post details via Edge Function (now with fixed CORS)
    const { data: postData, error: postError } = await supabase.functions.invoke(
      'get-community-post-detail',
      {
        body: { post_id: postId },
      }
    );

    if (postError) {
      throw new Error(`Failed to load post: ${postError.message || 'Unknown error'}`);
    }

    if (!postData) {
      throw new Error(`Post with ID ${postId} not found`);
    }

    // Extract the actual post data from the response
    const actualPostData = postData?.data || postData;

    // Fetch comments using the optimized RPC function
    const { data: comments, error: commentsError } = await supabase.rpc('get_comments_for_post', {
      p_post_id: postId,
      p_user_id: userId,
    });

    if (commentsError) {
      // Don't fail the entire query if comments fail - show post without comments
      return { post: actualPostData as CommunityPost, comments: [] };
    }

    return {
      post: actualPostData as CommunityPost,
      comments: (comments || []) as CommunityPost[],
    };
  } catch (error) {
    
    // Enhanced error messaging for better debugging
    if (error instanceof Error) {
      if (error.message.includes('CORS')) {
        throw new Error('Connection blocked. Please ensure you\'re using the correct domain or refresh the page.');
      }
      if (error.message.includes('Network')) {
        throw new Error('Network connection issue. Please check your internet connection and try again.');
      }
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error('Authentication required. Please log in to view this post.');
      }
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('You don\'t have permission to view this post.');
      }
      if (error.message.includes('404') || error.message.includes('not found')) {
        throw new Error('This post was not found. It may have been deleted or moved.');
      }
    }
    
    // Generic fallback error
    throw new Error('Unable to load post. Please try refreshing the page or contact support if the problem persists.');
  }
};

/**
 * Custom hook for fetching a post with all its comments.
 * Follows [D3.4] Data Access Layer patterns with optimized caching and reliability.
 * @param postId The ID of the post to fetch
 */
export const usePostWithCommentsQuery = (postId: number) => {
  return useQuery({
    queryKey: ['postWithComments', postId],
    queryFn: () => fetchPostWithComments(postId),
    enabled: !!postId && postId > 0 && !isNaN(postId),
    
    // PERFORMANCE OPTIMIZATIONS:
    staleTime: 2 * 60 * 1000, // 2 minutes - balance between freshness and performance
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer for back navigation
    
    // RELIABILITY OPTIMIZATIONS:
    retry: (failureCount, error) => {
      // Don't retry on client-side errors (400-499)
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403') || 
            error.message.includes('404') || error.message.includes('not found')) {
          return false;
        }
      }
      
      // Exponential backoff: 1s, 2s, 4s
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
    
    // UX OPTIMIZATIONS:
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnMount: 'stale', // Only refetch if data is stale
    refetchInterval: false, // Don't auto-refresh comments (user-driven)
    
    // BACKGROUND UPDATES:
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchIntervalInBackground: false, // Don't waste resources in background
    
    meta: {
      errorMessage: `Failed to load post details for ID: ${postId}`,
    },
    
    // STRUCTURED ERROR HANDLING:
    throwOnError: (error) => {
      // Let authentication and permission errors bubble up to UI
      if (error instanceof Error && 
          (error.message.includes('401') || error.message.includes('403'))) {
        return true;
      }
      // Suppress other errors to avoid breaking the UI
      return false;
    },
  });
};
