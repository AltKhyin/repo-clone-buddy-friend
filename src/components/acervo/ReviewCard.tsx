
// ABOUTME: Review card component for the Acervo grid with proper linking to detail pages.

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye } from 'lucide-react';
import type { AcervoReview } from '../../../packages/hooks/useAcervoDataQuery';

interface ReviewCardProps {
  review: AcervoReview;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  // Create URL-safe slug from title
  const slug = encodeURIComponent(review.title);
  
  // Get all tags as a flat array for display
  const allTags = Object.entries(review.tags_json).flatMap(([categoria, subtags]) => {
    const tags = [categoria];
    if (subtags && subtags.length > 0) {
      tags.push(...subtags);
    }
    return tags;
  });

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 h-fit">
      <Link to={`/reviews/${slug}`} className="block">
        <CardContent className="p-0">
          {/* Cover Image */}
          {review.cover_image_url ? (
            <div className="aspect-video overflow-hidden rounded-t-lg">
              <img 
                src={review.cover_image_url}
                alt={review.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-muted to-muted/60 rounded-t-lg flex items-center justify-center">
              <div className="text-4xl font-bold text-muted-foreground/30">
                {review.title.charAt(0)}
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {review.title}
            </h3>
            
            {/* Description */}
            {review.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {review.description}
              </p>
            )}
            
            {/* Tags */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {allTags.slice(0, 3).map((tag, index) => (
                  <Badge 
                    key={`${tag}-${index}`} 
                    variant="secondary" 
                    className="text-xs px-2 py-0.5"
                  >
                    {tag}
                  </Badge>
                ))}
                {allTags.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    +{allTags.length - 3}
                  </Badge>
                )}
              </div>
            )}
            
            {/* Meta info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(review.published_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              {review.view_count && review.view_count > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{review.view_count}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default ReviewCard;
