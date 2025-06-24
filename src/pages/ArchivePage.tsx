
// ABOUTME: Archive page component for displaying historical reviews and content collections
import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import CollectionPage from './CollectionPage';

const ArchivePage = () => {
  return (
    <ErrorBoundary 
      tier="page"
      context="página de arquivo"
      showDetails={false}
      showHomeButton={true}
      showBackButton={true}
    >
      <CollectionPage />
    </ErrorBoundary>
  );
};

export default ArchivePage;
