
// ABOUTME: TanStack Query mutation hook for casting votes on community posts with optimistic updates.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import { toast } from 'sonner';
import type { CommunityPost } from './useCommunityPageQuery';

interface VoteParams {
  postId: number;
  voteType: 'up' | 'down' | null;
}

interface FeedResponse {
  posts: CommunityPost[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

const castCommunityVote = async ({ postId, voteType }: VoteParams) => {
  console.log('Casting community vote:', { postId, voteType });
  
  const { data, error } = await supabase.functions.invoke('cast-community-vote', {
    body: { post_id: postId, vote_type: voteType }
  });

  if (error) {
    console.error('Community vote error:', error);
    throw new Error(error.message || 'Failed to cast vote');
  }

  if (data?.error) {
    console.error('Community vote API error:', data.error);
    throw new Error(data.error.message || 'Failed to cast vote');
  }

  console.log('Community vote cast successfully');
  return data;
};

export const useCastCommunityVoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: castCommunityVote,
    // TASK 2.2: Implement optimistic updates for immediate UI feedback
    onMutate: async ({ postId, voteType }) => {
      // Cancel any outgoing refetches to prevent conflicts
      await queryClient.cancelQueries({ queryKey: ['community-page-data'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: ['community-page-data'] });

      // Optimistically update the cache
      queryClient.setQueriesData(
        { queryKey: ['community-page-data'] },
        (old: any) => {
          if (!old?.pages) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              posts: page.posts.map((post: CommunityPost) => {
                if (post.id !== postId) return post;

                const currentVote = post.user_vote;
                let newUpvotes = post.upvotes;
                let newDownvotes = post.downvotes;

                // Remove previous vote if exists
                if (currentVote === 'up') newUpvotes--;
                if (currentVote === 'down') newDownvotes--;

                // Add new vote if not removing
                if (voteType === 'up') newUpvotes++;
                if (voteType === 'down') newDownvotes++;

                return {
                  ...post,
                  upvotes: Math.max(0, newUpvotes),
                  downvotes: Math.max(0, newDownvotes),
                  user_vote: voteType
                };
              })
            }))
          };
        }
      );

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      console.error('Community vote mutation error:', error);
      toast.error(error.message || 'Erro ao votar');
    },
    onSuccess: () => {
      // The optimistic update already handled the UI change
      // We just need to ensure final consistency by invalidating
      queryClient.invalidateQueries({ queryKey: ['community-page-data'] });
    },
  });
};
