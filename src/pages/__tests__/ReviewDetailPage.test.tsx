// ABOUTME: Test suite for ReviewDetailPage with intelligent renderer selection validation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReviewDetailPage from '../ReviewDetailPage';
import { useReviewDetailQuery } from '../../../packages/hooks/useReviewDetailQuery';
import { ReviewDetail } from '../../../packages/hooks/useReviewDetailQuery';

// Mock the hooks
vi.mock('../../../packages/hooks/useReviewDetailQuery');
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(() => ({ user: null })),
}));

// Mock the renderers
vi.mock('@/components/review-detail/LayoutAwareRenderer', () => ({
  default: vi.fn(() => <div data-testid="legacy-renderer">Legacy V2 Content</div>),
}));

vi.mock('@/components/review-detail/WYSIWYGRenderer', () => ({
  default: vi.fn(() => <div data-testid="v3-renderer">V3 WYSIWYG Content</div>),
}));

describe('ReviewDetailPage - Intelligent Renderer Selection', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (children: React.ReactNode) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  const mockV3Review: ReviewDetail = {
    id: 1,
    title: 'Test V3 Review',
    description: 'A test review with V3 content',
    cover_image_url: null,
    structured_content: {
      version: '3.0.0',
      nodes: [
        {
          id: 'text-1',
          type: 'textBlock',
          data: { htmlContent: '<p>V3 content</p>' },
        },
      ],
      positions: {
        'text-1': { id: 'text-1', x: 0, y: 0, width: 400, height: 100 },
      },
      canvas: { canvasWidth: 800, canvasHeight: 400 },
      metadata: { createdAt: '2023-01-01', updatedAt: '2023-01-01', editorVersion: '3.0.0' },
    },
    published_at: '2023-01-01T00:00:00Z',
    author: {
      id: 'author-1',
      full_name: 'Test Author',
      avatar_url: null,
    },
    access_level: 'public',
    community_post_id: null,
    view_count: 100,
    tags: ['test'],
    // V3 Content Bridge metadata
    contentFormat: 'v3',
    nodeCount: 1,
    hasPositions: true,
    hasMobilePositions: false,
  };

  const mockV2Review: ReviewDetail = {
    ...mockV3Review,
    structured_content: {
      layouts: {
        desktop: [{ id: 'block-1', type: 'text', content: 'V2 content' }],
        mobile: [{ id: 'block-1', type: 'text', content: 'V2 content' }],
      },
    },
    contentFormat: 'v2',
    nodeCount: 1,
    hasPositions: false,
    hasMobilePositions: false,
  };

  describe('V3 Content Rendering', () => {
    it('should use WYSIWYGRenderer for V3 content', async () => {
      vi.mocked(useReviewDetailQuery).mockReturnValue({
        data: mockV3Review,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
        isSuccess: true,
        isPending: false,
        isRefetchError: false,
        isLoadingError: false,
        failureCount: 0,
        failureReason: null,
        status: 'success',
        fetchStatus: 'idle',
        errorUpdateCount: 0,
        isFetched: true,
        isFetchedAfterMount: true,
        isPaused: false,
        isPlaceholderData: false,
        isStale: false,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
      });

      renderWithProviders(<ReviewDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Test V3 Review')).toBeInTheDocument();
      });

      // Should use V3 renderer for V3 content
      expect(screen.getByTestId('v3-renderer')).toBeInTheDocument();
      expect(screen.queryByTestId('legacy-renderer')).not.toBeInTheDocument();

      // Should show V3 content indicator in development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      renderWithProviders(<ReviewDetailPage />);
      await waitFor(() => {
        expect(screen.getByText(/V3 Content Bridge/)).toBeInTheDocument();
        expect(screen.getByText(/Using V3 Native Renderer/)).toBeInTheDocument();
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should display correct V3 metadata in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      vi.mocked(useReviewDetailQuery).mockReturnValue({
        data: mockV3Review,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
        isSuccess: true,
        isPending: false,
        isRefetchError: false,
        isLoadingError: false,
        failureCount: 0,
        failureReason: null,
        status: 'success',
        fetchStatus: 'idle',
        errorUpdateCount: 0,
        isFetched: true,
        isFetchedAfterMount: true,
        isPaused: false,
        isPlaceholderData: false,
        isStale: false,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
      });

      renderWithProviders(<ReviewDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/1 blocks • Positioned • Scaled/)).toBeInTheDocument();
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('V2 Content Rendering', () => {
    it('should use LayoutAwareRenderer for V2 content', async () => {
      vi.mocked(useReviewDetailQuery).mockReturnValue({
        data: mockV2Review,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
        isSuccess: true,
        isPending: false,
        isRefetchError: false,
        isLoadingError: false,
        failureCount: 0,
        failureReason: null,
        status: 'success',
        fetchStatus: 'idle',
        errorUpdateCount: 0,
        isFetched: true,
        isFetchedAfterMount: true,
        isPaused: false,
        isPlaceholderData: false,
        isStale: false,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
      });

      renderWithProviders(<ReviewDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Test V3 Review')).toBeInTheDocument();
      });

      // Should use legacy renderer for V2 content
      expect(screen.getByTestId('legacy-renderer')).toBeInTheDocument();
      expect(screen.queryByTestId('v3-renderer')).not.toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading skeleton', () => {
      vi.mocked(useReviewDetailQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
        isSuccess: false,
        isPending: true,
        isRefetchError: false,
        isLoadingError: false,
        failureCount: 0,
        failureReason: null,
        status: 'pending',
        fetchStatus: 'fetching',
        errorUpdateCount: 0,
        isFetched: false,
        isFetchedAfterMount: false,
        isPaused: false,
        isPlaceholderData: false,
        isStale: false,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
      });

      renderWithProviders(<ReviewDetailPage />);

      // Should show skeleton loaders (there might be additional skeleton elements from other components)
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThanOrEqual(6);
    });

    it('should show error state for not found', () => {
      vi.mocked(useReviewDetailQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Review not found'),
        refetch: vi.fn(),
        isRefetching: false,
        isSuccess: false,
        isPending: false,
        isRefetchError: false,
        isLoadingError: true,
        failureCount: 1,
        failureReason: new Error('Review not found'),
        status: 'error',
        fetchStatus: 'idle',
        errorUpdateCount: 1,
        isFetched: true,
        isFetchedAfterMount: true,
        isPaused: false,
        isPlaceholderData: false,
        isStale: false,
        dataUpdatedAt: 0,
        errorUpdatedAt: Date.now(),
      });

      renderWithProviders(<ReviewDetailPage />);

      expect(screen.getByText('Review não encontrado')).toBeInTheDocument();
      expect(screen.getByText(/não existe ou foi removido/)).toBeInTheDocument();
    });
  });

  describe('Content Format Detection', () => {
    it('should handle unknown content format gracefully', async () => {
      const unknownFormatReview = {
        ...mockV3Review,
        contentFormat: 'unknown' as const,
        structured_content: { someUnknownFormat: 'data' },
      };

      vi.mocked(useReviewDetailQuery).mockReturnValue({
        data: unknownFormatReview,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
        isSuccess: true,
        isPending: false,
        isRefetchError: false,
        isLoadingError: false,
        failureCount: 0,
        failureReason: null,
        status: 'success',
        fetchStatus: 'idle',
        errorUpdateCount: 0,
        isFetched: true,
        isFetchedAfterMount: true,
        isPaused: false,
        isPlaceholderData: false,
        isStale: false,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
      });

      renderWithProviders(<ReviewDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Test V3 Review')).toBeInTheDocument();
      });

      // Should fall back to legacy renderer for unknown format
      expect(screen.getByTestId('legacy-renderer')).toBeInTheDocument();
      expect(screen.queryByTestId('v3-renderer')).not.toBeInTheDocument();
    });
  });
});