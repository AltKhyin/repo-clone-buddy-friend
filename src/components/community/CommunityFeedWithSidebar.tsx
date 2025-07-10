// ABOUTME: Unified two-column layout following standard container pattern - matches Homepage/Acervo.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Plus, X } from 'lucide-react';
import { PostCard } from './PostCard';
import { RedditStyleSidebar } from './RedditStyleSidebar';
import { CommunityErrorBoundary } from './CommunityErrorBoundary';
import { CommunityLoadingState } from './CommunityLoadingState';
import NetworkAwareFallback from './NetworkAwareFallback';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useIsMobile } from '../../hooks/use-mobile';
import { ContentGrid } from '@/components/layout/ContentGrid';
import { useCategoryFilter } from '../../contexts/CategoryFilterContext';
import { Badge } from '../ui/badge';
import type { CommunityPost, SidebarData } from '../../types/community';

interface CommunityFeedWithSidebarProps {
  posts: CommunityPost[];
  sidebarData?: SidebarData;
  onLoadMore: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  lastSync?: Date;
  isLoading?: boolean;
  error?: Error | null;
}

export const CommunityFeedWithSidebar = ({
  posts,
  sidebarData,
  onLoadMore,
  hasMore,
  isLoadingMore,
  lastSync,
  isLoading = false,
  error = null,
}: CommunityFeedWithSidebarProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isOnline } = useNetworkStatus();
  const { selectedCategoryId, clearCategoryFilter } = useCategoryFilter();

  const handleCreatePost = () => {
    navigate('/comunidade/criar');
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Show network-aware fallback for offline scenarios
  if (!isOnline && posts.length === 0) {
    return (
      <NetworkAwareFallback
        isOnline={isOnline}
        lastSync={lastSync}
        onRetry={handleRetry}
        context="comunidade"
      />
    );
  }

  // Standardized layout using ContentGrid for proper width allocation
  return (
    <ContentGrid
      sidebarType="fixed"
      className="pb-6"
      sidebarContent={
        !isMobile ? (
          <CommunityErrorBoundary context="sidebar da comunidade">
            <RedditStyleSidebar />
          </CommunityErrorBoundary>
        ) : undefined
      }
    >
      {/* Main Feed Content */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Comunidade</h1>
          <Button onClick={handleCreatePost} size={isMobile ? 'sm' : 'default'}>
            <Plus className="w-4 h-4 mr-2" />
            {isMobile ? 'Nova' : 'Nova Discussão'}
          </Button>
        </div>

        {/* Category Filter Display */}
        {selectedCategoryId && (
          <div className="flex items-center gap-2 py-2">
            <span className="text-sm text-muted-foreground">Filtrando por:</span>
            <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
              <span className="text-sm">
                {sidebarData?.categories?.find(cat => cat.id.toString() === selectedCategoryId)
                  ?.name || 'Categoria'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                onClick={clearCategoryFilter}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          </div>
        )}

        {/* Network status indicator for stale data */}
        <NetworkAwareFallback
          isOnline={isOnline}
          lastSync={lastSync}
          showCachedBadge={posts.length > 0}
          context="discussões"
        />

        {/* Posts feed with enhanced error boundary */}
        <CommunityErrorBoundary context="feed da comunidade" showDetails={false}>
          <div className="space-y-4">
            {posts.length === 0 && !isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Nenhuma discussão encontrada.</p>
                <Button variant="outline" onClick={handleCreatePost}>
                  Criar a primeira discussão
                </Button>
              </div>
            ) : (
              <>
                {posts.map(post => (
                  <CommunityErrorBoundary key={post.id} context={`post ${post.id}`}>
                    <PostCard post={post} />
                  </CommunityErrorBoundary>
                ))}

                {/* Enhanced load more section */}
                {hasMore && (
                  <div className="flex justify-center pt-6">
                    {isLoadingMore ? (
                      <CommunityLoadingState
                        variant="minimal"
                        description="Carregando mais discussões..."
                      />
                    ) : (
                      <Button variant="outline" onClick={onLoadMore} disabled={!isOnline}>
                        {!isOnline ? 'Sem conexão' : 'Carregar mais'}
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </CommunityErrorBoundary>
      </div>
    </ContentGrid>
  );
};
