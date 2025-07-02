// ABOUTME: Main content management page for admin users to manage publication workflow

import React from 'react';
import { ContentQueue } from '@/components/admin/ContentManagement/ContentQueue';

const ContentManagement = () => {
  return (
    <div className="space-y-6">
      {/* Header Section - Enhanced typography hierarchy */}
      <div className="mb-6 space-y-2">
        <h2 className="text-3xl font-bold text-foreground mb-2 font-serif">Gestão de Conteúdo</h2>
        <p className="text-secondary text-lg">
          Gerencie o fluxo de publicação de todas as reviews e conteúdo.
        </p>
      </div>

      <ContentQueue />
    </div>
  );
};

export default ContentManagement;
