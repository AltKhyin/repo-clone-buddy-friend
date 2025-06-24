
// ABOUTME: Simplified community sidebar without sticky positioning - part of single scroll container.

import React from 'react';
import { RulesModule } from './sidebar/RulesModule';
import { LinksModule } from './sidebar/LinksModule';
import { TrendingDiscussionsModule } from './sidebar/TrendingDiscussionsModule';
import { FeaturedPollModule } from './sidebar/FeaturedPollModule';
import { RecentActivityModule } from './sidebar/RecentActivityModule';
import type { SidebarData } from '../../types/community';

interface CommunitySidebarProps {
  rules: SidebarData['rules'];
  links: SidebarData['links'];
  trendingDiscussions: SidebarData['trendingDiscussions'];
  featuredPoll?: SidebarData['featuredPoll'];
  recentActivity: SidebarData['recentActivity'];
}

export const CommunitySidebar = ({
  rules,
  links,
  trendingDiscussions,
  featuredPoll,
  recentActivity
}: CommunitySidebarProps) => {
  return (
    <div className="space-y-4">
      {/* Featured Poll Module - Priority display if available */}
      {featuredPoll && (
        <FeaturedPollModule poll={featuredPoll} />
      )}

      {/* Community Rules - Always show */}
      <RulesModule rules={rules} />

      {/* Trending Discussions - High engagement content */}
      <TrendingDiscussionsModule posts={trendingDiscussions} />

      {/* Recent Activity - Latest posts */}
      <RecentActivityModule activities={recentActivity} />

      {/* Useful Links - Static resources */}
      <LinksModule links={links} />
    </div>
  );
};
