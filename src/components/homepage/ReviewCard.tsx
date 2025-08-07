// ABOUTME: Dynamic review card component with cover image background and hover animations for homepage carousel.

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Eye, Clock, ChevronDown } from 'lucide-react';
import { HomepageReview } from '@packages/hooks/useHomepageFeedQuery';

interface ReviewCardProps {
  review: HomepageReview;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, isExpanded = false, onToggleExpand }) => {
  // Use review ID for reliable navigation
  const reviewId = review.id;

  // Author fallback logic
  const getAuthorName = () => {
    return review.custom_author_name || review.author?.full_name || 'EVIDENS';
  };

  const getAuthorAvatar = () => {
    return review.custom_author_avatar_url || review.author?.avatar_url || null;
  };

  // Format reading time
  const getReadingTime = () => {
    if (review.reading_time_minutes) {
      return `${review.reading_time_minutes}min`;
    }
    return '5min'; // Default fallback
  };

  // Format view count
  const formatViewCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Format date with Portuguese month abbreviations
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
    ];
    const month = monthNames[date.getMonth()];
    return `${day}/${month}`;
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl aspect-[3/4] w-full flex-shrink-0 border-0">
      <Link to={`/reviews/${reviewId}`} className="block h-full">
        <CardContent className="p-0 h-full relative">
          {/* Background Cover Image */}
          <div className="absolute inset-0 w-full h-full">
            {review.cover_image_url ? (
              <img
                src={review.cover_image_url}
                alt={review.title}
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105 group-hover:blur-sm group-hover:transition-all group-hover:duration-150"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-6xl font-bold text-white/20">{review.title.charAt(0)}</div>
              </div>
            )}
          </div>

          {/* Information Overlay - Expands to cover whole image on expansion or hover */}
          <div
            className={`absolute inset-0 bg-gradient-to-t transition-all duration-300
                          ${
                            isExpanded
                              ? 'from-black/90 via-black/70 to-black/30'
                              : 'from-black/80 via-black/20 to-transparent sm:group-hover:from-black/90 sm:group-hover:via-black/70 sm:group-hover:to-black/30'
                          }`}
          />

          {/* Content Container - Baseline: bottom-aligned header only, Expanded: full center layout */}
          <div
            className={`absolute inset-x-0 bottom-0 p-4 transition-all duration-300 z-10
                          ${isExpanded ? 'inset-0 flex flex-col justify-center' : 'sm:group-hover:inset-0 sm:group-hover:flex sm:group-hover:flex-col sm:group-hover:justify-center'}`}
          >
            {/* Header: Always visible content (Title + Stats) */}
            <div className="space-y-3">
              {/* Phone-only Expand Toggle - Positioned above everything, centered */}
              {onToggleExpand && (
                <div className="flex justify-center mb-3 sm:hidden">
                  <button
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleExpand();
                    }}
                    className="bg-black/50 backdrop-blur-sm rounded-full p-2 
                               hover:bg-black/70 transition-all duration-200
                               focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label={isExpanded ? 'Collapse review details' : 'Expand review details'}
                  >
                    <ChevronDown
                      className={`h-4 w-4 text-white transition-transform duration-200 
                                 ${isExpanded ? 'rotate-0' : 'rotate-180'}`}
                    />
                  </button>
                </div>
              )}

              {/* Content Type Pills - Visible on phone expansion or tablet/desktop hover */}
              <div className={`${isExpanded ? 'block' : 'hidden sm:group-hover:block'}`}>
                {review.content_types && review.content_types.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-2">
                    {review.content_types.slice(0, 2).map(contentType => (
                      <Badge
                        key={contentType.id}
                        style={{
                          backgroundColor: `${contentType.background_color}80`, // Add 50% transparency
                          borderColor: `${contentType.border_color}80`, // Add 50% transparency
                          color: contentType.text_color,
                        }}
                        className="text-xs font-medium"
                      >
                        {contentType.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Title - Always visible, no truncation */}
              <h3 className="font-bold text-white text-lg leading-tight transition-colors">
                {review.title}
              </h3>

              {/* Baseline Stats - Always visible */}
              <div className="flex items-center gap-4 text-white/80 text-sm">
                {/* Publication Date */}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(review.published_at)}</span>
                </div>

                {/* Reading Time */}
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{getReadingTime()}</span>
                </div>

                {/* View Count */}
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{formatViewCount(review.view_count)}</span>
                </div>
              </div>
            </div>

            {/* Expanded Information - Visible on phone expansion or tablet/desktop hover */}
            <div
              className={`space-y-4 mt-4 ${isExpanded ? 'block' : 'hidden sm:group-hover:block'}`}
            >
              {/* Description */}
              {review.description && (
                <p className="text-white/90 text-sm leading-relaxed line-clamp-4">
                  {review.description}
                </p>
              )}

              {/* Author Info - Right aligned with "- por" prefix */}
              <div className="flex items-center justify-end gap-2">
                <span className="text-white/90 text-sm font-medium">- por {getAuthorName()}</span>
                <Avatar className="h-7 w-7">
                  <AvatarImage src={getAuthorAvatar() || undefined} />
                  <AvatarFallback className="text-xs bg-white/20 text-white">
                    {getAuthorName().charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default ReviewCard;
