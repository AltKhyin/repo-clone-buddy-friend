
// ABOUTME: Responsive masonry grid component for displaying review cards with Pinterest-like layout.

import React from 'react';
import Masonry from 'react-masonry-css';
import ReviewCard from './ReviewCard';
import { useIsMobile } from '@/hooks/use-mobile';
import type { AcervoReview } from '../../../packages/hooks/useAcervoDataQuery';

interface MasonryGridProps {
  reviews: AcervoReview[];
}

const MasonryGrid: React.FC<MasonryGridProps> = ({ reviews }) => {
  const isMobile = useIsMobile();

  // Breakpoint configuration for masonry columns
  const breakpointColumnsObj = {
    default: 4, // Desktop: 4 columns
    1280: 3,    // Large screens: 3 columns  
    1024: 2,    // Tablet: 2 columns
    768: 2,     // Mobile: 2 columns per DOC_8 RULE 6
  };

  return (
    <div className="w-full">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-auto -ml-4"
        columnClassName="pl-4 bg-clip-padding"
      >
        {reviews.map((review) => (
          <div key={review.review_id} className="mb-4">
            <ReviewCard review={review} />
          </div>
        ))}
      </Masonry>
    </div>
  );
};

export default MasonryGrid;
