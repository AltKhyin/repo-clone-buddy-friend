// ABOUTME: Featured review hero component with desktop banner layout and mobile split-screen design optimized for best UI/UX practices.

import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { HomepageReview } from '@packages/hooks/useHomepageFeedQuery';
import { useIsMobile } from '../../hooks/use-mobile';
import { cn } from '@/lib/utils';

interface FeaturedReviewProps {
  review: HomepageReview | null;
}

const FeaturedReview: React.FC<FeaturedReviewProps> = ({ review }) => {
  const isMobile = useIsMobile();

  // Author fallback logic
  const getAuthorName = () => {
    if (!review) return 'EVIDENS';
    return review.custom_author_name || review.author?.full_name || 'EVIDENS';
  };

  const getAuthorAvatar = () => {
    if (!review) return null;
    return review.custom_author_avatar_url || review.author?.avatar_url || null;
  };

  // Format reading time with Portuguese suffix
  const getReadingTime = () => {
    if (!review?.reading_time_minutes) return '5min leitura';
    return `${review.reading_time_minutes}min leitura`;
  };

  // Format date with Portuguese month abbreviations
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = [
      'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
      'jul', 'ago', 'set', 'out', 'nov', 'dez',
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return {
      short: `${day}/${month}`,
      full: `${day}/${month}/${year}`
    };
  };

  // Empty state
  if (!review) {
    return (
      <div className={cn(
        "w-full bg-gradient-to-br from-surface to-surface-muted rounded-lg flex items-center justify-center border border-border/50",
        isMobile ? "h-80" : "h-96"
      )}>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground font-serif">Nenhuma edição em destaque</h3>
          <p className="text-muted-foreground text-sm">Uma nova edição será selecionada em breve</p>
        </div>
      </div>
    );
  }

  // MOBILE LAYOUT: Split-screen design (upper: image+info, lower: content)
  if (isMobile) {
    return (
      <div className="w-full">
        {/* Upper Half: Cover Image + Small Info */}
        <Link 
          to={`/reviews/${review.id}`}
          className="block w-full group focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-t-lg"
        >
          <div className="relative w-full h-60 overflow-hidden rounded-t-lg bg-surface">
            {/* Cover Image */}
            <div className="absolute inset-0">
              {review.cover_image_url ? (
                <>
                  <img
                    src={review.cover_image_url}
                    alt={review.title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Mobile gradient for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-surface via-surface-muted to-accent/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-muted-foreground/30 font-serif mb-3">
                      {review.title.charAt(0)}
                    </div>
                    <div className="text-sm text-muted-foreground/60 tracking-wider uppercase font-semibold">
                      EVIDENS
                    </div>
                  </div>
                </div>
              )}
            </div>


            {/* Bottom Left: Tags + Title */}
            <div className="absolute bottom-5 left-5 z-10 space-y-3 max-w-lg">
              {/* Tags - Now above title inside cover area */}
              <div className="flex gap-2 flex-wrap">
                {/* Edition Badge - First */}
                <Badge 
                  variant="secondary"
                  className="bg-white/90 text-foreground backdrop-blur-sm border-white/20 font-bold text-xs px-3 py-1 shadow-lg"
                >
                  {review.edicao || review.id}
                </Badge>
                
                {/* Content Type Tags */}
                {review.content_types && review.content_types.length > 0 && (
                  <>
                    {review.content_types.slice(0, 2).map(contentType => (
                      <Badge
                        key={contentType.id}
                        style={{
                          backgroundColor: `${contentType.background_color}90`,
                          borderColor: `${contentType.border_color}90`,
                          color: contentType.text_color,
                        }}
                        className="text-xs font-medium backdrop-blur-sm border shadow-lg px-2 py-1"
                      >
                        {contentType.label}
                      </Badge>
                    ))}
                  </>
                )}
              </div>
              
              {/* Title - Now under tags */}
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-white font-serif">
                {review.title}
              </h1>
            </div>
          </div>
        </Link>

        {/* Lower Half: Date/Time, Description, Author */}
        <div className="bg-background border-x border-b border-border/20 rounded-b-lg p-5 space-y-4">
          {/* Date & Reading Time */}
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">{formatDate(review.published_at).short}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{getReadingTime()}</span>
            </div>
          </div>

          {/* Description */}
          {review.description && (
            <p className="text-muted-foreground leading-relaxed text-base">
              {review.description}
            </p>
          )}

          {/* Author */}
          <div className="flex items-center gap-3 pt-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={getAuthorAvatar() || undefined} />
              <AvatarFallback className="text-sm bg-accent/15 text-accent font-bold">
                {getAuthorName().charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-semibold text-foreground">
                por {getAuthorName()}
              </div>
              <div className="text-xs text-muted-foreground">
                Autor desta edição
              </div>
            </div>
          </div>
          
          {/* Mobile CTA - Separated and positioned lower */}
          <div className="flex items-center justify-end gap-2 pt-3 mt-1">
            <span className="text-xs text-muted-foreground/60 font-medium">Toque para ler</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
          </div>
        </div>
      </div>
    );
  }

  // DESKTOP LAYOUT: Everything inside cover image (banner style)
  return (
    <Link 
      to={`/reviews/${review.id}`}
      className="block w-full group focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-lg"
    >
      <div className="relative w-full h-[550px] overflow-hidden rounded-lg bg-surface shadow-sm hover:shadow-xl transition-all duration-500">
        {/* Background Image with hover effects */}
        <div className="absolute inset-0 w-full h-full">
          {review.cover_image_url ? (
            <img
              src={review.cover_image_url}
              alt={review.title}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:blur-sm"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-surface via-surface-muted to-accent/10 flex items-center justify-center">
              <div className="text-center">
                <div className="text-9xl font-bold text-muted-foreground/20 font-serif mb-6 transition-all duration-500 group-hover:scale-110">
                  {review.title.charAt(0)}
                </div>
                <div className="text-lg text-muted-foreground/60 tracking-wider uppercase font-bold">
                  EVIDENS
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40 group-hover:from-black/85 group-hover:via-black/65 group-hover:to-black/45 transition-all duration-500" />

        {/* Content Container - Flex layout to prevent clipping */}
        <div className="absolute inset-0 flex flex-col justify-between p-8 lg:p-10 z-10">
          
          {/* Top/Center: Title with contextual tags above, metadata and description below */}
          <div className="flex-1 flex flex-col justify-center space-y-6 max-w-4xl min-h-0">
            {/* Edition + Content Type Tags - Above title */}
            <div className="flex gap-2 flex-wrap">
              {/* Edition Badge - First */}
              <Badge 
                variant="secondary"
                className="bg-white/90 text-foreground backdrop-blur-sm border-white/20 font-bold text-sm px-4 py-1 shadow-lg"
              >
                {review.edicao || review.id}
              </Badge>
              
              {/* Content Type Tags */}
              {review.content_types && review.content_types.length > 0 && (
                <>
                  {review.content_types.slice(0, 3).map(contentType => (
                    <Badge
                      key={contentType.id}
                      style={{
                        backgroundColor: `${contentType.background_color}90`,
                        borderColor: `${contentType.border_color}90`,
                        color: contentType.text_color,
                      }}
                      className="text-sm font-medium backdrop-blur-sm border shadow-lg px-3 py-1"
                    >
                      {contentType.label}
                    </Badge>
                  ))}
                </>
              )}
            </div>

            {/* Hero Title - Primary decision factor */}
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-white font-serif">
              {review.title}
            </h1>

            {/* Date & Reading Time - Between title and description */}
            <div className="flex items-center gap-6 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(review.published_at).short}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{getReadingTime()}</span>
              </div>
            </div>

            {/* Description - Deeper context with overflow handling */}
            {review.description && (
              <p className="text-lg lg:text-xl text-white/90 leading-relaxed max-w-3xl font-sans flex-shrink min-h-0 overflow-hidden">
                {review.description}
              </p>
            )}
          </div>

          {/* Bottom Row: Author (left) + CTA (right) - Always visible */}
          <div className="flex items-center justify-between mt-6 flex-shrink-0">
            {/* Left: Author */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 flex-shrink-0">
                <AvatarImage src={getAuthorAvatar() || undefined} />
                <AvatarFallback className="text-sm bg-accent/20 text-accent font-bold">
                  {getAuthorName().charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-white/90 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {getAuthorName()}
                </div>
                <div className="text-xs text-white/70">
                  Autor
                </div>
              </div>
            </div>

            {/* Right: CTA */}
            <div className="flex items-center gap-3 text-white/80 hover:text-white transition-colors flex-shrink-0">
              <span className="text-sm font-medium">Ler edição completa</span>
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FeaturedReview;