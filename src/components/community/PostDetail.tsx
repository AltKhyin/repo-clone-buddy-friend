
// ABOUTME: Unified post detail component that combines post content with threaded comments using enhanced CommentThread.

import React from 'react';
import { PostDetailCard } from './PostDetailCard';
import { CommentThread } from './CommentThread';
import { MinimalCommentInput } from './MinimalCommentInput';
import { useAuthStore } from '../../store/auth';
import { Separator } from '../ui/separator';
import type { CommunityPost } from '../../types/community';

interface PostDetailProps {
  post: CommunityPost;
  comments: CommunityPost[];
}

export const PostDetail = ({ post, comments }: PostDetailProps) => {
  const { user } = useAuthStore();

  const handleCommentPosted = () => {
    // Comment posted successfully - TanStack Query will handle cache invalidation automatically
    // No need for manual reload as useCreateCommentMutation invalidates the postWithComments query
    console.log('Comment posted successfully - cache will be updated automatically');
  };

  return (
    <div className="space-y-4">
      {/* Main Post */}
      <PostDetailCard post={post} />
      
      {/* Comment Section Separator */}
      <Separator className="border-border/50" />
      
      {/* Minimal Comment Input for Top-Level Comments */}
      {user && !post.is_locked && (
        <MinimalCommentInput
          parentPostId={post.id}
          onCommentPosted={handleCommentPosted}
          placeholder="Join the conversation"
        />
      )}
      
      {/* Locked Post Notice */}
      {post.is_locked && (
        <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <span className="text-sm font-medium">
              Esta discussão foi bloqueada pelos moderadores
            </span>
          </div>
        </div>
      )}
      
      {/* Comments Thread with Enhanced Threading */}
      <div className="space-y-3">
        <CommentThread 
          comments={comments} 
          onCommentPosted={handleCommentPosted}
        />
      </div>
    </div>
  );
};
