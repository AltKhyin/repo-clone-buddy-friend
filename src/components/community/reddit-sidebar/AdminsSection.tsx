// ABOUTME: Reddit-style Admins section showing administrators with user profession display

import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { RedditSidebarCard } from './RedditSidebarCard';
import type {
  CommunitySidebarSection,
  CommunitySidebarData,
} from '../../../../packages/hooks/useCommunityManagementQuery';

interface AdminsSectionProps {
  section: CommunitySidebarSection;
  sidebarData: CommunitySidebarData;
  isLast?: boolean;
}

const AdminCard = ({ admin }: { admin: any }) => {
  return (
    <div className="flex items-center gap-2 py-1 px-2 -mx-2 rounded hover:bg-reddit-hover-bg transition-colors">
      <Avatar className="h-7 w-7">
        <AvatarImage src={admin.avatar_url} alt={admin.full_name} />
        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
          {admin.full_name
            ?.split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-reddit-text-primary truncate">
          {admin.full_name}
        </span>

        {admin.title && <p className="text-xs text-reddit-text-meta truncate">{admin.title}</p>}
      </div>
    </div>
  );
};

export const AdminsSection = ({ section, sidebarData, isLast }: AdminsSectionProps) => {
  const content = section.content || {};
  const showAdmins = content.show_moderators !== false; // Keep existing config key for compatibility

  // Get real admins from the computed data or sidebar data (previously moderators)
  const computedData = section.computed_data || {};
  const admins = computedData.moderators || sidebarData?.moderators || []; // Keep moderators key for data compatibility

  // Add profession as title
  const adminsWithTitles = admins.map((admin: any) => ({
    ...admin,
    title: admin.profession,
  }));

  if (!showAdmins) {
    return null;
  }

  return (
    <RedditSidebarCard title={section.title} isLast={isLast}>
      <div className="space-y-2">
        {/* Admins List - No header, no count */}
        {showAdmins && adminsWithTitles.length > 0 && (
          <div className="space-y-1">
            {adminsWithTitles.map(admin => (
              <AdminCard key={admin.id} admin={admin} />
            ))}
          </div>
        )}

        {/* No Admins Message */}
        {showAdmins && adminsWithTitles.length === 0 && (
          <div className="text-center py-4 text-reddit-text-secondary">
            <p className="text-sm">Nenhum administrador encontrado</p>
          </div>
        )}
      </div>
    </RedditSidebarCard>
  );
};
