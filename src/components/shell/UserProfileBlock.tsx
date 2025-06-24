
// ABOUTME: Self-contained user profile block component with independent data fetching for the application shell.

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfileQuery } from '../../../packages/hooks/useUserProfileQuery';

interface UserProfileBlockProps {
  isCollapsed: boolean;
}

export const UserProfileBlock = ({ isCollapsed }: UserProfileBlockProps) => {
  // Independent data fetching - completely decoupled from any global context
  const { data: userProfile, isLoading, isError } = useUserProfileQuery();

  console.log('UserProfileBlock state:', { 
    isLoading, 
    isError, 
    hasProfile: !!userProfile,
    isCollapsed 
  });

  // Independent loading state - shows skeleton while data loads
  if (isLoading) {
    return (
      <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center p-2' : 'p-3'}`}>
        <Skeleton className="h-9 w-9 rounded-full" />
        {!isCollapsed && <Skeleton className="h-4 w-24" />}
      </div>
    );
  }

  // Error state handling - graceful degradation
  if (isError || !userProfile) {
    return (
      <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center p-2' : 'p-3'}`}>
        <div className="h-9 w-9 rounded-full bg-muted" />
        {!isCollapsed && (
          <span className="text-sm text-muted-foreground">Error loading profile</span>
        )}
      </div>
    );
  }

  // Success state - render user profile data
  const initials = userProfile.full_name
    ?.split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase() || '??';

  return (
    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center p-2' : 'p-3'}`}>
      <Avatar className={isCollapsed ? 'h-9 w-9' : 'h-9 w-9'}>
        <AvatarImage src={userProfile.avatar_url || ''} alt={userProfile.full_name || 'User'} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      {!isCollapsed && (
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground truncate">
            {userProfile.full_name || 'Unnamed User'}
          </span>
          {userProfile.role && userProfile.role !== 'practitioner' && (
            <span className="text-xs text-muted-foreground capitalize">
              {userProfile.role}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
