// ABOUTME: Reddit-style sidebar redesign with exact visual styling and 8 specific sections for community management

import React from 'react';
import { useCommunitySidebarDataQuery } from '@packages/hooks/useCommunityManagementQuery';
import { AboutSection } from './reddit-sidebar/AboutSection';
import { UsefulLinksSection } from './reddit-sidebar/UsefulLinksSection';
import { RulesSection } from './reddit-sidebar/RulesSection';
import { AdminsSection } from './reddit-sidebar/AdminsSection'; // Renamed from ModeratorsSection
import { CategoriesSection } from './reddit-sidebar/CategoriesSection';
import { AnnouncementsSection } from './reddit-sidebar/AnnouncementsSection';
import { CustomSection } from './reddit-sidebar/CustomSection';

export const RedditStyleSidebar = () => {
  const { data: sidebarData, isLoading, error } = useCommunitySidebarDataQuery();

  // DEBUG: Log sidebar data to console
  console.log('RedditStyleSidebar - sidebarData:', sidebarData);
  console.log('RedditStyleSidebar - isLoading:', isLoading);
  console.log('RedditStyleSidebar - error:', error);

  if (isLoading) {
    return (
      <div className="w-full max-w-sm bg-reddit-sidebar-bg" data-testid="reddit-style-sidebar">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="px-4 py-4 border-b border-reddit-divider last:border-b-0"
            data-testid="skeleton"
          >
            <div className="animate-pulse">
              <div className="h-4 bg-reddit-divider rounded w-3/4 mb-3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-reddit-divider rounded w-full"></div>
                <div className="h-3 bg-reddit-divider rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-sm bg-reddit-sidebar-bg">
        <div className="px-4 py-4">
          <p className="text-sm text-red-600 dark:text-red-400">
            Erro ao carregar sidebar da comunidade
          </p>
        </div>
      </div>
    );
  }

  const sections = sidebarData?.sections || [];
  const visibleSections = sections
    .filter(section => section.is_visible)
    .sort((a, b) => a.display_order - b.display_order);

  // DEBUG: Log section processing
  console.log('RedditStyleSidebar - sections:', sections);
  console.log('RedditStyleSidebar - visibleSections:', visibleSections);

  return (
    <div className="w-full max-w-sm bg-reddit-sidebar-bg" data-testid="reddit-style-sidebar">
      {visibleSections.map((section, index) => {
        const props = {
          section,
          sidebarData,
          isLast: index === visibleSections.length - 1,
        };

        switch (section.section_type) {
          case 'about':
            return <AboutSection key={section.id} {...props} />;
          case 'links':
            return <UsefulLinksSection key={section.id} {...props} />;
          case 'rules':
            return <RulesSection key={section.id} {...props} />;
          case 'moderators':
            return <AdminsSection key={section.id} {...props} />; // Renamed from ModeratorsSection
          case 'categories':
            return <CategoriesSection key={section.id} {...props} />;
          case 'announcements':
            return <AnnouncementsSection key={section.id} {...props} />;
          case 'custom':
            return <CustomSection key={section.id} {...props} />;
          default:
            return null;
        }
      })}
    </div>
  );
};
