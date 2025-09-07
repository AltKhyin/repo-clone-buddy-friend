// ABOUTME: Simplified admin tag management page focused on core operations (Add, Remove, Edit, Organize)

import React from 'react';
import { TagHierarchy } from '@/components/admin/TagManagement/TagHierarchy';
import { StandardLayout } from '@/components/layout/StandardLayout';

const AdminTagManagement = () => {
  return (
    <StandardLayout type="wide" contentClassName="space-y-6">
      {/* Simple header focused on core purpose */}
      <div className="mb-6 space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Gerenciar Tags</h2>
        <p className="text-muted-foreground">
          Adicione, edite, organize e remova tags do sistema.
        </p>
      </div>
      
      {/* Only the core tag management interface */}
      <TagHierarchy />
    </StandardLayout>
  );
};

export default AdminTagManagement;
