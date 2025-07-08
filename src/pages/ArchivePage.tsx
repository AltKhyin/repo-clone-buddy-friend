// ABOUTME: Archive page component for displaying historical reviews and content collections

import React, { useState, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAcervoDataQuery } from '../../packages/hooks/useAcervoDataQuery';
import { useContentAccessFilter } from '@/hooks/useContentAccessFilter';
import { Skeleton } from '@/components/ui/skeleton';
import { AccessUpgradePrompt } from '@/components/ui/AccessUpgradePrompt';
import TagsPanel from '@/components/acervo/TagsPanel';
import MobileTagsModal from '@/components/acervo/MobileTagsModal';
import MasonryGrid from '@/components/acervo/MasonryGrid';
import { ClientSideSorter } from '@/components/acervo/ClientSideSorter';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StandardLayout } from '@/components/layout/StandardLayout';

export const ArchivePageContent = () => {
  const isMobile = useIsMobile();
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'alphabetical'>('recent');

  const { data: acervoData, isLoading, error } = useAcervoDataQuery();

  const handleTagSelect = useMemo(
    () => (tagId: number) => {
      setSelectedTags(prev => {
        if (prev.includes(tagId)) {
          // Remove tag
          return prev.filter(id => id !== tagId);
        } else {
          // Add tag
          return [...prev, tagId];
        }
      });
    },
    []
  );

  // Add content filtering based on user access level
  const {
    filteredContent: accessibleReviews,
    totalFiltered,
    statistics,
    userAccessLevel,
  } = useContentAccessFilter(acervoData?.reviews, {
    accessLevelField: 'access_level',
    defaultAccessLevel: 'public',
  });

  // Memoize skeleton component to prevent re-renders
  const loadingSkeleton = useMemo(
    () => (
      <div className="min-h-screen" data-testid="loading-skeleton">
        <div className="p-6">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-22" />
          </div>
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="mb-4 break-inside-avoid">
                <Skeleton className="w-full h-48" />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    []
  );

  if (isLoading) {
    return (
      <StandardLayout type="content-only" contentClassName="px-6 pb-6">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-22" />
        </div>
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mb-4 break-inside-avoid">
              <Skeleton className="w-full h-48" />
            </div>
          ))}
        </div>
      </StandardLayout>
    );
  }

  if (isLoading) {
    return loadingSkeleton;
  }

  if (error) {
    return (
      <StandardLayout type="centered" contentClassName="text-center">
        <div>
          <h2 className="text-2xl font-bold text-destructive mb-2">Erro ao carregar Acervo</h2>
          <p className="text-muted-foreground">{error.message || 'Ocorreu um erro inesperado'}</p>
        </div>
      </StandardLayout>
    );
  }

  if (!acervoData) {
    return (
      <StandardLayout type="centered" contentClassName="text-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Nenhum dado encontrado</h2>
          <p className="text-muted-foreground">Não foi possível carregar o conteúdo do Acervo</p>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout type="content-only" contentClassName="px-6 pb-6">
      {/* Desktop: Horizontal Tags Panel */}
      {!isMobile && (
        <TagsPanel
          allTags={acervoData.tags}
          selectedTags={selectedTags}
          onTagSelect={handleTagSelect}
        />
      )}

      {/* Mobile: Tags Filter Button */}
      {isMobile && (
        <MobileTagsModal
          allTags={acervoData.tags}
          selectedTags={selectedTags}
          onTagSelect={handleTagSelect}
        />
      )}

      {/* Access Control Upgrade Prompt */}
      {totalFiltered > 0 && (
        <AccessUpgradePrompt
          filteredCount={totalFiltered}
          statistics={statistics}
          userAccessLevel={userAccessLevel}
          onUpgradeClick={() => {
            // Navigate to pricing page
            window.location.href = '/pricing';
          }}
          onLoginClick={() => {
            // Navigate to login page
            window.location.href = '/login';
          }}
        />
      )}

      {/* Reviews Grid with Client-Side Sorting */}
      <ClientSideSorter
        reviews={accessibleReviews}
        tags={acervoData.tags}
        selectedTags={selectedTags}
        searchQuery=""
        sortBy={sortBy}
      >
        {({ sortedReviews }) => (
          <>
            {sortedReviews.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">Nenhum review encontrado</h3>
                <p className="text-muted-foreground">Tente ajustar os filtros selecionados</p>
              </div>
            ) : (
              <MasonryGrid reviews={sortedReviews} />
            )}

            {/* Results summary */}
            <div className="text-center py-4 text-sm text-muted-foreground">
              {selectedTags.length > 0
                ? `${sortedReviews.length} reviews encontrados`
                : `${sortedReviews.length} reviews no total`}
            </div>
          </>
        )}
      </ClientSideSorter>
    </StandardLayout>
  );
};

export default function ArchivePage() {
  return (
    <ErrorBoundary
      tier="page"
      context="página do acervo"
      showHomeButton={true}
      showBackButton={true}
    >
      <ArchivePageContent />
    </ErrorBoundary>
  );
}
