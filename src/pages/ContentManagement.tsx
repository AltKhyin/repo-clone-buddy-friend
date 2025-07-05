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
      <StandardLayout type="wide" contentClassName="space-y-8">
        {/* Header Section - Enhanced typography hierarchy */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground font-serif">Gestão de Conteúdo</h1>
          <p className="text-muted-foreground text-base">
            Gerencie o fluxo de publicação de todas as reviews e conteúdo.
          </p>
        </div>

        <ContentQueue />
      </StandardLayout>
    </ErrorBoundary>
  );
};

export default ContentManagement;
