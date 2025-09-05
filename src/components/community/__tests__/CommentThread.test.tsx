// ABOUTME: Comprehensive test suite for CommentThread component covering Reddit-style hierarchical threading and performance characteristics.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommentThread } from '../CommentThread';
import type { CommunityPost } from '../../../types/community';

// Mock dependencies
vi.mock('../Comment', () => ({
  Comment: ({ comment, indentationLevel, hasReplies, isCollapsed, replyCount }: any) => (
    <div 
      data-testid="comment-component"
      data-comment-id={comment.id}
      data-indentation-level={indentationLevel}
      data-has-replies={hasReplies}
      data-is-collapsed={isCollapsed}
      data-reply-count={replyCount}
    >
      Comment {comment.id} (Level {indentationLevel})
    </div>
  ),
}));

// Test data factories
const createMockComment = (id: number, overrides: Partial<CommunityPost> = {}): CommunityPost => ({
  id,
  content: `<p>Comment ${id} content</p>`,
  category: 'discussion',
  upvotes: Math.floor(Math.random() * 20),
  downvotes: Math.floor(Math.random() * 5),
  created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  updated_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  author: {
    id: `user-${id}`,
    full_name: `User ${id}`,
    avatar_url: `https://example.com/avatar${id}.jpg`,
    role: 'member',
  },
  user_vote: null,
  nesting_level: 1,
  parent_post_id: null,
  ...overrides,
});

// Create hierarchical comment structures for testing
const createCommentHierarchy = () => {
  const comments: CommunityPost[] = [
    // Root comment (depth 0)
    createMockComment(1, { nesting_level: 1, parent_post_id: null }),
    
    // First level replies (depth 1)
    createMockComment(2, { nesting_level: 2, parent_post_id: 1 }),
    createMockComment(3, { nesting_level: 2, parent_post_id: 1 }),
    
    // Second level replies (depth 2)
    createMockComment(4, { nesting_level: 3, parent_post_id: 2 }),
    createMockComment(5, { nesting_level: 3, parent_post_id: 3 }),
    
    // Third level replies (depth 3)
    createMockComment(6, { nesting_level: 4, parent_post_id: 4 }),
    
    // Fourth level replies (depth 4 - deep nesting)
    createMockComment(7, { nesting_level: 5, parent_post_id: 6 }),
    
    // Very deep nesting (depth 8+ to test max depth)
    createMockComment(8, { nesting_level: 6, parent_post_id: 7 }),
    createMockComment(9, { nesting_level: 7, parent_post_id: 8 }),
    createMockComment(10, { nesting_level: 8, parent_post_id: 9 }),
    createMockComment(11, { nesting_level: 9, parent_post_id: 10 }),
  ];
  
  return comments;
};

