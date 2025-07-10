// ABOUTME: Reddit-style Announcements section for changelog, news, and community announcements

import React from 'react';
import { RedditSidebarCard, RedditSidebarListItem } from './RedditSidebarCard';
import type {
  CommunitySidebarSection,
  CommunitySidebarData,
} from '../../../../packages/hooks/useCommunityManagementQuery';

interface AnnouncementsSectionProps {
  section: CommunitySidebarSection;
  sidebarData: CommunitySidebarData;
  isLast?: boolean;
}

const AnnouncementItem = ({ announcement }: { announcement: any }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d atrás`;
    }

    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="py-2 border-b border-reddit-divider last:border-b-0">
      <div className="space-y-1">
        <h4 className="text-sm text-reddit-text-primary font-medium line-clamp-2">
          {announcement.title}{' '}
          <span className="text-xs text-reddit-text-meta font-normal">
            • {formatDate(announcement.created_at)}
          </span>
        </h4>

        {announcement.content && (
          <p className="text-xs text-reddit-text-secondary line-clamp-2 leading-relaxed">
            {announcement.content}
          </p>
        )}
      </div>
    </div>
  );
};

export const AnnouncementsSection = ({
  section,
  sidebarData,
  isLast,
}: AnnouncementsSectionProps) => {
  const content = section.content || {};
  const computedData = section.computed_data || {};

  const showFeaturedOnly = content.show_featured_only || false;
  const maxAnnouncements = content.max_announcements || 5;
  const allowedTypes = content.allowed_types || ['announcement', 'news', 'changelog', 'event'];

  // Get real announcements from computed data or sidebar data
  const announcements = computedData.announcements || sidebarData?.announcements || [];

  // Filter announcements based on configuration
  const filteredAnnouncements = announcements
    .filter(announcement => allowedTypes.includes(announcement.type))
    .filter(announcement => !showFeaturedOnly || announcement.is_featured)
    .slice(0, maxAnnouncements);

  if (filteredAnnouncements.length === 0) {
    return null;
  }

  return (
    <RedditSidebarCard title={section.title} isLast={isLast}>
      <div className="space-y-0">
        {filteredAnnouncements.map(announcement => (
          <AnnouncementItem key={announcement.id} announcement={announcement} />
        ))}
      </div>
    </RedditSidebarCard>
  );
};
