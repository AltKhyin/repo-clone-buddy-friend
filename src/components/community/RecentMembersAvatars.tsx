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
  maxDisplayed,
  className,
}: RecentMembersAvatarsProps) {
  // Calculate how many avatars fit nicely, then show all with extended fade
  const calculateBaseAvatars = () => {
    // Sidebar: 16rem (256px) - 2rem padding (32px) = 224px available
    const availableWidth = 224;
    const avatarSize = 32; // h-8 w-8
    const overlapSize = 8; // -space-x-2 overlap
    return Math.floor((availableWidth - avatarSize) / (avatarSize - overlapSize)) + 1;
  };

  const baseAvatarCount = calculateBaseAvatars(); // ~9 avatars fit nicely
  const maxToShow = Math.min(members.length, 12); // Limit to 12 to prevent overflow
  const displayedMembers = members.slice(0, maxToShow);

  // If no members, don't render anything
  if (!displayedMembers.length) {
    return null;
  }

  return (
    <div className={cn('flex items-center', className)}>
      {/* Full-width stacked avatars with fade effect and z-index stacking */}
      <div className="flex -space-x-2">
        {displayedMembers.map((member, index) => {
          // Progressive fade with last avatar completely transparent
          let opacity = 1;

          if (displayedMembers.length > baseAvatarCount) {
            if (index >= baseAvatarCount - 1) {
              // Calculate fade for avatars beyond the base comfortable fit
              const fadeStart = baseAvatarCount - 1;
              const fadePosition = index - fadeStart;
              const totalFadePositions = displayedMembers.length - fadeStart - 1;

              if (index === displayedMembers.length - 1) {
                // Last avatar is completely transparent (0% opacity)
                opacity = 0;
              } else {
                // Progressive fade from 1.0 to near 0
                opacity = Math.max(0.1, 1 - (fadePosition / (totalFadePositions + 1)) * 0.9);
              }
            }
          }

          // Z-index stacking: left avatars on upper layer
          const zIndex = displayedMembers.length - index;

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
                'hover:scale-110',
                'h-8 w-8' // Compact size for sidebar
              )}
              style={{
                opacity,
                zIndex: zIndex,
                // Ensure hover state goes above all others
                '--hover-z': displayedMembers.length + 10
              } as React.CSSProperties & { '--hover-z': number }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.zIndex = `${displayedMembers.length + 10}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.zIndex = `${zIndex}`;
              }}
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
    </div>
  );
}

// Export a variant specifically for the sidebar about section
export function SidebarRecentMembers({ members }: { members: RecentMember[] }) {
  return (
    <div className="space-y-2">
      <RecentMembersAvatars members={members} className="justify-start" />
      {members.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Recentemente online
        </div>
      )}
    </div>
  );
}
