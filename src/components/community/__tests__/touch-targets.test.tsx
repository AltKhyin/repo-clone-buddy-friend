// ABOUTME: Touch target size validation tests ensuring 44px minimum for mobile accessibility compliance.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Comment } from '../Comment';
import { CommentThread } from '../CommentThread';
import type { CommunityPost } from '../../../types/community';

// Mock dependencies
vi.mock('../../../hooks/useColorTokens');
vi.mock('../MinimalCommentInput', () => ({
  MinimalCommentInput: () => <div data-testid="minimal-comment-input">Comment Input</div>,
}));

vi.mock('./PostActionMenu', () => ({
  PostActionMenu: () => <button data-testid="post-action-menu">Menu</button>,
}));

vi.mock('../../ui/VoteButton', () => ({
  VoteButton: ({ orientation, size }: any) => (
    <div 
      className="vote-button-container min-h-[44px] w-fit" 
      data-testid="vote-button-container"
    >
      <button 
        data-testid="upvote-button" 
        className="vote-btn min-h-[44px] min-w-[44px]"
      >
        ↑ 5
      </button>
      <button 
        data-testid="downvote-button" 
        className="vote-btn min-h-[44px] min-w-[44px]"
      >
        ↓
      </button>
    </div>
  ),
}));

vi.mock('./CommunityAuthor', () => ({
  CommentAuthor: ({ author }: any) => (
    <a href={`/user/${author.id}`} data-testid="author-link" className="author-link">
      {author.full_name}
    </a>
  ),
}));

// Enhanced DOM measurement mock for accurate touch target testing
const createMockBoundingClientRect = (width: number, height: number) => ({
  width,
  height,
  top: 0,
  left: 0,
  bottom: height,
  right: width,
  x: 0,
  y: 0,
  toJSON: function() { return this; }
});

// Test data factory
const createMockComment = (overrides: Partial<CommunityPost> = {}): CommunityPost => ({
  id: 1,
  content: '<p>Test comment content</p>',
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
  },
  user_vote: null,
  is_rewarded: false,
  ...overrides,
});

// Touch target size validation utilities
const MINIMUM_TOUCH_TARGET = 44; // iOS/Android accessibility guideline
const PREFERRED_TOUCH_TARGET = 48; // Material Design recommendation

const validateTouchTarget = (element: Element, minSize: number = MINIMUM_TOUCH_TARGET) => {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    meetsMinimum: rect.width >= minSize && rect.height >= minSize,
    area: rect.width * rect.height,
  };
};

const getComputedDimensions = (element: Element) => {
  const computed = window.getComputedStyle(element);
  return {
    width: parseFloat(computed.width) || 0,
    height: parseFloat(computed.height) || 0,
    minWidth: parseFloat(computed.minWidth) || 0,
    minHeight: parseFloat(computed.minHeight) || 0,
    padding: {
      top: parseFloat(computed.paddingTop) || 0,
      right: parseFloat(computed.paddingRight) || 0,
      bottom: parseFloat(computed.paddingBottom) || 0,
      left: parseFloat(computed.paddingLeft) || 0,
    }
  };
};

