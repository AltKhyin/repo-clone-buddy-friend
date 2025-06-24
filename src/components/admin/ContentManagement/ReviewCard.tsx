
// ABOUTME: Individual review card for content queue display

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User } from 'lucide-react';
import { ReviewQueueItem } from '../../../../packages/hooks/useContentQueueQuery';

interface ReviewCardProps {
  review: ReviewQueueItem;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}

export const ReviewCard = ({ review, isSelected, onSelect }: ReviewCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-center gap-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
        />
        
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base">{review.title}</CardTitle>
              <Badge className={getStatusColor(review.review_status || review.status)}>
                {review.review_status || review.status}
              </Badge>
            </div>
            {review.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{review.description}</p>
            )}
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center gap-4 text-sm text-gray-500">
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
          <Button variant="outline" size="sm">
            Visualizar
          </Button>
          <Button variant="outline" size="sm">
            Editar
          </Button>
        </div>
      </div>
    </div>
  );
};
