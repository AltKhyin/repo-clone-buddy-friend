// ABOUTME: Tests for PostDetailCard component ensuring link preview display and other post type functionality.

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostDetailCard } from '../PostDetailCard';
import type { CommunityPost } from '@/types';

// Mock dependencies
vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user', user_metadata: { full_name: 'Test User' } },
  }),
}));

vi.mock('../../../packages/hooks/useSavePostMutation', () => ({
  useSavePostMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../theme/CustomThemeProvider', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('../PostActionMenu', () => ({
  PostActionMenu: () => null,
}));

vi.mock('../PollDisplay', () => ({
  PollDisplay: () => null,
}));

vi.mock('../../lib/video-utils', () => ({
  processVideoUrl: vi.fn(url => url),
  getVideoType: vi.fn(() => 'youtube'),
}));

vi.mock('../ui/VoteButton', () => ({
  VoteButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../CommunityAuthor', () => ({
  PostAuthor: ({ author }: { author: any }) => <div>{author.full_name}</div>,
}));

const mockPost: CommunityPost = {
  id: 1,
  title: 'Test Post',
  content: 'Test content',
  category: 'discussao-geral',
  post_type: 'text',
  upvotes: 5,
  downvotes: 1,
  created_at: '2025-07-12T10:00:00Z',
  is_pinned: false,
  is_locked: false,
  reply_count: 3,
  author: {
    id: 'author-id',
    full_name: 'Author Name',
    avatar_url: null,
  },
  user_vote: null,
  is_saved: false,
  flair_text: null,
  flair_color: null,
  image_url: null,
  video_url: null,
  poll_data: null,
  link_url: null,
  link_preview_data: null,
};

describe('PostDetailCard', () => {
  it('should render basic post information', () => {
    render(<PostDetailCard post={mockPost} />);

    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByText('Author Name')).toBeInTheDocument();
  });

  it('should display link preview for link posts with preview data', () => {
    const linkPost: CommunityPost = {
      ...mockPost,
      post_type: 'link',
      link_url: 'https://example.com',
      link_preview_data: {
        url: 'https://example.com',
        title: 'Example Title',
        description: 'Example description',
        domain: 'example.com',
        image: 'https://example.com/image.jpg',
      },
    };

    render(<PostDetailCard post={linkPost} />);

    expect(screen.getByText('Example Title')).toBeInTheDocument();
    expect(screen.getByText('Example description')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com');
  });

  it('should display fallback for link posts without preview data', () => {
    const linkPost: CommunityPost = {
      ...mockPost,
      post_type: 'link',
      link_url: 'https://example.com',
      link_preview_data: null,
    };

    render(<PostDetailCard post={linkPost} />);

    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com');
  });

  it('should not display link preview for non-link posts', () => {
    render(<PostDetailCard post={mockPost} />);

    expect(screen.queryByText(/example\.com/)).not.toBeInTheDocument();
  });

  it('should display image for image posts', () => {
    const imagePost: CommunityPost = {
      ...mockPost,
      post_type: 'image',
      image_url: 'https://example.com/image.jpg',
    };

    render(<PostDetailCard post={imagePost} />);

    const image = screen.getByAltText('Post image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });
});
