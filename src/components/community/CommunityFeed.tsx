
// ABOUTME: Reddit-style community feed with true flat design and optimized infinite scroll.

import React from 'react';
import { PostCard } from './PostCard';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Loader2 } from 'lucide-react';
import type { CommunityPost } from '@/types/community';

interface CommunityFeedProps {
  posts: CommunityPost[];
  onLoadMore: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export const CommunityFeed = ({
  posts,
  onLoadMore,
  hasMore,
  isLoadingMore
}: CommunityFeedProps) => {
  return (
    <div className="reddit-feed-container">
      {posts.map((post, index) => (
        <React.Fragment key={post.id}>
          <PostCard post={post} />
          {/* Subtle separator between posts - only if not last */}
          {index < posts.length - 1 && (
            <Separator className="border-border/20" />
          )}
        </React.Fragment>
      ))}

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center py-8">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="reddit-action-button px-6 py-2 h-auto"
          >
            {isLoadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {isLoadingMore ? 'Carregando...' : 'Carregar mais'}
          </Button>
        </div>
      )}
    </div>
  );
};
