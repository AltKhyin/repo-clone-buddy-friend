// ABOUTME: Performance optimization and validation tests for Reddit-style commenting system

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CommentThread } from '../CommentThread';
import { Comment } from '../Comment';
import { CommentActions } from '../CommentActions';
import type { CommunityPost } from '../../../types/community';

// Mock dependencies for performance testing
vi.mock('../../../hooks/useColorTokens');
vi.mock('../../hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

vi.mock('../MinimalCommentInput', () => ({
  MinimalCommentInput: () => <div data-testid="comment-input">Comment Input</div>,
}));

vi.mock('../PostActionMenu', () => ({
  PostActionMenu: () => <div data-testid="post-action-menu">Menu</div>,
}));

vi.mock('../../ui/VoteButton', () => ({
  VoteButton: ({ entityId }: any) => (
    <div data-testid={`vote-button-${entityId}`} className="min-h-[44px]">
      Vote Button
    </div>
  ),
}));

vi.mock('../CommunityAuthor', () => ({
  CommentAuthor: ({ author }: any) => (
    <div data-testid={`author-${author?.id || 'deleted'}`}>
      {author?.full_name || '[Usuário excluído]'}
    </div>
  ),
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Award: () => <span>🏆</span>,
    ChevronDown: () => <span>▼</span>,
    ChevronRight: () => <span>▶</span>,
    Share: () => <span>📤</span>,
    MoreHorizontal: () => <span>⋯</span>,
  };
});

// Performance testing utilities
const measureRenderTime = (renderFn: () => void): number => {
  const startTime = performance.now();
  renderFn();
  const endTime = performance.now();
  return endTime - startTime;
};

// Test data generators for performance testing
const generateComment = (
  id: number, 
  parentId: number | null = null, 
  depth: number = 0
): CommunityPost => ({
  id,
  content: `<p>Performance test comment ${id} with detailed content.</p>`,
  category: 'discussion',
  upvotes: Math.floor(Math.random() * 50),
  downvotes: Math.floor(Math.random() * 10),
  created_at: new Date(Date.now() - id * 60000).toISOString(),
  updated_at: new Date(Date.now() - id * 60000).toISOString(),
  author: {
    id: `user-${id}`,
    full_name: `Test User ${id}`,
    avatar_url: `https://example.com/user${id}.jpg`,
    role: 'member',
    profession: `Developer ${id % 5}`
  },
  user_vote: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'up' : 'down') : null,
  is_rewarded: Math.random() > 0.9,
  parent_post_id: parentId,
  nesting_level: depth + 1,
});

const generateCommentTree = (totalComments: number, maxDepth: number = 8): CommunityPost[] => {
  const comments: CommunityPost[] = [];
  let currentId = 1;

  // Generate root comments (30% of total)
  const rootCommentCount = Math.floor(totalComments * 0.3);
  for (let i = 0; i < rootCommentCount; i++) {
    comments.push(generateComment(currentId++));
  }

  // Generate nested replies
  while (currentId <= totalComments) {
    const parentIndex = Math.floor(Math.random() * comments.length);
    const parent = comments[parentIndex];
    const parentDepth = parent.nesting_level - 1;
    
    if (parentDepth < maxDepth) {
      comments.push(generateComment(currentId++, parent.id, parentDepth));
    } else {
      comments.push(generateComment(currentId++));
    }
  }

  return comments;
};

