// ABOUTME: Reusable Reddit-style voting component with net scoring and hollow/filled arrow states.

import React from 'react';
import { Button } from './button';
import { VoteArrowUp } from './icons/VoteArrowUp';
import { VoteArrowDown } from './icons/VoteArrowDown';
import { cn } from '../../lib/utils';
import { useCastVoteMutation } from '../../../packages/hooks/useCastVoteMutation';
import { useAuthStore } from '../../store/auth';
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
}: VoteButtonProps) => {
  const { user } = useAuthStore();
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
          userVote === 'up' && 'text-primary',
          userVote === 'down' && 'text-muted-foreground',
          !userVote && 'text-foreground'
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
            userVote === 'up' && 'text-primary bg-primary/10 hover:bg-primary/20',
            !userVote && 'text-muted-foreground hover:text-primary hover:bg-primary/10'
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
              userVote === 'down' && 'text-muted-foreground bg-muted/20 hover:bg-muted/30',
              !userVote && 'text-muted-foreground hover:text-muted-foreground hover:bg-muted/10'
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
