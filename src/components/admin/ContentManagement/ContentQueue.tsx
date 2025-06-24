
// ABOUTME: Main content queue interface with filtering, search, and infinite scroll pagination

import React, { useState } from 'react';
import { useContentQueueQuery } from '../../../../packages/hooks/useContentQueueQuery';
import { FilterPanel } from './FilterPanel';
import { ReviewCard } from './ReviewCard';
import { BulkOperations } from './BulkOperations';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ContentQueue = () => {
  const [filters, setFilters] = useState({
    status: 'all' as const,
    search: '',
    authorId: '',
    reviewerId: '',
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
  } = useContentQueueQuery(filters);

  const allReviews = data?.pages.flatMap(page => page.reviews) || [];
  const stats = data?.pages[0]?.stats;

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setSelectedReviews([]); // Clear selection when filters change
  };

  const handleSelectReview = (reviewId: number, selected: boolean) => {
    setSelectedReviews(prev => 
      selected 
        ? [...prev, reviewId]
        : prev.filter(id => id !== reviewId)
    );
  };

  const handleSelectAll = () => {
    const allIds = allReviews.map(review => review.id);
    setSelectedReviews(
      selectedReviews.length === allIds.length ? [] : allIds
    );
  };

  if (isError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Error Loading Content Queue
        </h3>
        <p className="text-gray-600 mb-4">
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
    <div className="space-y-6">
      {/* Filter Panel */}
      <FilterPanel 
        filters={filters} 
        onFiltersChange={handleFilterChange}
        summary={stats}
      />

      {/* Bulk Operations */}
      {selectedReviews.length > 0 && (
        <BulkOperations 
          selectedReviews={selectedReviews}
          onComplete={() => setSelectedReviews([])}
        />
      )}

      {/* Content Queue */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Content Queue ({allReviews.length} items)
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedReviews.length === allReviews.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-20 w-full" />
              </div>
            ))
          ) : allReviews.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No content found matching your filters.
            </div>
          ) : (
            allReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isSelected={selectedReviews.includes(review.id)}
                onSelect={(selected) => handleSelectReview(review.id, selected)}
              />
            ))
          )}
        </div>

        {/* Load More Button */}
        {hasNextPage && (
          <div className="p-4 border-t border-gray-200 text-center">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
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
