// ABOUTME: Admin user management page for user administration and role management

import React from 'react';
import { UserListTable } from '@/components/admin/UserManagement/UserListTable';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StandardLayout } from '@/components/layout/StandardLayout';

const AdminUserManagement = () => {
  return (
    <ErrorBoundary
      tier="feature"
      context="gestão de usuários"
      showDetails={process.env.NODE_ENV === 'development'}
      showHomeButton={true}
      showBackButton={true}
    >
      <StandardLayout type="wide" contentClassName="space-y-6">
        {/* Header Section - Enhanced typography hierarchy */}
        <div className="mb-6 space-y-2">
          <h2 className="text-3xl font-bold text-foreground mb-2 font-serif">Gestão de Usuários</h2>
          <p className="text-secondary text-lg">
            Gerencie usuários, papéis e permissões da plataforma.
          </p>
        </div>

        <UserListTable />
      </StandardLayout>
    </ErrorBoundary>
  );
};

export default AdminUserManagement;
