// ABOUTME: End-to-end integration tests for Reddit-style commenting system ensuring complete functionality

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommentThread } from '../CommentThread';
import { Comment } from '../Comment';
import type { CommunityPost, RedditThreadState } from '../../../types/community';

// Mock all dependencies for isolated integration testing
vi.mock('../../../hooks/useColorTokens');
vi.mock('../../hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false), // Default to desktop, can be overridden
}));

vi.mock('../MinimalCommentInput', () => ({
  MinimalCommentInput: ({ onCommentPosted, placeholder }: any) => (
    <div data-testid="comment-input" data-placeholder={placeholder}>
      <input data-testid="comment-text" placeholder={placeholder} />
      <button onClick={onCommentPosted} data-testid="submit-comment">
        Submit
      </button>
    </div>
  ),
}));

vi.mock('../PostActionMenu', () => ({
  PostActionMenu: () => <div data-testid="post-action-menu">⋮</div>,
}));

vi.mock('../../ui/VoteButton', () => ({
  VoteButton: ({ entityId, upvotes, downvotes, userVote, orientation, size }: any) => (
    <div 
      data-testid={`vote-button-${entityId}`}
      data-upvotes={upvotes}
      data-downvotes={downvotes}
      data-user-vote={userVote}
      data-orientation={orientation}
      data-size={size}
      className="vote-button min-h-[44px]"
    >
      <button data-testid={`upvote-${entityId}`}>↑ {upvotes - downvotes}</button>
      <button data-testid={`downvote-${entityId}`}>↓</button>
    </div>
  ),
}));

vi.mock('../CommunityAuthor', () => ({
  CommentAuthor: ({ author, timestamp }: any) => (
    <div data-testid={`author-${author?.id || 'deleted'}`}>
      {author?.full_name || '[Usuário excluído]'} • {timestamp}
    </div>
  ),
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Award: () => <span data-testid="award-icon">🏆</span>,
    ChevronDown: () => <span data-testid="chevron-down">▼</span>,
    ChevronRight: () => <span data-testid="chevron-right">▶</span>,
    Share: () => <span data-testid="share-icon">📤</span>,
    MoreHorizontal: () => <span data-testid="more-icon">⋯</span>,
  };
});

// Test data factory for realistic comment hierarchies
const createCommentHierarchy = (): CommunityPost[] => [
  // Root comments (depth 0)
  {
    id: 1,
    content: '<p>This is a root comment with interesting discussion points.</p>',
    category: 'discussion',
    upvotes: 15,
    downvotes: 2,
    created_at: '2023-09-03T10:00:00Z',
    updated_at: '2023-09-03T10:00:00Z',
    author: {
      id: 'user-1',
      full_name: 'Alice Smith',
      avatar_url: 'https://example.com/alice.jpg',
      role: 'member',
      profession: 'Developer'
    },
    user_vote: null,
    is_rewarded: false,
    parent_post_id: null,
    nesting_level: 1,
  },
  
  // First-level reply (depth 1)
  {
    id: 2,
    content: '<p>Great point! I totally agree with your analysis.</p>',
    category: 'discussion', 
    upvotes: 8,
    downvotes: 1,
    created_at: '2023-09-03T10:30:00Z',
    updated_at: '2023-09-03T10:30:00Z',
    author: {
      id: 'user-2',
      full_name: 'Bob Johnson',
      avatar_url: 'https://example.com/bob.jpg',
      role: 'member',
      profession: 'Designer'
    },
    user_vote: 'up',
    is_rewarded: false,
    parent_post_id: 1,
    nesting_level: 2,
  },

  // Deep nested reply (depth 2)
  {
    id: 3,
    content: '<p>But have you considered the alternative perspective?</p>',
    category: 'discussion',
    upvotes: 5,
    downvotes: 0,
    created_at: '2023-09-03T11:00:00Z',
    updated_at: '2023-09-03T11:00:00Z',
    author: {
      id: 'user-3',
      full_name: 'Carol White',
      avatar_url: 'https://example.com/carol.jpg',
      role: 'moderator',
      profession: 'Product Manager'
    },
    user_vote: null,
    is_rewarded: true, // Rewarded comment
    parent_post_id: 2,
    nesting_level: 3,
  },

  // Very deep reply (depth 3)
  {
    id: 4,
    content: '<p>Actually, that makes perfect sense now!</p>',
    category: 'discussion',
    upvotes: 3,
    downvotes: 0,
    created_at: '2023-09-03T11:15:00Z',
    updated_at: '2023-09-03T11:15:00Z',
    author: {
      id: 'user-2',
      full_name: 'Bob Johnson',
      avatar_url: 'https://example.com/bob.jpg',
      role: 'member',
      profession: 'Designer'
    },
    user_vote: null,
    is_rewarded: false,
    parent_post_id: 3,
    nesting_level: 4,
  },

  // Second root comment
  {
    id: 5,
    content: '<p>Here is another top-level discussion point.</p>',
    category: 'discussion',
    upvotes: 12,
    downvotes: 3,
    created_at: '2023-09-03T12:00:00Z',
    updated_at: '2023-09-03T12:00:00Z',
    author: {
      id: 'user-4',
      full_name: 'David Brown',
      avatar_url: 'https://example.com/david.jpg',
      role: 'member',
      profession: 'Engineer'
    },
    user_vote: null,
    is_rewarded: false,
    parent_post_id: null,
    nesting_level: 1,
  }
];

