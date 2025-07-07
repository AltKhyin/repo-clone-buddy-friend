// ABOUTME: Module component for displaying a horizontal carousel of review cards with mobile optimization.

import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ReviewCard from './ReviewCard';
import { HomepageReview } from '../../../packages/hooks/useHomepageFeedQuery';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReviewCarouselProps {
  title: string;
  reviews: HomepageReview[];
}

const ReviewCarousel: React.FC<ReviewCarouselProps> = ({ title, reviews }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // State for mobile expansion - only one card can be expanded at a time
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Handle mobile card expansion toggle
  const handleToggleExpand = (reviewId: number) => {
    setExpandedCardId(expandedCardId === reviewId ? null : reviewId);
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-foreground text-2xl font-bold mb-4 font-serif">{title}</h2>
        <div className="bg-surface rounded-md p-8 text-center">
          <p className="text-secondary">Nenhuma edição disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Section Title */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-foreground text-2xl font-bold font-serif">{title}</h2>

        {/* Navigation Arrows - Hidden only on phone-sized screens */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={scrollLeft}
            className="p-2 bg-surface text-foreground rounded-md hover:bg-surface-muted transition-colors border border-border"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={scrollRight}
            className="p-2 bg-surface text-foreground rounded-md hover:bg-surface-muted transition-colors border border-border"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Scrollable Reviews Container - Reduced gaps by 50% for improved content density */}
      <div
        ref={scrollRef}
        className={`flex overflow-x-auto scrollbar-hide pb-2 gap-1.5 md:gap-3 ${isMobile ? 'mobile-carousel-hint' : ''}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {reviews.map(review => (
          <div key={review.id} className={`flex-shrink-0 ${isMobile ? 'w-72' : 'w-72'}`}>
            <ReviewCard
              review={review}
              isExpanded={expandedCardId === review.id}
              onToggleExpand={() => handleToggleExpand(review.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewCarousel;
