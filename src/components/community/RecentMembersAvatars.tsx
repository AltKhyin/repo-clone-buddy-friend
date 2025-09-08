// ABOUTME: Simple avatar display component showing recent members with stacked, overlapping design for sidebar about section

import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface RecentMember {
  id: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

interface RecentMembersAvatarsProps {
  members: RecentMember[];
  maxDisplayed?: number;
  className?: string;
}

export function RecentMembersAvatars({
  members,
  maxDisplayed = 7,
  className,
}: RecentMembersAvatarsProps) {
  // Limit to maximum displayed members
  const displayedMembers = members.slice(0, maxDisplayed);

  // If no members, don't render anything
  if (!displayedMembers.length) {
    return null;
  }

  return (
    <div className={cn('flex items-center', className)}>
      {/* Stacked and overlapping avatars */}
      <div className="flex -space-x-2">
        {displayedMembers.map((member, index) => {
          // Calculate opacity for fade effect on the right
          const opacity =
            index < maxDisplayed - 2 ? 1 : Math.max(0.3, 1 - (index - (maxDisplayed - 3)) * 0.35);

          // Get user initials for fallback
          const initials = member.full_name
            .split(' ')
            .map(name => name.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <Avatar
              key={member.id}
              className={cn(
                'border-2 border-background transition-opacity duration-200',
                'hover:z-10 hover:scale-110',
                'h-8 w-8' // Compact size for sidebar
              )}
              style={{ opacity }}
            >
              <AvatarImage
                src={member.avatar_url || undefined}
                alt={`${member.full_name} avatar`}
              />
              <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
            </Avatar>
          );
        })}
      </div>

      {/* Member count indicator if there are more members */}
      {members.length > maxDisplayed && (
        <div className="ml-2 text-xs text-muted-foreground">+{members.length - maxDisplayed}</div>
      )}
    </div>
  );
}

// Export a variant specifically for the sidebar about section
export function SidebarRecentMembers({ members }: { members: RecentMember[] }) {
  return (
    <div className="space-y-2">
      <RecentMembersAvatars members={members} maxDisplayed={7} className="justify-start" />
      {members.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Recentemente online
        </div>
      )}
    </div>
  );
}
