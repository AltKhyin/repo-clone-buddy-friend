// ABOUTME: Individual review card for content queue display

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReviewQueueItem } from '../../../../packages/hooks/useAdminContentQueue';

interface ReviewCardProps {
  review: ReviewQueueItem;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}

export const ReviewCard = ({ review, isSelected, onSelect }: ReviewCardProps) => {
  const getStatusInfo = (review: ReviewQueueItem) => {
    // Priority: show publication status first (status field), then review status
    const primaryStatus = review.status;
    const reviewStatus = review.review_status;
    
    switch (primaryStatus) {
      case 'published':
        return {
          status: 'published',
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          label: 'Published'
        };
      case 'scheduled':
        return {
          status: 'scheduled',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          label: 'Scheduled'
        };
      case 'archived':
        return {
          status: 'archived',
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          label: 'Archived'
        };
      case 'draft':
        // For drafts, show the review status if it's more specific
        switch (reviewStatus) {
          case 'under_review':
            return {
              status: 'under_review',
              color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
              label: 'Under Review'
            };
          case 'approved':
            return {
              status: 'approved',
              color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
              label: 'Approved'
            };
          case 'rejected':
            return {
              status: 'rejected',
              color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
              label: 'Rejected'
            };
          case 'changes_requested':
            return {
              status: 'changes_requested',
              color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
              label: 'Changes Requested'
            };
          default:
            return {
              status: 'draft',
              color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
              label: 'Draft'
            };
        }
      default:
        return {
          status: primaryStatus,
          color: 'bg-surface-muted text-foreground border border-border',
          label: primaryStatus
        };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const statusInfo = getStatusInfo(review);

  return (
    <div className="p-4 hover:bg-surface-muted transition-colors">
      <div className="flex items-center gap-4">
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />

        {/* Cover Image */}
        <div className="flex-shrink-0">
          {review.cover_image_url ? (
            <img
              src={review.cover_image_url}
              alt={review.title}
              className="w-24 h-24 object-cover rounded-lg border border-border"
            />
          ) : (
            <div className="w-24 h-24 bg-surface-muted rounded-lg border border-border flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-secondary" />
            </div>
          )}
        </div>

        <Card className="flex-1 bg-surface border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base text-foreground">{review.title}</CardTitle>
              <Badge className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            </div>
            {review.description && (
              <p className="text-sm text-secondary line-clamp-2">{review.description}</p>
            )}
          </CardHeader>

          <CardContent className="pt-0">
            <div className="flex items-center gap-4 text-sm text-secondary">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Criado: {formatDate(review.created_at)}</span>
              </div>

              {review.scheduled_publish_at && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Agendado: {formatDate(review.scheduled_publish_at)}</span>
                </div>
              )}

              {review.published_at && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Publicado: {formatDate(review.published_at)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Link to={`/reviews/${review.id}`}>
            <Button variant="outline" size="sm">
              Visualizar
            </Button>
          </Link>
          <Link to={`/admin/review/${review.id}`}>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
