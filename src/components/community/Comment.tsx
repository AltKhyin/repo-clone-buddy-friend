// ABOUTME: Reddit-style individual comment component with exact visual hierarchy and proper terminology.

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MinimalCommentInput } from './MinimalCommentInput';
import { PostActionMenu } from './PostActionMenu';
import { Award, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommunityPost } from '../../types/community';
import { VoteButton } from '../ui/VoteButton';
import { CommentAuthor } from './CommunityAuthor';

interface CommentProps {
  comment: CommunityPost;
  indentationLevel: number;  // Represents nesting depth
  rootPostId: number;
  onCommentPosted: () => void;
  // Collapse/expand functionality
  hasReplies?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  replyCount?: number;
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
      locale: ptBR,
    });
  } catch (error) {
    console.error('Comment: Date formatting error:', error, 'for date:', dateString);
    return 'Data inválida';
  }
};

export const Comment = ({
  comment,
  indentationLevel,
  rootPostId,
  onCommentPosted,
  hasReplies = false,
  isCollapsed = false,
  onToggleCollapse,
  replyCount = 0,
}: CommentProps) => {
  const [isReplying, setIsReplying] = useState(false);

  // Natural depth handling with visual awareness
  const nestingDepth = indentationLevel;
  const isDeepNested = nestingDepth > 3;
  const isNested = nestingDepth > 0;

  const handleReplyPosted = () => {
    setIsReplying(false);
    onCommentPosted();
  };

  // Handle optimistic update visual feedback
  const isOptimistic = comment._isOptimistic;
  const isLoading = comment._isLoading;

  return (
    <div 
      className={cn(
        "natural-comment flex gap-2 mt-2 transition-all duration-200",
        isOptimistic && "opacity-70 animate-pulse",
        isLoading && "bg-blue-50/30 rounded-md p-1",
        isDeepNested && "text-sm", // Slightly smaller text for deeply nested comments
        isNested && "mt-1" // Tighter spacing for nested comments
      )}
    >
      {/* Natural comment content with nesting awareness */}
      <div className="flex-1 comment-body">
        <div
          className={cn(
            'comment-container p-2 rounded-sm transition-colors',
            'hover:bg-surface-hover',
            comment.is_rewarded &&
              'border-l-2 border-accent bg-accent/10',
            isDeepNested && "p-1.5", // Slightly tighter padding for deep comments
          )}
        >
          {/* Comment header with collapse control */}
          <div className="comment-header flex items-center justify-between text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-2">
              <CommentAuthor
                author={comment.author}
                size="sm"
                showTimestamp={true}
                timestamp={isLoading ? 'Enviando...' : formatCommentDate(comment.created_at)}
                className="flex-1"
              />
              
              {/* Thread collapse/expand control */}
              {hasReplies && onToggleCollapse && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleCollapse}
                  className={cn(
                    "thread-toggle-btn h-6 px-1.5 rounded-md",
                    "hover:bg-surface-hover text-muted-foreground hover:text-foreground",
                    "flex items-center gap-1 transition-all duration-150",
                    "border border-transparent hover:border-border/40"
                  )}
                  title={isCollapsed ? `Mostrar ${replyCount} respostas` : 'Ocultar respostas'}
                >
                  {isCollapsed ? (
                    <>
                      <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
                      <span className="text-xs font-medium">{replyCount}</span>
                    </>
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
                  )}
                </Button>
              )}
              
              {comment.is_rewarded && (
                <Badge
                  variant="secondary"
                  className="reward-badge text-accent border-accent/60 bg-accent/20 text-xs px-1.5 py-0.5"
                >
                  <Award className="w-3 h-3 mr-1" />
                  Recompensa
                </Badge>
              )}
            </div>
            <PostActionMenu post={comment} />
          </div>

          {/* Reddit-style comment body */}
          <div
            className="reddit-comment-text max-w-none mb-3 text-sm leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />

          {/* Natural action bar */}
          <div className="comment-actions flex items-center gap-1 text-muted-foreground text-xs">
            {/* Horizontal vote controls */}
            <VoteButton
              entityId={comment.id.toString()}
              entityType="community_post"
              upvotes={comment.upvotes || 0}
              downvotes={comment.downvotes || 0}
              userVote={comment.user_vote}
              orientation="horizontal"
              size={isDeepNested ? "xs" : "sm"}
            />

            {/* Reply button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying(!isReplying)}
              className={cn(
                "reply-btn h-7 px-2 text-xs hover:bg-action-hover hover:text-accent transition-colors",
                isDeepNested && "h-6 px-1.5" // Smaller for deep comments
              )}
            >
              {isReplying ? 'Cancelar' : 'Responder'}
            </Button>

          </div>
        </div>

        {/* Natural reply input */}
        {isReplying && (
          <div className="reply-input mt-3">
            <MinimalCommentInput
              parentPostId={comment.id}
              rootPostId={rootPostId}
              onCommentPosted={handleReplyPosted}
              placeholder="Responder a este comentário..."
            />
          </div>
        )}
      </div>
    </div>
  );
};
