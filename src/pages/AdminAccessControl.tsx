// ABOUTME: Admin access control management page for configuring page-level access rules

import React from 'react';
import { PageAccessControlManager } from '@/components/admin/PageAccessControlManager';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const AdminAccessControl = () => {
  return (
    <ErrorBoundary
      tier="feature"
      context="controle de acesso"
      showDetails={process.env.NODE_ENV === 'development'}
      showHomeButton={true}
      showBackButton={true}
    >
      <div className="space-y-6">
        {/* Header Section - Enhanced typography hierarchy */}
        <div className="mb-6 space-y-2">
          <h2 className="text-3xl font-bold text-foreground mb-2 font-serif">Controle de Acesso</h2>
          <p className="text-secondary text-lg">
            Configure regras de acesso para páginas e recursos da plataforma.
          </p>
        </div>

        <PageAccessControlManager />
      </div>
    </ErrorBoundary>
  );
};

export default AdminAccessControl;
