// ABOUTME: Reddit-style Moderators section showing admins and moderators with user flair

import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { RedditSidebarCard } from './RedditSidebarCard';
import type {
  CommunitySidebarSection,
  CommunitySidebarData,
} from '../../../../packages/hooks/useCommunityManagementQuery';

interface ModeratorsSectionProps {
  section: CommunitySidebarSection;
  sidebarData: CommunitySidebarData;
  isLast?: boolean;
}

const ModeratorCard = ({ moderator }: { moderator: any }) => {
  return (
    <div className="flex items-center gap-2 py-1 px-2 -mx-2 rounded hover:bg-reddit-hover-bg transition-colors">
      <Avatar className="h-7 w-7">
        <AvatarImage src={moderator.avatar_url} alt={moderator.full_name} />
        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
          {moderator.full_name
            ?.split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-reddit-text-primary truncate">
          {moderator.full_name}
        </span>

        {moderator.title && (
          <p className="text-xs text-reddit-text-meta truncate">{moderator.title}</p>
        )}
      </div>
    </div>
  );
};

export const ModeratorsSection = ({ section, sidebarData, isLast }: ModeratorsSectionProps) => {
  const content = section.content || {};
  const showModerators = content.show_moderators !== false;

  // Get real moderators from the computed data or sidebar data
  const computedData = section.computed_data || {};
  const moderators = computedData.moderators || sidebarData?.moderators || [];

  // Add profession flair as title
  const moderatorsWithTitles = moderators.map((moderator: any) => ({
    ...moderator,
    title: moderator.profession_flair,
  }));

  if (!showModerators) {
    return null;
  }

  return (
    <RedditSidebarCard title={section.title} isLast={isLast}>
      <div className="space-y-2">
        {/* Moderators List - No header, no count */}
        {showModerators && moderatorsWithTitles.length > 0 && (
          <div className="space-y-1">
            {moderatorsWithTitles.map(moderator => (
              <ModeratorCard key={moderator.id} moderator={moderator} />
            ))}
          </div>
        )}

        {/* No Moderators Message */}
        {showModerators && moderatorsWithTitles.length === 0 && (
          <div className="text-center py-4 text-reddit-text-secondary">
            <p className="text-sm">Nenhum moderador encontrado</p>
          </div>
        )}
      </div>
    </RedditSidebarCard>
  );
};
