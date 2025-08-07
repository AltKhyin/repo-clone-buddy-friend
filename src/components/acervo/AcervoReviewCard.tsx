// ABOUTME: Masonry-compatible review card with homepage visual style and authentic data for acervo grid.

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Eye, Clock } from 'lucide-react';
import type { AcervoReview } from '@packages/hooks/useAcervoDataQuery';

interface AcervoReviewCardProps {
  review: AcervoReview;
}

const AcervoReviewCard: React.FC<AcervoReviewCardProps> = ({ review }) => {
  // Use review ID directly from authentic data
  const reviewId = review.review_id;

  // Author fallback logic (identical to homepage)
  const getAuthorName = () => {
    return review.custom_author_name || review.author?.full_name || 'EVIDENS';
  };

  const getAuthorAvatar = () => {
    return review.custom_author_avatar_url || review.author?.avatar_url || null;
  };

  // Reading time formatting (identical to homepage)
  const getReadingTime = () => {
    if (review.reading_time_minutes) {
      return `${review.reading_time_minutes}min`;
    }
    return '5min'; // Default fallback
  };

  // Format view count (identical to homepage)
  const formatViewCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Format date with Portuguese month abbreviations (identical to homepage)
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

  // Calculate minimum height to accommodate ALL hover state content with generous spacing
  const calculateMinHeight = () => {
    // Much more generous calculations to prevent any content cutting
    
    // Content type pills (when present)
    const contentTypePillsHeight = (review.content_types?.length > 0) ? 35 : 0; // Reduced from 50
    
    // Title with proper line-height calculation (leading-tight = 1.25)
    const titleLines = Math.ceil(review.title.length / 30); // More conservative chars per line
    const titleHeight = titleLines * 30; // Reduced from 35px per line
    
    // Stats row (Date + Time + Views)
    const statsRowHeight = 30; // Reduced from 40px
    
    // Space-y-3 spacing in header section (between content types, title, stats)
    const headerSpacing = 20; // Reduced from 24px
    
    // mt-4 spacing before expanded section
    const expandedSectionMargin = 16; // Reduced from 20px
    
    // Description (line-clamp-4 with leading-relaxed)
    const descriptionHeight = review.description ? 80 : 0; // Reduced from 100px
    
    // space-y-4 between description and author
    const expandedInternalSpacing = review.description ? 16 : 0; // Reduced from 20px
    
    // Author row (Avatar + text)
    const authorRowHeight = 32; // Reduced from 40px
    
    // Container padding (p-4 = 16px top + 16px bottom)
    const containerPadding = 20; // Half of previous value
    
    // Additional safety margin for any unexpected spacing
    const safetyMargin = 20; // Half of previous value
    
    // Calculate total with all spacing accounted for
    const totalContentHeight = 
      contentTypePillsHeight + 
      titleHeight + 
      statsRowHeight + 
      headerSpacing +
      expandedSectionMargin + 
      descriptionHeight + 
      expandedInternalSpacing +
      authorRowHeight + 
      containerPadding +
      safetyMargin;
    
    // Use a reasonable minimum and always accommodate full content
    return Math.max(280, totalContentHeight);
  };

  const minHeight = calculateMinHeight();

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl w-full flex-shrink-0 border-0">
      <Link to={`/reviews/${reviewId}`} className="block">
        <CardContent className="p-0 relative">
          {/* Background Cover Image - Variable height for masonry with content-based minimum */}
          <div className="relative w-full" style={{ minHeight: `${minHeight}px` }}>
            {review.cover_image_url ? (
              <img
                src={review.cover_image_url}
                alt={review.title}
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105 group-hover:blur-sm group-hover:transition-all group-hover:duration-150"
                style={{ minHeight: `${minHeight}px` }}
              />
            ) : (
              <div className="w-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center"
                   style={{ minHeight: `${minHeight}px` }}>
                <div className="text-6xl font-bold text-white/20">{review.title.charAt(0)}</div>
              </div>
            )}
          </div>

          {/* Information Overlay - Expands on hover (identical to homepage) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent sm:group-hover:from-black/90 sm:group-hover:via-black/70 sm:group-hover:to-black/30 transition-all duration-300" />

          {/* Content Container - Bottom-aligned, expands to center on hover (identical to homepage) */}
          <div className="absolute inset-x-0 bottom-0 p-4 transition-all duration-300 z-10 sm:group-hover:inset-0 sm:group-hover:flex sm:group-hover:flex-col sm:group-hover:justify-center">
            {/* Header: Always visible content (Title + Stats) */}
            <div className="space-y-3">
              {/* Content Type Pills - Visible on hover (authentic content types, no tags) */}
              <div className="hidden sm:group-hover:block">
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

            {/* Expanded Information - Visible on hover (identical to homepage) */}
            <div className="space-y-4 mt-4 hidden sm:group-hover:block">
              {/* Description */}
              {review.description && (
                <p className="text-white/90 text-sm leading-relaxed line-clamp-4">
                  {review.description}
                </p>
              )}

              {/* Author Info - Right aligned with "- por" prefix (authentic author data) */}
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

export default AcervoReviewCard;