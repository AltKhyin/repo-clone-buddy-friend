// ABOUTME: Tests for line break support in comment content display

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Comment } from '../Comment';
import type { CommunityPost } from '../../../types/community';

// Mock dependencies
vi.mock('../MinimalCommentInput', () => ({
  MinimalCommentInput: () => <div data-testid="minimal-comment-input">Reply Input</div>,
}));

vi.mock('../PostActionMenu', () => ({
  PostActionMenu: () => <div data-testid="post-action-menu">Action Menu</div>,
}));

vi.mock('../CommunityAuthor', () => ({
  CommentAuthor: () => <div data-testid="comment-author">Test Author</div>,
}));

vi.mock('../CommentActions', () => ({
  CommentActions: () => <div data-testid="comment-actions">Actions</div>,
}));

describe('Comment Line Break Support', () => {
  const createMockComment = (content: string): CommunityPost => ({
    id: 1,
    content,
    category: 'comment',
    created_at: '2023-01-01T00:00:00Z',
    upvotes: 0,
    downvotes: 0,
    is_pinned: false,
    is_locked: false,
    is_rewarded: false,
    author: {
      id: 'user-1',
      full_name: 'Test User',
      avatar_url: null,
    },
    user_vote: null,
    is_saved: false,
    reply_count: 0,
  });

  const defaultProps = {
    indentationLevel: 0,
    rootPostId: 1,
    onCommentPosted: vi.fn(),
  };

  it('should preserve single line breaks', () => {
    const commentWithLineBreak = createMockComment('First line\nSecond line');

    const { container } = render(
      <Comment
        comment={commentWithLineBreak}
        {...defaultProps}
      />
    );

    const commentBody = container.querySelector('.reddit-comment-text');
    expect(commentBody?.innerHTML).toContain('First line<br>Second line');
  });

  it('should preserve multiple line breaks', () => {
    const commentWithMultipleBreaks = createMockComment('Line 1\n\nLine 3\nLine 4');

    const { container } = render(
      <Comment
        comment={commentWithMultipleBreaks}
        {...defaultProps}
      />
    );

    const commentBody = container.querySelector('.reddit-comment-text');
    expect(commentBody?.innerHTML).toContain('Line 1<br><br>Line 3<br>Line 4');
  });

  it('should handle content without line breaks normally', () => {
    const regularComment = createMockComment('Just a regular comment without breaks');

    const { container } = render(
      <Comment
        comment={regularComment}
        {...defaultProps}
      />
    );

    const commentBody = container.querySelector('.reddit-comment-text');
    expect(commentBody?.innerHTML).toBe('Just a regular comment without breaks');
  });

  it('should apply whitespace-pre-wrap class for proper text formatting', () => {
    const comment = createMockComment('Any content');

    const { container } = render(
      <Comment
        comment={comment}
        {...defaultProps}
      />
    );

    const commentBody = container.querySelector('.reddit-comment-text');
    expect(commentBody).toHaveClass('whitespace-pre-wrap');
  });
});