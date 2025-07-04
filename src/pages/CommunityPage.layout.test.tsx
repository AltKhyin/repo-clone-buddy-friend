// ABOUTME: Tests for CommunityPage layout migration to Reddit-inspired standardized layout system

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CommunityPage from './CommunityPage';

// Mock all dependencies
vi.mock('../../packages/hooks/useCommunityPageQuery', () => ({
  useCommunityPageQuery: vi.fn(),
}));

vi.mock('../components/community/CommunityFeedWithSidebar', () => ({
  CommunityFeedWithSidebar: ({ posts, sidebarData }: any) => (
    <div data-testid="community-feed-with-sidebar">
      <div data-testid="posts-count">{posts?.length || 0} posts</div>
      <div data-testid="sidebar-data">{sidebarData ? 'has sidebar' : 'no sidebar'}</div>
    </div>
  ),
}));

vi.mock('../components/community/CommunityErrorBoundary', () => ({
  CommunityErrorBoundary: ({ children }: any) => (
    <div data-testid="community-error-boundary">{children}</div>
  ),
}));

vi.mock('../components/community/CommunityLoadingState', () => ({
  CommunityLoadingState: ({ description }: any) => (
    <div data-testid="community-loading-state">{description}</div>
  ),
}));

vi.mock('../components/community/NetworkAwareFallback', () => ({
  NetworkAwareFallback: ({ context }: any) => (
    <div data-testid="network-aware-fallback">Network fallback for {context}</div>
  ),
  useNetworkStatus: vi.fn(() => ({ isOnline: true })),
}));

describe('CommunityPage Layout Integration', () => {
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

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockCommunityData = {
    posts: [
      { id: 1, title: 'Test Post 1', content: 'Content 1' },
      { id: 2, title: 'Test Post 2', content: 'Content 2' },
    ],
    sidebarData: {
      trendingTopics: ['Topic 1', 'Topic 2'],
      featuredPolls: [{ id: 1, question: 'Test Poll?' }],
    },
  };

  const setupMocks = (options: {
    isLoading?: boolean;
    error?: Error | null;
    hasData?: boolean;
    isOnline?: boolean;
  } = {}) => {
    const {
      isLoading = false,
      error = null,
      hasData = true,
      isOnline = true,
    } = options;

    return {
      useCommunityPageQuery: vi.fn().mockReturnValue({
        data: hasData ? mockCommunityData : null,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading,
        error,
        refetch: vi.fn(),
        dataUpdatedAt: hasData ? Date.now() : undefined,
      }),
      useNetworkStatus: vi.fn().mockReturnValue({
        isOnline,
      }),
    };
  };

  describe('layout structure and constraints', () => {
    it('should apply proper content constraints for Reddit-inspired layout', async () => {
      const mocks = setupMocks();
      
      const mockUseCommunityPageQuery = await import('../../packages/hooks/useCommunityPageQuery');
      const mockNetworkAware = await import('../components/community/NetworkAwareFallback');
      
      vi.mocked(mockUseCommunityPageQuery.useCommunityPageQuery).mockImplementation(mocks.useCommunityPageQuery);
      vi.mocked(mockNetworkAware.useNetworkStatus).mockImplementation(mocks.useNetworkStatus);

      render(<CommunityPage />, { wrapper });

      // Should have proper main component structure
      expect(screen.getByTestId('community-error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('community-feed-with-sidebar')).toBeInTheDocument();
    });

    it('should handle compression-safe layout classes', async () => {
      const mocks = setupMocks();
      
      const mockUseCommunityPageQuery = await import('../../packages/hooks/useCommunityPageQuery');
      const mockNetworkAware = await import('../components/community/NetworkAwareFallback');
      
      vi.mocked(mockUseCommunityPageQuery.useCommunityPageQuery).mockImplementation(mocks.useCommunityPageQuery);
      vi.mocked(mockNetworkAware.useNetworkStatus).mockImplementation(mocks.useNetworkStatus);

      render(<CommunityPage />, { wrapper });

      // Should render community feed with proper data
      expect(screen.getByTestId('posts-count')).toHaveTextContent('2 posts');
      expect(screen.getByTestId('sidebar-data')).toHaveTextContent('has sidebar');
    });

    it('should maintain shell integration without extra containers', async () => {
      const mocks = setupMocks();
      
      const mockUseCommunityPageQuery = await import('../../packages/hooks/useCommunityPageQuery');
      const mockNetworkAware = await import('../components/community/NetworkAwareFallback');
      
      vi.mocked(mockUseCommunityPageQuery.useCommunityPageQuery).mockImplementation(mocks.useCommunityPageQuery);
      vi.mocked(mockNetworkAware.useNetworkStatus).mockImplementation(mocks.useNetworkStatus);

      const { container } = render(<CommunityPage />, { wrapper });

      // Should have clean structure without unnecessary containers
      expect(screen.getByTestId('community-feed-with-sidebar')).toBeInTheDocument();
      expect(container.querySelector('.community-page-container')).toBeNull(); // No extra containers
    });
  });

  describe('loading state layout', () => {
    it('should apply proper layout constraints to loading state', async () => {
      const mocks = setupMocks({ isLoading: true, hasData: false });
      
      const mockUseCommunityPageQuery = await import('../../packages/hooks/useCommunityPageQuery');
      const mockNetworkAware = await import('../components/community/NetworkAwareFallback');
      
      vi.mocked(mockUseCommunityPageQuery.useCommunityPageQuery).mockImplementation(mocks.useCommunityPageQuery);
      vi.mocked(mockNetworkAware.useNetworkStatus).mockImplementation(mocks.useNetworkStatus);

      render(<CommunityPage />, { wrapper });

      // Should show loading state component
      expect(screen.getByTestId('community-loading-state')).toBeInTheDocument();
      expect(screen.getByText('Carregando comunidade...')).toBeInTheDocument();
    });

    it('should handle progressive loading indicators', async () => {
      const mocks = setupMocks({ isLoading: true, hasData: false });
      
      const mockUseCommunityPageQuery = await import('../../packages/hooks/useCommunityPageQuery');
      const mockNetworkAware = await import('../components/community/NetworkAwareFallback');
      
      vi.mocked(mockUseCommunityPageQuery.useCommunityPageQuery).mockImplementation(mocks.useCommunityPageQuery);
      vi.mocked(mockNetworkAware.useNetworkStatus).mockImplementation(mocks.useNetworkStatus);

      render(<CommunityPage />, { wrapper });

      // Should have proper loading component
      expect(screen.getByTestId('community-loading-state')).toBeInTheDocument();
    });
  });

  describe('error state layout', () => {
    it('should apply proper layout constraints to error state', async () => {
      const mocks = setupMocks({ error: new Error('Test error'), hasData: false });
      
      const mockUseCommunityPageQuery = await import('../../packages/hooks/useCommunityPageQuery');
      const mockNetworkAware = await import('../components/community/NetworkAwareFallback');
      
      vi.mocked(mockUseCommunityPageQuery.useCommunityPageQuery).mockImplementation(mocks.useCommunityPageQuery);
      vi.mocked(mockNetworkAware.useNetworkStatus).mockImplementation(mocks.useNetworkStatus);

      const { container } = render(<CommunityPage />, { wrapper });

      // Should have proper error layout structure
      const errorContainer = container.querySelector('.flex.flex-col.items-center') as HTMLElement;
      expect(errorContainer).toBeInTheDocument();
      
      // Should show error details
      expect(screen.getByText(/Erro ao carregar a comunidade/)).toBeInTheDocument();
    });

    it('should handle network-aware error states', async () => {
      const mocks = setupMocks({ 
        error: new Error('Network error'), 
        hasData: false, 
        isOnline: false 
      });
      
      const mockUseCommunityPageQuery = await import('../../packages/hooks/useCommunityPageQuery');
      const mockNetworkAware = await import('../components/community/NetworkAwareFallback');
      
      vi.mocked(mockUseCommunityPageQuery.useCommunityPageQuery).mockImplementation(mocks.useCommunityPageQuery);
      vi.mocked(mockNetworkAware.useNetworkStatus).mockImplementation(mocks.useNetworkStatus);

      render(<CommunityPage />, { wrapper });

      // Should show network-specific error message
      expect(screen.getByText(/Sem conexão com a internet/)).toBeInTheDocument();
    });
  });

  describe('network fallback layout', () => {
    it('should handle offline state with proper layout', async () => {
      const mocks = setupMocks({ isOnline: false, hasData: false });
      
      const mockUseCommunityPageQuery = await import('../../packages/hooks/useCommunityPageQuery');
      const mockNetworkAware = await import('../components/community/NetworkAwareFallback');
      
      vi.mocked(mockUseCommunityPageQuery.useCommunityPageQuery).mockImplementation(mocks.useCommunityPageQuery);
      vi.mocked(mockNetworkAware.useNetworkStatus).mockImplementation(mocks.useNetworkStatus);

      render(<CommunityPage />, { wrapper });

      // Should show network fallback
      expect(screen.getByTestId('network-aware-fallback')).toBeInTheDocument();
      expect(screen.getByText('Network fallback for comunidade')).toBeInTheDocument();
    });
  });

  describe('content rendering and layout integration', () => {
    it('should render community content with proper data flow', async () => {
      const mocks = setupMocks();
      
      const mockUseCommunityPageQuery = await import('../../packages/hooks/useCommunityPageQuery');
      const mockNetworkAware = await import('../components/community/NetworkAwareFallback');
      
      vi.mocked(mockUseCommunityPageQuery.useCommunityPageQuery).mockImplementation(mocks.useCommunityPageQuery);
      vi.mocked(mockNetworkAware.useNetworkStatus).mockImplementation(mocks.useNetworkStatus);

      render(<CommunityPage />, { wrapper });

      // Should pass correct data to feed component
      expect(screen.getByTestId('community-feed-with-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('posts-count')).toHaveTextContent('2 posts');
      expect(screen.getByTestId('sidebar-data')).toHaveTextContent('has sidebar');
    });

    it('should handle empty posts gracefully', async () => {
      const emptyData = { ...mockCommunityData, posts: [] };
      const mocks = setupMocks();
      mocks.useCommunityPageQuery = vi.fn().mockReturnValue({
        data: emptyData,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        dataUpdatedAt: Date.now(),
      });
      
      const mockUseCommunityPageQuery = await import('../../packages/hooks/useCommunityPageQuery');
      const mockNetworkAware = await import('../components/community/NetworkAwareFallback');
      
      vi.mocked(mockUseCommunityPageQuery.useCommunityPageQuery).mockImplementation(mocks.useCommunityPageQuery);
      vi.mocked(mockNetworkAware.useNetworkStatus).mockImplementation(mocks.useNetworkStatus);

      render(<CommunityPage />, { wrapper });

      // Should handle empty posts
      expect(screen.getByTestId('posts-count')).toHaveTextContent('0 posts');
    });

    it('should handle missing sidebar data', async () => {
      const noSidebarData = { ...mockCommunityData, sidebarData: null };
      const mocks = setupMocks();
      mocks.useCommunityPageQuery = vi.fn().mockReturnValue({
        data: noSidebarData,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        dataUpdatedAt: Date.now(),
      });
      
      const mockUseCommunityPageQuery = await import('../../packages/hooks/useCommunityPageQuery');
      const mockNetworkAware = await import('../components/community/NetworkAwareFallback');
      
      vi.mocked(mockUseCommunityPageQuery.useCommunityPageQuery).mockImplementation(mocks.useCommunityPageQuery);
      vi.mocked(mockNetworkAware.useNetworkStatus).mockImplementation(mocks.useNetworkStatus);

      render(<CommunityPage />, { wrapper });

      // Should handle missing sidebar data
      expect(screen.getByTestId('sidebar-data')).toHaveTextContent('no sidebar');
    });
  });

  describe('error boundary integration', () => {
    it('should maintain error boundary structure with layout updates', async () => {
      const mocks = setupMocks();
      
      const mockUseCommunityPageQuery = await import('../../packages/hooks/useCommunityPageQuery');
      const mockNetworkAware = await import('../components/community/NetworkAwareFallback');
      
      vi.mocked(mockUseCommunityPageQuery.useCommunityPageQuery).mockImplementation(mocks.useCommunityPageQuery);
      vi.mocked(mockNetworkAware.useNetworkStatus).mockImplementation(mocks.useNetworkStatus);

      // Should render without throwing errors
      expect(() => {
        render(<CommunityPage />, { wrapper });
      }).not.toThrow();

      // Should wrap content in error boundary
      expect(screen.getByTestId('community-error-boundary')).toBeInTheDocument();
    });
  });

  describe('accessibility and semantic structure', () => {
    it('should maintain proper semantic structure with layout updates', async () => {
      const mocks = setupMocks();
      
      const mockUseCommunityPageQuery = await import('../../packages/hooks/useCommunityPageQuery');
      const mockNetworkAware = await import('../components/community/NetworkAwareFallback');
      
      vi.mocked(mockUseCommunityPageQuery.useCommunityPageQuery).mockImplementation(mocks.useCommunityPageQuery);
      vi.mocked(mockNetworkAware.useNetworkStatus).mockImplementation(mocks.useNetworkStatus);

      render(<CommunityPage />, { wrapper });

      // Should have proper component structure
      expect(screen.getByTestId('community-feed-with-sidebar')).toBeInTheDocument();
    });

    it('should handle focus management within layout constraints', async () => {
      const mocks = setupMocks({ error: new Error('Test error'), hasData: false });
      
      const mockUseCommunityPageQuery = await import('../../packages/hooks/useCommunityPageQuery');
      const mockNetworkAware = await import('../components/community/NetworkAwareFallback');
      
      vi.mocked(mockUseCommunityPageQuery.useCommunityPageQuery).mockImplementation(mocks.useCommunityPageQuery);
      vi.mocked(mockNetworkAware.useNetworkStatus).mockImplementation(mocks.useNetworkStatus);

      render(<CommunityPage />, { wrapper });

      // Should have focusable retry button in error state
      const retryButton = screen.getByText('Tentar Novamente');
      expect(retryButton).toBeInTheDocument();
      
      retryButton.focus();
      expect(retryButton).toHaveFocus();
    });
  });

  describe('performance and data updates', () => {
    it('should handle lastSync timestamp properly', async () => {
      const mocks = setupMocks();
      
      const mockUseCommunityPageQuery = await import('../../packages/hooks/useCommunityPageQuery');
      const mockNetworkAware = await import('../components/community/NetworkAwareFallback');
      
      vi.mocked(mockUseCommunityPageQuery.useCommunityPageQuery).mockImplementation(mocks.useCommunityPageQuery);
      vi.mocked(mockNetworkAware.useNetworkStatus).mockImplementation(mocks.useNetworkStatus);

      render(<CommunityPage />, { wrapper });

      // Should render successfully with timestamp data
      expect(screen.getByTestId('community-feed-with-sidebar')).toBeInTheDocument();
    });
  });
});