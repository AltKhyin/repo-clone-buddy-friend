
// ABOUTME: Suggestion page component for submitting and viewing content suggestions
import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SuggestionPage = () => {
  return (
    <ErrorBoundary 
      tier="page"
      context="página de sugestões"
      showDetails={false}
      showHomeButton={true}
      showBackButton={true}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Sugestões
          </h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Envie suas Sugestões</CardTitle>
              <CardDescription>
                Compartilhe ideias para novos conteúdos e melhorias da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500">
                Sistema de sugestões em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SuggestionPage;
