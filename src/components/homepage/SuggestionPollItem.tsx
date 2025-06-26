
// ABOUTME: Atomic component for displaying and voting on individual suggestions with optimistic updates.

import React from 'react';
import { ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Suggestion } from './NextEditionModule';
import { useCastVoteMutation } from '../../../packages/hooks/useCastVoteMutation';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth';

interface SuggestionPollItemProps {
  suggestion: Suggestion;
}

const SuggestionPollItem: React.FC<SuggestionPollItemProps> = ({ suggestion }) => {
  const { user } = useAuthStore();
  const mutation = useCastVoteMutation();

  const handleVote = () => {
    if (!user) {
      toast.error('Você precisa estar logado para votar');
      return;
    }

    const vote_type = suggestion.user_has_voted ? 'none' : 'up';

    // The mutation now handles optimistic updates automatically
    mutation.mutate({
      entity_id: suggestion.id.toString(), 
      vote_type, 
      entity_type: 'suggestion' 
    });
  };

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
        <span className="text-sm font-medium text-foreground min-w-[2rem] text-right">
          {suggestion.upvotes}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleVote}
          disabled={mutation.isPending}
          className={cn(
            "p-2 h-8 w-8",
            suggestion.user_has_voted && "text-green-600 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-900/30"
          )}
        >
          <ChevronUp 
            size={14} 
            className={suggestion.user_has_voted ? "text-current" : "text-muted-foreground"} 
          />
        </Button>
      </div>
    </div>
  );
};

export default SuggestionPollItem;