describe('Reddit-Style Commenting System Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Component Rendering Performance', () => {
    it('should render small comment threads quickly (< 50ms)', () => {
      const comments = generateCommentTree(10, 3);
      
      const renderTime = measureRenderTime(() => {
        render(
          <CommentThread
            comments={comments}
            rootPostId={123}
            onCommentPosted={vi.fn()}
          />
        );
      });

      expect(renderTime).toBeLessThan(50);
      expect(screen.getByText(/Performance test comment 1/)).toBeInTheDocument();
    });

    it('should render medium comment threads efficiently (< 100ms)', () => {
      const comments = generateCommentTree(50, 5);
      
      const renderTime = measureRenderTime(() => {
        render(
          <CommentThread
            comments={comments}
            rootPostId={123}
            onCommentPosted={vi.fn()}
          />
        );
      });

      expect(renderTime).toBeLessThan(100);
      expect(comments.length).toBe(50);
    });

    it('should render large comment threads within acceptable limits (< 200ms)', () => {
      const comments = generateCommentTree(100, 8);
      
      const renderTime = measureRenderTime(() => {
        render(
          <CommentThread
            comments={comments}
            rootPostId={123}
            onCommentPosted={vi.fn()}
          />
        );
      });

      expect(renderTime).toBeLessThan(200);
      expect(comments.length).toBe(100);
    });
  });

  describe('Reddit-Style Tree Building Performance', () => {
    it('should build comment tree efficiently for hierarchical data', () => {
      const comments = generateCommentTree(100, 8);
      
      const buildTime = measureRenderTime(() => {
        render(
          <CommentThread
            comments={comments}
            rootPostId={123}
            onCommentPosted={vi.fn()}
          />
        );
      });

      expect(buildTime).toBeLessThan(150);
      
      const rootComments = comments.filter(c => !c.parent_post_id);
      expect(rootComments.length).toBeGreaterThan(0);
    });

    it('should handle deep nesting efficiently without exponential slowdown', () => {
      const comments = generateCommentTree(50, 8);
      
      const renderTime = measureRenderTime(() => {
        render(
          <CommentThread
            comments={comments}
            rootPostId={123}
            onCommentPosted={vi.fn()}
          />
        );
      });

      expect(renderTime).toBeLessThan(100);
      
      const deepComments = comments.filter(c => c.nesting_level >= 6);
      expect(deepComments.length).toBeGreaterThan(0);
    });
  });

  describe('CommentActions Performance', () => {
    it('should render CommentActions component efficiently', () => {
      const testComment = generateComment(1);
      
      const renderTime = measureRenderTime(() => {
        render(
          <Comment
            comment={testComment}
            indentationLevel={0}
            rootPostId={123}
            onCommentPosted={vi.fn()}
            hasReplies={true}
            onToggleCollapse={vi.fn()}
            replyCount={5}
          />
        );
      });

      expect(renderTime).toBeLessThan(20);
    });

    it('should not degrade performance with progressive disclosure features', () => {
      const testComment = generateComment(1);
      
      const renderTime = measureRenderTime(() => {
        render(
          <CommentActions
            comment={testComment}
            isReplying={false}
            onToggleReply={vi.fn()}
            hasReplies={true}
            onToggleCollapse={vi.fn()}
            replyCount={3}
            showShareButton={true}
            showMoreActions={true}
            mobileActionLimit={3}
          />
        );
      });

      expect(renderTime).toBeLessThan(10);
    });
  });

  describe('Comparative Performance Analysis', () => {
    it('should perform similarly regardless of comment depth', () => {
      const shallowComments = generateCommentTree(30, 2);
      const shallowTime = measureRenderTime(() => {
        const { unmount } = render(
          <CommentThread
            comments={shallowComments}
            rootPostId={123}
            onCommentPosted={vi.fn()}
          />
        );
        unmount();
      });

      const deepComments = generateCommentTree(30, 8);
      const deepTime = measureRenderTime(() => {
        const { unmount } = render(
          <CommentThread
            comments={deepComments}
            rootPostId={123}
            onCommentPosted={vi.fn()}
          />
        );
        unmount();
      });

      // Reddit-style: Deep comments should not be significantly slower
      expect(deepTime).toBeLessThan(shallowTime * 2);
    });

    it('should scale linearly with comment count', () => {
      const sizes = [25, 50, 100];
      const renderTimes: number[] = [];

      sizes.forEach(size => {
        const comments = generateCommentTree(size, 5);
        const renderTime = measureRenderTime(() => {
          const { unmount } = render(
            <CommentThread
              comments={comments}
              rootPostId={123}
              onCommentPosted={vi.fn()}
            />
          );
          unmount();
        });
        renderTimes.push(renderTime);
      });

      // Performance should scale reasonably (not exponentially)
      const scaleFactor = renderTimes[2] / renderTimes[0];
      expect(scaleFactor).toBeLessThan(4);
    });
  });

  describe('Performance Regression Prevention', () => {
    it('should maintain baseline performance standards', () => {
      const standardCommentSet = generateCommentTree(75, 6);
      
      const renderTime = measureRenderTime(() => {
        render(
          <CommentThread
            comments={standardCommentSet}
            rootPostId={123}
            onCommentPosted={vi.fn()}
          />
        );
      });

      expect(renderTime).toBeLessThan(120);
    });

    it('should handle Reddit-scale comment threads (300+ comments)', () => {
      const comments = generateCommentTree(300, 8);
      
      const renderTime = measureRenderTime(() => {
        render(
          <CommentThread
            comments={comments}
            rootPostId={123}
            onCommentPosted={vi.fn()}
          />
        );
      });

      expect(renderTime).toBeLessThan(400);
      expect(comments.length).toBe(300);
    });

    it('should maintain responsiveness during user interactions', () => {
      const comments = generateCommentTree(100, 6);
      
      render(
        <CommentThread
          comments={comments}
          rootPostId={123}
          onCommentPosted={vi.fn()}
        />
      );

      const interactionTime = measureRenderTime(() => {
        const replyButtons = screen.getAllByRole('button', { name: /responder/i });
        const voteButtons = screen.getAllByTestId(/^vote-button-/);
        
        expect(replyButtons.length).toBeGreaterThan(0);
        expect(voteButtons.length).toBeGreaterThan(0);
      });

      expect(interactionTime).toBeLessThan(20);
    });
  });
});