
// ABOUTME: Enhanced comment tree with Reddit-style expand/collapse threading and visual hierarchy.

import React, { useState, useMemo } from 'react';
import { Comment } from './Comment';
import { Button } from '../ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CommunityPost } from '../../types/community';

interface CommentThreadProps {
  comments: CommunityPost[];
  onCommentPosted: () => void;
}

// Enhanced comment type with replies and thread state
type EnhancedComment = CommunityPost & { 
  replies: EnhancedComment[];
  depth: number;
  hasReplies: boolean;
};

interface ThreadState {
  collapsedComments: Set<number>;
  expandedPaths: Map<number, boolean>;
}

export const CommentThread = ({ comments, onCommentPosted }: CommentThreadProps) => {
  const [threadState, setThreadState] = useState<ThreadState>({
    collapsedComments: new Set(),
    expandedPaths: new Map()
  });

  // Build hierarchical tree from flat list with depth tracking
  const commentTree = useMemo(() => {
    const commentMap = new Map<number, EnhancedComment>();
    const rootComments: EnhancedComment[] = [];

    // First pass: Create enhanced comment objects
    comments.forEach(comment => {
      commentMap.set(comment.id, { 
        ...comment, 
        replies: [],
        depth: 0,
        hasReplies: false
      });
    });

    // Second pass: Build tree structure and calculate depth
    comments.forEach(comment => {
      const enhancedComment = commentMap.get(comment.id)!;
      
      if (comment.parent_post_id && commentMap.has(comment.parent_post_id)) {
        // This is a reply to another comment
        const parentComment = commentMap.get(comment.parent_post_id)!;
        enhancedComment.depth = parentComment.depth + 1;
        parentComment.replies.push(enhancedComment);
        parentComment.hasReplies = true;
      } else {
        // This is a top-level comment
        rootComments.push(enhancedComment);
      }
    });

    return rootComments;
  }, [comments]);

  const toggleThread = (commentId: number) => {
    setThreadState(prev => {
      const newCollapsed = new Set(prev.collapsedComments);
      
      if (newCollapsed.has(commentId)) {
        newCollapsed.delete(commentId);
      } else {
        newCollapsed.add(commentId);
      }
      
      return {
        ...prev,
        collapsedComments: newCollapsed
      };
    });
  };

  const isThreadCollapsed = (commentId: number) => {
    return threadState.collapsedComments.has(commentId);
  };

  // Recursive function to render comments with threading lines
  const renderComments = (
    commentsToRender: EnhancedComment[],
    level: number = 0
  ): React.ReactNode => {
    return commentsToRender.map((comment, index) => {
      const isCollapsed = isThreadCollapsed(comment.id);
      const isLastInLevel = index === commentsToRender.length - 1;
      
      return (
        <div key={comment.id} className="relative">
          {/* Threading line - only show for nested comments */}
          {level > 0 && (
            <div 
              className={cn(
                "absolute left-0 top-0 bottom-0 w-0.5 bg-border/30",
                "hover:bg-border/50 transition-colors duration-150"
              )}
              style={{ left: `${(level - 1) * 24 + 12}px` }}
            />
          )}
          
          {/* Thread toggle button for comments with replies */}
          {comment.hasReplies && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "absolute z-10 w-4 h-4 p-0 bg-background border border-border rounded-sm",
                "hover:bg-surface-muted hover:border-border-hover transition-colors duration-150",
                "flex items-center justify-center"
              )}
              style={{ 
                left: `${level * 24 + 4}px`,
                top: '12px'
              }}
              onClick={() => toggleThread(comment.id)}
            >
              {isCollapsed ? (
                <ChevronRight className="w-2.5 h-2.5" />
              ) : (
                <ChevronDown className="w-2.5 h-2.5" />
              )}
            </Button>
          )}

          {/* Comment content with proper indentation */}
          <div 
            className={cn(
              "transition-all duration-200",
              isCollapsed && "opacity-60"
            )}
            style={{ 
              marginLeft: `${level * 24}px`,
              paddingLeft: level > 0 ? '16px' : '0'
            }}
          >
            <Comment 
              comment={comment} 
              indentationLevel={level}
              onCommentPosted={onCommentPosted}
            />
            
            {/* Collapsed thread indicator */}
            {isCollapsed && comment.replies.length > 0 && (
              <div className="ml-4 mt-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => toggleThread(comment.id)}
                >
                  [{comment.replies.length} {comment.replies.length === 1 ? 'resposta oculta' : 'respostas ocultas'}]
                </Button>
              </div>
            )}
          </div>

          {/* Render nested replies if not collapsed */}
          {!isCollapsed && comment.replies && comment.replies.length > 0 && (
            <div className="relative">
              {renderComments(comment.replies, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="space-y-2">
          <p className="text-base">Ainda não há comentários nesta discussão.</p>
          <p className="text-sm">Seja o primeiro a comentar!</p>
        </div>
      </div>
    );
  }

  const totalComments = comments.length;
  const collapsedCount = threadState.collapsedComments.size;

  return (
    <div className="space-y-1">
      {/* Thread stats */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/30">
        <div className="text-sm text-muted-foreground">
          {totalComments} {totalComments === 1 ? 'comentário' : 'comentários'}
          {collapsedCount > 0 && (
            <span className="ml-2">
              ({collapsedCount} {collapsedCount === 1 ? 'thread oculta' : 'threads ocultas'})
            </span>
          )}
        </div>
        
        {collapsedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setThreadState({ 
              collapsedComments: new Set(),
              expandedPaths: new Map()
            })}
          >
            Expandir todas
          </Button>
        )}
      </div>

      {/* Comment tree */}
      <div className="reddit-comment-thread">
        {renderComments(commentTree)}
      </div>
    </div>
  );
};
