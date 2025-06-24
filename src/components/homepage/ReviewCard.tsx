
// ABOUTME: Review card component for homepage carousel with proper linking to detail pages.

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

export interface Review {
  id: number;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  published_at: string;
  tags?: string[];
}

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  // Create URL-safe slug from title
  const slug = encodeURIComponent(review.title);

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 h-full flex-shrink-0">
      <Link to={`/reviews/${slug}`} className="block h-full">
        <CardContent className="p-0 h-full flex flex-col">
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
          <div className="p-4 space-y-3 flex-1 flex flex-col">
            {/* Title */}
            <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {review.title}
            </h3>
            
            {/* Description */}
            {review.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                {review.description}
              </p>
            )}
            
            {/* Tags */}
            {review.tags && review.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {review.tags.slice(0, 2).map((tag, index) => (
                  <Badge 
                    key={`${tag}-${index}`} 
                    variant="secondary" 
                    className="text-xs px-2 py-0.5"
                  >
                    {tag}
                  </Badge>
                ))}
                {review.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    +{review.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
            
            {/* Date */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 mt-auto">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(review.published_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default ReviewCard;
