// ABOUTME: Performance benchmark tests for comment system to track rendering efficiency and responsiveness.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Comment } from '../Comment';
import { CommentThread } from '../CommentThread';
import type { CommunityPost } from '../../../types/community';

// Mock dependencies with performance tracking
vi.mock('../../../hooks/useColorTokens');

let renderCount = 0;
vi.mock('../MinimalCommentInput', () => ({
  MinimalCommentInput: (props: any) => {
    renderCount++;
    return <div data-testid="minimal-comment-input" data-render-count={renderCount}>Comment Input</div>;
  },
}));

vi.mock('./PostActionMenu', () => ({
  PostActionMenu: () => <button data-testid="post-action-menu">Menu</button>,
}));

vi.mock('../ui/VoteButton', () => ({
  VoteButton: ({ upvotes, downvotes }: any) => (
    <div data-testid="vote-button" data-upvotes={upvotes} data-downvotes={downvotes}>
      Vote Button
    </div>
  ),
}));

vi.mock('./CommunityAuthor', () => ({
  CommentAuthor: ({ author }: any) => (
    <div data-testid="comment-author">{author.full_name}</div>
  ),
}));

// Performance measurement utilities
interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryDelta: number;
  interactionTime?: number;
}

const measurePerformance = (operation: () => void): PerformanceMetrics => {
  // Measure memory before
  const memoryBefore = (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
  
  // Measure render time
  const startTime = performance.now();
  operation();
  const endTime = performance.now();
  
  // Measure memory after
  const memoryAfter = (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
  
  return {
    renderTime: endTime - startTime,
    componentCount: document.querySelectorAll('[data-testid]').length,
    memoryBefore,
    memoryAfter,
    memoryDelta: memoryAfter - memoryBefore,
  };
};

const measureInteractionTime = (interaction: () => void): number => {
  const startTime = performance.now();
  interaction();
  const endTime = performance.now();
  return endTime - startTime;
};

// Test data generators for performance testing
const generateCommentTree = (depth: number, childrenPerLevel: number = 3): CommunityPost[] => {
  const comments: CommunityPost[] = [];
  let id = 1;
  
  const createComment = (parentId: number | null, level: number): number => {
    const commentId = id++;
    comments.push({
      id: commentId,
      content: `<p>Comment ${commentId} at level ${level} with moderate content length to simulate real comments</p>`,
      category: 'discussion',
      upvotes: Math.floor(Math.random() * 50),
      downvotes: Math.floor(Math.random() * 10),
      created_at: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
      author: {
        id: `user-${commentId}`,
        full_name: `User ${commentId}`,
        avatar_url: `https://example.com/avatar${commentId}.jpg`,
        role: 'member',
        profession: `Profession ${commentId % 10}`,
      },
      user_vote: null,
      nesting_level: level,
      parent_post_id: parentId,
      is_rewarded: Math.random() > 0.9, // 10% chance of being rewarded
    });
    
    // Create children if not at max depth
    if (level < depth) {
      for (let i = 0; i < childrenPerLevel; i++) {
        createComment(commentId, level + 1);
      }
    }
    
    return commentId;
  };
  
  // Create root comments
  const rootCount = Math.max(1, Math.floor(childrenPerLevel / 2));
  for (let i = 0; i < rootCount; i++) {
    createComment(null, 1);
  }
  
  return comments;
};

const generateLargeCommentSet = (count: number): CommunityPost[] => {
  const comments: CommunityPost[] = [];
  
  for (let i = 1; i <= count; i++) {
    const parentId = i > 10 ? Math.floor(Math.random() * (i - 1)) + 1 : null;
    const nestingLevel = parentId ? Math.min(Math.floor(Math.random() * 8) + 1, 8) : 1;
    
    comments.push({
      id: i,
      content: `<p>Comment ${i} content with realistic length and some <strong>formatting</strong> to simulate real usage patterns.</p>`,
      category: 'discussion',
      upvotes: Math.floor(Math.random() * 100),
      downvotes: Math.floor(Math.random() * 20),
      created_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      author: {
        id: `user-${i}`,
        full_name: `User ${i}`,
        avatar_url: `https://example.com/avatar${i}.jpg`,
        role: i % 20 === 0 ? 'moderator' : 'member',
        profession: `Profession ${i % 15}`,
      },
      user_vote: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'up' : 'down') : null,
      nesting_level: nestingLevel,
      parent_post_id: parentId,
      is_rewarded: Math.random() > 0.95,
    });
  }
  
  return comments;
};

describe('Comment System Performance Benchmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renderCount = 0;
    
    // Clear any existing DOM
    document.body.innerHTML = '';
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  describe('Single Comment Performance', () => {
    it('should render single comment efficiently', () => {
      const comment = generateCommentTree(1, 0)[0]; // Single comment, no children
      
      const metrics = measurePerformance(() => {
        render(<Comment 
          comment={comment}
          indentationLevel={0}
          rootPostId={123}
          onCommentPosted={vi.fn()}
        />);
      });
      
      expect(metrics.renderTime).toBeLessThan(10); // Should render in under 10ms
      expect(metrics.componentCount).toBeGreaterThan(0);
      
      console.log(`Single comment render: ${metrics.renderTime.toFixed(2)}ms`);
    });

    it('should handle comment interactions responsively', () => {
      const comment = generateCommentTree(1, 0)[0];
      const onCommentPosted = vi.fn();
      
      render(<Comment 
        comment={comment}
        indentationLevel={0}
        rootPostId={123}
        onCommentPosted={onCommentPosted}
      />);
      
      const replyButton = screen.getByRole('button', { name: /responder/i });
      
      const interactionTime = measureInteractionTime(() => {
        fireEvent.click(replyButton);
      });
      
      expect(interactionTime).toBeLessThan(5); // Should respond in under 5ms
      expect(screen.getByTestId('minimal-comment-input')).toBeInTheDocument();
      
      console.log(`Reply button interaction: ${interactionTime.toFixed(2)}ms`);
    });
  });

  describe('Comment Thread Performance', () => {
    it('should render shallow comment tree efficiently (depth 3)', () => {
      const comments = generateCommentTree(3, 2); // Depth 3, 2 children per level
      
      const metrics = measurePerformance(() => {
        render(<CommentThread 
          comments={comments}
          rootPostId={123}
          onCommentPosted={vi.fn()}
        />);
      });
      
      expect(metrics.renderTime).toBeLessThan(50); // Should render in under 50ms
      expect(comments.length).toBeGreaterThan(5); // Should have multiple comments
      
      console.log(`Shallow tree (${comments.length} comments): ${metrics.renderTime.toFixed(2)}ms`);
    });

    it('should render deep comment tree efficiently (depth 6)', () => {
      const comments = generateCommentTree(6, 2); // Depth 6, 2 children per level
      
      const metrics = measurePerformance(() => {
        render(<CommentThread 
          comments={comments}
          rootPostId={123}
          onCommentPosted={vi.fn()}
        />);
      });
      
      expect(metrics.renderTime).toBeLessThan(100); // Should render in under 100ms
      expect(comments.length).toBeGreaterThan(20); // Should have many comments
      
      console.log(`Deep tree (${comments.length} comments): ${metrics.renderTime.toFixed(2)}ms`);
    });

    it('should handle very deep nesting (depth 8+)', () => {
      const comments = generateCommentTree(8, 2); // Depth 8, 2 children per level
      
      const metrics = measurePerformance(() => {
        render(<CommentThread 
          comments={comments}
          rootPostId={123}
          onCommentPosted={vi.fn()}
        />);
      });
      
      expect(metrics.renderTime).toBeLessThan(150); // Should render in under 150ms
      
      // Should show "continue thread" links for very deep nesting
      const continueLinks = screen.queryAllByText(/Continuar esta conversa/);
      expect(continueLinks.length).toBeGreaterThan(0);
      
      console.log(`Very deep tree (${comments.length} comments): ${metrics.renderTime.toFixed(2)}ms`);
    });
  });

  describe('Large Dataset Performance', () => {
    it('should handle 50 comments efficiently', () => {
      const comments = generateLargeCommentSet(50);
      
      const metrics = measurePerformance(() => {
        render(<CommentThread 
          comments={comments}
          rootPostId={123}
          onCommentPosted={vi.fn()}
        />);
      });
      
      expect(metrics.renderTime).toBeLessThan(200); // Should render in under 200ms
      
      // Should render significant number of comments
      const renderedComments = document.querySelectorAll('[data-testid="comment-component"]');
      expect(renderedComments.length).toBeGreaterThan(0);
      
      console.log(`50 comments: ${metrics.renderTime.toFixed(2)}ms`);
    });

    it('should handle 100 comments efficiently', () => {
      const comments = generateLargeCommentSet(100);
      
      const metrics = measurePerformance(() => {
        render(<CommentThread 
          comments={comments}
          rootPostId={123}
          onCommentPosted={vi.fn()}
        />);
      });
      
      expect(metrics.renderTime).toBeLessThan(500); // Should render in under 500ms
      
      console.log(`100 comments: ${metrics.renderTime.toFixed(2)}ms`);
    });

    it('should handle 200 comments without significant performance degradation', () => {
      const comments = generateLargeCommentSet(200);
      
      const metrics = measurePerformance(() => {
        render(<CommentThread 
          comments={comments}
          rootPostId={123}
          onCommentPosted={vi.fn()}
        />);
      });
      
      expect(metrics.renderTime).toBeLessThan(1000); // Should render in under 1 second
      
      console.log(`200 comments: ${metrics.renderTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage', () => {
    it('should have reasonable memory footprint for moderate comment threads', () => {
      const comments = generateCommentTree(4, 3); // Moderate size tree
      
      const metrics = measurePerformance(() => {
        render(<CommentThread 
          comments={comments}
          rootPostId={123}
          onCommentPosted={vi.fn()}
        />);
      });
      
      // Memory usage should be reasonable (less than 5MB delta if memory API available)
      if (metrics.memoryBefore > 0 && metrics.memoryAfter > 0) {
        expect(metrics.memoryDelta).toBeLessThan(5 * 1024 * 1024); // 5MB
        
        console.log(`Memory usage: ${(metrics.memoryDelta / 1024 / 1024).toFixed(2)}MB`);
      }
    });

    it('should not leak memory on component unmount', () => {
      const comments = generateCommentTree(3, 3);
      
      const initialMemory = (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      
      const { unmount } = render(<CommentThread 
        comments={comments}
        rootPostId={123}
        onCommentPosted={vi.fn()}
      />);
      
      unmount();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryDelta = finalMemory - initialMemory;
        // Should not have significant memory increase after unmount
        expect(memoryDelta).toBeLessThan(1024 * 1024); // 1MB tolerance
        
        console.log(`Memory after unmount: ${(memoryDelta / 1024).toFixed(2)}KB delta`);
      }
    });
  });

  describe('Interaction Performance', () => {
    it('should expand/collapse threads responsively', () => {
      const comments = generateCommentTree(4, 3);
      
      render(<CommentThread 
        comments={comments}
        rootPostId={123}
        onCommentPosted={vi.fn()}
      />);
      
      const collapseButtons = document.querySelectorAll('.thread-toggle-btn');
      
      if (collapseButtons.length > 0) {
        const collapseTime = measureInteractionTime(() => {
          fireEvent.click(collapseButtons[0]);
        });
        
        expect(collapseTime).toBeLessThan(10); // Should respond in under 10ms
        
        const expandTime = measureInteractionTime(() => {
          fireEvent.click(collapseButtons[0]);
        });
        
        expect(expandTime).toBeLessThan(10); // Should respond in under 10ms
        
        console.log(`Thread collapse: ${collapseTime.toFixed(2)}ms, expand: ${expandTime.toFixed(2)}ms`);
      }
    });

    it('should handle multiple simultaneous interactions', () => {
      const comments = generateCommentTree(3, 4);
      
      render(<CommentThread 
        comments={comments}
        rootPostId={123}
        onCommentPosted={vi.fn()}
      />);
      
      const replyButtons = screen.getAllByRole('button', { name: /responder/i });
      
      if (replyButtons.length >= 3) {
        const multiInteractionTime = measureInteractionTime(() => {
          replyButtons[0].click();
          replyButtons[1].click();
          replyButtons[2].click();
        });
        
        expect(multiInteractionTime).toBeLessThan(20); // Should handle all in under 20ms
        
        // All reply inputs should be visible
        const replyInputs = screen.getAllByTestId('minimal-comment-input');
        expect(replyInputs.length).toBe(3);
        
        console.log(`Multiple interactions: ${multiInteractionTime.toFixed(2)}ms`);
      }
    });
  });

  describe('Re-render Performance', () => {
    it('should minimize re-renders when data changes', () => {
      const comments = generateCommentTree(3, 2);
      
      const { rerender } = render(<CommentThread 
        comments={comments}
        rootPostId={123}
        onCommentPosted={vi.fn()}
      />);
      
      const initialRenderCount = renderCount;
      
      // Re-render with same data
      const rerenderTime = measureInteractionTime(() => {
        rerender(<CommentThread 
          comments={comments}
          rootPostId={123}
          onCommentPosted={vi.fn()}
        />);
      });
      
      expect(rerenderTime).toBeLessThan(30); // Should re-render quickly
      
      // Should not have excessive re-renders due to memoization
      const renderDelta = renderCount - initialRenderCount;
      expect(renderDelta).toBeLessThan(comments.length); // Should be less than total comments
      
      console.log(`Re-render: ${rerenderTime.toFixed(2)}ms, render delta: ${renderDelta}`);
    });

    it('should handle prop changes efficiently', () => {
      const comments = generateCommentTree(3, 2);
      const onCommentPosted1 = vi.fn();
      const onCommentPosted2 = vi.fn();
      
      const { rerender } = render(<CommentThread 
        comments={comments}
        rootPostId={123}
        onCommentPosted={onCommentPosted1}
      />);
      
      const propChangeTime = measureInteractionTime(() => {
        rerender(<CommentThread 
          comments={comments}
          rootPostId={123}
          onCommentPosted={onCommentPosted2}
        />);
      });
      
      expect(propChangeTime).toBeLessThan(50); // Should handle prop changes quickly
      
      console.log(`Prop change re-render: ${propChangeTime.toFixed(2)}ms`);
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle empty comment thread efficiently', () => {
      const metrics = measurePerformance(() => {
        render(<CommentThread 
          comments={[]}
          rootPostId={123}
          onCommentPosted={vi.fn()}
        />);
      });
      
      expect(metrics.renderTime).toBeLessThan(5); // Empty state should render very quickly
      expect(screen.getByText(/Ainda não há comentários/)).toBeInTheDocument();
      
      console.log(`Empty thread: ${metrics.renderTime.toFixed(2)}ms`);
    });

    it('should handle malformed comment data gracefully', () => {
      const malformedComments = [
        {
          id: 1,
          content: '<p>Normal comment</p>',
          category: 'discussion',
          upvotes: 5,
          downvotes: 1,
          created_at: '2023-09-03T14:00:00Z',
          updated_at: '2023-09-03T14:00:00Z',
          author: null, // Malformed: missing author
        },
        {
          id: 2,
          content: '', // Malformed: empty content
          category: 'discussion',
          upvotes: 0,
          downvotes: 0,
          created_at: 'invalid-date', // Malformed: invalid date
          updated_at: 'invalid-date',
          author: {
            id: 'user-2',
            full_name: 'User 2',
            avatar_url: null,
            role: 'member',
          },
        },
      ] as CommunityPost[];
      
      const metrics = measurePerformance(() => {
        render(<CommentThread 
          comments={malformedComments}
          rootPostId={123}
          onCommentPosted={vi.fn()}
        />);
      });
      
      expect(metrics.renderTime).toBeLessThan(50); // Should handle gracefully
      
      // Should render without crashing
      const renderedComments = document.querySelectorAll('[data-testid="comment-component"]');
      expect(renderedComments.length).toBeGreaterThan(0);
      
      console.log(`Malformed data: ${metrics.renderTime.toFixed(2)}ms`);
    });
  });
});