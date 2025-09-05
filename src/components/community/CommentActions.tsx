// ABOUTME: Essential comment actions component focusing only on nesting-related functionality

import React from 'react';
import { Button } from '@/components/ui/button';
import { VoteButton } from '@/components/ui/VoteButton';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '../../hooks/use-mobile';
import type { CommunityPost } from '../../types/community';

export interface CommentActionsProps {
  comment: CommunityPost;
  
  // Reply functionality
  isReplying: boolean;
  onToggleReply: () => void;
  
  // Thread collapse functionality (nesting-related)
  hasReplies?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  replyCount?: number;
  
  // Layout options
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

// Responsive sizing: WCAG-compliant mobile (44px) vs refined desktop (32px)
const getMobileSizeConfig = () => ({
  xs: {
    button: 'min-h-[44px] px-2 text-xs', // WCAG mobile: 44px minimum
    icon: 'w-4 h-4',
  },
  sm: {
    button: 'min-h-[44px] px-3 text-xs', // WCAG mobile: 44px minimum
    icon: 'w-4 h-4',
  },
  md: {
    button: 'min-h-[44px] px-4 text-sm', // WCAG mobile: 44px minimum
    icon: 'w-5 h-5',
  },
} as const);

const getDesktopSizeConfig = () => ({
  xs: {
    button: 'min-h-[32px] px-2 text-xs', // Desktop: refined sizing
    icon: 'w-3.5 h-3.5',
  },
  sm: {
    button: 'min-h-[32px] px-3 text-xs', // Desktop: refined sizing
    icon: 'w-3.5 h-3.5',
  },
  md: {
    button: 'min-h-[32px] px-4 text-sm', // Desktop: refined sizing
    icon: 'w-4 h-4',
  },
} as const);

export function CommentActions({
  comment,
  isReplying,
  onToggleReply,
  hasReplies = false,
  isCollapsed = false,
  onToggleCollapse,
  replyCount = 0,
  size = 'sm',
  className,
}: CommentActionsProps) {
  const isMobile = useIsMobile();
  const sizeConfig = isMobile 
    ? getMobileSizeConfig()[size]
    : getDesktopSizeConfig()[size];

  return (
    <div className={cn(
      "comment-actions flex items-center gap-1 text-muted-foreground",
      className
    )}>
      {/* Vote controls */}
      <VoteButton
        entityId={comment.id.toString()}
        entityType="community_post"
        upvotes={comment.upvotes || 0}
        downvotes={comment.downvotes || 0}
        userVote={comment.user_vote}
        orientation="horizontal"
        size={size}
      />

      {/* Reply action */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleReply}
        className={cn(
          "reply-btn hover:bg-action-hover hover:text-accent transition-colors",
          sizeConfig.button
        )}
      >
        {isReplying ? 'Cancelar' : 'Responder'}
      </Button>

      {/* Thread collapse/expand control (chevron icons) */}
      {hasReplies && onToggleCollapse && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            "thread-toggle-btn hover:bg-action-hover hover:text-accent transition-all duration-150 flex items-center gap-1",
            sizeConfig.button
          )}
          title={isCollapsed ? `Mostrar ${replyCount} respostas` : 'Ocultar respostas'}
        >
          {isCollapsed ? (
            <>
              <ChevronRight className={cn(sizeConfig.icon)} strokeWidth={2} />
              <span className="font-medium">{replyCount}</span>
            </>
          ) : (
            <ChevronDown className={cn(sizeConfig.icon)} strokeWidth={2} />
          )}
        </Button>
      )}
    </div>
  );
}