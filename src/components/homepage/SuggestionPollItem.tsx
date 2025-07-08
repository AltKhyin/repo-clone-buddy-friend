// ABOUTME: Atomic component for displaying and voting on individual suggestions with optimistic updates.

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Suggestion } from './NextEditionModule';
import { cn } from '../../lib/utils';
import { VoteButton } from '../ui/VoteButton';

interface SuggestionPollItemProps {
  suggestion: Suggestion;
}

const SuggestionPollItem: React.FC<SuggestionPollItemProps> = ({ suggestion }) => {
  return (
    <div className="flex items-start justify-between p-3 bg-surface rounded-md border border-border hover:bg-surface-muted transition-colors">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
          <AvatarImage src={suggestion.Practitioners?.avatar_url} />
          <AvatarFallback className="text-xs">
            {suggestion.Practitioners?.full_name?.charAt(0) || 'A'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground line-clamp-3 leading-relaxed">
            {suggestion.title}
          </h4>
          <p className="text-xs text-secondary mt-1">
            {suggestion.Practitioners?.full_name || 'Anônimo'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-3 mt-0.5">
        <VoteButton
          entityId={suggestion.id.toString()}
          entityType="suggestion"
          upvotes={suggestion.upvotes}
          downvotes={0}
          userVote={suggestion.user_has_voted ? 'up' : null}
          orientation="horizontal"
          size="sm"
          showDownvote={false}
        />
      </div>
    </div>
  );
};

export default SuggestionPollItem;
