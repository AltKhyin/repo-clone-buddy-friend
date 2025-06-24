
// ABOUTME: Main Acervo page component with responsive tag filtering, search, and review display.

import React, { useState, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAcervoDataQuery } from '../../packages/hooks/useAcervoDataQuery';
import { Skeleton } from '@/components/ui/skeleton';
import TagsPanel from '@/components/acervo/TagsPanel';
import MobileTagsModal from '@/components/acervo/MobileTagsModal';
import MasonryGrid from '@/components/acervo/MasonryGrid';
import SearchInput from '@/components/acervo/SearchInput';
import { ClientSideSorter } from '@/components/acervo/ClientSideSorter';

const AcervoPage = () => {
  const isMobile = useIsMobile();
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'alphabetical'>('recent');
  
  const { data: acervoData, isLoading, error } = useAcervoDataQuery();

  const handleTagSelect = useMemo(() => (tagId: number) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        // Remove tag
        return prev.filter(id => id !== tagId);
      } else {
        // Add tag
        return [...prev, tagId];
      }
    });
  }, []);

  const handleSearchChange = useMemo(() => (query: string) => {
    setSearchQuery(query);
  }, []);

  // Memoize skeleton component to prevent re-renders
  const loadingSkeleton = useMemo(() => (
    <div className="min-h-screen">
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
  ), []);

  if (isLoading) {
    return (
      <div className="min-h-screen">
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
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Erro ao carregar Acervo</h2>
          <p className="text-muted-foreground">
            {error.message || 'Ocorreu um erro inesperado'}
          </p>
        </div>
      </div>
    );
  }

  if (!acervoData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Nenhum dado encontrado</h2>
          <p className="text-muted-foreground">
            Não foi possível carregar o conteúdo do Acervo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="p-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Acervo</h1>
          
          {/* Search Bar */}
          <div className="mb-4">
            <SearchInput 
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
            />
          </div>
        </div>
        
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
        
        {/* Reviews Grid with Client-Side Sorting and Search */}
        <ClientSideSorter 
          reviews={acervoData.reviews} 
          tags={acervoData.tags}
          selectedTags={selectedTags}
          searchQuery={searchQuery}
          sortBy={sortBy}
        >
          {({ sortedReviews }) => (
            <>
              {sortedReviews.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold mb-2">Nenhum review encontrado</h3>
                  <p className="text-muted-foreground">
                    {searchQuery.trim() 
                      ? `Tente uma busca diferente ou ajuste os filtros selecionados`
                      : `Tente ajustar os filtros selecionados`
                    }
                  </p>
                </div>
              ) : (
                <MasonryGrid reviews={sortedReviews} />
              )}
              
              {/* Results summary */}
              <div className="text-center py-4 text-sm text-muted-foreground">
                {searchQuery.trim() || selectedTags.length > 0 
                  ? `${sortedReviews.length} reviews encontrados`
                  : `${sortedReviews.length} reviews no total`
                }
              </div>
            </>
          )}
        </ClientSideSorter>
      </div>
    </div>
  );
};

export default AcervoPage;
