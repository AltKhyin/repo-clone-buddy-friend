// ABOUTME: Client-side sorting component for Acervo page with tag-based reordering (no filtering) and improved priority algorithm.

import React, { useMemo } from 'react';
import type { Tag } from '@/types';
import type { AcervoReview } from '@packages/hooks/useAcervoDataQuery';

interface ClientSideSorterProps {
  reviews: AcervoReview[];
  tags: Tag[];
  selectedTags: number[];
  searchQuery: string;
  sortBy: 'recent' | 'popular' | 'alphabetical';
  children: (data: { sortedReviews: AcervoReview[]; sortedTags: Tag[] }) => React.ReactNode;
}

export const ClientSideSorter = ({
  reviews,
  tags,
  selectedTags,
  searchQuery,
  sortBy,
  children,
}: ClientSideSorterProps) => {
  const sortedData = useMemo(() => {
    // Defensive checks for tags and reviews
    if (!tags || !Array.isArray(tags)) {
      console.warn('ClientSideSorter: tags is not a valid array:', tags);
      return {
        sortedReviews: Array.isArray(reviews) ? reviews : [],
        sortedTags: [],
      };
    }

    if (!reviews || !Array.isArray(reviews)) {
      console.warn('ClientSideSorter: reviews is not a valid array:', reviews);
      return {
        sortedReviews: [],
        sortedTags: tags,
      };
    }

    // **TASK 3.1 FIX: Improved Tag Sorting Algorithm**
    const getTagPriority = (tag: Tag, selectedTags: number[]): number => {
      if (selectedTags.includes(tag.id)) return 1; // Selected
      if (tag.parent_id && selectedTags.includes(tag.parent_id)) return 2; // Child of selected
      return 3; // Other
    };

    // Sort tags by priority, then alphabetically (safe array spread)
    const sortedTags = [...tags].sort((a, b) => {
      const priorityDiff = getTagPriority(a, selectedTags) - getTagPriority(b, selectedTags);
      return priorityDiff !== 0 ? priorityDiff : a.tag_name.localeCompare(b.tag_name);
    });

    // TASK 2.2: Apply search query filter but NOT tag filtering (use reordering instead)
    const searchFilteredReviews = reviews.filter(review => {
      // Search query filter - still applies filtering
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesTitle = review.title.toLowerCase().includes(searchLower);
        const matchesDescription = review.description?.toLowerCase().includes(searchLower);
        return matchesTitle || matchesDescription;
      }
      return true;
    });

    // TASK 2.2: Tag matching logic for reordering (no filtering)
    const getTagMatchPriority = (review: AcervoReview) => {
      if (selectedTags.length === 0) return 1; // No tags selected, all reviews equal priority

      const reviewTagNames = Object.entries(review.tags_json).flatMap(([categoria, subtags]) => {
        const allTags = [categoria];
        if (subtags && subtags.length > 0) {
          allTags.push(...subtags);
        }
        return allTags;
      });

      // Convert selected tag IDs to tag names for comparison
      const selectedTagNames = selectedTags
        .map(tagId => {
          const tag = tags.find(t => t.id === tagId);
          return tag?.tag_name || '';
        })
        .filter(Boolean);

      // Calculate match score - more matches = higher priority (lower number)
      const matchCount = selectedTagNames.filter(tagName =>
        reviewTagNames.includes(tagName)
      ).length;

      if (matchCount > 0) {
        return 0; // Matching reviews get top priority
      } else {
        return 1; // Non-matching reviews get lower priority
      }
    };

    // TASK 2.2: Sort reviews with tag priority first, then by sortBy criteria
    const sortedReviews = [...searchFilteredReviews].sort((a, b) => {
      // Primary sort: Tag match priority (matching reviews first)
      const aPriority = getTagMatchPriority(a);
      const bPriority = getTagMatchPriority(b);

      if (aPriority !== bPriority) {
        return aPriority - bPriority; // Lower priority number = higher importance
      }

      // Secondary sort: Within same priority group, apply sortBy criteria
      switch (sortBy) {
        case 'recent':
          return (
            new Date(b.published_at || '').getTime() - new Date(a.published_at || '').getTime()
          );
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
      sortedTags,
    };
  }, [reviews, tags, selectedTags, searchQuery, sortBy]);

  return <>{children(sortedData)}</>;
};
