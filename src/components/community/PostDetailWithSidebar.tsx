// ABOUTME: Unified post detail layout following CommunityFeedWithSidebar architecture pattern.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import { RedditStyleSidebar } from './RedditStyleSidebar';
import { CommunityErrorBoundary } from './CommunityErrorBoundary';
import { CommunityLoadingState } from './CommunityLoadingState';
import { PostDetailContent } from './PostDetailContent';
import NetworkAwareFallback from './NetworkAwareFallback';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useIsMobile } from '../../hooks/use-mobile';
import { ContentGrid } from '@/components/layout/ContentGrid';
import { usePostWithCommentsQuery } from '@packages/hooks/usePostWithCommentsQuery';
import { useCommunityPageQuery } from '@packages/hooks/useCommunityPageQuery';

interface PostDetailWithSidebarProps {
  postId: string;
}

export const PostDetailWithSidebar = ({ postId }: PostDetailWithSidebarProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isOnline } = useNetworkStatus();

  // Parse postId to number for the query
  const parsedPostId = React.useMemo(() => {
    const trimmedId = String(postId).trim();
    if (!trimmedId) return 0;

    const parsed = parseInt(trimmedId, 10);
    if (isNaN(parsed) || parsed <= 0) return 0;

    return parsed;
  }, [postId]);

  // Fetch post and comments data
  const {
    data: postData,
    isLoading: postLoading,
    error: postError,
  } = usePostWithCommentsQuery(parsedPostId);

  // Fetch sidebar data (reuse community page query for consistency)
  const {
    data: communityData,
    isLoading: sidebarLoading,
    lastSync,
  } = useCommunityPageQuery({ postId: parsedPostId });

  const handleBackToFeed = () => {
    navigate('/comunidade');
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Early return for invalid ID
  if (parsedPostId === 0) {
    return (
      <ContentGrid sidebarType="none" className="pb-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">URL inválida</h2>
          <p className="text-muted-foreground mb-6">
            O ID do post não foi fornecido ou é inválido.
          </p>
          <Button onClick={handleBackToFeed} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a comunidade
          </Button>
        </div>
      </ContentGrid>
    );
  }

  // Show network-aware fallback for offline scenarios
  if (!isOnline && !postData) {
    return (
      <NetworkAwareFallback
        isOnline={isOnline}
        lastSync={lastSync}
        onRetry={handleRetry}
        context="post da comunidade"
      />
    );
  }

  // Loading state with enhanced alignment to community feed patterns
  if (postLoading) {
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
        <div className="space-y-6">
          {/* Back to feed button - shown during loading */}
          <div className="flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToFeed}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para a comunidade
            </Button>
          </div>

          {/* Loading state matching community feed pattern */}
          <CommunityLoadingState description="Carregando discussão..." />
        </div>
      </ContentGrid>
    );
  }

  // Error state with enhanced alignment to community feed patterns
  if (postError || !postData) {
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
        <div className="space-y-6">
          {/* Back to feed button - shown during error */}
          <div className="flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToFeed}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para a comunidade
            </Button>
          </div>

          {/* Error message aligned with community feed pattern */}
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">Post não encontrado</h2>
            <p className="text-muted-foreground mb-6">
              Este post pode ter sido removido ou você pode não ter permissão para visualizá-lo.
            </p>
            <Button onClick={handleBackToFeed} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para a comunidade
            </Button>
          </div>
        </div>
      </ContentGrid>
    );
  }

  const sidebarData = communityData?.sidebarData;

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
      {/* Main Post Detail Content */}
      <div className="space-y-6">
        {/* Back to feed button */}
        <div className="flex justify-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToFeed}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a comunidade
          </Button>
        </div>

        {/* Network status indicator for stale data */}
        <NetworkAwareFallback
          isOnline={isOnline}
          lastSync={lastSync}
          showCachedBadge={!!postData}
          context="post"
        />

        {/* Post detail with enhanced error boundary */}
        <CommunityErrorBoundary context="post detail" showDetails={false}>
          <PostDetailContent post={postData.post} comments={postData.comments} />
        </CommunityErrorBoundary>
      </div>
    </ContentGrid>
  );
};
