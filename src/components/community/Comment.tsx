
// ABOUTME: Core UI component for displaying a single comment with nesting support and reward badges.

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MinimalCommentInput } from './MinimalCommentInput';
import { PostActionMenu } from './PostActionMenu';
import { ChevronUp, ChevronDown, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { CommunityPost } from '../../types/community';
import { useCastVoteMutation } from '../../../packages/hooks/useCastVoteMutation';
import { useAuthStore } from '../../store/auth';

interface CommentProps {
  comment: CommunityPost;
  indentationLevel: number;
  onCommentPosted: () => void;
}

// Safe date formatting helper
const formatCommentDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    console.warn('Comment: Missing or null date value:', dateString);
    return 'Data indisponível';
  }

  try {
    // Try parsing as ISO string first
    let date = parseISO(dateString);
    
    // If not valid, try as direct Date constructor
    if (!isValid(date)) {
      date = new Date(dateString);
    }
    
    // Final validation
    if (!isValid(date)) {
      console.error('Comment: Invalid date after parsing:', dateString);
      return 'Data inválida';
    }
    
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: ptBR
    });
  } catch (error) {
    console.error('Comment: Date formatting error:', error, 'for date:', dateString);
    return 'Data inválida';
  }
};

export const Comment = ({ comment, indentationLevel, onCommentPosted }: CommentProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const { user } = useAuthStore();
  const castVoteMutation = useCastVoteMutation();

  // Calculate left margin for nesting effect (max 6 levels to prevent UI overflow)
  const effectiveLevel = Math.min(indentationLevel, 6);
  const indentationStyle = { marginLeft: `${effectiveLevel * 1.5}rem` };

  const handleReplyPosted = () => {
    setIsReplying(false);
    onCommentPosted();
  };

  const handleVote = (voteType: 'up' | 'down') => {
    if (!user) {
      toast.error('Você precisa estar logado para votar');
      return;
    }

    const newVoteType = comment.user_vote === voteType ? null : voteType;

    // The mutation now handles optimistic updates and error handling automatically
    castVoteMutation.mutate({
      entity_id: comment.id.toString(),
      vote_type: newVoteType || 'none',
      entity_type: 'community_post'
    });
  };

  return (
    <div className="flex gap-2 mt-3" style={indentationStyle}>
      {/* Vertical connector line for nested comments */}
      {indentationLevel > 0 && (
        <div className="flex flex-col items-center">
          <div className="w-0.5 bg-border flex-grow min-h-[60px]"></div>
        </div>
      )}

      <div className="flex-1">
        <div className={cn(
          "p-2 transition-colors hover:bg-surface/20",
          comment.is_rewarded && "border-l-2 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20"
        )}>
          {/* Comment Header */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={comment.author?.avatar_url || ''} />
                <AvatarFallback>{comment.author?.full_name?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{comment.author?.full_name}</span>
              <span>•</span>
              <span>{formatCommentDate(comment.created_at)}</span>
              {comment.is_rewarded && (
                <Badge variant="secondary" className="text-yellow-600 border-yellow-500/50 bg-yellow-100 dark:bg-yellow-900/30">
                  <Award className="w-3 h-3 mr-1" />
                  Recompensa
                </Badge>
              )}
            </div>
            <PostActionMenu post={comment} />
          </div>

          {/* Comment Body */}
          <div
            className="prose dark:prose-invert prose-sm max-w-none mb-2"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />

          {/* Comment Actions - Reddit Style Bottom Row */}
          <div className="flex items-center gap-1 text-muted-foreground">
            {/* Vote Section */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-2 text-xs hover:bg-surface-muted/50",
                  comment.user_vote === 'up' && "text-green-600 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                )}
                onClick={() => handleVote('up')}
                disabled={castVoteMutation.isPending}
              >
                <ChevronUp className="w-4 h-4 mr-1" />
                {comment.upvotes || 0}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-2 text-xs hover:bg-surface-muted/50",
                  comment.user_vote === 'down' && "text-red-600 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                )}
                onClick={() => handleVote('down')}
                disabled={castVoteMutation.isPending}
              >
                <ChevronDown className="w-4 h-4 mr-1" />
                {comment.downvotes || 0}
              </Button>
            </div>

            {/* Reply Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsReplying(!isReplying)}
              className="h-8 px-2 text-xs hover:bg-surface-muted/50"
            >
              {isReplying ? 'Cancelar' : 'Responder'}
            </Button>
          </div>
        </div>
        
        {/* Reply Input */}
        {isReplying && (
          <div className="mt-2 ml-4">
            <MinimalCommentInput
              parentPostId={comment.id}
              onCommentPosted={handleReplyPosted}
              placeholder="Reply to this comment"
            />
          </div>
        )}
      </div>
    </div>
  );
};
