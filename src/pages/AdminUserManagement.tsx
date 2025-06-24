
// ABOUTME: Admin user management page for user administration and role management

import React from 'react';
import { UserListTable } from '@/components/admin/UserManagement/UserListTable';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const AdminUserManagement = () => {
  return (
    <ErrorBoundary 
      tier="feature"
      context="gestão de usuários"
      showDetails={process.env.NODE_ENV === 'development'}
      showHomeButton={true}
      showBackButton={true}
    >
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Gestão de Usuários
          </h2>
          <p className="text-gray-600">
            Gerencie usuários, papéis e permissões da plataforma.
          </p>
        </div>

        <UserListTable />
      </div>
    </ErrorBoundary>
  );
};

export default AdminUserManagement;
