
// ABOUTME: Core UI component for displaying a single comment with nesting support and reward badges.

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CommentEditor } from './CommentEditor';
import { PostActionMenu } from './PostActionMenu';
import { ChevronUp, ChevronDown, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { CommunityPost } from '../../types/community';
import { useCastCommunityVoteMutation } from '../../../packages/hooks/useCastCommunityVoteMutation';
import { useAuthStore } from '../../store/auth';

interface CommentProps {
  comment: CommunityPost;
  indentationLevel: number;
  onCommentPosted: () => void;
}

export const Comment = ({ comment, indentationLevel, onCommentPosted }: CommentProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const { user } = useAuthStore();
  const castVoteMutation = useCastCommunityVoteMutation();

  // Calculate left margin for nesting effect (max 6 levels to prevent UI overflow)
  const effectiveLevel = Math.min(indentationLevel, 6);
  const indentationStyle = { marginLeft: `${effectiveLevel * 1.5}rem` };

  const handleReplyPosted = () => {
    setIsReplying(false);
    onCommentPosted();
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) {
      toast.error('Você precisa estar logado para votar');
      return;
    }

    const newVoteType = comment.user_vote === voteType ? null : voteType;

    try {
      await castVoteMutation.mutateAsync({
        postId: comment.id,
        voteType: newVoteType
      });
    } catch (error) {
      toast.error('Erro ao votar. Tente novamente.');
    }
  };

  return (
    <div className="flex gap-3 mt-4" style={indentationStyle}>
      {/* Vertical connector line for nested comments */}
      {indentationLevel > 0 && (
        <div className="flex flex-col items-center">
          <div className="w-0.5 bg-border flex-grow min-h-[60px]"></div>
        </div>
      )}

      <div className="flex-1">
        <div className={cn(
          "p-3 transition-colors hover:bg-surface/20",
          comment.is_rewarded && "border-l-2 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20"
        )}>
          {/* Comment Header */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={comment.author?.avatar_url || ''} />
                <AvatarFallback>{comment.author?.full_name?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{comment.author?.full_name}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}</span>
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
            className="prose dark:prose-invert prose-sm max-w-none mb-3"
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
                  comment.user_vote === 'up' && "text-green-600 bg-green-50 hover:bg-green-100"
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
                  comment.user_vote === 'down' && "text-red-600 bg-red-50 hover:bg-red-100"
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
        
        {/* Reply Editor */}
        {isReplying && (
          <div className="mt-2 ml-4">
            <CommentEditor
              parentPostId={comment.id}
              onCommentPosted={handleReplyPosted}
            />
          </div>
        )}
      </div>
    </div>
  );
};
