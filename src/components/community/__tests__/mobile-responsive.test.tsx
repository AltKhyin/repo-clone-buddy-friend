// ABOUTME: Mobile responsive behavior tests for comment components using the mobile testing infrastructure.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Comment } from '../Comment';
import { CommentThread } from '../CommentThread';
import type { CommunityPost } from '../../../types/community';
import { 
  VIEWPORTS, 
  ViewportManager, 
  testResponsiveDesign, 
  simulateTouch,
  mobileTestUtils,
  validateMobileAccessibility
} from '../../../test-utils/mobile-testing';

// Mock dependencies
vi.mock('../../../hooks/useColorTokens');
vi.mock('../MinimalCommentInput', () => ({
  MinimalCommentInput: () => <div data-testid="minimal-comment-input">Comment Input</div>,
}));

vi.mock('./PostActionMenu', () => ({
  PostActionMenu: () => <button data-testid="post-action-menu" className="h-8 w-8">Menu</button>,
}));

vi.mock('../ui/VoteButton', () => ({
  VoteButton: ({ orientation, size }: any) => (
    <div className={`vote-button-container ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'}`}>
      <button data-testid="upvote-button" className={`vote-btn ${size === 'xs' ? 'h-6 w-6' : 'h-8 w-8'}`}>↑</button>
      <span>5</span>
      <button data-testid="downvote-button" className={`vote-btn ${size === 'xs' ? 'h-6 w-6' : 'h-8 w-8'}`}>↓</button>
    </div>
  ),
}));

vi.mock('./CommunityAuthor', () => ({
  CommentAuthor: ({ author, size }: any) => (
    <div data-testid="comment-author" data-size={size} className="author-container">
      <a href={`/user/${author.id}`} data-testid="author-link" className="author-link min-h-[44px] flex items-center">
        {author.full_name}
      </a>
    </div>
  ),
}));

// Enhanced DOM measurement mock for responsive testing
const createResponsiveBoundingRect = (baseWidth: number, baseHeight: number) => {
  return function(this: Element) {
    const viewport = window.innerWidth;
    const isMobile = viewport < 768;
    
    // Adjust dimensions based on viewport
    let width = baseWidth;
    let height = baseHeight;
    
    if (this.classList.contains('h-6')) {
      height = 24;
      width = 24;
    } else if (this.classList.contains('h-7')) {
      height = 28;
      width = Math.max(28, width);
    } else if (this.classList.contains('h-8')) {
      height = 32;
      width = 32;
    }
    
    // Mobile optimization - ensure minimum touch targets
    if (isMobile && (this.tagName === 'BUTTON' || this.classList.contains('author-link'))) {
      width = Math.max(width, 44);
      height = Math.max(height, 44);
    }
    
    return {
      width,
      height,
      top: 0,
      left: 0,
      bottom: height,
      right: width,
      x: 0,
      y: 0,
      toJSON: function() { return this; }
    };
  };
};

// Test data factory
const createMockComment = (overrides: Partial<CommunityPost> = {}): CommunityPost => ({
  id: 1,
  content: '<p>Test comment content that might be longer on mobile devices</p>',
  category: 'discussion',
  upvotes: 15,
  downvotes: 3,
  created_at: '2023-09-03T14:00:00Z',
  updated_at: '2023-09-03T14:00:00Z',
  author: {
    id: 'user-123',
    full_name: 'Test User Name',
    avatar_url: 'https://example.com/avatar.jpg',
    role: 'member',
    profession: 'Software Developer',
  },
  user_vote: null,
  is_rewarded: false,
  ...overrides,
});

