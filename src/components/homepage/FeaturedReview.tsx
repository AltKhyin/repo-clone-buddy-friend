
// ABOUTME: Module component for displaying the featured review hero section with mobile optimization.

import React from 'react';
import { Review } from './ReviewCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface FeaturedReviewProps {
  review: Review | null;
}

const FeaturedReview: React.FC<FeaturedReviewProps> = ({ review }) => {
  const isMobile = useIsMobile();

  if (!review) {
    return (
      <div className={`w-full bg-surface rounded-md flex items-center justify-center ${isMobile ? 'h-64' : 'h-96'}`}>
        <p className="text-secondary">Nenhuma edição em destaque</p>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full bg-cover bg-center rounded-md overflow-hidden cursor-pointer group ${isMobile ? 'h-64' : 'h-96'}`}
      style={{ 
        backgroundImage: review.cover_image_url ? `url(${review.cover_image_url})` : 'none',
        backgroundColor: review.cover_image_url ? 'transparent' : 'hsl(var(--surface))'
      }}
      onClick={() => window.location.href = `/reviews/${review.id}`}
    >
      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      
      {/* Content */}
      <div className={`absolute inset-0 flex flex-col justify-center max-w-2xl ${isMobile ? 'p-4' : 'p-8'}`}>
        {/* Edition tag */}
        <div className="mb-4">
          <span className="text-white/90 text-sm font-medium bg-black/40 backdrop-blur-sm px-3 py-1 rounded-md border border-white/20">
            Edição #{review.id}
          </span>
        </div>
        
        {/* Title */}
        <h1 className={`text-white font-bold leading-tight font-serif ${isMobile ? 'text-2xl mb-3' : 'text-4xl mb-4'}`}>
          {review.title}
        </h1>
        
        {/* Description */}
        {review.description && (
          <p className={`text-white/90 leading-relaxed max-w-xl font-sans ${isMobile ? 'text-base mb-4' : 'text-lg mb-6'}`}>
            {review.description}
          </p>
        )}
        
        {/* CTA Button - Touch-friendly on mobile */}
        <button className={`bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors w-fit text-sm ${isMobile ? 'px-4 py-3 min-h-[44px]' : 'px-6 py-3'}`}>
          Ler agora
        </button>
      </div>
    </div>
  );
};

export default FeaturedReview;
