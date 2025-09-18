// ABOUTME: Magazine-style review detail header with typography-first design and author credibility focus.

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, BookOpen } from 'lucide-react';
import { ReviewDetail } from '../../../packages/hooks/useReviewDetailQuery';
import { useIsMobile } from '../../hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ReviewHeroProps {
  review: ReviewDetail;
}

const ReviewHero: React.FC<ReviewHeroProps> = ({ review }) => {
  const isMobile = useIsMobile();

  // Author fallback logic with custom fields priority
  const getAuthorName = () => {
    return review.custom_author_name || review.author?.full_name || 'EVIDENS';
  };

  const getAuthorAvatar = () => {
    return review.custom_author_avatar_url || review.author?.avatar_url || null;
  };

  const getAuthorDescription = () => {
    return review.custom_author_description || review.author?.profession || null;
  };

  // Format date with Portuguese month names (full format for article style)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };


  // Get reading time from database or fallback
  const getReadingTime = () => {
    if (review.reading_time_minutes && review.reading_time_minutes > 0) {
      return `${review.reading_time_minutes}min de leitura`;
    }
    return '5min de leitura'; // Fallback
  };

  // MOBILE LAYOUT: Classic editorial header
  if (isMobile) {
    return (
      <div className="w-full space-y-6 bg-surface/60 py-8 rounded-lg">
        {/* Article Title and Content - Tighter flow */}
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold leading-tight text-foreground font-serif">
            {review.title}
          </h1>
          
          {/* Subtitle/Description - Classic editorial style */}
          {review.description && (
            <p className="text-base text-muted-foreground leading-relaxed font-serif italic">
              {review.description}
            </p>
          )}

          {/* Author byline - Integrated into content flow */}
          <div className="space-y-3 pt-4">
            <div className="flex justify-center">
              <Avatar className="h-12 w-12">
                <AvatarImage src={getAuthorAvatar() || undefined} />
                <AvatarFallback className="text-sm bg-accent/15 text-accent font-bold">
                  {getAuthorName().charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-foreground">
                Por {getAuthorName()}
              </div>
              {getAuthorDescription() && (
                <div className="text-xs text-muted-foreground">
                  {getAuthorDescription()}
                </div>
              )}
              <div className="flex justify-center items-center gap-3 text-xs text-muted-foreground">
                <span>{formatDate(review.published_at)}</span>
                <span>•</span>
                <span>{getReadingTime()}</span>
              </div>
            </div>

            {/* Featured banner - YouTube-style visual breathing space */}
            {review.cover_image_url && (
              <div className="pt-6">
                <div className="w-full h-24 mx-auto">
                  <img
                    src={review.cover_image_url}
                    alt={review.title}
                    className="w-full h-full object-cover rounded-lg"
                    loading="lazy"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // DESKTOP LAYOUT: Classic editorial header
  return (
    <div className="w-full space-y-8 bg-surface/50 py-12 rounded-xl">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Article Title and Content - Tighter flow */}
        <div className="text-center space-y-6">
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-foreground font-serif max-w-3xl mx-auto">
            {review.title}
          </h1>
          
          {/* Subtitle/Description - Classic editorial style */}
          {review.description && (
            <p className="text-lg text-muted-foreground leading-relaxed font-serif italic max-w-2xl mx-auto">
              {review.description}
            </p>
          )}

          {/* Author byline - Integrated into content flow */}
          <div className="space-y-4 pt-4">
            <div className="flex justify-center">
              <Avatar className="h-16 w-16">
                <AvatarImage src={getAuthorAvatar() || undefined} />
                <AvatarFallback className="text-lg bg-accent/15 text-accent font-bold">
                  {getAuthorName().charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-2">
              <div className="text-base font-semibold text-foreground">
                Por {getAuthorName()}
              </div>
              {getAuthorDescription() && (
                <div className="text-sm text-muted-foreground">
                  {getAuthorDescription()}
                </div>
              )}
              <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground">
                <span>{formatDate(review.published_at)}</span>
                <span>•</span>
                <span>{getReadingTime()}</span>
              </div>
            </div>

            {/* Featured banner - YouTube-style visual breathing space */}
            {review.cover_image_url && (
              <div className="pt-8">
                <div className="w-full h-32">
                  <img
                    src={review.cover_image_url}
                    alt={review.title}
                    className="w-full h-full object-cover rounded-xl"
                    loading="lazy"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewHero;