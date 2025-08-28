
// ABOUTME: Reddit-style comment threading with exact visual hierarchy, proper terminology, and optimized performance.

import React, { useState, useMemo } from 'react';
import { Comment } from './Comment';
import { Button } from '../ui/button';
import { ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CommunityPost, RedditCommentTreeNode, RedditThreadState } from '../../types/community';

interface CommentThreadProps {
  comments: CommunityPost[];
  rootPostId: number;
  onCommentPosted: () => void;
}

// Reddit-style constants for exact visual matching
const REDDIT_INDENT_WIDTH = 12; // pixels per depth level (Reddit's standard)
const REDDIT_MAX_VISIBLE_DEPTH = 8; // Before "Continue this thread" link
// Use CSS custom property instead of hardcoded color for theme consistency

export const CommentThread = ({ comments, rootPostId, onCommentPosted }: CommentThreadProps) => {
  const [threadState, setThreadState] = useState<RedditThreadState>({
    collapsedComments: new Set(),
    showMoreReplies: new Map()
  });

  // Build Reddit-style hierarchical tree with proper depth calculation
  const commentTree = useMemo(() => {
    console.log('Building Reddit-style comment tree from comments:', comments);
    
    const commentMap = new Map<number, RedditCommentTreeNode>();
    const rootComments: RedditCommentTreeNode[] = [];

    // First pass: Create Reddit-style comment tree nodes
    comments.forEach(comment => {
      const redditNode: RedditCommentTreeNode = { 
        ...comment, 
        replies: [],
        depth: 0,
        hasReplies: false,
        isCollapsed: false // Will be set in rendering logic
      };
      commentMap.set(comment.id, redditNode);
    });

    // Second pass: Build Reddit-style tree structure with proper depth
    // Sort by nesting_level to ensure parents are processed before children
    const sortedComments = [...comments].sort((a, b) => (a.nesting_level || 0) - (b.nesting_level || 0));
    
    sortedComments.forEach(comment => {
      const redditNode = commentMap.get(comment.id)!;
      
      // Find parent comment for Reddit-style threading
      const parentComment = comment.parent_post_id ? commentMap.get(comment.parent_post_id) : null;
      
      if (parentComment) {
        // Reply to another comment - calculate Reddit-style depth
        redditNode.depth = Math.min(parentComment.depth + 1, REDDIT_MAX_VISIBLE_DEPTH);
        redditNode.nesting_level = comment.nesting_level || (parentComment.nesting_level || 0) + 1;
        parentComment.replies.push(redditNode);
        parentComment.hasReplies = true;
      } else {
        // Top-level comment (direct reply to main post)
        redditNode.depth = 0;
        redditNode.nesting_level = comment.nesting_level || 1;
        rootComments.push(redditNode);
      }
    });
    
    // Sort root comments chronologically (Reddit-style)
    rootComments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    console.log('Built Reddit-style tree:', { rootComments: rootComments.length, totalComments: comments.length });
    return rootComments;
  }, [comments, threadState.collapsedComments]);

  // Reddit-style thread collapse/expand functionality
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

  // Calculate total visible comments for Reddit-style counting
  const getTotalComments = (nodes: RedditCommentTreeNode[]): number => {
    return nodes.reduce((total, node) => {
      return total + 1 + (node.replies ? getTotalComments(node.replies) : 0);
    }, 0);
  };

  // Reddit-style comment rendering with exact visual hierarchy
  const renderRedditComments = (
    commentsToRender: RedditCommentTreeNode[],
    depth: number = 0
  ): React.ReactNode => {
    return commentsToRender.map((comment, index) => {
      const isCollapsed = isThreadCollapsed(comment.id);
      const replyCount = getTotalComments(comment.replies);
      
      
      return (
        <div key={comment.id} className="comment-thread-item">
          
          {/* Natural comment layout with collapse button and nesting indicators */}
          <div
            className={cn(
              "comment-with-nesting flex transition-all duration-200",
              isCollapsed && "opacity-50"
            )}
            style={{
              marginLeft: `${depth * REDDIT_INDENT_WIDTH}px`
            }}
          >
            
            {/* Comment content with depth-aware styling */}
            <div
              className={cn(
                "comment-content flex-1",
                depth > 0 && "border-l border-border/20 pl-3", // Subtle left border for nested comments
                depth > 2 && "border-l-2", // Stronger border for deeper nesting
                depth > 4 && "bg-surface-muted/30 rounded-r-md" // Background for very deep nesting
              )}
            >
              <Comment
                comment={comment}
                indentationLevel={depth}
                rootPostId={rootPostId}
                onCommentPosted={onCommentPosted}
                hasReplies={comment.hasReplies}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => toggleThread(comment.id)}
                replyCount={replyCount}
              />

            </div>
          </div>

          {/* Nested replies */}
          {!isCollapsed && comment.replies && comment.replies.length > 0 && (
            <div className="nested-replies">
              {comment.depth < REDDIT_MAX_VISIBLE_DEPTH ? (
                renderRedditComments(comment.replies, depth + 1)
              ) : (
                <div 
                  className="continue-thread mt-2 mb-4"
                  style={{ marginLeft: `${(depth + 1) * REDDIT_INDENT_WIDTH + 24}px` }}
                >
                  <Button
                    variant="link"
                    size="sm"
                    className="text-accent hover:text-accent/80 text-xs p-0 h-auto"
                    onClick={() => console.log('Navigate to comment permalink')}
                  >
                    Continuar esta conversa →
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  // Reddit-style empty state
  if (comments.length === 0) {
    return (
      <div className="reddit-empty-state text-center py-12 text-muted-foreground">
        <div className="space-y-2">
          <p className="text-base">Ainda não há comentários nesta discussão.</p>
          <p className="text-sm">Seja o primeiro a comentar!</p>
        </div>
      </div>
    );
  }

  const totalComments = getTotalComments(commentTree);
  const collapsedCount = threadState.collapsedComments.size;

  return (
    <div className="reddit-comment-thread space-y-1">
      {/* Reddit-style thread header with proper terminology */}
      <div className="reddit-thread-header flex items-center justify-between mb-4 pb-2 border-b border-border/20">
        <div className="text-sm text-muted-foreground font-medium">
          {totalComments} {totalComments === 1 ? 'comentário' : 'comentários'}
          {collapsedCount > 0 && (
            <span className="ml-2 text-accent">
              ({collapsedCount} {collapsedCount === 1 ? 'thread oculta' : 'threads ocultas'})
            </span>
          )}
        </div>
        
        {collapsedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="reddit-expand-all text-xs h-7 px-3"
            onClick={() => setThreadState({
              collapsedComments: new Set(),
              showMoreReplies: new Map()
            })}
          >
            Expandir todas
          </Button>
        )}
      </div>

      {/* Reddit-style comment tree */}
      <div className="reddit-comments-container">
        {renderRedditComments(commentTree)}
      </div>
    </div>
  );
};
