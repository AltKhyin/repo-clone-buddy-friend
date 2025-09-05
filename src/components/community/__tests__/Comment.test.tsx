// ABOUTME: Comprehensive test suite for Comment component covering depth levels, visual differentiation, and mobile UX requirements.

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Comment } from '../Comment';
import type { CommunityPost } from '../../../types/community';

// Mock hooks and dependencies
vi.mock('../../../hooks/useColorTokens');
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Award: vi.fn(() => <div data-testid="award-icon">Award</div>),
    ChevronDown: vi.fn(() => <div data-testid="chevron-down">ChevronDown</div>),
    ChevronRight: vi.fn(() => <div data-testid="chevron-right">ChevronRight</div>),
  };
});
vi.mock('../MinimalCommentInput', () => ({
  MinimalCommentInput: ({ onCommentPosted }: { onCommentPosted: () => void }) => (
    <div data-testid="minimal-comment-input">
      <button onClick={onCommentPosted} data-testid="post-reply">Post Reply</button>
    </div>
  ),
}));

vi.mock('../PostActionMenu', () => ({
  PostActionMenu: () => <div data-testid="post-action-menu">Action Menu</div>,
}));

vi.mock('../../ui/VoteButton', () => ({
  VoteButton: ({ orientation, size, upvotes }: any) => (
    <div 
      data-testid="vote-button" 
      data-orientation={orientation}
      data-size={size}
      data-upvotes={upvotes}
    >
      Vote Button
    </div>
  ),
}));

vi.mock('../CommunityAuthor', () => ({
  CommentAuthor: ({ author, timestamp }: any) => (
    <div data-testid="comment-author">
      {author.full_name} • {timestamp}
    </div>
  ),
}));

// Test data factory
const createMockComment = (overrides: Partial<CommunityPost> = {}): CommunityPost => ({
  id: 1,
  content: '<p>This is a test comment content</p>',
  category: 'discussion',
  upvotes: 5,
  downvotes: 2,
  created_at: '2023-09-03T14:00:00Z',
  updated_at: '2023-09-03T14:00:00Z',
  author: {
    id: 'user-123',
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    role: 'member',
    profession: 'Developer',
  },
  user_vote: null,
  is_rewarded: false,
  ...overrides,
} as CommunityPost);

// Mock DOM measurement for touch target tests
Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  configurable: true,
  value: function() {
    return {
      width: 44,
      height: 44,
      top: 0,
      left: 0,
      bottom: 44,
      right: 44,
      x: 0,
      y: 0,
      toJSON: function() { return this; }
    };
  },
});

