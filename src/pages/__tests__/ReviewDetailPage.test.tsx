// ABOUTME: Test suite for ReviewDetailPage with intelligent renderer selection validation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReviewDetailPage from '../ReviewDetailPage';
import { useReviewDetailQuery } from '../../../packages/hooks/useReviewDetailQuery';
import { useEditorLoadQuery } from '../../../packages/hooks/useEditorPersistence';
import { ReviewDetail } from '../../../packages/hooks/useReviewDetailQuery';

// Mock the hooks
vi.mock('../../../packages/hooks/useReviewDetailQuery');
vi.mock('../../../packages/hooks/useEditorPersistence');
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(() => ({ user: null })),
}));

// Mock the renderers
vi.mock('@/components/review-detail/LayoutAwareRenderer', () => ({
  default: vi.fn(() => <div data-testid="legacy-renderer">Legacy V2 Content</div>),
}));

vi.mock('@/components/review-detail/ReadOnlyCanvas', () => ({
  ReadOnlyCanvas: vi.fn(() => <div data-testid="readonly-canvas">V3 ReadOnly Canvas Content</div>),
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
    
    // Default mock for editor query (no content)
    vi.mocked(useEditorLoadQuery).mockReturnValue({
      data: null,
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
    it('should use ReadOnlyCanvas for V3 editor content', async () => {
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

      // Mock editor content data (same as editor uses)
      vi.mocked(useEditorLoadQuery).mockReturnValue({
        data: {
          id: 'editor-content-1',
          review_id: 1,
          structured_content: mockV3Review.structured_content,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
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

      // Should use ReadOnly Canvas for V3 content
      expect(screen.getByTestId('readonly-canvas')).toBeInTheDocument();
      expect(screen.queryByTestId('legacy-renderer')).not.toBeInTheDocument();

      // ReadOnly Canvas successfully renders V3 content
      expect(screen.getByTestId('readonly-canvas')).toHaveTextContent('V3 ReadOnly Canvas Content');
    });

    it('should properly render V3 structured content', async () => {
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

      // Mock editor content data
      vi.mocked(useEditorLoadQuery).mockReturnValue({
        data: {
          id: 'editor-content-1',
          review_id: 1,
          structured_content: mockV3Review.structured_content,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
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
        expect(screen.getByTestId('readonly-canvas')).toBeInTheDocument();
      });

      // Verify V3 content section is properly rendered
      expect(screen.getByText('Test V3 Review')).toBeInTheDocument();
      expect(screen.getByText('A test review with V3 content')).toBeInTheDocument();
    });
  });

  describe('No Content Rendering', () => {
    it('should show no content message when editor data is unavailable', async () => {
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

      // Use default mock (no editor content)
      renderWithProviders(<ReviewDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Test V3 Review')).toBeInTheDocument();
      });

      // Should show no content message when editor data is null
      expect(screen.getByText('Este review ainda não possui conteúdo estruturado.')).toBeInTheDocument();
      expect(screen.queryByTestId('readonly-canvas')).not.toBeInTheDocument();
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

  describe('Editor Loading States', () => {
    it('should show loading when editor content is loading', () => {
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

      // Mock editor query as loading
      vi.mocked(useEditorLoadQuery).mockReturnValue({
        data: null,
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

      // Should show skeleton loaders while editor content is loading
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThanOrEqual(6);
    });
  });
});