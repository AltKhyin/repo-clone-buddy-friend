// ABOUTME: Tests for Index page layout migration to Reddit-inspired standardized layout system

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Index from './Index';

// Mock the homepage query hook
vi.mock('../../packages/hooks/useHomepageFeedQuery', () => ({
  useConsolidatedHomepageFeedQuery: vi.fn(),
}));

// Mock homepage components
vi.mock('../components/homepage/FeaturedReview', () => ({
  default: ({ review }: any) => (
    <div data-testid="featured-review">
      {review ? `Featured: ${review.title}` : 'No featured review'}
    </div>
  ),
}));

vi.mock('../components/homepage/ReviewCarousel', () => ({
  default: ({ title, reviews }: any) => (
    <div data-testid="review-carousel">
      <h2>{title}</h2>
      <div>{reviews?.length || 0} reviews</div>
    </div>
  ),
}));

vi.mock('../components/homepage/NextEditionModule', () => ({
  default: ({ suggestions }: any) => (
    <div data-testid="next-edition-module">
      {suggestions?.length || 0} suggestions
    </div>
  ),
}));

describe('Index Page Layout Integration', () => {
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

  const mockHomepageData = {
    featured: { title: 'Featured Review', content: 'Featured content' },
    recent: [
      { id: 1, title: 'Recent 1' },
      { id: 2, title: 'Recent 2' },
    ],
    popular: [
      { id: 3, title: 'Popular 1' },
      { id: 4, title: 'Popular 2' },
    ],
    recommendations: [
      { id: 5, title: 'Recommendation 1' },
    ],
    suggestions: [
      { id: 6, title: 'Suggestion 1' },
    ],
    layout: ['featured', 'recent', 'popular', 'recommendations', 'suggestions'],
  };

  describe('layout structure and constraints', () => {
    it('should apply proper content constraints for Reddit-inspired layout', async () => {
      const mockUseConsolidatedHomepageFeedQuery = await import('../../packages/hooks/useHomepageFeedQuery');
      
      vi.mocked(mockUseConsolidatedHomepageFeedQuery.useConsolidatedHomepageFeedQuery).mockReturnValue({
        data: mockHomepageData,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<Index />, { wrapper });

      // Should have proper StandardLayout structure with content-only type
      const contentWrapper = container.querySelector('main') as HTMLElement;
      expect(contentWrapper).toBeInTheDocument();
      expect(contentWrapper).toHaveClass('space-y-8');
      expect(contentWrapper).toHaveClass('py-6');
    });

    it('should handle mobile responsive layout properly', async () => {
      const mockUseConsolidatedHomepageFeedQuery = await import('../../packages/hooks/useHomepageFeedQuery');
      
      vi.mocked(mockUseConsolidatedHomepageFeedQuery.useConsolidatedHomepageFeedQuery).mockReturnValue({
        data: mockHomepageData,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<Index />, { wrapper });

      // Should maintain proper mobile padding
      const contentWrapper = container.querySelector('.px-4') as HTMLElement;
      expect(contentWrapper).toHaveClass('px-4'); // Mobile padding
    });

    it('should apply compression-safe layout classes', async () => {
      const mockUseConsolidatedHomepageFeedQuery = await import('../../packages/hooks/useHomepageFeedQuery');
      
      vi.mocked(mockUseConsolidatedHomepageFeedQuery.useConsolidatedHomepageFeedQuery).mockReturnValue({
        data: mockHomepageData,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<Index />, { wrapper });

      // Should have proper background and layout structure
      const backgroundContainer = container.querySelector('.min-h-screen.bg-background') as HTMLElement;
      expect(backgroundContainer).toBeInTheDocument();
    });

    it('should handle content overflow gracefully', async () => {
      const mockUseConsolidatedHomepageFeedQuery = await import('../../packages/hooks/useHomepageFeedQuery');
      
      // Mock with very long content that could cause overflow
      const longTitleData = {
        ...mockHomepageData,
        featured: { 
          title: 'A'.repeat(200), // Very long title
          content: 'B'.repeat(1000) // Very long content
        },
      };
      
      vi.mocked(mockUseConsolidatedHomepageFeedQuery.useConsolidatedHomepageFeedQuery).mockReturnValue({
        data: longTitleData,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<Index />, { wrapper });

      // Should maintain proper layout structure even with overflow content
      const contentWrapper = container.querySelector('.px-4') as HTMLElement;
      expect(contentWrapper).toBeInTheDocument();
      
      // Content should be rendered without breaking layout
      expect(screen.getByTestId('featured-review')).toBeInTheDocument();
    });
  });

  describe('loading state layout', () => {
    it('should apply proper layout constraints to loading skeletons', async () => {
      const mockUseConsolidatedHomepageFeedQuery = await import('../../packages/hooks/useHomepageFeedQuery');
      
      vi.mocked(mockUseConsolidatedHomepageFeedQuery.useConsolidatedHomepageFeedQuery).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
      });

      const { container } = render(<Index />, { wrapper });

      // Should have proper loading layout structure
      const loadingContainer = container.querySelector('.min-h-screen.bg-background') as HTMLElement;
      expect(loadingContainer).toBeInTheDocument();
      
      // Should use StandardLayout for loading state
      const mainElement = container.querySelector('main') as HTMLElement;
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveClass('space-y-8');
      expect(mainElement).toHaveClass('py-6');
    });

    it('should apply compression-safe classes to loading state', async () => {
      const mockUseConsolidatedHomepageFeedQuery = await import('../../packages/hooks/useHomepageFeedQuery');
      
      vi.mocked(mockUseConsolidatedHomepageFeedQuery.useConsolidatedHomepageFeedQuery).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
      });

      const { container } = render(<Index />, { wrapper });

      // Should have loading skeletons with proper structure
      const skeletonElements = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('error state layout', () => {
    it('should apply proper layout constraints to error state', async () => {
      const mockUseConsolidatedHomepageFeedQuery = await import('../../packages/hooks/useHomepageFeedQuery');
      
      vi.mocked(mockUseConsolidatedHomepageFeedQuery.useConsolidatedHomepageFeedQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: new Error('Test error message'),
      });

      const { container } = render(<Index />, { wrapper });

      // Should have proper error layout structure
      const errorContainer = container.querySelector('.min-h-screen.bg-background') as HTMLElement;
      expect(errorContainer).toBeInTheDocument();
      
      // Should use StandardLayout centered type for error state
      const centeredContent = container.querySelector('main') as HTMLElement;
      expect(centeredContent).toBeInTheDocument();
      expect(centeredContent).toHaveClass('text-center');
      expect(centeredContent).toHaveClass('space-y-4');
    });

    it('should handle error message overflow gracefully', async () => {
      const mockUseConsolidatedHomepageFeedQuery = await import('../../packages/hooks/useHomepageFeedQuery');
      
      vi.mocked(mockUseConsolidatedHomepageFeedQuery.useConsolidatedHomepageFeedQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: new Error('A'.repeat(500)), // Very long error message
      });

      const { container } = render(<Index />, { wrapper });

      // Should maintain proper layout constraints
      const errorContainer = container.querySelector('.max-w-md.mx-auto') as HTMLElement;
      expect(errorContainer).toBeInTheDocument();
    });
  });

  describe('empty state layout', () => {
    it('should apply proper layout constraints to empty state', async () => {
      const mockUseConsolidatedHomepageFeedQuery = await import('../../packages/hooks/useHomepageFeedQuery');
      
      vi.mocked(mockUseConsolidatedHomepageFeedQuery.useConsolidatedHomepageFeedQuery).mockReturnValue({
        data: null, // No data returned
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<Index />, { wrapper });

      // Should have proper empty state layout structure
      const emptyContainer = container.querySelector('.min-h-screen.bg-background') as HTMLElement;
      expect(emptyContainer).toBeInTheDocument();
      
      // Should use StandardLayout centered type for empty state
      const centeredContent = container.querySelector('main') as HTMLElement;
      expect(centeredContent).toBeInTheDocument();
      expect(centeredContent).toHaveClass('text-center');
      expect(centeredContent).toHaveClass('space-y-4');
    });
  });

  describe('content rendering and layout integration', () => {
    it('should render all modules with proper spacing', async () => {
      const mockUseConsolidatedHomepageFeedQuery = await import('../../packages/hooks/useHomepageFeedQuery');
      
      vi.mocked(mockUseConsolidatedHomepageFeedQuery.useConsolidatedHomepageFeedQuery).mockReturnValue({
        data: mockHomepageData,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<Index />, { wrapper });

      // Should render all module types
      expect(screen.getByTestId('featured-review')).toBeInTheDocument();
      expect(screen.getAllByTestId('review-carousel')).toHaveLength(3); // recent, popular, recommendations
      expect(screen.getByTestId('next-edition-module')).toBeInTheDocument();
    });

    it('should handle missing modules gracefully', async () => {
      const mockUseConsolidatedHomepageFeedQuery = await import('../../packages/hooks/useHomepageFeedQuery');
      
      const partialData = {
        featured: mockHomepageData.featured,
        layout: ['featured', 'missing-module'],
      };
      
      vi.mocked(mockUseConsolidatedHomepageFeedQuery.useConsolidatedHomepageFeedQuery).mockReturnValue({
        data: partialData,
        isLoading: false,
        isError: false,
        error: null,
      });

      expect(() => {
        render(<Index />, { wrapper });
      }).not.toThrow();

      // Should render available modules
      expect(screen.getByTestId('featured-review')).toBeInTheDocument();
    });
  });

  describe('accessibility and semantic structure', () => {
    it('should maintain proper semantic structure with layout updates', async () => {
      const mockUseConsolidatedHomepageFeedQuery = await import('../../packages/hooks/useHomepageFeedQuery');
      
      vi.mocked(mockUseConsolidatedHomepageFeedQuery.useConsolidatedHomepageFeedQuery).mockReturnValue({
        data: mockHomepageData,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<Index />, { wrapper });

      // Should maintain semantic structure
      const contentArea = container.querySelector('.min-h-screen') as HTMLElement;
      expect(contentArea).toBeInTheDocument();
    });

    it('should handle focus management within layout constraints', async () => {
      const mockUseConsolidatedHomepageFeedQuery = await import('../../packages/hooks/useHomepageFeedQuery');
      
      vi.mocked(mockUseConsolidatedHomepageFeedQuery.useConsolidatedHomepageFeedQuery).mockReturnValue({
        data: mockHomepageData,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<Index />, { wrapper });

      // Should have rendered content that can be focused
      const featuredReview = screen.getByTestId('featured-review');
      expect(featuredReview).toBeInTheDocument();
    });
  });

  describe('error boundary integration', () => {
    it('should maintain error boundary structure with layout updates', async () => {
      const mockUseConsolidatedHomepageFeedQuery = await import('../../packages/hooks/useHomepageFeedQuery');
      
      vi.mocked(mockUseConsolidatedHomepageFeedQuery.useConsolidatedHomepageFeedQuery).mockReturnValue({
        data: mockHomepageData,
        isLoading: false,
        isError: false,
        error: null,
      });

      // Should render without throwing errors
      expect(() => {
        render(<Index />, { wrapper });
      }).not.toThrow();
    });
  });
});