// ABOUTME: Simplified Reddit-style About section with recent members display using stacked avatars

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { RedditSidebarCard, RedditSidebarDivider } from './RedditSidebarCard';
import { SidebarRecentMembers } from '../RecentMembersAvatars';
import type {
  CommunitySidebarSection,
  CommunitySidebarData,
} from '../../../../packages/hooks/useCommunityManagementQuery';

interface AboutSectionProps {
  section: CommunitySidebarSection;
  sidebarData: CommunitySidebarData;
  isLast?: boolean;
}

export const AboutSection = ({ section, sidebarData, isLast }: AboutSectionProps) => {
  const content = section.content || {};
  const computedData = section.computed_data || {};

  const description = content.description || 'Comunidade de profissionais da saúde';
  const recentMembers = computedData.recent_members || sidebarData?.recentMembers || [];

  // Get real member statistics
  const totalMembers = computedData.total_members || sidebarData?.memberStats?.totalMembers || 0;
  const onlineCount = computedData.online_count || sidebarData?.memberStats?.onlineCount || 0;

  return (
    <RedditSidebarCard title={section.title} isLast={isLast}>
      <div className="space-y-3">
        {/* Community Description */}
        <p className="text-sm text-reddit-text-secondary leading-relaxed">{description}</p>

        {/* Member Statistics - Reddit style: simple format */}
        <div className="text-sm text-reddit-text-secondary">
          <span>{totalMembers.toLocaleString()} membros</span>
          {onlineCount > 0 && (
            <>
              <span className="mx-1">•</span>
              <span>{onlineCount} online</span>
            </>
          )}
        </div>

        {/* Recent Members Display */}
        {recentMembers.length > 0 && (
          <>
            <RedditSidebarDivider />
            <SidebarRecentMembers members={recentMembers} />
          </>
        )}
      </div>
    </RedditSidebarCard>
  );
};
