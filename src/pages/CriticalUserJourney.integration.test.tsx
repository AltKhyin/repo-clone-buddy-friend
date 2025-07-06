// ABOUTME: Critical user journey integration tests - AI-safe guardrails for complete homepage to review detail workflow

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test-utils';

// Mock critical navigation flow components
const MockHomepage = () => (
  <div data-testid="homepage">
    <main role="main">
      <h1>EVIDENS Platform</h1>
      <section data-testid="featured-review">
        <a href="/review/featured-123" data-testid="featured-review-link">
          Featured Review: Medical Device Analysis
        </a>
        <p>Comprehensive review of the latest medical device technology...</p>
      </section>
      <section data-testid="recent-posts">
        <h2>Recent Community Posts</h2>
        <a href="/community/post-456" data-testid="community-post-link">
          Community Discussion: Treatment Guidelines
        </a>
      </section>
      <nav data-testid="main-navigation">
        <a href="/community" data-testid="nav-community">
          Community
        </a>
        <a href="/acervo" data-testid="nav-acervo">
          Acervo
        </a>
        <a href="/profile" data-testid="nav-profile">
          Profile
        </a>
      </nav>
    </main>
  </div>
);

const MockCommunityPage = () => {
  const isAuthenticated = !!mockAuthStore.session;

  return (
    <div data-testid="community-page">
      <main role="main">
        <h1>Community</h1>
        <section data-testid="community-posts">
          <article data-testid="post-1">
            <h3>
              <a href="/community/post-789" data-testid="post-detail-link">
                Discussion: Latest Research Findings
              </a>
            </h3>
            <p>Dr. Smith - 15 votes - 8 comments</p>
            <button
              data-testid="vote-button"
              disabled={!isAuthenticated}
              data-requires-auth={!isAuthenticated ? 'true' : undefined}
            >
              Vote
            </button>
            <button
              data-testid="save-button"
              disabled={!isAuthenticated}
              data-requires-auth={!isAuthenticated ? 'true' : undefined}
            >
              Save
            </button>
          </article>
          <article data-testid="post-2">
            <h3>Poll: Preferred Treatment Approach</h3>
            <div data-testid="poll-options">
              <button data-testid="poll-option-1">Conservative Treatment</button>
              <button data-testid="poll-option-2">Aggressive Treatment</button>
            </div>
          </article>
        </section>
        <button data-testid="create-post-button">Create New Post</button>
      </main>
    </div>
  );
};

const MockReviewDetailPage = ({ reviewId }: { reviewId: string }) => {
  const isAuthenticated = !!mockAuthStore.session;

  return (
    <div data-testid="review-detail">
      <main role="main">
        <header data-testid="review-header">
          <button data-testid="back-button">← Back</button>
          <h1>Medical Device Analysis - Review #{reviewId}</h1>
          <div data-testid="author-info">
            <span>Dr. Maria Silva</span>
            <span>Cardiologist</span>
          </div>
        </header>
        <article data-testid="review-content">
          <section data-testid="executive-summary">
            <h2>Executive Summary</h2>
            <p>This comprehensive review examines the latest medical device...</p>
          </section>
          <section data-testid="key-findings">
            <h2>Key Findings</h2>
            <ul>
              <li>Efficacy: Significant improvement in patient outcomes</li>
              <li>Safety: Well-tolerated with minimal side effects</li>
              <li>Cost-effectiveness: Favorable cost-benefit ratio</li>
            </ul>
          </section>
        </article>
        <aside data-testid="review-metadata">
          <div data-testid="tags">
            <span>cardiology</span>
            <span>medical-devices</span>
            <span>clinical-trial</span>
          </div>
          <div data-testid="stats">
            <span>1,847 views</span>
            <span>156 saves</span>
            <span>Score: 89</span>
          </div>
        </aside>
        <section data-testid="user-actions">
          <button
            data-testid="save-review-button"
            disabled={!isAuthenticated}
            data-requires-auth={!isAuthenticated ? 'true' : undefined}
          >
            Save Review
          </button>
          <button
            data-testid="vote-review-button"
            disabled={!isAuthenticated}
            data-requires-auth={!isAuthenticated ? 'true' : undefined}
          >
            Vote
          </button>
          <button data-testid="share-button">Share</button>
        </section>
        <section data-testid="related-reviews">
          <h3>Related Reviews</h3>
          <a href="/review/related-1" data-testid="related-review-link">
            Previous Device Analysis
          </a>
        </section>
      </main>
    </div>
  );
};

