
// ABOUTME: Main layout component for admin dashboard with navigation and consistent structure

import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminNavigation } from './AdminNavigation';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const AdminLayout = () => {
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground">
              Gerencie conteúdo, usuários e configurações da plataforma
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card className="p-4">
                <AdminNavigation />
              </Card>
            </div>
            
            <div className="lg:col-span-3">
              <ErrorBoundary 
                tier="feature"
                context="conteúdo administrativo"
                showDetails={process.env.NODE_ENV === 'development'}
                showHomeButton={false}
                showBackButton={false}
              >
                <Outlet />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
