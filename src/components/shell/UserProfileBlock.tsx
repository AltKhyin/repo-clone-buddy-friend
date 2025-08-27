// ABOUTME: Self-contained user profile block component with independent data fetching for the application shell.

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LogIn, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserProfileQuery } from '@packages/hooks/useUserProfileQuery';

interface UserProfileBlockProps {
  isCollapsed: boolean;
}

export const UserProfileBlock = ({ isCollapsed }: UserProfileBlockProps) => {
  // Independent data fetching - completely decoupled from any global context
  const { data: userProfile, isLoading, isError } = useUserProfileQuery();
  const navigate = useNavigate();

  console.log('UserProfileBlock state:', {
    isLoading,
    isError,
    hasProfile: !!userProfile,
    isCollapsed,
  });

  // Independent loading state - shows skeleton while data loads
  if (isLoading) {
    return (
      <div
        className={`flex items-center gap-3 ${isCollapsed ? 'justify-center p-2' : 'p-3'}`}
        data-testid="loading-skeleton"
      >
        <Skeleton className="h-9 w-9 rounded-full" />
        {!isCollapsed && <Skeleton className="h-4 w-24" />}
      </div>
    );
  }

  // Error state handling - graceful degradation with login CTA
  if (isError || !userProfile) {
    const handleLoginClick = () => {
      navigate('/auth');
    };

    return (
      <div
        className={`flex items-center gap-3 ${isCollapsed ? 'justify-center p-2' : 'p-3'}`}
        data-testid="login-cta-state"
      >
        {/* Discrete avatar with user icon */}
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-muted-foreground/10 text-muted-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        
        {!isCollapsed && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLoginClick}
            className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogIn className="h-3 w-3 mr-1.5" />
            Entrar/Criar conta
          </Button>
        )}
      </div>
    );
  }

  // Success state - render user profile data
  const initials =
    userProfile.full_name
      ?.split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase() || '??';

  return (
    <div
      className={`flex items-center gap-3 ${isCollapsed ? 'justify-center p-2' : 'p-3'}`}
      data-testid="profile-data"
    >
      <Avatar className={isCollapsed ? 'h-9 w-9' : 'h-9 w-9'} data-testid="user-avatar">
        <AvatarImage src={userProfile.avatar_url || ''} alt={userProfile.full_name || 'User'} />
        <AvatarFallback
          className="bg-primary/10 text-primary text-sm font-medium"
          data-testid="avatar-initials"
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      {!isCollapsed && (
        <div className="flex flex-col min-w-0 flex-1" data-testid="user-info">
          <span className="text-sm font-medium text-foreground truncate" data-testid="user-name">
            {userProfile.full_name || 'Unnamed User'}
          </span>
          {userProfile.role && userProfile.role !== 'practitioner' && (
            <span className="text-xs text-muted-foreground capitalize" data-testid="user-role">
              {userProfile.role}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
