// ABOUTME: Tests for ArchivePage layout migration to Reddit-inspired standardized layout system

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ArchivePage, { ArchivePageContent } from './ArchivePage';

// Mock all dependencies
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

vi.mock('@/components/acervo/MobileTagsModal', () => ({
  default: () => <div data-testid="mobile-tags-modal">Mobile Tags Modal</div>,
}));

vi.mock('@/components/ui/AccessUpgradePrompt', () => ({
  AccessUpgradePrompt: ({ filteredCount }: any) => (
    <div data-testid="access-upgrade-prompt">
      {filteredCount} reviews filtered
    </div>
  ),
}));

describe('ArchivePage Layout Integration', () => {
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

  const mockReviews = [
    {
      review_id: 1,
      title: 'Test Review 1',
      access_level: 'public',
      description: 'Public content',
      published_at: '2023-01-01',
      view_count: 100,
    },
    {
      review_id: 2,
      title: 'Test Review 2',
      access_level: 'premium',
      description: 'Premium content',
      published_at: '2023-01-02',
      view_count: 200,
    },
  ];

  const mockTags = [
    { tag_id: 1, name: 'test-tag-1', category: 'category1' },
    { tag_id: 2, name: 'test-tag-2', category: 'category2' },
  ];

  const setupMocks = (options: {
    isLoading?: boolean;
    error?: Error | null;
    hasData?: boolean;
    userAccessLevel?: string;
    totalFiltered?: number;
  } = {}) => {
    const {
      isLoading = false,
      error = null,
      hasData = true,
      userAccessLevel = 'public',
      totalFiltered = 0,
    } = options;

    return {
      useAcervoDataQuery: vi.fn().mockReturnValue({
        data: hasData ? { reviews: mockReviews, tags: mockTags } : null,
        isLoading,
        error,
      }),
      useContentAccessFilter: vi.fn().mockReturnValue({
        filteredContent: mockReviews,
        userAccessLevel,
        totalFiltered,
        statistics: {
          total: mockReviews.length,
          accessible: mockReviews.length - totalFiltered,
          filtered: totalFiltered,
          byAccessLevel: { public: 1, free: 0, premium: 1, editor_admin: 0 },
        },
        canAccessPremium: userAccessLevel === 'premium',
        canAccessEditorAdmin: false,
      }),
      useAuthStore: vi.fn().mockReturnValue({
        user: userAccessLevel !== 'public' ? { id: 'user123', subscription_tier: userAccessLevel } : null,
        session: userAccessLevel !== 'public' ? { access_token: 'token123' } : null,
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      }),
    };
  };

  describe('layout structure and constraints', () => {
    it('should apply proper content constraints for Reddit-inspired layout', async () => {
      const mocks = setupMocks();
      
      // Apply mocks
      const mockUseAcervoDataQuery = await import('../../packages/hooks/useAcervoDataQuery');
      const mockUseContentAccessFilter = await import('@/hooks/useContentAccessFilter');
      const mockUseAuthStore = await import('@/store/auth');
      
      vi.mocked(mockUseAcervoDataQuery.useAcervoDataQuery).mockImplementation(mocks.useAcervoDataQuery);
      vi.mocked(mockUseContentAccessFilter.useContentAccessFilter).mockImplementation(mocks.useContentAccessFilter);
      vi.mocked(mockUseAuthStore.useAuthStore).mockImplementation(mocks.useAuthStore);

      const { container } = render(<ArchivePage />, { wrapper });

      // Should have proper main container structure
      const mainContainer = container.querySelector('.min-h-screen') as HTMLElement;
      expect(mainContainer).toBeInTheDocument();
      
      // Should have proper content padding
      const contentWrapper = container.querySelector('.p-6') as HTMLElement;
      expect(contentWrapper).toBeInTheDocument();
    });

    it('should handle compression-safe layout classes', async () => {
      const mocks = setupMocks();
      
      const mockUseAcervoDataQuery = await import('../../packages/hooks/useAcervoDataQuery');
      const mockUseContentAccessFilter = await import('@/hooks/useContentAccessFilter');
      const mockUseAuthStore = await import('@/store/auth');
      
      vi.mocked(mockUseAcervoDataQuery.useAcervoDataQuery).mockImplementation(mocks.useAcervoDataQuery);
      vi.mocked(mockUseContentAccessFilter.useContentAccessFilter).mockImplementation(mocks.useContentAccessFilter);
      vi.mocked(mockUseAuthStore.useAuthStore).mockImplementation(mocks.useAuthStore);

      const { container } = render(<ArchivePage />, { wrapper });

      // Should have proper layout structure
      const mainContainer = container.querySelector('.min-h-screen') as HTMLElement;
      expect(mainContainer).toBeInTheDocument();
    });

    it('should maintain responsive layout patterns', async () => {
      const mocks = setupMocks();
      
      const mockUseAcervoDataQuery = await import('../../packages/hooks/useAcervoDataQuery');
      const mockUseContentAccessFilter = await import('@/hooks/useContentAccessFilter');
      const mockUseAuthStore = await import('@/store/auth');
      
      vi.mocked(mockUseAcervoDataQuery.useAcervoDataQuery).mockImplementation(mocks.useAcervoDataQuery);
      vi.mocked(mockUseContentAccessFilter.useContentAccessFilter).mockImplementation(mocks.useContentAccessFilter);
      vi.mocked(mockUseAuthStore.useAuthStore).mockImplementation(mocks.useAuthStore);

      render(<ArchivePage />, { wrapper });

      // Should render core archive components
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('tags-panel')).toBeInTheDocument();
      expect(screen.getByTestId('masonry-grid')).toBeInTheDocument();
    });
  });

  describe('loading state layout', () => {
    it('should apply proper layout constraints to loading state', async () => {
      const mocks = setupMocks({ isLoading: true, hasData: false });
      
      const mockUseAcervoDataQuery = await import('../../packages/hooks/useAcervoDataQuery');
      const mockUseContentAccessFilter = await import('@/hooks/useContentAccessFilter');
      const mockUseAuthStore = await import('@/store/auth');
      
      vi.mocked(mockUseAcervoDataQuery.useAcervoDataQuery).mockImplementation(mocks.useAcervoDataQuery);
      vi.mocked(mockUseContentAccessFilter.useContentAccessFilter).mockImplementation(mocks.useContentAccessFilter);
      vi.mocked(mockUseAuthStore.useAuthStore).mockImplementation(mocks.useAuthStore);

      const { container } = render(<ArchivePage />, { wrapper });

      // Should have proper loading layout structure
      const loadingContainer = container.querySelector('.min-h-screen') as HTMLElement;
      expect(loadingContainer).toBeInTheDocument();
      
      // Should have loading skeletons
      const skeletonElements = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should handle compression-safe classes in loading state', async () => {
      const mocks = setupMocks({ isLoading: true, hasData: false });
      
      const mockUseAcervoDataQuery = await import('../../packages/hooks/useAcervoDataQuery');
      const mockUseContentAccessFilter = await import('@/hooks/useContentAccessFilter');
      const mockUseAuthStore = await import('@/store/auth');
      
      vi.mocked(mockUseAcervoDataQuery.useAcervoDataQuery).mockImplementation(mocks.useAcervoDataQuery);
      vi.mocked(mockUseContentAccessFilter.useContentAccessFilter).mockImplementation(mocks.useContentAccessFilter);
      vi.mocked(mockUseAuthStore.useAuthStore).mockImplementation(mocks.useAuthStore);

      const { container } = render(<ArchivePage />, { wrapper });

      // Should maintain proper structure during loading
      const mainContainer = container.querySelector('.min-h-screen') as HTMLElement;
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('error state layout', () => {
    it('should apply proper layout constraints to error state', async () => {
      const mocks = setupMocks({ error: new Error('Test error'), hasData: false });
      
      const mockUseAcervoDataQuery = await import('../../packages/hooks/useAcervoDataQuery');
      const mockUseContentAccessFilter = await import('@/hooks/useContentAccessFilter');
      const mockUseAuthStore = await import('@/store/auth');
      
      vi.mocked(mockUseAcervoDataQuery.useAcervoDataQuery).mockImplementation(mocks.useAcervoDataQuery);
      vi.mocked(mockUseContentAccessFilter.useContentAccessFilter).mockImplementation(mocks.useContentAccessFilter);
      vi.mocked(mockUseAuthStore.useAuthStore).mockImplementation(mocks.useAuthStore);

      const { container } = render(<ArchivePage />, { wrapper });

      // Should have proper error layout structure
      const errorContainer = container.querySelector('.min-h-screen') as HTMLElement;
      expect(errorContainer).toBeInTheDocument();
      
      // Should use StandardLayout centered type for error state
      const centeredContent = container.querySelector('main') as HTMLElement;
      expect(centeredContent).toBeInTheDocument();
      expect(centeredContent).toHaveClass('text-center');
    });
  });

  describe('content rendering and layout integration', () => {
    it('should render archive content with proper spacing', async () => {
      const mocks = setupMocks();
      
      const mockUseAcervoDataQuery = await import('../../packages/hooks/useAcervoDataQuery');
      const mockUseContentAccessFilter = await import('@/hooks/useContentAccessFilter');
      const mockUseAuthStore = await import('@/store/auth');
      
      vi.mocked(mockUseAcervoDataQuery.useAcervoDataQuery).mockImplementation(mocks.useAcervoDataQuery);
      vi.mocked(mockUseContentAccessFilter.useContentAccessFilter).mockImplementation(mocks.useContentAccessFilter);
      vi.mocked(mockUseAuthStore.useAuthStore).mockImplementation(mocks.useAuthStore);

      render(<ArchivePage />, { wrapper });

      // Should render all main components
      expect(screen.getByText('Acervo')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('tags-panel')).toBeInTheDocument();
      expect(screen.getByTestId('masonry-grid')).toBeInTheDocument();
    });

    it('should handle masonry grid layout constraints', async () => {
      const mocks = setupMocks();
      
      const mockUseAcervoDataQuery = await import('../../packages/hooks/useAcervoDataQuery');
      const mockUseContentAccessFilter = await import('@/hooks/useContentAccessFilter');
      const mockUseAuthStore = await import('@/store/auth');
      
      vi.mocked(mockUseAcervoDataQuery.useAcervoDataQuery).mockImplementation(mocks.useAcervoDataQuery);
      vi.mocked(mockUseContentAccessFilter.useContentAccessFilter).mockImplementation(mocks.useContentAccessFilter);
      vi.mocked(mockUseAuthStore.useAuthStore).mockImplementation(mocks.useAuthStore);

      render(<ArchivePage />, { wrapper });

      // Should render reviews in masonry grid
      expect(screen.getByTestId('review-1')).toBeInTheDocument();
      expect(screen.getByTestId('review-2')).toBeInTheDocument();
    });
  });

  describe('mobile layout handling', () => {
    it('should handle mobile tags modal layout', async () => {
      const mockUseIsMobile = await import('@/hooks/use-mobile');
      vi.mocked(mockUseIsMobile.useIsMobile).mockReturnValue(true);
      
      const mocks = setupMocks();
      
      const mockUseAcervoDataQuery = await import('../../packages/hooks/useAcervoDataQuery');
      const mockUseContentAccessFilter = await import('@/hooks/useContentAccessFilter');
      const mockUseAuthStore = await import('@/store/auth');
      
      vi.mocked(mockUseAcervoDataQuery.useAcervoDataQuery).mockImplementation(mocks.useAcervoDataQuery);
      vi.mocked(mockUseContentAccessFilter.useContentAccessFilter).mockImplementation(mocks.useContentAccessFilter);
      vi.mocked(mockUseAuthStore.useAuthStore).mockImplementation(mocks.useAuthStore);

      render(<ArchivePage />, { wrapper });

      // Should show mobile tags modal instead of tags panel
      expect(screen.getByTestId('mobile-tags-modal')).toBeInTheDocument();
      expect(screen.queryByTestId('tags-panel')).not.toBeInTheDocument();
    });
  });

  describe('accessibility and semantic structure', () => {
    it('should maintain proper semantic structure with layout updates', async () => {
      const mocks = setupMocks();
      
      const mockUseAcervoDataQuery = await import('../../packages/hooks/useAcervoDataQuery');
      const mockUseContentAccessFilter = await import('@/hooks/useContentAccessFilter');
      const mockUseAuthStore = await import('@/store/auth');
      
      vi.mocked(mockUseAcervoDataQuery.useAcervoDataQuery).mockImplementation(mocks.useAcervoDataQuery);
      vi.mocked(mockUseContentAccessFilter.useContentAccessFilter).mockImplementation(mocks.useContentAccessFilter);
      vi.mocked(mockUseAuthStore.useAuthStore).mockImplementation(mocks.useAuthStore);

      const { container } = render(<ArchivePage />, { wrapper });

      // Should maintain semantic heading structure
      const mainHeading = screen.getByText('Acervo');
      expect(mainHeading).toBeInTheDocument();
      
      // Should have proper layout structure
      const contentArea = container.querySelector('.min-h-screen') as HTMLElement;
      expect(contentArea).toBeInTheDocument();
    });
  });

  describe('content filtering and access control layout', () => {
    it('should handle access upgrade prompt layout', async () => {
      const mocks = setupMocks({ totalFiltered: 1 });
      
      const mockUseAcervoDataQuery = await import('../../packages/hooks/useAcervoDataQuery');
      const mockUseContentAccessFilter = await import('@/hooks/useContentAccessFilter');
      const mockUseAuthStore = await import('@/store/auth');
      
      vi.mocked(mockUseAcervoDataQuery.useAcervoDataQuery).mockImplementation(mocks.useAcervoDataQuery);
      vi.mocked(mockUseContentAccessFilter.useContentAccessFilter).mockImplementation(mocks.useContentAccessFilter);
      vi.mocked(mockUseAuthStore.useAuthStore).mockImplementation(mocks.useAuthStore);

      render(<ArchivePage />, { wrapper });

      // Should show access upgrade prompt when content is filtered
      expect(screen.getByTestId('access-upgrade-prompt')).toBeInTheDocument();
    });
  });
});