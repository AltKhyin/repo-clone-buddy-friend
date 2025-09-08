// ABOUTME: Tests for ReviewDetailPage recommendations section ensuring proper integration and display

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ReviewDetailPage from '../ReviewDetailPage';
import { useReviewDetailQuery } from '../../../packages/hooks/useReviewDetailQuery';
import { useEditorLoadQuery } from '../../../packages/hooks/useEditorPersistence';
import { useReviewRecommendations } from '../../../packages/hooks/useReviewRecommendations';

// Mock the hooks
vi.mock('../../../packages/hooks/useReviewDetailQuery');
vi.mock('../../../packages/hooks/useEditorPersistence');
vi.mock('../../../packages/hooks/useReviewRecommendations');

// Mock ReviewCarousel component
vi.mock('../../components/homepage/ReviewCarousel', () => ({
  default: ({ title, reviews }: { title: string; reviews: any[] }) => (
    <div data-testid="review-carousel">
      <h2>{title}</h2>
      <div data-testid="carousel-reviews">
        {reviews.map(review => (
          <div key={review.id} data-testid={`review-card-${review.id}`}>
            {review.title}
          </div>
        ))}
      </div>
    </div>
  ),
}));

const mockedUseReviewDetailQuery = vi.mocked(useReviewDetailQuery);
const mockedUseEditorLoadQuery = vi.mocked(useEditorLoadQuery);
const mockedUseReviewRecommendations = vi.mocked(useReviewRecommendations);

// Mock console methods
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// Test wrapper with QueryClient and Router
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/reviews/test-review']}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Mock data
const mockReview = {
  id: 1,
  title: 'Test Review',
  description: 'Test description',
  cover_image_url: 'https://example.com/cover.jpg',
  structured_content: null,
  published_at: '2024-01-01T00:00:00Z',
  author: {
    id: 'author-1',
    full_name: 'Test Author',
    avatar_url: null,
  },
  access_level: 'public',
  community_post_id: null,
  view_count: 100,
  edicao: null,
  tags: ['tag1', 'tag2'],
  contentFormat: 'v3' as const,
  nodeCount: 5,
  hasPositions: true,
  hasMobilePositions: false,
};

const mockEditorContent = {
  structured_content: {
    version: '3.0.0',
    nodes: [
      { id: 'node1', type: 'text', content: 'Test content' },
    ],
    positions: {},
    mobilePositions: {},
  },
};

const mockRecommendations = [
  {
    id: 2,
    title: 'Similar Review 1',
    description: 'A similar review',
    cover_image_url: 'https://example.com/cover1.jpg',
    published_at: '2024-01-01T00:00:00Z',
    view_count: 50,
    reading_time_minutes: 5,
    custom_author_name: null,
    custom_author_avatar_url: null,
    edicao: null,
    author: {
      id: 'author-2',
      full_name: 'Another Author',
      avatar_url: null,
    },
    content_types: [],
  },
  {
    id: 3,
    title: 'Similar Review 2',
    description: 'Another similar review',
    cover_image_url: 'https://example.com/cover2.jpg',
    published_at: '2024-01-02T00:00:00Z',
    view_count: 75,
    reading_time_minutes: 7,
    custom_author_name: null,
    custom_author_avatar_url: null,
    edicao: null,
    author: {
      id: 'author-3',
      full_name: 'Third Author',
      avatar_url: null,
    },
    content_types: [],
  },
];