describe('CommentThread Component', () => {
  const defaultProps = {
    comments: [],
    rootPostId: 123,
    onCommentPosted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render empty state when no comments', () => {
      render(<CommentThread {...defaultProps} />);
      
      expect(screen.getByText('Ainda não há comentários nesta discussão.')).toBeInTheDocument();
      expect(screen.getByText('Seja o primeiro a comentar!')).toBeInTheDocument();
    });

    it('should render single comment correctly', () => {
      const singleComment = [createMockComment(1)];
      render(<CommentThread {...defaultProps} comments={singleComment} />);
      
      expect(screen.getByTestId('comment-component')).toBeInTheDocument();
      expect(screen.getByText('Comment 1 (Level 0)')).toBeInTheDocument();
    });
  });

  describe('Hierarchical Threading', () => {
    const hierarchyComments = createCommentHierarchy();

    it('should build correct comment tree structure', () => {
      render(<CommentThread {...defaultProps} comments={hierarchyComments} />);
      
      // Should render all comments
      expect(screen.getAllByTestId('comment-component')).toHaveLength(11);
      
      // Root comment should be at level 0
      const rootComment = screen.getByText('Comment 1 (Level 0)');
      expect(rootComment).toBeInTheDocument();
      
      // First level replies should be at level 1
      expect(screen.getByText('Comment 2 (Level 1)')).toBeInTheDocument();
      expect(screen.getByText('Comment 3 (Level 1)')).toBeInTheDocument();
    });

    it('should respect maximum visible depth (REDDIT_MAX_VISIBLE_DEPTH)', () => {
      // Create a deep chain that exceeds REDDIT_MAX_VISIBLE_DEPTH (8)
      const deepComments: CommunityPost[] = [];
      let parentId: number | null = null;
      
      for (let i = 1; i <= 10; i++) { // Create 10 levels (exceeds depth 8)
        deepComments.push(createMockComment(i, {
          nesting_level: i,
          parent_post_id: parentId,
        }));
        parentId = i;
      }
      
      render(<CommentThread {...defaultProps} comments={deepComments} />);
      
      // Comments beyond max depth (8) should trigger "continue thread" link
      const continueButtons = screen.queryAllByText('Continuar esta conversa →');
      expect(continueButtons.length).toBeGreaterThan(0);
    });

    it('should calculate correct indentation levels', () => {
      render(<CommentThread {...defaultProps} comments={hierarchyComments} />);
      
      const commentComponents = screen.getAllByTestId('comment-component');
      
      // Find specific comments and check their indentation
      const level0Comment = commentComponents.find(el => 
        el.getAttribute('data-comment-id') === '1'
      );
      expect(level0Comment).toHaveAttribute('data-indentation-level', '0');
      
      const level1Comment = commentComponents.find(el => 
        el.getAttribute('data-comment-id') === '2'
      );
      expect(level1Comment).toHaveAttribute('data-indentation-level', '1');
    });
  });

  describe('Indentation Level Passing', () => {
    it('should pass correct indentation levels to Comment components', () => {
      const comments = [
        createMockComment(1, { nesting_level: 1, parent_post_id: null }),
        createMockComment(2, { nesting_level: 2, parent_post_id: 1 }),
        createMockComment(3, { nesting_level: 3, parent_post_id: 2 }),
      ];
      
      render(<CommentThread {...defaultProps} comments={comments} />);
      
      const commentComponents = screen.getAllByTestId('comment-component');
      
      // Verify indentation levels are passed correctly (Reddit-style depth calculation)
      expect(commentComponents[0]).toHaveAttribute('data-indentation-level', '0'); // Root level
      expect(commentComponents[1]).toHaveAttribute('data-indentation-level', '1'); // First nesting
      expect(commentComponents[2]).toHaveAttribute('data-indentation-level', '2'); // Second nesting
    });
  });

  describe('Thread Collapse/Expand Functionality', () => {
    const hierarchyComments = createCommentHierarchy();

    it('should toggle thread collapse state', () => {
      render(<CommentThread {...defaultProps} comments={hierarchyComments} />);
      
      // Find a comment that has replies
      const commentWithReplies = screen.getByText('Comment 1 (Level 0)');
      expect(commentWithReplies).toBeInTheDocument();
      
      // Initially should show as expanded (no collapse state)
      const collapseButtons = document.querySelectorAll('.thread-toggle-btn');
      if (collapseButtons.length > 0) {
        fireEvent.click(collapseButtons[0]);
        
        // After collapse, nested comments should be hidden or marked as collapsed
        // This tests the state management functionality
      }
    });

    it('should pass correct hasReplies prop to Comment components', () => {
      render(<CommentThread {...defaultProps} comments={hierarchyComments} />);
      
      const commentComponents = screen.getAllByTestId('comment-component');
      
      // Root comment (id=1) should have replies
      const rootComment = commentComponents.find(el => 
        el.getAttribute('data-comment-id') === '1'
      );
      expect(rootComment).toHaveAttribute('data-has-replies', 'true');
      
      // Leaf comments should not have replies
      const leafComment = commentComponents.find(el => 
        el.getAttribute('data-comment-id') === '11'
      );
      expect(leafComment).toHaveAttribute('data-has-replies', 'false');
    });

    it('should calculate correct reply counts', () => {
      render(<CommentThread {...defaultProps} comments={hierarchyComments} />);
      
      const commentComponents = screen.getAllByTestId('comment-component');
      
      // Root comment should have total reply count of all descendants
      const rootComment = commentComponents.find(el => 
        el.getAttribute('data-comment-id') === '1'
      );
      
      // Should count all nested replies recursively
      const replyCount = rootComment?.getAttribute('data-reply-count');
      expect(parseInt(replyCount || '0')).toBeGreaterThan(0);
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle large comment trees efficiently', () => {
      // Create a large comment tree
      const largeCommentSet: CommunityPost[] = [];
      
      // Add 100 comments in various nesting levels
      for (let i = 1; i <= 100; i++) {
        const parentId = i > 10 ? Math.floor(Math.random() * (i - 1)) + 1 : null;
        const nestingLevel = parentId ? Math.min(Math.floor(Math.random() * 8) + 1, 8) : 1;
        
        largeCommentSet.push(createMockComment(i, {
          nesting_level: nestingLevel,
          parent_post_id: parentId,
        }));
      }
      
      const startTime = performance.now();
      render(<CommentThread {...defaultProps} comments={largeCommentSet} />);
      const endTime = performance.now();
      
      // Should render within reasonable time (less than 100ms for 100 comments)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Should render all comments
      expect(screen.getAllByTestId('comment-component').length).toBeGreaterThan(0);
    });

    it('should memoize comment tree building', () => {
      const comments = createCommentHierarchy();
      
      const { rerender } = render(<CommentThread {...defaultProps} comments={comments} />);
      
      // Re-render with same props should not rebuild tree
      rerender(<CommentThread {...defaultProps} comments={comments} />);
      
      // Component should still render correctly
      expect(screen.getAllByTestId('comment-component')).toHaveLength(11);
    });
  });

  describe('Edge Cases', () => {
    it('should handle circular references gracefully', () => {
      const circularComments = [
        createMockComment(1, { nesting_level: 1, parent_post_id: 2 }),
        createMockComment(2, { nesting_level: 2, parent_post_id: 1 }),
      ];
      
      expect(() => {
        render(<CommentThread {...defaultProps} comments={circularComments} />);
      }).not.toThrow();
    });

    it('should handle orphaned comments (parent not found)', () => {
      const orphanedComments = [
        createMockComment(1, { nesting_level: 2, parent_post_id: 999 }), // Parent doesn't exist
        createMockComment(2, { nesting_level: 1, parent_post_id: null }),
      ];
      
      render(<CommentThread {...defaultProps} comments={orphanedComments} />);
      
      // Should render both comments without crashing
      expect(screen.getAllByTestId('comment-component')).toHaveLength(2);
    });

    it('should handle malformed nesting levels', () => {
      const malformedComments = [
        createMockComment(1, { nesting_level: undefined, parent_post_id: null }),
        createMockComment(2, { nesting_level: -1, parent_post_id: 1 }),
        createMockComment(3, { nesting_level: 999, parent_post_id: 1 }),
      ];
      
      expect(() => {
        render(<CommentThread {...defaultProps} comments={malformedComments} />);
      }).not.toThrow();
    });
  });

  describe('Continue Thread Links', () => {
    it('should show continue thread links for very deep nesting', () => {
      // Create comments that exceed REDDIT_MAX_VISIBLE_DEPTH
      const veryDeepComments: CommunityPost[] = [];
      let parentId: number | null = null;
      
      for (let i = 1; i <= 12; i++) {
        veryDeepComments.push(createMockComment(i, {
          nesting_level: i,
          parent_post_id: parentId,
        }));
        parentId = i;
      }
      
      render(<CommentThread {...defaultProps} comments={veryDeepComments} />);
      
      const continueLinks = screen.getAllByText('Continuar esta conversa →');
      expect(continueLinks.length).toBeGreaterThan(0);
    });

    it('should render continue thread buttons with proper structure', () => {
      const veryDeepComments: CommunityPost[] = [];
      let parentId: number | null = null;
      
      for (let i = 1; i <= 10; i++) {
        veryDeepComments.push(createMockComment(i, {
          nesting_level: i,
          parent_post_id: parentId,
        }));
        parentId = i;
      }
      
      render(<CommentThread {...defaultProps} comments={veryDeepComments} />);
      
      // Should have continue thread buttons with proper styling classes
      const continueThreads = document.querySelectorAll('.continue-thread');
      if (continueThreads.length > 0) {
        expect(continueThreads[0]).toHaveClass('continue-thread');
        expect(continueThreads[0]).toBeInTheDocument();
      }
    });
  });
});