// ABOUTME: Main content queue interface with filtering, search, and infinite scroll pagination

import React, { useState } from 'react';
import { useAdminContentQueue } from '../../../../packages/hooks/useAdminContentQueue';
import { FilterPanel } from './FilterPanel';
import { ReviewCard } from './ReviewCard';
import { BulkOperations } from './BulkOperations';
import { CreateReviewButton } from './CreateReviewButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ContentQueue = () => {
  const [filters, setFilters] = useState({
    status: 'all' as const,
    search: '',
    authorId: '',
    reviewerId: '',
    contentType: 'all',
  });

  const [selectedReviews, setSelectedReviews] = useState<number[]>([]);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useAdminContentQueue(filters);

  const allReviews = data?.pages.flatMap(page => page.reviews) || [];
  const stats = data?.pages[0]?.stats;

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setSelectedReviews([]); // Clear selection when filters change
  };

  const handleSelectReview = (reviewId: number, selected: boolean) => {
    setSelectedReviews(prev =>
      selected ? [...prev, reviewId] : prev.filter(id => id !== reviewId)
    );
  };

  const handleSelectAll = () => {
    const allIds = allReviews.map(review => review.id);
    setSelectedReviews(selectedReviews.length === allIds.length ? [] : allIds);
  };

  if (isError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Content Queue</h3>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : 'Failed to load content queue'}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filter Panel */}
      <FilterPanel filters={filters} onFiltersChange={handleFilterChange} summary={stats} />

      {/* Bulk Operations */}
      {selectedReviews.length > 0 && (
        <BulkOperations
          selectedReviews={selectedReviews}
          onComplete={() => setSelectedReviews([])}
        />
      )}

      {/* Content Queue - Enhanced with surface tokens */}
      <div className="bg-surface rounded-lg border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Content Queue ({allReviews.length} items)
            </h2>
            <div className="flex items-center gap-3">
              <CreateReviewButton />
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedReviews.length === allReviews.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div>
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-6">
                <Skeleton className="h-24 w-full" />
              </div>
            ))
          ) : allReviews.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <p className="text-base">No content found matching your filters.</p>
            </div>
          ) : (
            allReviews.map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                isSelected={selectedReviews.includes(review.id)}
                onSelect={selected => handleSelectReview(review.id, selected)}
              />
            ))
          )}
        </div>

        {/* Load More Button */}
        {hasNextPage && (
          <div className="p-6 border-t border-border text-center">
            <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