describe('ReviewDetailPage - Recommendations Section', () => {
  it('should display recommendations section when recommendations are available', async () => {
    mockedUseReviewDetailQuery.mockReturnValue({
      data: mockReview,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    mockedUseEditorLoadQuery.mockReturnValue({
      data: mockEditorContent,
      isLoading: false,
    } as any);

    mockedUseReviewRecommendations.mockReturnValue({
      data: mockRecommendations,
      isLoading: false,
      isError: false,
    } as any);

    render(<ReviewDetailPage />, { wrapper: createTestWrapper() });

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('Test Review')).toBeInTheDocument();
    });

    // Verify recommendations section is displayed
    expect(screen.getByTestId('review-carousel')).toBeInTheDocument();
    expect(screen.getByText('Leituras recomendadas')).toBeInTheDocument();

    // Verify recommendations are rendered
    expect(screen.getByTestId('review-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('review-card-3')).toBeInTheDocument();
    expect(screen.getByText('Similar Review 1')).toBeInTheDocument();
    expect(screen.getByText('Similar Review 2')).toBeInTheDocument();
  });

  it('should not display recommendations section when no recommendations are available', async () => {
    mockedUseReviewDetailQuery.mockReturnValue({
      data: mockReview,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    mockedUseEditorLoadQuery.mockReturnValue({
      data: mockEditorContent,
      isLoading: false,
    } as any);

    mockedUseReviewRecommendations.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    render(<ReviewDetailPage />, { wrapper: createTestWrapper() });

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('Test Review')).toBeInTheDocument();
    });

    // Verify recommendations section is NOT displayed
    expect(screen.queryByTestId('review-carousel')).not.toBeInTheDocument();
    expect(screen.queryByText('Leituras recomendadas')).not.toBeInTheDocument();
  });

  it('should not display recommendations section when recommendations data is null', async () => {
    mockedUseReviewDetailQuery.mockReturnValue({
      data: mockReview,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    mockedUseEditorLoadQuery.mockReturnValue({
      data: mockEditorContent,
      isLoading: false,
    } as any);

    mockedUseReviewRecommendations.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    } as any);

    render(<ReviewDetailPage />, { wrapper: createTestWrapper() });

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('Test Review')).toBeInTheDocument();
    });

    // Verify recommendations section is NOT displayed
    expect(screen.queryByTestId('review-carousel')).not.toBeInTheDocument();
    expect(screen.queryByText('Leituras recomendadas')).not.toBeInTheDocument();
  });

  it('should call useReviewRecommendations with correct reviewId', async () => {
    mockedUseReviewDetailQuery.mockReturnValue({
      data: mockReview,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    mockedUseEditorLoadQuery.mockReturnValue({
      data: mockEditorContent,
      isLoading: false,
    } as any);

    mockedUseReviewRecommendations.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    render(<ReviewDetailPage />, { wrapper: createTestWrapper() });

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('Test Review')).toBeInTheDocument();
    });

    // Verify the hook was called with correct review ID
    expect(mockedUseReviewRecommendations).toHaveBeenCalledWith(1);
  });

  it('should not call useReviewRecommendations when review is not loaded', async () => {
    mockedUseReviewDetailQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    mockedUseEditorLoadQuery.mockReturnValue({
      data: null,
      isLoading: true,
    } as any);

    mockedUseReviewRecommendations.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    } as any);

    render(<ReviewDetailPage />, { wrapper: createTestWrapper() });

    // Verify the hook was called with undefined (disabled)
    expect(mockedUseReviewRecommendations).toHaveBeenCalledWith(undefined);
  });

  it('should include recommendations skeleton in loading state', async () => {
    mockedUseReviewDetailQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    mockedUseEditorLoadQuery.mockReturnValue({
      data: null,
      isLoading: true,
    } as any);

    mockedUseReviewRecommendations.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    } as any);

    render(<ReviewDetailPage />, { wrapper: createTestWrapper() });

    // Should show loading skeletons including recommendations skeleton
    const skeletons = screen.getAllByTestId(/skeleton|Skeleton/i);
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should handle recommendations loading error gracefully', async () => {
    mockedUseReviewDetailQuery.mockReturnValue({
      data: mockReview,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    mockedUseEditorLoadQuery.mockReturnValue({
      data: mockEditorContent,
      isLoading: false,
    } as any);

    mockedUseReviewRecommendations.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load recommendations'),
    } as any);

    render(<ReviewDetailPage />, { wrapper: createTestWrapper() });

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('Test Review')).toBeInTheDocument();
    });

    // Should not crash and should not show recommendations section
    expect(screen.queryByTestId('review-carousel')).not.toBeInTheDocument();
    expect(screen.queryByText('Leituras recomendadas')).not.toBeInTheDocument();
    
    // Main content should still be displayed
    expect(screen.getByText('Test Review')).toBeInTheDocument();
  });
});