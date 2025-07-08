// ABOUTME: Content component for post detail rendering, following CommunityFeedWithSidebar architectural pattern.

import React from 'react';
import { PostDetail } from './PostDetail';
import type { CommunityPost } from '../../types/community';

interface PostDetailContentProps {
  post: CommunityPost;
  comments: CommunityPost[];
}

export const PostDetailContent = ({ post, comments }: PostDetailContentProps) => {
  // Delegate to existing PostDetail component to maintain all current functionality
  // This approach follows [C0.2.1] Leverage existing components and [C3.1] Component reusability
  return <PostDetail post={post} comments={comments} />;
};
