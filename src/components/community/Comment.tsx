// ABOUTME: Reddit-style individual comment component with exact visual hierarchy and proper terminology.

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MinimalCommentInput } from './MinimalCommentInput';
import { PostActionMenu } from './PostActionMenu';
import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommunityPost } from '../../types/community';
import { CommentAuthor } from './CommunityAuthor';
import { CommentActions } from './CommentActions';

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

  // Simplified indentation for continuous nesting line system
  const nestingDepth = indentationLevel;
  const isNested = nestingDepth > 0;
  const lineSpacing = 20; // Space per nesting level
  const totalIndentation = nestingDepth * lineSpacing;

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
        "natural-comment flex gap-2 mt-1 transition-all duration-200 relative",
        isOptimistic && "opacity-70 animate-pulse",
        isLoading && "bg-blue-50/30 rounded-md p-1"
      )}
      style={{
        paddingLeft: `${totalIndentation}px`
      }}
    >
      <div className="flex-1 comment-body">
        <div
          className={cn(
            'comment-container p-2 rounded-sm transition-colors',
            'hover:bg-surface-hover',
            comment.is_rewarded &&
              'border-l-2 border-accent bg-accent/10'
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
            className="reddit-comment-text max-w-none mb-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: comment.content.replace(/\n/g, '<br>') }}
          />

          {/* Essential comment actions */}
          <CommentActions
            comment={comment}
            isReplying={isReplying}
            onToggleReply={() => setIsReplying(!isReplying)}
            hasReplies={hasReplies}
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            replyCount={replyCount}
            size="sm"
            className="text-xs"
          />
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
