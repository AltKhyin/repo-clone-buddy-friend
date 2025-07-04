// ABOUTME: Main content management page for admin users to manage publication workflow with proper layout constraints

import React from 'react';
import { ContentQueue } from '@/components/admin/ContentManagement/ContentQueue';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StandardLayout } from '@/components/layout/StandardLayout';

const ContentManagement = () => {
  return (
    <ErrorBoundary
      tier="feature"
      context="gestão de conteúdo"
      showDetails={process.env.NODE_ENV === 'development'}
      showHomeButton={true}
      showBackButton={true}
    >
      <StandardLayout type="wide" contentClassName="space-y-6">
        {/* Header Section - Enhanced typography hierarchy */}
        <div className="mb-6 space-y-2">
          <h2 className="text-3xl font-bold text-foreground mb-2 font-serif">Gestão de Conteúdo</h2>
          <p className="text-secondary text-lg">
            Gerencie o fluxo de publicação de todas as reviews e conteúdo.
          </p>
        </div>

        <ContentQueue />
      </StandardLayout>
    </ErrorBoundary>
  );
};

export default ContentManagement;
