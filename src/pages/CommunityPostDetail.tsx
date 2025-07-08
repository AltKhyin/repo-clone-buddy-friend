// ABOUTME: Community post detail page component for displaying individual post discussions
import React from 'react';
import { useParams } from 'react-router-dom';
import { PostDetailWithSidebar } from '../components/community/PostDetailWithSidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const CommunityPostDetailContent = () => {
  const params = useParams();

  // Extract postId from route parameters
  const postId = React.useMemo(() => {
    const rawId = params.postId || params.id || params.post_id;
    return rawId ? String(rawId) : '';
  }, [params]);

  // Delegate to standardized PostDetailWithSidebar component
  // This provides identical architecture to CommunityFeedWithSidebar
  return <PostDetailWithSidebar postId={postId} />;
};

const CommunityPostDetail = () => {
  return (
    <ErrorBoundary
      tier="page"
      context="detalhes do post da comunidade"
      showDetails={false}
      showHomeButton={true}
      showBackButton={true}
    >
      <CommunityPostDetailContent />
    </ErrorBoundary>
  );
};

export default CommunityPostDetail;
