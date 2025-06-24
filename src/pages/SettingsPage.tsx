
// ABOUTME: User settings page component for account and preference management
import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SettingsPage = () => {
  return (
    <ErrorBoundary 
      tier="page"
      context="página de configurações"
      showDetails={false}
      showHomeButton={true}
      showBackButton={true}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Configurações
          </h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Conta</CardTitle>
              <CardDescription>
                Gerencie suas preferências e configurações de conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500">
                Página de configurações em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SettingsPage;