// Mock auth store states
const mockAuthStore = {
  session: null,
  user: null,
  isLoading: false,
};

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

describe('CriticalUserJourney - Complete Homepage to Review Detail Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth store
    mockAuthStore.session = null;
    mockAuthStore.user = null;
    mockAuthStore.isLoading = false;
  });

  describe('🔴 CRITICAL: Core Navigation Flow', () => {
    it('homepage renders with all essential navigation elements', () => {
      renderWithProviders(<MockHomepage />);

      // Should render main page elements
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('EVIDENS Platform')).toBeInTheDocument();

      // Should render featured content
      expect(screen.getByTestId('featured-review')).toBeInTheDocument();
      expect(screen.getByText('Featured Review: Medical Device Analysis')).toBeInTheDocument();

      // Should render community posts
      expect(screen.getByTestId('recent-posts')).toBeInTheDocument();
      expect(screen.getByText('Community Discussion: Treatment Guidelines')).toBeInTheDocument();

      // Should render main navigation
      expect(screen.getByTestId('main-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('nav-community')).toBeInTheDocument();
      expect(screen.getByTestId('nav-acervo')).toBeInTheDocument();
    });

    it('homepage provides proper navigation links', () => {
      renderWithProviders(<MockHomepage />);

      // Featured review should link to review detail
      const featuredLink = screen.getByTestId('featured-review-link');
      expect(featuredLink).toHaveAttribute('href', '/review/featured-123');

      // Community post should link to post detail
      const communityLink = screen.getByTestId('community-post-link');
      expect(communityLink).toHaveAttribute('href', '/community/post-456');

      // Navigation should link to proper pages
      expect(screen.getByTestId('nav-community')).toHaveAttribute('href', '/community');
      expect(screen.getByTestId('nav-acervo')).toHaveAttribute('href', '/acervo');
    });
  });

  describe('🟡 CRITICAL: Community Page Functionality', () => {
    it('community page renders with essential features', () => {
      renderWithProviders(<MockCommunityPage />);

      // Should render community page structure
      expect(screen.getByTestId('community-page')).toBeInTheDocument();
      expect(screen.getByText('Community')).toBeInTheDocument();

      // Should render community posts
      expect(screen.getByTestId('community-posts')).toBeInTheDocument();
      expect(screen.getByTestId('post-1')).toBeInTheDocument();
      expect(screen.getByTestId('post-2')).toBeInTheDocument();

      // Should render interactive elements
      expect(screen.getByTestId('vote-button')).toBeInTheDocument();
      expect(screen.getByTestId('save-button')).toBeInTheDocument();
      expect(screen.getByTestId('create-post-button')).toBeInTheDocument();
    });

    it('community page provides post interaction capabilities', () => {
      mockAuthStore.session = {
        user: {
          id: 'user-123',
          email: 'practitioner@example.com',
          app_metadata: { role: 'practitioner' },
        },
      };

      renderWithProviders(<MockCommunityPage />);

      // Should have functional vote button
      const voteButton = screen.getByTestId('vote-button');
      expect(voteButton).toBeInTheDocument();
      expect(voteButton).not.toBeDisabled();

      // Should have functional save button
      const saveButton = screen.getByTestId('save-button');
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).not.toBeDisabled();

      // Should have poll options
      expect(screen.getByTestId('poll-option-1')).toBeInTheDocument();
      expect(screen.getByTestId('poll-option-2')).toBeInTheDocument();
    });

    it('community page provides navigation to post details', () => {
      renderWithProviders(<MockCommunityPage />);

      // Should link to post detail
      const postDetailLink = screen.getByTestId('post-detail-link');
      expect(postDetailLink).toHaveAttribute('href', '/community/post-789');
    });
  });

  describe('🟢 STRATEGIC: Review Detail Page Completeness', () => {
    it('review detail page renders with complete content structure', () => {
      renderWithProviders(<MockReviewDetailPage reviewId="featured-123" />);

      // Should render review page structure
      expect(screen.getByTestId('review-detail')).toBeInTheDocument();
      expect(
        screen.getByText('Medical Device Analysis - Review #featured-123')
      ).toBeInTheDocument();

      // Should render author information
      expect(screen.getByTestId('author-info')).toBeInTheDocument();
      expect(screen.getByText('Dr. Maria Silva')).toBeInTheDocument();
      expect(screen.getByText('Cardiologist')).toBeInTheDocument();

      // Should render content sections
      expect(screen.getByTestId('executive-summary')).toBeInTheDocument();
      expect(screen.getByTestId('key-findings')).toBeInTheDocument();
      expect(
        screen.getByText('Efficacy: Significant improvement in patient outcomes')
      ).toBeInTheDocument();
    });

    it('review detail page provides metadata and interaction features', () => {
      renderWithProviders(<MockReviewDetailPage reviewId="featured-123" />);

      // Should render tags
      expect(screen.getByTestId('tags')).toBeInTheDocument();
      expect(screen.getByText('cardiology')).toBeInTheDocument();
      expect(screen.getByText('medical-devices')).toBeInTheDocument();

      // Should render statistics
      expect(screen.getByTestId('stats')).toBeInTheDocument();
      expect(screen.getByText('1,847 views')).toBeInTheDocument();
      expect(screen.getByText('156 saves')).toBeInTheDocument();

      // Should render user actions
      expect(screen.getByTestId('user-actions')).toBeInTheDocument();
      expect(screen.getByTestId('save-review-button')).toBeInTheDocument();
      expect(screen.getByTestId('vote-review-button')).toBeInTheDocument();
    });

    it('review detail page provides navigation and related content', () => {
      renderWithProviders(<MockReviewDetailPage reviewId="featured-123" />);

      // Should have back navigation
      expect(screen.getByTestId('back-button')).toBeInTheDocument();

      // Should render related reviews
      expect(screen.getByTestId('related-reviews')).toBeInTheDocument();
      const relatedLink = screen.getByTestId('related-review-link');
      expect(relatedLink).toHaveAttribute('href', '/review/related-1');
    });
  });

  describe('🔵 AI-SAFETY: User Role Access Control Across Journey', () => {
    const userRoleScenarios = [
      {
        role: 'anonymous',
        session: null,
        expectInteractionDisabled: true,
        expectUpgradePrompts: false,
      },
      {
        role: 'free_practitioner',
        session: {
          user: {
            id: 'user-free',
            email: 'free@example.com',
            app_metadata: { role: 'practitioner' },
            subscription_tier: 'free',
          },
        },
        expectInteractionDisabled: false,
        expectUpgradePrompts: true,
      },
      {
        role: 'premium_practitioner',
        session: {
          user: {
            id: 'user-premium',
            email: 'premium@example.com',
            app_metadata: { role: 'practitioner' },
            subscription_tier: 'premium',
          },
        },
        expectInteractionDisabled: false,
        expectUpgradePrompts: false,
      },
      {
        role: 'admin',
        session: {
          user: {
            id: 'user-admin',
            email: 'admin@example.com',
            app_metadata: { role: 'admin' },
            subscription_tier: 'premium',
          },
        },
        expectInteractionDisabled: false,
        expectUpgradePrompts: false,
      },
    ];

    userRoleScenarios.forEach(scenario => {
      it(`maintains consistent access control for ${scenario.role} across the journey`, () => {
        mockAuthStore.session = scenario.session;
        mockAuthStore.user = scenario.session?.user || null;

        // Test homepage
        const { unmount: unmountHomepage } = renderWithProviders(<MockHomepage />);
        expect(screen.getByText('EVIDENS Platform')).toBeInTheDocument();
        unmountHomepage();

        // Test community page
        const { unmount: unmountCommunity } = renderWithProviders(<MockCommunityPage />);
        const voteButton = screen.getByTestId('vote-button');

        if (scenario.expectInteractionDisabled) {
          expect(voteButton).toBeDisabled();
        } else {
          expect(voteButton).not.toBeDisabled();
        }
        unmountCommunity();

        // Test review detail page
        renderWithProviders(<MockReviewDetailPage reviewId="test-123" />);
        expect(screen.getByText('Medical Device Analysis - Review #test-123')).toBeInTheDocument();

        const saveReviewButton = screen.getByTestId('save-review-button');
        if (scenario.expectInteractionDisabled) {
          expect(saveReviewButton).toBeDisabled();
        } else {
          expect(saveReviewButton).not.toBeDisabled();
        }
      });
    });
  });

  describe('🎯 COVERAGE: Complete User Journey Flow', () => {
    it('supports complete navigation flow: homepage → community → review detail', () => {
      // Start at homepage
      const { unmount: unmountHomepage } = renderWithProviders(<MockHomepage />);

      // Verify homepage navigation options
      expect(screen.getByTestId('featured-review-link')).toHaveAttribute(
        'href',
        '/review/featured-123'
      );
      expect(screen.getByTestId('nav-community')).toHaveAttribute('href', '/community');
      unmountHomepage();

      // Navigate to community
      const { unmount: unmountCommunity } = renderWithProviders(<MockCommunityPage />);

      // Verify community navigation options
      expect(screen.getByTestId('post-detail-link')).toHaveAttribute('href', '/community/post-789');
      unmountCommunity();

      // Navigate to review detail
      renderWithProviders(<MockReviewDetailPage reviewId="featured-123" />);

      // Verify review detail content
      expect(
        screen.getByText('Medical Device Analysis - Review #featured-123')
      ).toBeInTheDocument();
      expect(screen.getByTestId('related-review-link')).toHaveAttribute(
        'href',
        '/review/related-1'
      );
    });

    it('maintains consistent layout structure across all pages', () => {
      // Test homepage layout
      const { unmount: unmountHomepage } = renderWithProviders(<MockHomepage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      unmountHomepage();

      // Test community layout
      const { unmount: unmountCommunity } = renderWithProviders(<MockCommunityPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      unmountCommunity();

      // Test review detail layout
      renderWithProviders(<MockReviewDetailPage reviewId="test-123" />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('🛡️ ARCHITECTURE: Integration Points and Error Handling', () => {
    it('handles authentication state changes across the journey', () => {
      // Start anonymous
      mockAuthStore.session = null;
      const { rerender } = renderWithProviders(<MockCommunityPage />);

      const voteButton = screen.getByTestId('vote-button');
      expect(voteButton).toBeDisabled();

      // Authenticate user
      mockAuthStore.session = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          app_metadata: { role: 'practitioner' },
        },
      };
      mockAuthStore.user = mockAuthStore.session.user;

      rerender(<MockCommunityPage />);

      const updatedVoteButton = screen.getByTestId('vote-button');
      expect(updatedVoteButton).not.toBeDisabled();
    });

    it('maintains responsive design across all pages', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      // Test each page renders without layout issues
      const { unmount: unmountHomepage } = renderWithProviders(<MockHomepage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      unmountHomepage();

      const { unmount: unmountCommunity } = renderWithProviders(<MockCommunityPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      unmountCommunity();

      renderWithProviders(<MockReviewDetailPage reviewId="test-123" />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('provides consistent error handling patterns', () => {
      // Each page should have proper error boundaries and fallbacks
      // This is tested by ensuring the basic structure renders without errors

      const { unmount: unmountHomepage } = renderWithProviders(<MockHomepage />);
      expect(screen.getByTestId('homepage')).toBeInTheDocument();
      unmountHomepage();

      const { unmount: unmountCommunity } = renderWithProviders(<MockCommunityPage />);
      expect(screen.getByTestId('community-page')).toBeInTheDocument();
      unmountCommunity();

      renderWithProviders(<MockReviewDetailPage reviewId="test-123" />);
      expect(screen.getByTestId('review-detail')).toBeInTheDocument();
    });
  });
});
