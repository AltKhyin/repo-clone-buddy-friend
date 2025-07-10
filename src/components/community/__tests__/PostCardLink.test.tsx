// ABOUTME: Tests for PostCard component ensuring Link post type display works correctly.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { PostCard } from '../PostCard';
import type { CommunityPost } from '@/types/community';

// Mock dependencies
vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user' },
  }),
}));

vi.mock('../theme/CustomThemeProvider', () => ({
  useTheme: () => ({
    actualTheme: 'light',
  }),
}));

vi.mock('../../../packages/hooks/useSavePostMutation', () => ({
  useSavePostMutation: () => ({
    mutateAsync: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/lib/video-utils', () => ({
  processVideoUrl: vi.fn(url => url),
  getVideoType: vi.fn(() => 'youtube'),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('PostCard - Link Posts', () => {
  const baseLinkPost: CommunityPost = {
    id: 1,
    title: 'Check out this interesting article',
    content: 'This article has some great insights on modern web development.',
    category: 'tecnologia-saude',
    post_type: 'link',
    link_url: 'https://example.com/article',
    link_preview_data: {
      url: 'https://example.com/article',
      title: 'Modern Web Development Best Practices',
      description: 'Learn about the latest trends and techniques in web development.',
      image: 'https://example.com/image.jpg',
      siteName: 'Tech Blog',
      domain: 'example.com',
      favicon: 'https://example.com/favicon.ico',
    },
    upvotes: 5,
    downvotes: 1,
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
    author: {
      id: 'author-1',
      full_name: 'John Doe',
      avatar_url: 'https://example.com/avatar.jpg',
    },
    reply_count: 3,
    user_vote: null,
    is_saved: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays link preview with all metadata', () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <PostCard post={baseLinkPost} />
      </Wrapper>
    );

    // Check main post content
    expect(screen.getByText('Check out this interesting article')).toBeInTheDocument();
    expect(screen.getByText(/this article has some great insights/i)).toBeInTheDocument();

    // Check link preview content
    expect(screen.getByText('Modern Web Development Best Practices')).toBeInTheDocument();
    expect(screen.getByText(/learn about the latest trends/i)).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('Tech Blog')).toBeInTheDocument();

    // Check preview image
    const previewImage = screen.getByAltText('Link preview');
    expect(previewImage).toBeInTheDocument();
    expect(previewImage).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('displays external link badge with domain', () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <PostCard post={baseLinkPost} />
      </Wrapper>
    );

    // Should show external link badge
    const badge = screen.getByText('example.com');
    expect(badge).toBeInTheDocument();

    // Badge should be within a link preview section
    const linkPreview = badge.closest('div');
    expect(linkPreview).toBeInTheDocument();
  });

  it('opens link in new tab when clicked', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();

    // Mock window.open
    const mockOpen = vi.fn();
    Object.defineProperty(window, 'open', {
      value: mockOpen,
      writable: true,
    });

    render(
      <Wrapper>
        <PostCard post={baseLinkPost} />
      </Wrapper>
    );

    // Find the link element
    const linkElement = screen.getByText('Modern Web Development Best Practices').closest('a');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', 'https://example.com/article');
    expect(linkElement).toHaveAttribute('target', '_blank');
    expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('handles link post without preview data', () => {
    const linkPostWithoutPreview: CommunityPost = {
      ...baseLinkPost,
      link_preview_data: undefined,
    };

    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <PostCard post={linkPostWithoutPreview} />
      </Wrapper>
    );

    // Should still show the link URL
    expect(screen.getByText('example.com')).toBeInTheDocument();

    // Should have link that goes to the URL
    const linkElement = screen.getByText('example.com').closest('a');
    expect(linkElement).toHaveAttribute('href', 'https://example.com/article');
  });

  it('handles broken preview images gracefully', () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <PostCard post={baseLinkPost} />
      </Wrapper>
    );

    const previewImage = screen.getByAltText('Link preview');

    // Simulate image load error
    const errorEvent = new Event('error');
    previewImage.dispatchEvent(errorEvent);

    // Image should be hidden
    expect(previewImage.style.display).toBe('none');
  });

  it('displays fallback text for invalid URL', () => {
    const linkPostWithInvalidUrl: CommunityPost = {
      ...baseLinkPost,
      link_url: 'not-a-valid-url',
      link_preview_data: undefined,
    };

    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <PostCard post={linkPostWithInvalidUrl} />
      </Wrapper>
    );

    // Should show fallback text
    expect(screen.getByText('Link externo')).toBeInTheDocument();
  });

  it('prioritizes preview data domain over parsed URL domain', () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <PostCard post={baseLinkPost} />
      </Wrapper>
    );

    // Should show domain from preview data, not parsed from URL
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('handles link post with only URL (no preview data)', () => {
    const linkPostUrlOnly: CommunityPost = {
      ...baseLinkPost,
      link_preview_data: undefined,
    };

    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <PostCard post={linkPostUrlOnly} />
      </Wrapper>
    );

    // Should still render link section
    const linkElement = screen.getByText('example.com').closest('a');
    expect(linkElement).toHaveAttribute('href', 'https://example.com/article');
  });

  it('shows proper styling for pinned link posts', () => {
    const pinnedLinkPost: CommunityPost = {
      ...baseLinkPost,
      is_pinned: true,
    };

    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <PostCard post={pinnedLinkPost} />
      </Wrapper>
    );

    // Should have pinned styling classes
    const postElement = screen.getByText('Check out this interesting article').closest('div');
    expect(postElement).toHaveClass('pinned-post');
  });

  it('prevents event bubbling when clicking on link preview', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();

    // Mock useNavigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });

    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <PostCard post={baseLinkPost} />
      </Wrapper>
    );

    // Click on the link preview
    const linkPreview = screen.getByText('Modern Web Development Best Practices');
    await user.click(linkPreview);

    // Should not navigate to post detail (event should be stopped)
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('displays partial preview data correctly', () => {
    const linkPostPartialPreview: CommunityPost = {
      ...baseLinkPost,
      link_preview_data: {
        url: 'https://example.com/article',
        title: 'Article Title',
        domain: 'example.com',
        // Missing description, image, siteName
      },
    };

    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <PostCard post={linkPostPartialPreview} />
      </Wrapper>
    );

    // Should show available data
    expect(screen.getByText('Article Title')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();

    // Should not crash or show undefined values
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
  });
});