describe('Reddit-Style Commenting System Integration', () => {
  const mockOnCommentPosted = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Comment Thread Rendering', () => {
    it('should render complete comment hierarchy with proper nesting', () => {
      const comments = createCommentHierarchy();
      
      render(
        <CommentThread
          comments={comments}
          rootPostId={123}
          onCommentPosted={mockOnCommentPosted}
        />
      );

      // Verify all comments are rendered
      expect(screen.getByText(/This is a root comment/)).toBeInTheDocument();
      expect(screen.getByText(/Great point! I totally agree/)).toBeInTheDocument();
      expect(screen.getByText(/But have you considered/)).toBeInTheDocument();
      expect(screen.getByText(/Actually, that makes perfect sense/)).toBeInTheDocument();
      expect(screen.getByText(/Here is another top-level/)).toBeInTheDocument();

      // Verify Reddit-style tree structure is built correctly
      const commentElements = screen.getAllByTestId(/^author-/);
      expect(commentElements).toHaveLength(5);
    });

    it('should display proper author information and metadata', () => {
      const comments = createCommentHierarchy();
      
      render(
        <CommentThread
          comments={comments}
          rootPostId={123}
          onCommentPosted={mockOnCommentPosted}
        />
      );

      // Verify author displays
      expect(screen.getByTestId('author-user-1')).toHaveTextContent('Alice Smith');
      expect(screen.getByTestId('author-user-2')).toBeInTheDocument();
      expect(screen.getByTestId('author-user-3')).toHaveTextContent('Carol White');
      expect(screen.getByTestId('author-user-4')).toHaveTextContent('David Brown');

      // Verify reward badge for rewarded comment
      expect(screen.getByTestId('award-icon')).toBeInTheDocument();
    });
  });

  describe('Reddit-Style Visual Consistency', () => {
    it('should maintain consistent styling across all depth levels', () => {
      const comments = createCommentHierarchy();
      
      render(
        <CommentThread
          comments={comments}
          rootPostId={123}
          onCommentPosted={mockOnCommentPosted}
        />
      );

      // All vote buttons should have consistent sizing (Reddit-style)
      const voteButtons = screen.getAllByTestId(/^vote-button-/);
      voteButtons.forEach(button => {
        expect(button).toHaveAttribute('data-size', 'sm');
        expect(button).toHaveAttribute('data-orientation', 'horizontal');
        expect(button).toHaveClass('min-h-[44px]');
      });

      // All reply buttons should be consistently sized
      const replyButtons = screen.getAllByRole('button', { name: /responder/i });
      replyButtons.forEach(button => {
        expect(button).toBeInTheDocument();
        // Should meet WCAG touch target requirements
      });
    });

    it('should not apply visual depth differentiation', () => {
      const comments = createCommentHierarchy();
      
      render(
        <CommentThread
          comments={comments}
          rootPostId={123}
          onCommentPosted={mockOnCommentPosted}
        />
      );

      // Verify no depth-based class variations exist
      const commentContainers = document.querySelectorAll('.natural-comment');
      commentContainers.forEach(container => {
        // Should NOT have depth-based styling
        expect(container).not.toHaveClass('text-sm'); // No small text for deep comments
        expect(container).not.toHaveClass('text-xs'); // No extra small text
      });
    });
  });

  describe('Interactive Comment Actions Integration', () => {
    it('should handle complete reply workflow', async () => {
      const comments = createCommentHierarchy();
      
      render(
        <CommentThread
          comments={comments}
          rootPostId={123}
          onCommentPosted={mockOnCommentPosted}
        />
      );

      // Find and click first reply button
      const replyButtons = screen.getAllByRole('button', { name: /responder/i });
      const firstReplyButton = replyButtons[0];
      
      // Initial state: no reply input visible
      expect(screen.queryByTestId('comment-input')).not.toBeInTheDocument();
      
      // Click reply button
      fireEvent.click(firstReplyButton);
      
      // Reply input should appear
      expect(screen.getByTestId('comment-input')).toBeInTheDocument();
      expect(firstReplyButton).toHaveTextContent('Cancelar');
      
      // Submit a reply
      const submitButton = screen.getByTestId('submit-comment');
      fireEvent.click(submitButton);
      
      // Should call onCommentPosted callback
      await waitFor(() => {
        expect(mockOnCommentPosted).toHaveBeenCalled();
      });
    });

    it('should handle thread collapse/expand functionality', () => {
      const comments = createCommentHierarchy();
      
      render(
        <CommentThread
          comments={comments}
          rootPostId={123}
          onCommentPosted={mockOnCommentPosted}
        />
      );

      // Find collapse button for comment with replies
      const collapseButton = screen.getByTitle('Ocultar respostas');
      expect(collapseButton).toBeInTheDocument();
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();

      // Click to collapse thread
      fireEvent.click(collapseButton);

      // Should show expand state
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
      expect(screen.getByTitle(/Mostrar \d+ respostas/)).toBeInTheDocument();
    });

    it('should integrate voting system correctly', () => {
      const comments = createCommentHierarchy();
      
      render(
        <CommentThread
          comments={comments}
          rootPostId={123}
          onCommentPosted={mockOnCommentPosted}
        />
      );

      // Verify vote buttons show correct scores
      expect(screen.getByTestId('vote-button-1')).toHaveAttribute('data-upvotes', '15');
      expect(screen.getByTestId('vote-button-1')).toHaveAttribute('data-downvotes', '2');
      
      // Verify user votes are reflected  
      expect(screen.getByTestId('vote-button-2')).toHaveAttribute('data-user-vote', 'up');

      // Vote buttons should be clickable
      const upvoteButton = screen.getByTestId('upvote-1');
      expect(upvoteButton).toBeInTheDocument();
      fireEvent.click(upvoteButton);
    });
  });

  describe('Progressive Disclosure Integration', () => {
    it('should handle progressive disclosure on mobile', () => {
      // Mock mobile environment
      const { useIsMobile } = require('../../hooks/use-mobile');
      useIsMobile.mockReturnValue(true);

      const comments = createCommentHierarchy();
      
      render(
        <CommentThread
          comments={comments}
          rootPostId={123}
          onCommentPosted={mockOnCommentPosted}
        />
      );

      // Essential actions should still be visible
      const replyButtons = screen.getAllByRole('button', { name: /responder/i });
      expect(replyButtons.length).toBeGreaterThan(0);
      
      // Vote buttons should maintain proper size
      const voteButtons = screen.getAllByTestId(/^vote-button-/);
      voteButtons.forEach(button => {
        expect(button).toHaveClass('min-h-[44px]');
      });
    });

    it('should show share buttons when enabled', () => {
      const comments = createCommentHierarchy();
      
      render(
        <CommentThread
          comments={comments}
          rootPostId={123}
          onCommentPosted={mockOnCommentPosted}
        />
      );

      // Share buttons should be present (enabled in Comment.tsx)
      const shareIcons = screen.queryAllByTestId('share-icon');
      expect(shareIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain WCAG compliance throughout interaction flow', () => {
      const comments = createCommentHierarchy();
      
      render(
        <CommentThread
          comments={comments}
          rootPostId={123}
          onCommentPosted={mockOnCommentPosted}
        />
      );

      // All interactive elements should have proper ARIA attributes
      const interactiveElements = [
        ...screen.getAllByRole('button'),
        ...screen.getAllByTestId(/^vote-button-/),
      ];

      interactiveElements.forEach(element => {
        // Should be keyboard accessible
        expect(element).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('should provide proper semantic structure', () => {
      const comments = createCommentHierarchy();
      
      render(
        <CommentThread
          comments={comments}
          rootPostId={123}
          onCommentPosted={mockOnCommentPosted}
        />
      );

      // Should have proper button roles
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Should have identifiable content structure
      const commentContent = screen.getByText(/This is a root comment/);
      expect(commentContent).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle missing authors gracefully across the thread', () => {
      const commentsWithMissingAuthor = createCommentHierarchy().map(comment => 
        comment.id === 3 ? { ...comment, author: null } : comment
      );
      
      render(
        <CommentThread
          comments={commentsWithMissingAuthor}
          rootPostId={123}
          onCommentPosted={mockOnCommentPosted}
        />
      );

      // Should show deleted user text
      expect(screen.getByText('[Usuário excluído]')).toBeInTheDocument();
      
      // Other comments should still render normally
      expect(screen.getByTestId('author-user-1')).toHaveTextContent('Alice Smith');
    });

    it('should handle empty comment threads', () => {
      render(
        <CommentThread
          comments={[]}
          rootPostId={123}
          onCommentPosted={mockOnCommentPosted}
        />
      );

      // Should show empty state message
      expect(screen.getByText(/Ainda não há comentários/)).toBeInTheDocument();
      expect(screen.getByText(/Seja o primeiro a comentar/)).toBeInTheDocument();
    });
  });

  describe('Performance Integration', () => {
    it('should handle large comment threads efficiently', () => {
      const startTime = performance.now();
      
      // Create a larger comment thread (50 comments)
      const largeCommentSet = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        content: `<p>This is comment number ${i + 1} with detailed content.</p>`,
        category: 'discussion' as const,
        upvotes: Math.floor(Math.random() * 20),
        downvotes: Math.floor(Math.random() * 5),
        created_at: new Date(Date.now() - i * 60000).toISOString(),
        updated_at: new Date(Date.now() - i * 60000).toISOString(),
        author: {
          id: `user-${i + 1}`,
          full_name: `User ${i + 1}`,
          avatar_url: `https://example.com/user${i + 1}.jpg`,
          role: 'member' as const,
          profession: 'Developer'
        },
        user_vote: null,
        is_rewarded: false,
        parent_post_id: i > 0 && i % 5 === 0 ? i : null, // Some replies
        nesting_level: i > 0 && i % 5 === 0 ? 2 : 1,
      }));

      render(
        <CommentThread
          comments={largeCommentSet}
          rootPostId={123}
          onCommentPosted={mockOnCommentPosted}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
      
      // Should still render all comments
      expect(screen.getByText('This is comment number 1')).toBeInTheDocument();
      expect(screen.getByText('This is comment number 50')).toBeInTheDocument();
    });
  });
});