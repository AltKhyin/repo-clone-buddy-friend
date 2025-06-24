
// ABOUTME: Community post detail page component for displaying individual post discussions
import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import CommunityPostPage from './CommunityPostPage';

const CommunityPostDetail = () => {
  return (
    <ErrorBoundary 
      tier="page"
      context="detalhes do post da comunidade"
      showDetails={false}
      showHomeButton={true}
      showBackButton={true}
    >
      <CommunityPostPage />
    </ErrorBoundary>
  );
};

export default CommunityPostDetail;
