// ABOUTME: Reusable Reddit-style voting component with net scoring and hollow/filled arrow states.

import React from 'react';
import { Button } from './button';
import { VoteArrowUp } from './icons/VoteArrowUp';
import { VoteArrowDown } from './icons/VoteArrowDown';
import { cn } from '../../lib/utils';
import { useCastVoteMutation } from '../../../packages/hooks/useCastVoteMutation';
import { useAuthStore } from '../../store/auth';
import { useTheme } from '../theme/CustomThemeProvider';
import { toast } from 'sonner';

interface VoteButtonProps {
  entityId: string;
  entityType: 'community_post' | 'suggestion';
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  orientation?: 'vertical' | 'horizontal';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  showDownvote?: boolean;
  isPinned?: boolean;
}

export const VoteButton = ({
  entityId,
  entityType,
  upvotes,
  downvotes,
  userVote,
  orientation = 'horizontal',
  size = 'md',
  disabled = false,
  className,
  showDownvote = true,
  isPinned = false,
}: VoteButtonProps) => {
  const { user } = useAuthStore();
  const { actualTheme } = useTheme();
  const castVoteMutation = useCastVoteMutation();

  // Calculate net score (Reddit-style)
  const netScore = upvotes - downvotes;

  // Handle vote action
  const handleVote = (voteType: 'up' | 'down') => {
    if (!user) {
      toast.error('Você precisa estar logado para votar');
      return;
    }

    // Reddit-style toggle logic: same vote = remove, different vote = change
    // For upvote-only systems (suggestions), don't allow downvotes
    if (voteType === 'down' && !showDownvote) return;

    const newVoteType = userVote === voteType ? null : voteType;

    castVoteMutation.mutate({
      entity_id: entityId,
      vote_type: newVoteType || 'none',
      entity_type: entityType,
    });
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'h-6 w-6 p-1',
      icon: 12,
      text: 'text-xs',
    },
    md: {
      button: 'h-8 w-8 p-1.5',
      icon: 14,
      text: 'text-sm',
    },
    lg: {
      button: 'h-10 w-10 p-2',
      icon: 16,
      text: 'text-base',
    },
  };

  const config = sizeConfig[size];
  const isLoading = castVoteMutation.isPending;

  // Theme-aware upvote styling: Use accent color for light theme, primary for others
  const getUpvoteStyle = () => {
    if (isPinned) {
      if (actualTheme === 'dark') {
        return 'text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20';
      }
      return 'text-accent-foreground bg-accent-foreground/10 hover:bg-accent-foreground/20';
    }
    if (actualTheme === 'light') {
      return 'text-accent bg-accent/10 hover:bg-accent/20';
    }
    return 'text-primary bg-primary/10 hover:bg-primary/20';
  };

  // Theme-aware downvote styling for pinned posts
  const getDownvoteStyle = () => {
    if (isPinned) {
      if (actualTheme === 'dark') {
        return 'text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20';
      }
      return 'text-accent-foreground bg-accent-foreground/10 hover:bg-accent-foreground/20';
    }
    return 'text-error bg-error/10 hover:bg-error/20';
  };

  // Orientation-specific styling
  const containerClass =
    orientation === 'vertical' ? 'flex flex-col items-center gap-1' : 'flex items-center gap-2';

  const scoreClass = orientation === 'vertical' ? 'order-2' : 'order-2';

  return (
    <div className={cn(containerClass, className)}>
      {/* Net Score - Now on the left */}
      <span
        className={cn(
          config.text,
          'font-medium min-w-[2rem] text-center tabular-nums',
          userVote === 'up' &&
            (isPinned
              ? actualTheme === 'dark'
                ? 'text-primary-foreground'
                : 'text-accent-foreground'
              : actualTheme === 'light'
                ? 'text-accent'
                : 'text-primary'),
          userVote === 'down' &&
            (isPinned
              ? actualTheme === 'dark'
                ? 'text-primary-foreground/70'
                : 'text-accent-foreground/70'
              : 'text-muted-foreground'),
          !userVote &&
            (isPinned
              ? actualTheme === 'dark'
                ? 'text-primary-foreground'
                : 'text-accent-foreground'
              : 'text-foreground')
        )}
      >
        {netScore}
      </span>

      {/* Vote Buttons Container - No gap between buttons */}
      <div className="flex items-center">
        {/* Upvote Button */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            config.button,
            'transition-all duration-150',
            showDownvote ? 'rounded-r-none' : 'rounded-sm',
            userVote === 'up' && getUpvoteStyle(),
            !userVote &&
              (isPinned
                ? actualTheme === 'dark'
                  ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
                  : 'text-accent-foreground/70 hover:text-accent-foreground hover:bg-accent-foreground/10'
                : actualTheme === 'light'
                  ? 'text-muted-foreground hover:text-accent hover:bg-accent/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10')
          )}
          onClick={() => handleVote('up')}
          disabled={disabled || isLoading}
        >
          <VoteArrowUp
            filled={userVote === 'up'}
            size={config.icon}
            className="transition-all duration-150"
          />
        </Button>

        {/* Downvote Button - Only show if enabled */}
        {showDownvote && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              config.button,
              'rounded-l-none transition-all duration-150',
              userVote === 'down' &&
                (isPinned
                  ? getDownvoteStyle()
                  : 'text-muted-foreground bg-muted/20 hover:bg-muted/30'),
              !userVote &&
                (isPinned
                  ? actualTheme === 'dark'
                    ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
                    : 'text-accent-foreground/70 hover:text-accent-foreground hover:bg-accent-foreground/10'
                  : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted/10')
            )}
            onClick={() => handleVote('down')}
            disabled={disabled || isLoading}
          >
            <VoteArrowDown
              filled={userVote === 'down'}
              size={config.icon}
              className="transition-all duration-150"
            />
          </Button>
        )}
      </div>
    </div>
  );
};
