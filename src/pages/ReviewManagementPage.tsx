// ABOUTME: Main review management interface for admin control of reviews

import React from 'react';
import { useParams } from 'react-router-dom';
import { ReviewMetadataPanel } from '@/components/admin/ReviewManagement/ReviewMetadataPanel';
import { PublicationControlPanel } from '@/components/admin/ReviewManagement/PublicationControlPanel';
import { ReviewAnalyticsPanel } from '@/components/admin/ReviewManagement/ReviewAnalyticsPanel';
import { UnifiedSaveProvider } from '@/components/admin/common/UnifiedSaveProvider';
import { SaveButton } from '@/components/admin/common/SaveButton';
import { useAdminReviewManagement } from '../../packages/hooks/useAdminReviewManagement';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReviewManagementPage() {
  const { reviewId } = useParams<{ reviewId: string }>();

  const { data: review, isLoading, isError, error } = useAdminReviewManagement(reviewId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (isError || !review) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Review</h3>
        <p className="text-secondary mb-4">
          {error instanceof Error ? error.message : 'Failed to load review'}
        </p>
        <Link to="/admin/content">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Content Queue
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <UnifiedSaveProvider reviewId={review.id}>
      <div className="space-y-6">
        {/* Header Section - Enhanced typography hierarchy */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/admin/content">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Content Queue
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground font-serif">{review.title}</h1>
              <p className="text-sm text-secondary">Review ID: {review.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
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

        {/* Main Layout - Updated to 2-column for improved focus */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Metadata */}
          <div>
            <ReviewMetadataPanel review={review} />
          </div>

          {/* Right Panel: Publication & Analytics */}
          <div className="space-y-6">
            <PublicationControlPanel review={review} />
            <ReviewAnalyticsPanel review={review} />
          </div>
        </div>
      </div>
    </UnifiedSaveProvider>
  );
}