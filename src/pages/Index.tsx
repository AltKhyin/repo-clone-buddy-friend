// ABOUTME: Main homepage with shell-aware responsive container pattern.

import React from 'react';
import { useConsolidatedHomepageFeedQuery } from '@packages/hooks/useHomepageFeedQuery';
import FeaturedReview from '../components/homepage/FeaturedReview';
import ReviewCarousel from '../components/homepage/ReviewCarousel';
import NextEditionModule from '../components/homepage/NextEditionModule';
import { Skeleton } from '../components/ui/skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StandardLayout } from '@/components/layout/StandardLayout';

const IndexContent = () => {
  // Use ONLY the consolidated query - no other API calls allowed
  const { data, isLoading, isError, error } = useConsolidatedHomepageFeedQuery();


  // Loading state with skeleton loaders
  if (isLoading) {
    return (
      <StandardLayout type="content-only" contentClassName="pb-6 space-y-8">
        <>
          {/* Featured Review Skeleton */}
          <Skeleton className="w-full h-96 rounded-md" />
          
          {/* Carousel Skeletons */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-64 rounded-md" />
              <div className="flex gap-4 overflow-x-auto">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="w-64 h-48 rounded-md flex-shrink-0" />
                ))}
              </div>
            </div>
          ))}
          
          {/* NextEdition Skeleton */}
          <Skeleton className="w-full h-80 rounded-md" />
        </>
      </StandardLayout>
    );
  }

  // Error state
  if (isError) {
    console.error('Homepage error details:', error);
    return (
      <StandardLayout type="centered" contentClassName="pb-6 text-center space-y-4">
        <div className="max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-foreground font-serif">Erro ao carregar a página</h1>
          <p className="text-muted-foreground">
            {error?.message || 'Ocorreu um erro inesperado. Tente novamente.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-semibold hover:bg-primary/90 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </StandardLayout>
    );
  }

  // If no data, show empty state
  if (!data) {
    return (
      <StandardLayout type="centered" contentClassName="pb-6 text-center space-y-4">
        <div className="max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-foreground font-serif">Nenhum conteúdo disponível</h1>
          <p className="text-muted-foreground">
            Não há conteúdo para exibir no momento.
          </p>
        </div>
      </StandardLayout>
    );
  }


  // Render modules based on layout order from API
  const renderModule = (moduleType: string) => {
    switch (moduleType) {
      case 'featured':
        return <FeaturedReview key="featured" review={data?.featured || null} />;
      
      case 'recent':
        return (
          <ReviewCarousel 
            key="recent"
            title="Edições Recentes" 
            reviews={data?.recent || []} 
          />
        );
      
      case 'popular':
        return (
          <ReviewCarousel 
            key="popular"
            title="Mais acessados" 
            reviews={data?.popular || []} 
          />
        );
      
      case 'recommendations':
        return (
          <ReviewCarousel 
            key="recommendations"
            title="Recomendados para você" 
            reviews={data?.recommendations || []} 
          />
        );
      
      case 'suggestions':
        return (
          <NextEditionModule 
            key="suggestions"
            suggestions={data?.suggestions || []} 
          />
        );
      
      default:
        console.warn(`Unknown module type: ${moduleType}`);
        return null;
    }
  };

  return (
    <StandardLayout type="content-only" contentClassName="pb-6 space-y-8">
      {/* Render modules in the order specified by the layout array */}
      {data?.layout?.map((moduleType) => renderModule(moduleType))}
    </StandardLayout>
  );
};

export default function Index() {
  return (
    <ErrorBoundary 
      tier="page"
      context="página inicial"
      showHomeButton={false}
      showBackButton={false}
    >
      <IndexContent />
    </ErrorBoundary>
  );
}