
// ABOUTME: Individual community post page following standard shell integration pattern - matches other detail pages.

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PostDetail } from '../components/community/PostDetail';
import { CommunitySidebar } from '../components/community/CommunitySidebar';
import { CommunityErrorBoundary } from '../components/community/CommunityErrorBoundary';
import { CommunityLoadingState } from '../components/community/CommunityLoadingState';
import { usePostWithCommentsQuery } from '../../packages/hooks/usePostWithCommentsQuery';
import { useCommunityPageQuery } from '../../packages/hooks/useCommunityPageQuery';
import { useIsMobile } from '../hooks/use-mobile';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

const CommunityPostPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Enhanced ID parsing with comprehensive validation
  const postId = React.useMemo(() => {
    console.log('CommunityPostPage: Raw params object:', params);
    console.log('CommunityPostPage: Available param keys:', Object.keys(params));
    
    // Try different possible parameter names
    const rawId = params.id || params.postId || params.post_id;
    console.log('CommunityPostPage: Raw ID value:', rawId, 'Type:', typeof rawId);
    
    if (!rawId) {
      console.error('CommunityPostPage: No ID parameter found in route params');
      return 0;
    }
    
    const trimmedId = String(rawId).trim();
    if (!trimmedId) {
      console.error('CommunityPostPage: Empty ID parameter after trim');
      return 0;
    }
    
    const parsed = parseInt(trimmedId, 10);
    if (isNaN(parsed) || parsed <= 0) {
      console.error('CommunityPostPage: Invalid ID parameter:', trimmedId, 'parsed as:', parsed);
      return 0;
    }
    
    console.log('CommunityPostPage: Valid ID parsed:', parsed);
    return parsed;
  }, [params]);

  console.log('CommunityPostPage: Final postId for queries:', postId);

  // Fetch post and comments with enhanced error handling
  const { 
    data: postData, 
    isLoading: postLoading, 
    error: postError 
  } = usePostWithCommentsQuery(postId);

  // Fetch sidebar data (reuse community page query for consistency)
  const { 
    data: communityData,
    isLoading: sidebarLoading 
  } = useCommunityPageQuery();

  const handleBackToFeed = () => {
    navigate('/comunidade'); // CORRECTED: Use Portuguese path
  };

  // Early return for invalid ID with improved UX
  if (postId === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
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
      </div>
    );
  }

  if (postLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <CommunityLoadingState description="Carregando discussão..." />
      </div>
    );
  }

  if (postError || !postData) {
    console.error('Post error or no data:', postError, postData);
    return (
      <div className="container mx-auto px-4 py-6">
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
    );
  }

  const { post, comments } = postData;
  const sidebarData = communityData?.sidebarData;

  // Standard shell integration matching other detail pages
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back to feed button */}
      <div className="mb-4">
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

      {/* Standard two-column layout */}
      <div className={`flex gap-8 ${isMobile ? 'flex-col' : 'flex-row'}`}>
        {/* Main Content Column */}
        <div className={`${isMobile ? 'w-full' : 'flex-1'} min-w-0`}>
          <CommunityErrorBoundary context="post detail">
            <PostDetail post={post} comments={comments} />
          </CommunityErrorBoundary>
        </div>

        {/* Sidebar Column - Desktop Only */}
        {!isMobile && sidebarData && (
          <div className="w-80 flex-shrink-0">
            <CommunityErrorBoundary context="sidebar da comunidade">
              <CommunitySidebar 
                rules={sidebarData.rules}
                links={sidebarData.links}
                trendingDiscussions={sidebarData.trendingDiscussions}
                featuredPoll={sidebarData.featuredPoll}
                recentActivity={sidebarData.recentActivity}
              />
            </CommunityErrorBoundary>
          </div>
        )}

        {/* Mobile Sidebar Content Integration */}
        {isMobile && sidebarData && (
          <div className="w-full mt-8">
            <div className="space-y-6">
              {/* Featured content as horizontal cards */}
              {sidebarData.featuredPoll && (
                <div className="p-4 bg-surface/50 rounded-lg">
                  <h3 className="font-medium mb-2">Enquete em Destaque</h3>
                  <p className="text-sm text-muted-foreground">
                    {sidebarData.featuredPoll.question}
                  </p>
                </div>
              )}

              {/* Trending discussions */}
              {sidebarData.trendingDiscussions.length > 0 && (
                <div className="p-4 bg-surface/50 rounded-lg">
                  <h3 className="font-medium mb-3">Em Alta</h3>
                  <div className="space-y-2">
                    {sidebarData.trendingDiscussions.slice(0, 3).map((discussion) => (
                      <div key={discussion.id} className="text-sm">
                        <div className="font-medium line-clamp-1">{discussion.title}</div>
                        <div className="text-muted-foreground text-xs">
                          {discussion.upvotes} votos • {discussion.reply_count} respostas
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPostPage;
