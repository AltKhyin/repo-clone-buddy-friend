
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

// Reddit-style constants for logical tree structure  
const REDDIT_MAX_VISIBLE_DEPTH = 3; // Before "Ver mais respostas" button

export const CommentThread = ({ comments, rootPostId, onCommentPosted }: CommentThreadProps) => {
  const [threadState, setThreadState] = useState<RedditThreadState>({
    collapsedComments: new Set(),
    showMoreReplies: new Map(),
    isInFocusMode: false,
    navigationHistory: [],
    isTransitioning: false
  });

  // Build Reddit-style hierarchical tree with proper depth calculation
  const commentTree = useMemo(() => {
    
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
    
    return rootComments;
  }, [comments, threadState.collapsedComments]);

  // Helper function to check if a comment is descendant of another
  const isDescendantOf = (comment: CommunityPost, ancestorId: number, allComments: CommunityPost[]): boolean => {
    let current = comment;
    while (current.parent_post_id) {
      if (current.parent_post_id === ancestorId) return true;
      const parent = allComments.find(c => c.id === current.parent_post_id);
      if (!parent) break;
      current = parent;
    }
    return false;
  };

  // Build focused comment tree when in focus mode
  const focusedCommentTree = useMemo(() => {
    if (!threadState.isInFocusMode || !threadState.focusedCommentId) {
      return null;
    }
    
    // Find the focused comment in the original comments array
    const focusedComment = comments.find(c => c.id === threadState.focusedCommentId);
    if (!focusedComment) return null;
    
    // Build tree with focused comment as root
    const commentMap = new Map<number, RedditCommentTreeNode>();
    
    // Filter all comments that are part of this conversation thread
    // We need to show the focused comment AND all its descendants (any depth)
    const threadComments = comments.filter(comment => {
      // Include the focused comment itself
      if (comment.id === threadState.focusedCommentId) return true;
      // Include ALL descendants of the focused comment (no depth limit)
      return isDescendantOf(comment, threadState.focusedCommentId, comments);
    });
    
    // Create nodes for thread comments
    threadComments.forEach(comment => {
      const redditNode: RedditCommentTreeNode = { 
        ...comment, 
        replies: [],
        depth: 0, // Will be recalculated for focused view
        hasReplies: false,
        isCollapsed: false
      };
      commentMap.set(comment.id, redditNode);
    });
    
    // Build focused tree structure - focused comment becomes root (depth 0)
    const focusedRoot = commentMap.get(threadState.focusedCommentId)!;
    focusedRoot.depth = 0;
    
    // Build replies with flattened depth after limit
    const buildFocusedReplies = (parentId: number, currentDepth: number) => {
      const parentNode = commentMap.get(parentId);
      if (!parentNode) return;
      
      const directReplies = threadComments.filter(c => c.parent_post_id === parentId);
      
      directReplies.forEach(reply => {
        const replyNode = commentMap.get(reply.id)!;
        // In focus mode, flatten depth after limit but keep building the tree
        // This allows all comments to be visible but visually flattened
        replyNode.depth = Math.min(currentDepth + 1, REDDIT_MAX_VISIBLE_DEPTH);
        parentNode.replies.push(replyNode);
        parentNode.hasReplies = true;
        
        // Continue recursively building replies but pass the actual depth for tree structure
        buildFocusedReplies(reply.id, currentDepth + 1);
      });
      
      // Sort replies chronologically
      parentNode.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    };
    
    buildFocusedReplies(threadState.focusedCommentId, 0);
    
    return [focusedRoot];
  }, [comments, threadState.focusedCommentId, threadState.isInFocusMode, threadState.collapsedComments]);

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

  // Legacy deep comment functions (kept for backwards compatibility but unused)

  // Focus mode functionality - replaces section instead of inline expansion
  const enterFocusMode = (commentId: number) => {
    setThreadState(prev => ({
      ...prev,
      isTransitioning: true,
      focusedCommentId: commentId,
      navigationHistory: [...prev.navigationHistory, commentId]
    }));
    
    // Simulate microanimation timing
    setTimeout(() => {
      setThreadState(prev => ({
        ...prev,
        isInFocusMode: true,
        isTransitioning: false
      }));
    }, 150);
  };

  const exitFocusMode = () => {
    setThreadState(prev => ({
      ...prev,
      isTransitioning: true
    }));
    
    // Simulate microanimation timing  
    setTimeout(() => {
      setThreadState(prev => ({
        ...prev,
        isInFocusMode: false,
        focusedCommentId: undefined,
        navigationHistory: [],
        isTransitioning: false
      }));
    }, 150);
  };

  // Calculate total visible comments for Reddit-style counting
  const getTotalComments = (nodes: RedditCommentTreeNode[]): number => {
    return nodes.reduce((total, node) => {
      return total + 1 + (node.replies ? getTotalComments(node.replies) : 0);
    }, 0);
  };

  // Count deep replies that are hidden beyond max depth
  // This should match exactly what will be shown in focus mode
  const getDeepRepliesCount = (node: RedditCommentTreeNode): number => {
    // Find all descendants of this node in the original comments array
    const allDescendants = comments.filter(comment => 
      isDescendantOf(comment, node.id, comments)
    );
    
    // Return the count of all descendants that would be shown in focus mode
    return allDescendants.length;
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
        <div key={comment.id} className="comment-thread-item relative" data-comment-id={comment.id}>
          
          {/* Continuous nesting lines - one for each parent level */}
          {Array.from({length: depth}, (_, lineLevel) => (
            <div
              key={`line-${lineLevel}`}
              className="absolute top-0 bottom-0 w-0.5 bg-border/20 pointer-events-none"
              style={{
                left: `${lineLevel * 20 + 10}px`
              }}
            />
          ))}
          
          {/* Natural comment layout */}
          <div
            className={cn(
              "comment-with-nesting flex transition-all duration-200 relative z-10",
              isCollapsed && "opacity-50"
            )}
          >
            
            {/* Comment content */}
            <div className="comment-content flex-1">
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
                <>
                  {/* Show "Ver mais respostas" button - now triggers focus mode */}
                  <div className="deep-replies-toggle mt-2 mb-4 ml-4">
                    <Button
                      variant="link"
                      size="sm"
                      className="text-accent hover:text-accent/80 text-xs p-0 h-auto"
                      onClick={() => enterFocusMode(comment.id)}
                    >
                      Ver mais {getDeepRepliesCount(comment)} respostas
                    </Button>
                  </div>
                </>
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

  // Determine which tree to render
  const activeTree = threadState.isInFocusMode ? focusedCommentTree : commentTree;
  const showBreadcrumb = threadState.isInFocusMode;

  return (
    <div className="comment-thread space-y-1">
      {/* Breadcrumb navigation for focus mode */}
      {showBreadcrumb && (
        <div className="focus-breadcrumb mb-4 pb-2 border-b border-border/30">
          <Button
            variant="link"
            size="sm"
            className="text-muted-foreground hover:text-foreground text-xs p-0 h-auto"
            onClick={exitFocusMode}
          >
            ← Voltar aos comentários
          </Button>
          <div className="text-xs text-muted-foreground mt-1">
            Visualizando conversa focada
          </div>
        </div>
      )}

      {/* Comments container with transition support */}
      <div className={cn(
        "comments-container transition-all duration-150",
        threadState.isTransitioning && "opacity-50 scale-[0.98]"
      )}>
        {activeTree && renderRedditComments(activeTree)}
      </div>
    </div>
  );
};
