
// ABOUTME: Client-side sorting component for Acervo page with improved tag priority algorithm.

import React, { useMemo } from 'react';
import type { Tag } from '@/types';
import type { AcervoReview } from '../../../packages/hooks/useAcervoDataQuery';

interface ClientSideSorterProps {
  reviews: AcervoReview[];
  tags: Tag[];
  selectedTags: number[];
  searchQuery: string;
  sortBy: 'recent' | 'popular' | 'alphabetical';
  children: (data: {
    sortedReviews: AcervoReview[];
    sortedTags: Tag[];
  }) => React.ReactNode;
}

export const ClientSideSorter = ({
  reviews,
  tags,
  selectedTags,
  searchQuery,
  sortBy,
  children
}: ClientSideSorterProps) => {
  const sortedData = useMemo(() => {
    // **TASK 3.1 FIX: Improved Tag Sorting Algorithm**
    const getTagPriority = (tag: Tag, selectedTags: number[]): number => {
      if (selectedTags.includes(tag.id)) return 1; // Selected
      if (tag.parent_id && selectedTags.includes(tag.parent_id)) return 2; // Child of selected
      return 3; // Other
    };

    // Sort tags by priority, then alphabetically
    const sortedTags = [...tags].sort((a, b) => {
      const priorityDiff = getTagPriority(a, selectedTags) - getTagPriority(b, selectedTags);
      return priorityDiff !== 0 ? priorityDiff : a.tag_name.localeCompare(b.tag_name);
    });

    // Filter reviews based on search query and selected tags
    let filteredReviews = reviews.filter(review => {
      // Search query filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesTitle = review.title.toLowerCase().includes(searchLower);
        const matchesDescription = review.description?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDescription) return false;
      }

      // Tag filter - check against tags_json structure
      if (selectedTags.length > 0) {
        const reviewTagNames = Object.entries(review.tags_json).flatMap(([categoria, subtags]) => {
          const allTags = [categoria];
          if (subtags && subtags.length > 0) {
            allTags.push(...subtags);
          }
          return allTags;
        });
        
        // Convert selected tag IDs to tag names for comparison
        const selectedTagNames = selectedTags.map(tagId => {
          const tag = tags.find(t => t.id === tagId);
          return tag?.tag_name || '';
        }).filter(Boolean);
        
        return selectedTagNames.some(tagName => reviewTagNames.includes(tagName));
      }

      return true;
    });

    // Sort reviews based on sortBy criteria
    const sortedReviews = [...filteredReviews].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.published_at || '').getTime() - 
                 new Date(a.published_at || '').getTime();
        case 'popular':
          return (b.view_count || 0) - (a.view_count || 0);
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return {
      sortedReviews,
      sortedTags
    };
  }, [reviews, tags, selectedTags, searchQuery, sortBy]);

  return <>{children(sortedData)}</>;
};
