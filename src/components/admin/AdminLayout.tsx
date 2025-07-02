// ABOUTME: Main layout component for admin dashboard with navigation and consistent structure

import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminNavigation } from './AdminNavigation';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useIsMobile } from '@/hooks/use-mobile';

export const AdminLayout = () => {
  const isMobile = useIsMobile();

  return (
    <ErrorBoundary
      tier="feature"
      context="painel administrativo"
      showDetails={process.env.NODE_ENV === 'development'}
      showHomeButton={true}
      showBackButton={true}
    >
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          {/* Header Section - Enhanced typography hierarchy */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 font-serif">
              Painel Administrativo
            </h1>
            <p className="text-secondary text-base">
              Gerencie conteúdo, usuários e configurações da plataforma
            </p>
          </div>

          {/* Layout Grid - Mobile responsive with proper spacing */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Navigation Sidebar - Enhanced with surface token */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-surface border-border shadow-sm">
                <AdminNavigation />
              </Card>
            </div>

            {/* Main Content Area - Enhanced spacing and styling */}
            <div className="lg:col-span-3">
              <ErrorBoundary
                tier="feature"
                context="conteúdo administrativo"
                showDetails={process.env.NODE_ENV === 'development'}
                showHomeButton={false}
                showBackButton={false}
              >
                <div className="space-y-6">
                  <Outlet />
                </div>
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
