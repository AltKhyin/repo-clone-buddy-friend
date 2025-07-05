// ABOUTME: Main review management interface for admin control of reviews with proper layout constraints

import React from 'react';
import { useParams } from 'react-router-dom';
import { ReviewMetadataPanel } from '@/components/admin/ReviewManagement/ReviewMetadataPanel';
import { UnifiedSaveProvider } from '@/components/admin/common/UnifiedSaveProvider';
import { SaveButton } from '@/components/admin/common/SaveButton';
import { useAdminReviewManagement } from '../../packages/hooks/useAdminReviewManagement';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StandardLayout } from '@/components/layout/StandardLayout';

export default function ReviewManagementPage() {
  const { reviewId } = useParams<{ reviewId: string }>();

  const { data: review, isLoading, isError, error } = useAdminReviewManagement(reviewId);

  if (isLoading) {
    return (
      <ErrorBoundary
        tier="feature"
        context="gestão de review"
        showDetails={process.env.NODE_ENV === 'development'}
        showHomeButton={true}
        showBackButton={true}
      >
        <StandardLayout type="wide" contentClassName="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <div className="space-y-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-64" />
          </div>
        </StandardLayout>
      </ErrorBoundary>
    );
  }

  if (isError || !review) {
    return (
      <ErrorBoundary
        tier="feature"
        context="gestão de review"
        showDetails={process.env.NODE_ENV === 'development'}
        showHomeButton={true}
        showBackButton={true}
      >
        <StandardLayout type="wide" contentClassName="space-y-6">
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-foreground mb-3">Error Loading Review</h3>
            <p className="text-muted-foreground mb-6">
              {error instanceof Error ? error.message : 'Failed to load review'}
            </p>
            <Link to="/admin/content">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Content Queue
              </Button>
            </Link>
          </div>
        </StandardLayout>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary
      tier="feature"
      context="gestão de review"
      showDetails={process.env.NODE_ENV === 'development'}
      showHomeButton={true}
      showBackButton={true}
    >
      <StandardLayout type="wide" contentClassName="space-y-6">
        <UnifiedSaveProvider reviewId={review.id}>
          {/* Header Section - Enhanced typography hierarchy */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link to="/admin/content">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Content Queue
                </Button>
              </Link>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-foreground font-serif">{review.title}</h1>
                <p className="text-sm text-muted-foreground">Review ID: {review.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  review.status === 'published'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : review.status === 'scheduled'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-surface-muted text-foreground border border-border'
                }`}
              >
                {review.status}
              </span>
              <SaveButton variant="save" size="sm" />
              <SaveButton variant="publish" size="sm" />
              <Link to={`/editor/${review.id}`}>
                <Button variant="outline" size="sm">Open Editor</Button>
              </Link>
            </div>
          </div>

          {/* Main Content - Linear single-column layout optimized for review editing workflow */}
          <div className="max-w-4xl">
            <ReviewMetadataPanel review={review} />
          </div>
        </UnifiedSaveProvider>
      </StandardLayout>
    </ErrorBoundary>
  );
}