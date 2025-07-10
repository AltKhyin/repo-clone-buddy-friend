// ABOUTME: Reddit-style Categories section for filtering posts by category with post counts

import React from 'react';
import { RedditSidebarCard, RedditSidebarButton } from './RedditSidebarCard';
import { useCategoryFilter } from '../../../contexts/CategoryFilterContext';
import type {
  CommunitySidebarSection,
  CommunitySidebarData,
} from '../../../../packages/hooks/useCommunityManagementQuery';

interface CategoriesSectionProps {
  section: CommunitySidebarSection;
  sidebarData: CommunitySidebarData;
  isLast?: boolean;
}

export const CategoriesSection = ({ section, sidebarData, isLast }: CategoriesSectionProps) => {
  const content = section.content || {};
  const computedData = section.computed_data || {};
  const categories = computedData.categories || sidebarData?.categories || [];

  const showAllCategories = content.show_all_categories !== false;

  const { selectedCategoryId, setSelectedCategoryId } = useCategoryFilter();

  // Use categories with real post counts from the Edge Function
  const categoriesWithCounts = categories.map((category: any) => ({
    ...category,
    post_count: category.post_count || 0,
  }));

  if (!showAllCategories && categories.length === 0) {
    return null;
  }

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    console.log('Filter by category:', categoryId);
  };

  return (
    <RedditSidebarCard title={section.title} isLast={isLast}>
      <div className="flex flex-wrap gap-2">
        {/* All Categories Option */}
        <RedditSidebarButton
          size="sm"
          variant={selectedCategoryId === null ? 'secondary' : 'outline'}
          onClick={() => handleCategoryClick(null)}
          className="text-xs"
        >
          Todas
        </RedditSidebarButton>

        {/* Categories Pills */}
        {showAllCategories &&
          categoriesWithCounts
            .filter((category: any) => category.is_active)
            .map((category: any) => (
              <RedditSidebarButton
                key={category.id}
                size="sm"
                variant={selectedCategoryId === category.id.toString() ? 'secondary' : 'outline'}
                onClick={() => handleCategoryClick(category.id.toString())}
                className="text-xs"
                style={{
                  color:
                    selectedCategoryId === category.id.toString() ? category.text_color : undefined,
                  borderColor: category.border_color,
                  backgroundColor:
                    selectedCategoryId === category.id.toString()
                      ? category.background_color
                      : undefined,
                }}
              >
                {category.label}
              </RedditSidebarButton>
            ))}
      </div>
    </RedditSidebarCard>
  );
};