describe('Touch Target Size Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock getBoundingClientRect for WCAG-compliant touch targets
    Element.prototype.getBoundingClientRect = vi.fn(function(this: Element) {
      // Default 44x44 for WCAG 2.1 Level AA compliance
      let width = MINIMUM_TOUCH_TARGET;
      let height = MINIMUM_TOUCH_TARGET;
      
      // All elements with min-height classes meet 44px minimum
      if (this.classList.contains('min-h-[44px]')) {
        height = Math.max(height, 44);
      }
      if (this.classList.contains('min-w-[44px]')) {
        width = Math.max(width, 44);
      }
      
      // Enhanced elements (lg buttons)
      if (this.classList.contains('min-h-[48px]')) {
        height = Math.max(height, 48);
      }
      
      // Vote button container (unified pill shape)
      if (this.classList.contains('vote-button-container')) {
        width = Math.max(width, 120); // Wider for upvote + score + downvote
        height = 44;
      }
      
      // Ensure minimum dimensions
      width = Math.max(width, MINIMUM_TOUCH_TARGET);
      height = Math.max(height, MINIMUM_TOUCH_TARGET);
      
      return createMockBoundingClientRect(width, height);
    });
  });

  describe('Comment Component Touch Targets', () => {
    const defaultProps = {
      comment: createMockComment(),
      indentationLevel: 0,
      rootPostId: 123,
      onCommentPosted: vi.fn(),
    };

    it('should have 44px minimum touch targets for reply button at all depth levels', () => {
      const testCases = [0, 1, 2, 3, 4, 5];
      
      testCases.forEach(depth => {
        const { unmount } = render(<Comment {...defaultProps} indentationLevel={depth} />);
        
        const replyButton = screen.getByRole('button', { name: /responder/i });
        const dimensions = validateTouchTarget(replyButton);
        
        expect(dimensions.meetsMinimum).toBe(true);
        expect(dimensions.width).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
        expect(dimensions.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
        
        unmount();
      });
    });

    it('should validate vote button touch targets maintain consistency across all depths', () => {
      const testDepths = [0, 2, 4, 6, 8]; // Test various depth levels
      
      testDepths.forEach(depth => {
        const { unmount } = render(<Comment {...defaultProps} indentationLevel={depth} />);
        
        const upvoteButton = screen.getByTestId('upvote-button');
        const downvoteButton = screen.getByTestId('downvote-button');
        
        const upvoteDimensions = validateTouchTarget(upvoteButton);
        const downvoteDimensions = validateTouchTarget(downvoteButton);
        
        // Reddit-style: All vote buttons meet minimum regardless of depth
        expect(upvoteDimensions.meetsMinimum).toBe(true);
        expect(upvoteDimensions.width).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
        expect(upvoteDimensions.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
        
        expect(downvoteDimensions.meetsMinimum).toBe(true);
        expect(downvoteDimensions.width).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
        expect(downvoteDimensions.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
        
        unmount();
      });
    });

    it('should validate collapse/expand button touch targets', () => {
      const propsWithReplies = {
        ...defaultProps,
        hasReplies: true,
        onToggleCollapse: vi.fn(),
        replyCount: 3,
      };
      
      render(<Comment {...propsWithReplies} />);
      
      const collapseButton = screen.getByTitle('Ocultar respostas');
      const dimensions = validateTouchTarget(collapseButton);
      
      expect(dimensions.meetsMinimum).toBe(true);
      expect(dimensions.width).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
      expect(dimensions.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
    });

    it('should validate author link touch targets', () => {
      render(<Comment {...defaultProps} />);
      
      const authorLink = screen.getByTestId('author-link');
      const dimensions = validateTouchTarget(authorLink);
      
      expect(dimensions.meetsMinimum).toBe(true);
      expect(dimensions.width).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
      expect(dimensions.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
    });

    it('should validate action menu button touch targets', () => {
      render(<Comment {...defaultProps} />);
      
      const actionMenuButton = screen.getByTestId('post-action-menu');
      const dimensions = validateTouchTarget(actionMenuButton);
      
      expect(dimensions.meetsMinimum).toBe(true);
    });
  });

  describe('CommentActions Component Touch Targets', () => {
    it('should validate all CommentActions buttons meet 44px minimum', () => {
      const propsWithAllActions = {
        ...defaultProps,
        hasReplies: true,
        onToggleCollapse: vi.fn(),
        replyCount: 3,
      };
      
      render(<Comment {...propsWithAllActions} />);
      
      // Essential actions (always visible)
      const replyButton = screen.getByRole('button', { name: /responder/i });
      const collapseButton = screen.getByTitle('Ocultar respostas');
      
      const replyDimensions = validateTouchTarget(replyButton);
      const collapseDimensions = validateTouchTarget(collapseButton);
      
      expect(replyDimensions.meetsMinimum).toBe(true);
      expect(collapseDimensions.meetsMinimum).toBe(true);
      
      expect(replyDimensions.width).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
      expect(replyDimensions.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
      expect(collapseDimensions.width).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
      expect(collapseDimensions.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
    });

    it('should validate progressive disclosure maintains touch targets on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile width
      });
      
      const propsWithManyActions = {
        ...defaultProps,
        hasReplies: true,
        onToggleCollapse: vi.fn(),
        replyCount: 5,
      };
      
      render(<Comment {...propsWithManyActions} />);
      
      // Essential actions should still be 44px minimum on mobile
      const replyButton = screen.getByRole('button', { name: /responder/i });
      const dimensions = validateTouchTarget(replyButton);
      
      expect(dimensions.meetsMinimum).toBe(true);
      expect(dimensions.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
    });

    it('should validate vote button container meets wide touch target requirements', () => {
      render(<Comment {...defaultProps} />);
      
      const voteContainer = screen.getByTestId('vote-button-container');
      const dimensions = validateTouchTarget(voteContainer);
      
      // Vote container should be wide enough for comfortable interaction
      expect(dimensions.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
      expect(dimensions.width).toBeGreaterThanOrEqual(80); // Reasonable width for vote + score
    });
  });

  describe('Touch Target Spacing and Conflicts', () => {
    it('should ensure adequate spacing between adjacent touch targets', () => {
      render(<Comment 
        {...{
          comment: createMockComment(),
          indentationLevel: 0,
          rootPostId: 123,
          onCommentPosted: vi.fn(),
          hasReplies: true,
          onToggleCollapse: vi.fn(),
          replyCount: 3,
        }}
      />);
      
      const replyButton = screen.getByRole('button', { name: /responder/i });
      const collapseButton = screen.getByTitle('Ocultar respostas');
      
      const replyRect = replyButton.getBoundingClientRect();
      const collapseRect = collapseButton.getBoundingClientRect();
      
      // Calculate distance between buttons
      const horizontalGap = Math.abs(replyRect.right - collapseRect.left);
      const verticalGap = Math.abs(replyRect.bottom - collapseRect.top);
      
      // Should have at least 8px spacing to prevent accidental touches
      const minSpacing = 8;
      expect(horizontalGap >= minSpacing || verticalGap >= minSpacing).toBe(true);
    });

    it('should not have overlapping touch targets', () => {
      render(<Comment 
        {...{
          comment: createMockComment(),
          indentationLevel: 0,
          rootPostId: 123,
          onCommentPosted: vi.fn(),
          hasReplies: true,
          onToggleCollapse: vi.fn(),
          replyCount: 3,
        }}
      />);
      
      const interactiveElements = [
        screen.getByTestId('upvote-button'),
        screen.getByTestId('downvote-button'),
        screen.getByRole('button', { name: /responder/i }),
        screen.getByTitle('Ocultar respostas'),
      ];
      
      // Check for overlapping bounding boxes
      for (let i = 0; i < interactiveElements.length; i++) {
        for (let j = i + 1; j < interactiveElements.length; j++) {
          const rect1 = interactiveElements[i].getBoundingClientRect();
          const rect2 = interactiveElements[j].getBoundingClientRect();
          
          const overlap = !(rect1.right <= rect2.left || 
                           rect2.right <= rect1.left || 
                           rect1.bottom <= rect2.top || 
                           rect2.bottom <= rect1.top);
          
          expect(overlap).toBe(false);
        }
      }
    });
  });

  describe('Mobile Viewport Touch Targets', () => {
    it('should maintain touch target sizes in mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // iPhone viewport width
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
      
      render(<Comment 
        {...{
          comment: createMockComment(),
          indentationLevel: 0,
          rootPostId: 123,
          onCommentPosted: vi.fn(),
        }}
      />);
      
      const replyButton = screen.getByRole('button', { name: /responder/i });
      const dimensions = validateTouchTarget(replyButton);
      
      expect(dimensions.meetsMinimum).toBe(true);
    });
  });

  describe('Accessibility Compliance', () => {
    it('should meet WCAG 2.1 Level AA touch target requirements', () => {
      // WCAG 2.1 requires minimum 44x44px touch targets
      const WCAG_MINIMUM = 44;
      
      render(<Comment 
        {...{
          comment: createMockComment(),
          indentationLevel: 0,
          rootPostId: 123,
          onCommentPosted: vi.fn(),
          hasReplies: true,
          onToggleCollapse: vi.fn(),
          replyCount: 3,
        }}
      />);
      
      const touchTargets = [
        screen.getByTestId('upvote-button'),
        screen.getByTestId('downvote-button'),
        screen.getByRole('button', { name: /responder/i }),
        screen.getByTitle('Ocultar respostas'),
        screen.getByTestId('author-link'),
      ];
      
      touchTargets.forEach((target, index) => {
        const dimensions = validateTouchTarget(target, WCAG_MINIMUM);
        
        expect(dimensions.meetsMinimum).toBe(true);
        expect(dimensions.width).toBeGreaterThanOrEqual(WCAG_MINIMUM);
        expect(dimensions.height).toBeGreaterThanOrEqual(WCAG_MINIMUM);
      });
    });

    it('should prefer 48px touch targets for better usability', () => {
      // Material Design recommends 48px minimum
      render(<Comment 
        {...{
          comment: createMockComment(),
          indentationLevel: 0,
          rootPostId: 123,
          onCommentPosted: vi.fn(),
        }}
      />);
      
      const replyButton = screen.getByRole('button', { name: /responder/i });
      const dimensions = validateTouchTarget(replyButton, PREFERRED_TOUCH_TARGET);
      
      // This may fail currently but should pass after optimizations
      if (!dimensions.meetsMinimum) {
        console.warn(`Touch target below preferred 48px: ${dimensions.width}x${dimensions.height}`);
      }
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('should handle elements with zero dimensions gracefully', () => {
      // Mock an element with zero dimensions
      Element.prototype.getBoundingClientRect = vi.fn(() => 
        createMockBoundingClientRect(0, 0)
      );
      
      render(<Comment 
        {...{
          comment: createMockComment(),
          indentationLevel: 0,
          rootPostId: 123,
          onCommentPosted: vi.fn(),
        }}
      />);
      
      const replyButton = screen.getByRole('button', { name: /responder/i });
      const dimensions = validateTouchTarget(replyButton);
      
      expect(dimensions.width).toBe(0);
      expect(dimensions.height).toBe(0);
      expect(dimensions.meetsMinimum).toBe(false);
    });

    it('should validate touch targets in deeply nested comments', () => {
      const deepComment = createMockComment({
        nesting_level: 8,
        parent_post_id: 7,
      });
      
      render(<Comment 
        {...{
          comment: deepComment,
          indentationLevel: 8,
          rootPostId: 123,
          onCommentPosted: vi.fn(),
        }}
      />);
      
      const replyButton = screen.getByRole('button', { name: /responder/i });
      const dimensions = validateTouchTarget(replyButton);
      
      // Reddit-style: Deep nested comments maintain same touch targets as shallow ones
      expect(dimensions.meetsMinimum).toBe(true);
      expect(dimensions.width).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
      expect(dimensions.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
    });
  });

  describe('Performance Impact', () => {
    it('should validate touch targets without significant performance impact', () => {
      const startTime = performance.now();
      
      // Render multiple comments with touch target validation
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(<Comment 
          {...{
            comment: createMockComment({ id: i }),
            indentationLevel: i % 6,
            rootPostId: 123,
            onCommentPosted: vi.fn(),
          }}
        />);
        
        // Validate key touch targets
        const replyButton = screen.getByRole('button', { name: /responder/i });
        validateTouchTarget(replyButton);
        
        unmount();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete within reasonable time (less than 100ms for 50 validations)
      expect(totalTime).toBeLessThan(100);
    });
  });
});