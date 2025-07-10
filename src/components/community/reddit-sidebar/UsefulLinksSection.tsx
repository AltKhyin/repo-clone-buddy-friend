// ABOUTME: Reddit-style Useful Links section for external resources and important links

import React from 'react';
import { RedditSidebarCard, RedditSidebarButton } from './RedditSidebarCard';
import type {
  CommunitySidebarSection,
  CommunitySidebarData,
} from '../../../../packages/hooks/useCommunityManagementQuery';

interface UsefulLinksSectionProps {
  section: CommunitySidebarSection;
  sidebarData: CommunitySidebarData;
  isLast?: boolean;
}

export const UsefulLinksSection = ({ section, sidebarData, isLast }: UsefulLinksSectionProps) => {
  const content = section.content || {};
  const links = content.links || [];

  if (!links || links.length === 0) {
    return null;
  }

  return (
    <RedditSidebarCard title={section.title} isLast={isLast}>
      <div className="space-y-1">
        {links.map((link: any, index: number) => (
          <RedditSidebarButton
            key={index}
            size="md"
            variant="outline"
            fullWidth={true}
            onClick={() => window.open(link.url, '_blank')}
            className="text-sm justify-start"
          >
            {link.title}
          </RedditSidebarButton>
        ))}
      </div>
    </RedditSidebarCard>
  );
};
