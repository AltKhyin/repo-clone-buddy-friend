// ABOUTME: Comprehensive admin community management page for configuring sidebar sections, categories, announcements, and community features

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Layout, Folder, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { CategoryManagement } from '@/components/admin/CommunityManagement/CategoryManagement';
import { SidebarSectionManagement } from '@/components/admin/CommunityManagement/SidebarSectionManagement';
import { AnnouncementManagement } from '@/components/admin/CommunityManagement/AnnouncementManagement';
import { NotificationManagement } from '@/components/admin/CommunityManagement/NotificationManagement';
import { StandardLayout } from '@/components/layout/StandardLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const AdminCommunityManagementContent = () => {
  const { user } = useAuthStore();

  return (
    <StandardLayout type="wide" contentClassName="space-y-6">
      {/* Header Section */}
      <div className="mb-6 space-y-2">
        <h2 className="text-3xl font-bold text-foreground mb-2 font-serif">Gestão da Comunidade</h2>
        <p className="text-muted-foreground text-lg">
          Configure seções da sidebar, categorias, anúncios e recursos da comunidade.
        </p>
      </div>

      {/* Simplified Single-Page Management Interface */}
      <div className="space-y-8">
        {/* Sidebar Sections Management */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Layout className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Gestão das Seções da Sidebar</h3>
          </div>
          <SidebarSectionManagement />
        </section>

        {/* Categories Management */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Folder className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Gestão de Categorias</h3>
          </div>
          <CategoryManagement />
        </section>

        {/* Announcements Management */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Gestão de Anúncios</h3>
          </div>
          <AnnouncementManagement />
        </section>

        {/* Notification Management */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Notificações Inbox</h3>
          </div>
          <NotificationManagement />
        </section>
      </div>
    </StandardLayout>
  );
};

export default function AdminCommunityManagement() {
  return (
    <ErrorBoundary
      tier="page"
      context="gestão da comunidade"
      showHomeButton={true}
      showBackButton={true}
    >
      <AdminCommunityManagementContent />
    </ErrorBoundary>
  );
}

export { AdminCommunityManagement };