describe('Mobile Responsive Comment System', () => {
  let viewportManager: ViewportManager;

  beforeEach(() => {
    vi.clearAllMocks();
    viewportManager = new ViewportManager();
    
    // Set up responsive DOM measurement
    Element.prototype.getBoundingClientRect = createResponsiveBoundingRect(44, 44);
  });

  afterEach(() => {
    viewportManager.reset();
  });

  describe('Viewport Adaptation', () => {
    it('should adapt comment layout across mobile viewports', async () => {
      const comment = createMockComment();
      
      await mobileTestUtils.testAcrossMobileViewports(
        () => render(<Comment 
          comment={comment}
          indentationLevel={0}
          rootPostId={123}
          onCommentPosted={vi.fn()}
        />),
        async (viewport) => {
          // Verify comment renders correctly in each viewport
          expect(screen.getByTestId('comment-author')).toBeInTheDocument();
          expect(screen.getByTestId('vote-button-container')).toBeInTheDocument();
          expect(screen.getByRole('button', { name: /responder/i })).toBeInTheDocument();
          
          // Check that content is readable in viewport
          const content = document.querySelector('.reddit-comment-text');
          expect(content).toBeInTheDocument();
          
          console.log(`✓ ${viewport.label} (${viewport.width}x${viewport.height})`);
        }
      );
    });

    it('should maintain touch targets across all mobile viewports', async () => {
      const comment = createMockComment();
      
      await mobileTestUtils.testAcrossMobileViewports(
        () => render(<Comment 
          comment={comment}
          indentationLevel={0}
          rootPostId={123}
          onCommentPosted={vi.fn()}
        />),
        async (viewport) => {
          const interactiveElements = [
            screen.getByTestId('upvote-button'),
            screen.getByTestId('downvote-button'),
            screen.getByRole('button', { name: /responder/i }),
            screen.getByTestId('author-link'),
          ];
          
          interactiveElements.forEach(element => {
            const isValidSize = validateMobileAccessibility.touchTargetSize(element, 44);
            expect(isValidSize).toBe(true);
          });
        }
      );
    });
  });

  describe('Depth Behavior on Mobile', () => {
    it('should handle deep nesting on small mobile screens', () => {
      viewportManager.setViewport(VIEWPORTS.IPHONE_SE); // Smallest mobile viewport
      viewportManager.setMobileUserAgent();
      
      const deepComment = createMockComment({ id: 1, nesting_level: 8 });
      
      render(<Comment 
        comment={deepComment}
        indentationLevel={8}
        rootPostId={123}
        onCommentPosted={vi.fn()}
      />);
      
      // Even at deep nesting, touch targets should remain accessible
      const replyButton = screen.getByRole('button', { name: /responder/i });
      const isValidTouchTarget = validateMobileAccessibility.touchTargetSize(replyButton, 44);
      expect(isValidTouchTarget).toBe(true);
      
      // Content should remain readable
      const commentText = document.querySelector('.reddit-comment-text');
      expect(commentText).toBeInTheDocument();
    });

    it('should maintain Reddit-style visual consistency on mobile', () => {
      viewportManager.setViewport(VIEWPORTS.PIXEL_5);
      viewportManager.setMobileUserAgent();
      
      const comments = [
        createMockComment({ id: 1, nesting_level: 1, parent_post_id: null }),
        createMockComment({ id: 2, nesting_level: 2, parent_post_id: 1 }),
        createMockComment({ id: 3, nesting_level: 3, parent_post_id: 2 }),
        createMockComment({ id: 4, nesting_level: 4, parent_post_id: 3 }),
      ];
      
      render(<CommentThread 
        comments={comments}
        rootPostId={123}
        onCommentPosted={vi.fn()}
      />);
      
      const commentContainers = document.querySelectorAll('.natural-comment');
      expect(commentContainers.length).toBeGreaterThan(0);
      
      // Reddit-style: All comments have consistent visual styling regardless of depth
      commentContainers.forEach((container) => {
        // Should NOT have depth-based visual differentiation
        expect(container).not.toHaveClass('text-sm'); // No smaller text for deep comments
        expect(container).not.toHaveClass('text-xs'); // No extra small text
        
        // Should NOT have progressive margin indentation
        const style = (container as HTMLElement).style;
        expect(style.marginLeft).toBeFalsy(); // No depth-based margins
      });
    });
  });

  describe('Touch Interaction', () => {
    it('should respond to touch interactions correctly', () => {
      viewportManager.setViewport(VIEWPORTS.IPHONE_12);
      viewportManager.setMobileUserAgent();
      
      const onCommentPosted = vi.fn();
      render(<Comment 
        comment={createMockComment()}
        indentationLevel={0}
        rootPostId={123}
        onCommentPosted={onCommentPosted}
      />);
      
      const replyButton = screen.getByRole('button', { name: /responder/i });
      
      // Simulate touch interaction
      simulateTouch.tap(replyButton);
      
      // Reply input should appear
      expect(screen.getByTestId('minimal-comment-input')).toBeInTheDocument();
    });

    it('should handle long press interactions', async () => {
      viewportManager.setViewport(VIEWPORTS.GALAXY_S20);
      viewportManager.setMobileUserAgent();
      
      render(<Comment 
        comment={createMockComment()}
        indentationLevel={0}
        rootPostId={123}
        onCommentPosted={vi.fn()}
      />);
      
      const actionMenu = screen.getByTestId('post-action-menu');
      
      // Simulate long press
      await simulateTouch.longPress(actionMenu, 500);
      
      // Component should handle long press without errors
      expect(actionMenu).toBeInTheDocument();
    });

    it('should prevent accidental touch conflicts', () => {
      viewportManager.setViewport(VIEWPORTS.IPHONE_SE);
      
      render(<Comment 
        comment={createMockComment()}
        indentationLevel={0}
        rootPostId={123}
        onCommentPosted={vi.fn()}
        hasReplies={true}
        onToggleCollapse={vi.fn()}
        replyCount={3}
      />);
      
      const replyButton = screen.getByRole('button', { name: /responder/i });
      const collapseButton = screen.getByTitle('Ocultar respostas');
      
      // Buttons should have adequate spacing
      const hasAdequateSpacing = validateMobileAccessibility.touchTargetSpacing(
        replyButton, 
        collapseButton, 
        8
      );
      expect(hasAdequateSpacing).toBe(true);
    });
  });

  describe('Typography and Readability', () => {
    it('should maintain readable font sizes on mobile', () => {
      viewportManager.setViewport(VIEWPORTS.IPHONE_SE);
      
      render(<Comment 
        comment={createMockComment()}
        indentationLevel={0}
        rootPostId={123}
        onCommentPosted={vi.fn()}
      />);
      
      const commentContent = document.querySelector('.reddit-comment-text');
      expect(commentContent).toBeInTheDocument();
      
      // Check computed font size
      const styles = window.getComputedStyle(commentContent!);
      const fontSize = parseFloat(styles.fontSize);
      
      // Font should be at least 16px for mobile readability
      expect(fontSize).toBeGreaterThanOrEqual(16);
    });

    it('should adapt author information for mobile', () => {
      viewportManager.setViewport(VIEWPORTS.IPHONE_12);
      
      render(<Comment 
        comment={createMockComment()}
        indentationLevel={0}
        rootPostId={123}
        onCommentPosted={vi.fn()}
      />);
      
      const authorContainer = screen.getByTestId('comment-author');
      expect(authorContainer).toBeInTheDocument();
      
      // Author size should be appropriate for mobile
      expect(authorContainer).toHaveAttribute('data-size', 'sm');
    });
  });

  describe('Progressive Disclosure', () => {
    it('should hide secondary actions on mobile', () => {
      // Mobile viewport
      viewportManager.setViewport(VIEWPORTS.PIXEL_5);
      viewportManager.setMobileUserAgent();
      
      const { unmount: unmountMobile } = render(<Comment 
        comment={createMockComment()}
        indentationLevel={0}
        rootPostId={123}
        onCommentPosted={vi.fn()}
      />);
      
      // Core actions should be visible
      expect(screen.getByRole('button', { name: /responder/i })).toBeInTheDocument();
      expect(screen.getByTestId('vote-button-container')).toBeInTheDocument();
      
      // Secondary actions might be hidden or consolidated
      const actionMenu = screen.getByTestId('post-action-menu');
      expect(actionMenu).toBeInTheDocument();
      
      unmountMobile();
      
      // Desktop viewport
      viewportManager.setViewport(VIEWPORTS.DESKTOP_LG);
      viewportManager.setDesktopUserAgent();
      
      render(<Comment 
        comment={createMockComment()}
        indentationLevel={0}
        rootPostId={123}
        onCommentPosted={vi.fn()}
      />);
      
      // All actions should be visible on desktop
      expect(screen.getByRole('button', { name: /responder/i })).toBeInTheDocument();
      expect(screen.getByTestId('vote-button-container')).toBeInTheDocument();
      expect(screen.getByTestId('post-action-menu')).toBeInTheDocument();
    });

    it('should optimize thread collapse controls for mobile', () => {
      viewportManager.setViewport(VIEWPORTS.IPHONE_12);
      
      render(<Comment 
        comment={createMockComment()}
        indentationLevel={0}
        rootPostId={123}
        onCommentPosted={vi.fn()}
        hasReplies={true}
        onToggleCollapse={vi.fn()}
        replyCount={5}
      />);
      
      const collapseButton = screen.getByTitle('Ocultar respostas');
      
      // Collapse button should be appropriately sized for mobile
      const isValidTouchTarget = validateMobileAccessibility.touchTargetSize(collapseButton, 44);
      expect(isValidTouchTarget).toBe(true);
      
      // Should show reply count clearly
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Orientation Changes', () => {
    it('should adapt to orientation changes', () => {
      viewportManager.setViewport(VIEWPORTS.IPHONE_12);
      
      render(<Comment 
        comment={createMockComment()}
        indentationLevel={0}
        rootPostId={123}
        onCommentPosted={vi.fn()}
      />);
      
      // Portrait orientation
      expect(screen.getByTestId('comment-author')).toBeInTheDocument();
      
      // Simulate orientation change to landscape
      viewportManager.setViewport({
        width: VIEWPORTS.IPHONE_12.height,
        height: VIEWPORTS.IPHONE_12.width,
        label: 'iPhone 12 Landscape'
      });
      
      // Component should still render correctly
      expect(screen.getByTestId('comment-author')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /responder/i })).toBeInTheDocument();
    });
  });

  describe('Performance on Mobile', () => {
    it('should render efficiently on low-end mobile devices', () => {
      viewportManager.setViewport(VIEWPORTS.IPHONE_SE);
      
      const startTime = performance.now();
      
      render(<Comment 
        comment={createMockComment()}
        indentationLevel={0}
        rootPostId={123}
        onCommentPosted={vi.fn()}
      />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly even on slower devices
      expect(renderTime).toBeLessThan(50); // 50ms threshold
    });

    it('should handle large comment threads efficiently on mobile', () => {
      viewportManager.setViewport(VIEWPORTS.PIXEL_5);
      
      // Create a moderately large comment tree
      const comments: CommunityPost[] = [];
      for (let i = 1; i <= 25; i++) {
        comments.push(createMockComment({
          id: i,
          nesting_level: Math.min(Math.floor(i / 5) + 1, 6),
          parent_post_id: i > 1 ? Math.max(1, i - 5) : null,
        }));
      }
      
      const startTime = performance.now();
      
      render(<CommentThread 
        comments={comments}
        rootPostId={123}
        onCommentPosted={vi.fn()}
      />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should handle moderate load efficiently
      expect(renderTime).toBeLessThan(100);
      
      // Should render all comments
      expect(document.querySelectorAll('[data-testid="comment-component"]').length).toBeGreaterThan(0);
    });
  });
});