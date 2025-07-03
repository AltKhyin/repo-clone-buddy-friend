// ABOUTME: Tests for ArchivePage with 4-tier access control content filtering integration

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ArchivePage, { ArchivePageContent } from './ArchivePage';
import { createTestQueryClient } from '../test-utils/test-query-client';

// Mock dependencies
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

vi.mock('../../packages/hooks/useAcervoDataQuery', () => ({
  useAcervoDataQuery: vi.fn(),
}));

vi.mock('@/hooks/useContentAccessFilter', () => ({
  useContentAccessFilter: vi.fn(),
}));

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}));

// Mock components
vi.mock('@/components/acervo/ClientSideSorter', () => ({
  ClientSideSorter: ({ children, reviews }: any) => (
    <div data-testid="client-side-sorter">{children({ sortedReviews: reviews })}</div>
  ),
}));

vi.mock('@/components/acervo/MasonryGrid', () => ({
  default: ({ reviews }: any) => (
    <div data-testid="masonry-grid">
      {reviews.map((review: any) => (
        <div key={review.review_id} data-testid={`review-${review.review_id}`}>
          {review.title}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/acervo/TagsPanel', () => ({
  default: () => <div data-testid="tags-panel">Tags Panel</div>,
}));

vi.mock('@/components/acervo/SearchInput', () => ({
  default: () => <div data-testid="search-input">Search Input</div>,
}));

describe('ArchivePage Content Filtering', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockReviews = [
    {
      review_id: 1,
      title: 'Public Review',
      access_level: 'public',
      description: 'Public content',
      published_at: '2023-01-01',
      view_count: 100,
    },
    {
      review_id: 2,
      title: 'Premium Review',
      access_level: 'premium',
      description: 'Premium content',
      published_at: '2023-01-02',
      view_count: 200,
    },
    {
      review_id: 3,
      title: 'Free Review',
      access_level: 'free',
      description: 'Free user content',
      published_at: '2023-01-03',
      view_count: 150,
    },
  ];

  const mockTags = [{ tag_id: 1, name: 'test-tag', category: 'category' }];

  it('should filter reviews based on user access level for free users', async () => {
    const mockUseAcervoDataQuery = await import('../../packages/hooks/useAcervoDataQuery');
    const mockUseContentAccessFilter = await import('@/hooks/useContentAccessFilter');
    const mockUseAuthStore = await import('@/store/auth');

    vi.mocked(mockUseAcervoDataQuery.useAcervoDataQuery).mockReturnValue({
      data: { reviews: mockReviews, tags: mockTags },
      isLoading: false,
      error: null,
    });

    vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
      user: { id: 'user123', app_metadata: { role: 'practitioner' }, subscription_tier: 'free' },
      session: { access_token: 'token123' },
      isLoading: false,
      setSession: vi.fn(),
      initialize: vi.fn(),
    });

    // Mock content filter to return only public and free content for free users
    vi.mocked(mockUseContentAccessFilter.useContentAccessFilter).mockReturnValue({
      filteredContent: [mockReviews[0], mockReviews[2]], // public and free reviews
      userAccessLevel: 'free',
      totalFiltered: 1, // 1 premium review filtered out
      statistics: {
        total: 3,
        accessible: 2,
        filtered: 1,
        byAccessLevel: { public: 1, free: 1, premium: 1, editor_admin: 0 },
      },
      canAccessPremium: false,
      canAccessEditorAdmin: false,
    });

    render(<ArchivePage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('masonry-grid')).toBeInTheDocument();
    });

    // Should show accessible reviews
    expect(screen.getByTestId('review-1')).toBeInTheDocument(); // public
    expect(screen.getByTestId('review-3')).toBeInTheDocument(); // free

    // Should NOT show premium review
    expect(screen.queryByTestId('review-2')).not.toBeInTheDocument();

    // Should show access upgrade prompt for filtered content
    expect(screen.getByTestId('access-upgrade-prompt')).toBeInTheDocument();
    expect(screen.getByText('1 review premium disponível')).toBeInTheDocument();
  });

  it('should show all reviews for premium users', async () => {
    const mockUseAcervoDataQuery = await import('../../packages/hooks/useAcervoDataQuery');
    const mockUseContentAccessFilter = await import('@/hooks/useContentAccessFilter');
    const mockUseAuthStore = await import('@/store/auth');

    vi.mocked(mockUseAcervoDataQuery.useAcervoDataQuery).mockReturnValue({
      data: { reviews: mockReviews, tags: mockTags },
      isLoading: false,
      error: null,
    });

    vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
      user: { id: 'user123', app_metadata: { role: 'practitioner' }, subscription_tier: 'premium' },
      session: { access_token: 'token123' },
      isLoading: false,
      setSession: vi.fn(),
      initialize: vi.fn(),
    });

    // Mock content filter to return all content for premium users
    vi.mocked(mockUseContentAccessFilter.useContentAccessFilter).mockReturnValue({
      filteredContent: mockReviews, // all reviews accessible
      userAccessLevel: 'premium',
      totalFiltered: 0, // no content filtered
      statistics: {
        total: 3,
        accessible: 3,
        filtered: 0,
        byAccessLevel: { public: 1, free: 1, premium: 1, editor_admin: 0 },
      },
      canAccessPremium: true,
      canAccessEditorAdmin: false,
    });

    render(<ArchivePage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('masonry-grid')).toBeInTheDocument();
    });

    // Should show all reviews
    expect(screen.getByTestId('review-1')).toBeInTheDocument(); // public
    expect(screen.getByTestId('review-2')).toBeInTheDocument(); // premium
    expect(screen.getByTestId('review-3')).toBeInTheDocument(); // free

    // Should NOT show access upgrade prompt
    expect(screen.queryByTestId('access-upgrade-prompt')).not.toBeInTheDocument();
  });

  it('should show only public content for anonymous users', async () => {
    const mockUseAcervoDataQuery = await import('../../packages/hooks/useAcervoDataQuery');
    const mockUseContentAccessFilter = await import('@/hooks/useContentAccessFilter');
    const mockUseAuthStore = await import('@/store/auth');

    vi.mocked(mockUseAcervoDataQuery.useAcervoDataQuery).mockReturnValue({
      data: { reviews: mockReviews, tags: mockTags },
      isLoading: false,
      error: null,
    });

    vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      setSession: vi.fn(),
      initialize: vi.fn(),
    });

    // Mock content filter to return only public content for anonymous users
    vi.mocked(mockUseContentAccessFilter.useContentAccessFilter).mockReturnValue({
      filteredContent: [mockReviews[0]], // only public review
      userAccessLevel: 'public',
      totalFiltered: 2, // 2 reviews filtered out
      statistics: {
        total: 3,
        accessible: 1,
        filtered: 2,
        byAccessLevel: { public: 1, free: 1, premium: 1, editor_admin: 0 },
      },
      canAccessPremium: false,
      canAccessEditorAdmin: false,
    });

    render(<ArchivePage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('masonry-grid')).toBeInTheDocument();
    });

    // Should show only public review
    expect(screen.getByTestId('review-1')).toBeInTheDocument(); // public
    expect(screen.queryByTestId('review-2')).not.toBeInTheDocument(); // premium
    expect(screen.queryByTestId('review-3')).not.toBeInTheDocument(); // free

    // Should show login prompt for anonymous users
    expect(screen.getByTestId('access-upgrade-prompt')).toBeInTheDocument();
    expect(screen.getByText('Faça login para ver mais conteúdo')).toBeInTheDocument();
  });

  it('should show loading state properly', async () => {
    const mockUseAcervoDataQuery = await import('../../packages/hooks/useAcervoDataQuery');
    const mockUseContentAccessFilter = await import('@/hooks/useContentAccessFilter');

    vi.mocked(mockUseAcervoDataQuery.useAcervoDataQuery).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    // Mock the content filter for loading state
    vi.mocked(mockUseContentAccessFilter.useContentAccessFilter).mockReturnValue({
      filteredContent: [],
      userAccessLevel: 'public',
      totalFiltered: 0,
      statistics: {
        total: 0,
        accessible: 0,
        filtered: 0,
        byAccessLevel: { public: 0, free: 0, premium: 0, editor_admin: 0 },
      },
      canAccessPremium: false,
      canAccessEditorAdmin: false,
    });

    render(<ArchivePageContent />, { wrapper });

    // Check for loading skeleton structure by CSS classes
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });
});
