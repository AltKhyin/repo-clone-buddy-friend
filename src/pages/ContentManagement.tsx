
// ABOUTME: Main content management page for admin users to manage publication workflow

import React from 'react';
import { ContentQueue } from '@/components/admin/ContentManagement/ContentQueue';

const ContentManagement = () => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Gestão de Conteúdo
        </h2>
        <p className="text-gray-600">
          Gerencie o fluxo de publicação de todas as reviews e conteúdo.
        </p>
      </div>
      
      <ContentQueue />
    </div>
  );
};

export default ContentManagement;
