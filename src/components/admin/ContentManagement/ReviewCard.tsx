// ABOUTME: Individual review card for content queue display

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, ImageIcon, FileText, Users, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReviewQueueItem } from '../../../../packages/hooks/useAdminContentQueue';
import type { ContentType } from '@/types';
import { ContentTypeEditModal } from '../ReviewManagement/ContentTypeEditModal';

interface ReviewCardProps {
  review: ReviewQueueItem;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}

// Enhanced Article Metadata Section Component
const ArticleMetadataSection = ({ review }: { review: ReviewQueueItem }) => {
  const hasArticleData =
    review.original_article_title ||
    review.original_article_authors ||
    review.original_article_publication_date ||
    review.study_type ||
    review.edicao;

  if (!hasArticleData) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="pt-3">
      <div className="space-y-3 text-xs bg-surface-muted/30 rounded p-3">
        {/* Compact fields with proper spacing */}
        <div className="flex flex-wrap gap-4">
          {review.edicao && (
            <div className="space-y-0.5 min-w-0 flex-shrink-0">
              <div className="text-muted-foreground font-medium">Edição:</div>
              <div className="whitespace-nowrap" title={review.edicao}>
                {review.edicao}
              </div>
            </div>
          )}
          {review.study_type && (
            <div className="space-y-0.5 min-w-0 flex-shrink-0">
              <div className="text-muted-foreground font-medium">Tipo:</div>
              <div className="whitespace-nowrap" title={review.study_type}>
                {review.study_type}
              </div>
            </div>
          )}
          {review.original_article_publication_date && (
            <div className="space-y-0.5 min-w-0 flex-shrink-0">
              <div className="text-muted-foreground font-medium">Data:</div>
              <div
                className="whitespace-nowrap"
                title={formatDate(review.original_article_publication_date)}
              >
                {formatDate(review.original_article_publication_date)}
              </div>
            </div>
          )}
        </div>

        {/* Full-width rows for longer fields: Título and Autores */}
        {review.original_article_title && (
          <div className="space-y-0.5">
            <div className="text-muted-foreground font-medium">Título:</div>
            <div
              className="leading-relaxed line-clamp-2 sm:line-clamp-3"
              title={review.original_article_title}
            >
              {review.original_article_title}
            </div>
          </div>
        )}
        {review.original_article_authors && (
          <div className="space-y-0.5">
            <div className="text-muted-foreground font-medium">Autores:</div>
            <div className="line-clamp-1 sm:line-clamp-2" title={review.original_article_authors}>
              {review.original_article_authors}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ReviewCard = ({ review, isSelected, onSelect }: ReviewCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContentType, setEditingContentType] = useState<any>(null);
  const getStatusInfo = (review: ReviewQueueItem) => {
    // Priority: show publication status first (status field), then review status
    const primaryStatus = review.status;
    const reviewStatus = review.review_status;

    switch (primaryStatus) {
      case 'published':
        return {
          status: 'published',
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          label: 'Published',
        };
      case 'scheduled':
        return {
          status: 'scheduled',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          label: 'Scheduled',
        };
      case 'archived':
        return {
          status: 'archived',
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          label: 'Archived',
        };
      case 'draft':
        // For drafts, show the review status if it's more specific
        switch (reviewStatus) {
          case 'under_review':
            return {
              status: 'under_review',
              color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
              label: 'Under Review',
            };
          case 'approved':
            return {
              status: 'approved',
              color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
              label: 'Approved',
            };
          case 'rejected':
            return {
              status: 'rejected',
              color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
              label: 'Rejected',
            };
          case 'changes_requested':
            return {
              status: 'changes_requested',
              color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
              label: 'Changes Requested',
            };
          default:
            return {
              status: 'draft',
              color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
              label: 'Draft',
            };
        }
      default:
        return {
          status: primaryStatus,
          color: 'bg-surface-muted text-foreground border border-border',
          label: primaryStatus,
        };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const statusInfo = getStatusInfo(review);

  return (
    <div
      className="p-6 hover:bg-surface-muted/50 transition-colors border-b border-border cursor-pointer"
      onClick={() => onSelect(!isSelected)}
    >
      <div className="flex gap-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className="self-center"
          onClick={e => e.stopPropagation()}
        />

        {/* Unified Review Item Container */}
        <div className="flex-1 bg-surface rounded border border-border overflow-hidden">
          {/* Header Section: Cover Image + Title/Description/Content Types */}
          <div className="flex flex-col sm:flex-row">
            {/* Cover Image with proper spacing */}
            <div className="flex-shrink-0 p-4 pb-2 sm:pb-0">
              {review.cover_image_url ? (
                <img
                  src={review.cover_image_url}
                  alt={review.title}
                  className="w-full h-32 sm:w-24 sm:h-24 object-cover rounded border border-border"
                />
              ) : (
                <div className="w-full h-32 sm:w-24 sm:h-24 bg-surface-muted rounded border border-border flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 sm:h-6 sm:w-6 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Header Content: Title, Description, Content Types */}
            <div className="flex-1 px-4 pb-2 sm:p-4 sm:pb-0 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground line-clamp-2 mb-2 leading-tight">
                    {review.title}
                  </h3>
                  {review.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                      {review.description}
                    </p>
                  )}
                </div>
                <Badge className={`${statusInfo.color} ml-3 flex-shrink-0`}>
                  {statusInfo.label}
                </Badge>
              </div>

              {/* Content Type Pills */}
              {review.content_types && review.content_types.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {review.content_types.map(type => (
                    <div key={type.id} className="group relative">
                      <Badge
                        style={{
                          color: type.text_color,
                          borderColor: type.border_color,
                          backgroundColor: type.background_color,
                          border: `1px solid ${type.border_color}`,
                        }}
                        className="text-xs px-2 py-1 pr-6 cursor-pointer"
                        onClick={e => {
                          e.stopPropagation();
                          setEditingContentType(type);
                          setShowEditModal(true);
                        }}
                        title={`Clique para editar ${type.label}`}
                      >
                        {type.label}
                      </Badge>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setEditingContentType(type);
                          setShowEditModal(true);
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded flex items-center justify-center"
                        title={`Editar ${type.label}`}
                      >
                        <Edit className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Body Section: Article Metadata and Footer */}
          <div className="flex flex-col sm:flex-row">
            {/* Article Metadata positioned under cover image */}
            <div className="w-full px-4 pb-4">
              <ArticleMetadataSection review={review} />
            </div>

            {/* Spacer for desktop layout */}
            <div className="flex-1"></div>
          </div>

          {/* Footer Section: Dates on left, Actions on right */}
          <div className="flex justify-between items-end p-4 pt-0">
            {/* Date Information moved to bottom left */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Criado: {formatDate(review.created_at)}</span>
              </div>

              {review.scheduled_publish_at && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Agendado: {formatDate(review.scheduled_publish_at)}</span>
                </div>
              )}

              {review.published_at && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>Publicado: {formatDate(review.published_at)}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <Link to={`/reviews/${review.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs font-medium min-w-[80px]"
                >
                  Visualizar
                </Button>
              </Link>
              <Link to={`/admin/review/${review.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs font-medium min-w-[70px]"
                >
                  Manage
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content Type Edit Modal */}
      {editingContentType && (
        <ContentTypeEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingContentType(null);
          }}
          contentType={editingContentType}
        />
      )}
    </div>
  );
};
