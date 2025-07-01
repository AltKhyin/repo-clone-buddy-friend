// ABOUTME: Main review management interface for admin control of reviews

import React from 'react';
import { useParams } from 'react-router-dom';
import { ReviewMetadataPanel } from '@/components/admin/ReviewManagement/ReviewMetadataPanel';
import { PublicationControlPanel } from '@/components/admin/ReviewManagement/PublicationControlPanel';
import { ReviewContentPreview } from '@/components/admin/ReviewManagement/ReviewContentPreview';
import { ReviewAnalyticsPanel } from '@/components/admin/ReviewManagement/ReviewAnalyticsPanel';
import { useReviewManagementQuery } from '../../packages/hooks/useReviewManagementQuery';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReviewManagementPage() {
  const { reviewId } = useParams<{ reviewId: string }>();

  const { data: review, isLoading, isError, error } = useReviewManagementQuery(reviewId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Review</h3>
        <p className="text-gray-600 mb-4">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/admin/content">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Content Queue
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{review.title}</h1>
            <p className="text-sm text-gray-500">Review ID: {review.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              review.status === 'published'
                ? 'bg-green-100 text-green-800'
                : review.status === 'scheduled'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
            }`}
          >
            {review.status}
          </span>
          <Link to={`/editor/${review.id}`}>
            <Button>Open Editor</Button>
          </Link>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel: Metadata */}
        <div className="xl:col-span-1">
          <ReviewMetadataPanel review={review} />
        </div>

        {/* Center Panel: Content Preview */}
        <div className="xl:col-span-1">
          <ReviewContentPreview review={review} />
        </div>

        {/* Right Panel: Publication & Analytics */}
        <div className="xl:col-span-1 space-y-6">
          <PublicationControlPanel review={review} />
          <ReviewAnalyticsPanel review={review} />
        </div>
      </div>
    </div>
  );
}