describe('Comment Component', () => {
  const defaultProps = {
    comment: createMockComment(),
    indentationLevel: 0,
    rootPostId: 123,
    onCommentPosted: vi.fn(),
    hasReplies: false,
    isCollapsed: false,
    replyCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render comment content correctly', () => {
      render(<Comment {...defaultProps} />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByTestId('comment-author')).toBeInTheDocument();
      expect(screen.getByTestId('vote-button')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /responder/i })).toBeInTheDocument();
    });

    it('should display comment content as HTML', () => {
      render(<Comment {...defaultProps} />);
      
      const contentDiv = document.querySelector('.reddit-comment-text');
      expect(contentDiv).toHaveProperty('innerHTML', '<p>This is a test comment content</p>');
    });

    it('should show reward badge when comment is rewarded', () => {
      const rewardedComment = createMockComment({ is_rewarded: true });
      render(<Comment {...defaultProps} comment={rewardedComment} />);
      
      expect(screen.getByText('Recompensa')).toBeInTheDocument();
    });
  });

  describe('Reddit-Style Visual Consistency (No Depth Differentiation)', () => {
    it('should maintain consistent styling at all depths', () => {
      render(<Comment {...defaultProps} indentationLevel={4} />);
      
      const commentContainer = document.querySelector('.natural-comment');
      expect(commentContainer).not.toHaveClass('text-sm'); // No depth-based text sizing
    });

    it('should maintain consistent padding regardless of depth', () => {
      render(<Comment {...defaultProps} indentationLevel={4} />);
      
      const commentContent = document.querySelector('.comment-container');
      expect(commentContent).toHaveClass('p-2'); // Consistent padding
      expect(commentContent).not.toHaveClass('p-1.5'); // No depth-based tighter padding
    });

    it('should render consistent vote button sizes regardless of depth', () => {
      render(<Comment {...defaultProps} indentationLevel={4} />);
      
      const voteButton = screen.getByTestId('vote-button');
      expect(voteButton).toHaveAttribute('data-size', 'sm'); // Consistent size regardless of depth
    });

    it('should render consistent action button sizes regardless of depth', () => {
      render(<Comment {...defaultProps} indentationLevel={4} />);
      
      const replyButton = screen.getByRole('button', { name: /responder/i });
      expect(replyButton).toHaveClass('h-7', 'px-2'); // Consistent reply button size
      expect(replyButton).not.toHaveClass('h-6', 'px-1.5'); // No depth-based smaller buttons
    });
  });

  describe('Reddit-Style Depth Consistency Test (All Depths Look Identical)', () => {
    const testCases = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(depth => ({
      depth,
      description: `depth level ${depth}`,
    }));

    testCases.forEach(({ depth, description }) => {
      describe(`Comment at ${description}`, () => {
        it('should render all essential elements consistently', () => {
          render(<Comment {...defaultProps} indentationLevel={depth} />);
          
          // All comments should have these elements regardless of depth
          expect(screen.getByTestId('comment-author')).toBeInTheDocument();
          expect(screen.getByTestId('vote-button')).toBeInTheDocument();
          expect(screen.getByRole('button', { name: /responder/i })).toBeInTheDocument();
        });

        it('should have consistent vote button size regardless of depth', () => {
          render(<Comment {...defaultProps} indentationLevel={depth} />);
          
          const voteButton = screen.getByTestId('vote-button');
          // Reddit-style: All vote buttons are the same size
          expect(voteButton).toHaveAttribute('data-size', 'sm');
        });

        it('should apply consistent text styling regardless of depth', () => {
          render(<Comment {...defaultProps} indentationLevel={depth} />);
          
          const commentContainer = document.querySelector('.natural-comment');
          // Reddit-style: No depth-based text size variations
          expect(commentContainer).not.toHaveClass('text-sm');
        });

        it('should maintain consistent padding regardless of depth', () => {
          render(<Comment {...defaultProps} indentationLevel={depth} />);
          
          const commentContent = document.querySelector('.comment-container');
          // Reddit-style: All comments use consistent padding
          expect(commentContent).toHaveClass('p-2');
        });
      });
    });
  });

  describe('Interactive Features', () => {
    it('should toggle reply input when reply button is clicked', async () => {
      render(<Comment {...defaultProps} />);
      
      const replyButton = screen.getByRole('button', { name: /responder/i });
      
      // Initially no reply input
      expect(screen.queryByTestId('minimal-comment-input')).not.toBeInTheDocument();
      
      // Click reply button
      fireEvent.click(replyButton);
      
      // Reply input should appear
      expect(screen.getByTestId('minimal-comment-input')).toBeInTheDocument();
      expect(replyButton).toHaveTextContent('Cancelar');
    });

    it('should call onCommentPosted when reply is posted', async () => {
      const onCommentPosted = vi.fn();
      render(<Comment {...defaultProps} onCommentPosted={onCommentPosted} />);
      
      // Open reply input
      fireEvent.click(screen.getByRole('button', { name: /responder/i }));
      
      // Post reply
      fireEvent.click(screen.getByTestId('post-reply'));
      
      expect(onCommentPosted).toHaveBeenCalled();
    });

    it('should show collapse button when hasReplies is true', () => {
      const onToggleCollapse = vi.fn();
      render(<Comment 
        {...defaultProps} 
        hasReplies={true} 
        onToggleCollapse={onToggleCollapse}
        replyCount={3}
      />);
      
      const collapseButton = screen.getByTitle('Ocultar respostas');
      expect(collapseButton).toBeInTheDocument();
      
      fireEvent.click(collapseButton);
      expect(onToggleCollapse).toHaveBeenCalled();
    });

    it('should show expand button when collapsed', () => {
      render(<Comment 
        {...defaultProps} 
        hasReplies={true}
        isCollapsed={true}
        onToggleCollapse={vi.fn()}
        replyCount={3}
      />);
      
      const expandButton = screen.getByTitle('Mostrar 3 respostas');
      expect(expandButton).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Optimistic Updates', () => {
    it('should show loading state for optimistic comments', () => {
      const optimisticComment = createMockComment({ _isOptimistic: true, _isLoading: true });
      render(<Comment {...defaultProps} comment={optimisticComment} />);
      
      const commentContainer = document.querySelector('.natural-comment');
      expect(commentContainer).toHaveClass('opacity-70', 'animate-pulse');
      expect(commentContainer).toHaveClass('bg-blue-50/30');
      
      // Should show "Enviando..." timestamp
      expect(screen.getByText(/Enviando\.\.\./)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on interactive elements', () => {
      render(<Comment 
        {...defaultProps} 
        hasReplies={true}
        onToggleCollapse={vi.fn()}
        replyCount={3}
      />);
      
      const replyButton = screen.getByRole('button', { name: /responder/i });
      expect(replyButton).toBeInTheDocument();
      
      const collapseButton = screen.getByTitle('Ocultar respostas');
      expect(collapseButton).toBeInTheDocument();
    });

    it('should maintain keyboard navigation', () => {
      render(<Comment {...defaultProps} />);
      
      const replyButton = screen.getByRole('button', { name: /responder/i });
      replyButton.focus();
      expect(document.activeElement).toBe(replyButton);
    });
  });

  describe('Vote System Integration', () => {
    it('should pass correct props to VoteButton', () => {
      const commentWithVotes = createMockComment({
        upvotes: 15,
        downvotes: 3,
        user_vote: 'up'
      });
      
      render(<Comment {...defaultProps} comment={commentWithVotes} />);
      
      const voteButton = screen.getByTestId('vote-button');
      expect(voteButton).toHaveAttribute('data-upvotes', '15');
      expect(voteButton).toHaveAttribute('data-orientation', 'horizontal');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing author gracefully', () => {
      const commentWithoutAuthor = createMockComment({ author: null });
      
      expect(() => {
        render(<Comment {...defaultProps} comment={commentWithoutAuthor} />);
      }).not.toThrow();
      
      // Should show deleted user text
      expect(screen.getByText('[Usuário excluído]')).toBeInTheDocument();
    });

    it('should handle invalid timestamps gracefully', () => {
      const commentWithBadDate = createMockComment({ created_at: 'invalid-date' });
      
      expect(() => {
        render(<Comment {...defaultProps} comment={commentWithBadDate} />);
      }).not.toThrow();
      
      // Should show fallback text
      expect(screen.getByText(/Data inválida/)).toBeInTheDocument();
    });
  });
});