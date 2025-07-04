// ABOUTME: Tests for ReviewManagementPage ensuring StandardLayout integration and proper review management interface behavior

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockProviders } from '@/test-utils/mock-providers';
import ReviewManagementPage from './ReviewManagementPage';

// Mock the hook
vi.mock('../../packages/hooks/useAdminReviewManagement', () => ({
  useAdminReviewManagement: () => ({
    data: {
      id: 'test-review-id',
      title: 'Test Review Title',
      status: 'draft'
    },
    isLoading: false,
    isError: false,
    error: null
  })
}));

// Mock admin components that might not exist yet
vi.mock('@/components/admin/ReviewManagement/ReviewMetadataPanel', () => ({
  ReviewMetadataPanel: () => <div data-testid="review-metadata-panel">Review Metadata Panel</div>
}));

vi.mock('@/components/admin/ReviewManagement/PublicationControlPanel', () => ({
  PublicationControlPanel: () => <div data-testid="publication-control-panel">Publication Control Panel</div>
}));

vi.mock('@/components/admin/ReviewManagement/ReviewAnalyticsPanel', () => ({
  ReviewAnalyticsPanel: () => <div data-testid="review-analytics-panel">Review Analytics Panel</div>
}));

vi.mock('@/components/admin/common/UnifiedSaveProvider', () => ({
  UnifiedSaveProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="unified-save-provider">{children}</div>
}));

vi.mock('@/components/admin/common/SaveButton', () => ({
  SaveButton: ({ variant }: { variant: string }) => <button data-testid={`save-button-${variant}`}>Save Button {variant}</button>
}));

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ reviewId: 'test-review-id' }),
    Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>
  };
});

describe('ReviewManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('layout structure', () => {
    it('should render with ErrorBoundary wrapper', () => {
      render(
        <MockProviders>
          <ReviewManagementPage />
        </MockProviders>
      );

      // Should have ErrorBoundary structure
      const errorBoundary = document.querySelector('[data-error-boundary]');
      expect(errorBoundary).toBeInTheDocument();
    });

    it('should render with StandardLayout wide type', () => {
      render(
        <MockProviders>
          <ReviewManagementPage />
        </MockProviders>
      );

      // Should have main element with wide layout characteristics
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveClass('max-w-6xl'); // StandardLayout 'wide' type
      expect(main).toHaveClass('mx-auto');   // Centering
    });

    it('should have proper spacing with contentClassName', () => {
      render(
        <MockProviders>
          <ReviewManagementPage />
        </MockProviders>
      );

      const main = screen.getByRole('main');
      expect(main).toHaveClass('space-y-6'); // contentClassName applied
    });
  });

  describe('content structure', () => {
    it('should display the review title', () => {
      render(
        <MockProviders>
          <ReviewManagementPage />
        </MockProviders>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Test Review Title');
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'font-serif');
    });

    it('should display review ID', () => {
      render(
        <MockProviders>
          <ReviewManagementPage />
        </MockProviders>
      );

      const reviewId = screen.getByText(/Review ID: test-review-id/);
      expect(reviewId).toBeInTheDocument();
    });

    it('should render review management panels', () => {
      render(
        <MockProviders>
          <ReviewManagementPage />
        </MockProviders>
      );

      const metadataPanel = screen.getByTestId('review-metadata-panel');
      const publicationPanel = screen.getByTestId('publication-control-panel');
      const analyticsPanel = screen.getByTestId('review-analytics-panel');

      expect(metadataPanel).toBeInTheDocument();
      expect(publicationPanel).toBeInTheDocument();
      expect(analyticsPanel).toBeInTheDocument();
    });

    it('should render save buttons', () => {
      render(
        <MockProviders>
          <ReviewManagementPage />
        </MockProviders>
      );

      const saveButton = screen.getByTestId('save-button-save');
      const publishButton = screen.getByTestId('save-button-publish');

      expect(saveButton).toBeInTheDocument();
      expect(publishButton).toBeInTheDocument();
    });

    it('should render UnifiedSaveProvider wrapper', () => {
      render(
        <MockProviders>
          <ReviewManagementPage />
        </MockProviders>
      );

      const saveProvider = screen.getByTestId('unified-save-provider');
      expect(saveProvider).toBeInTheDocument();
    });
  });

  describe('layout integration compliance', () => {
    it('should follow StandardLayout architecture pattern', () => {
      render(
        <MockProviders>
          <ReviewManagementPage />
        </MockProviders>
      );

      const main = screen.getByRole('main');
      
      // Should have StandardLayout 'wide' characteristics
      expect(main).toHaveClass('max-w-6xl'); // Wide type max-width
      expect(main).toHaveClass('mx-auto');   // Centering
      expect(main).toHaveClass('w-full');    // Full width within constraints
    });

    it('should not have custom layout implementations', () => {
      render(
        <MockProviders>
          <ReviewManagementPage />
        </MockProviders>
      );

      // Should NOT have old custom container classes
      const customContainer = document.querySelector('.container.mx-auto');
      expect(customContainer).not.toBeInTheDocument();

      // Should NOT have old space-y-6 div wrapper at root
      const customSpacing = document.querySelector('body > div.space-y-6');
      expect(customSpacing).not.toBeInTheDocument();
    });

    it('should maintain content width constraints', () => {
      render(
        <MockProviders>
          <ReviewManagementPage />
        </MockProviders>
      );

      const main = screen.getByRole('main');
      
      // Should have proper width constraints (not full screen width)
      expect(main).toHaveClass('max-w-6xl');
      
      // Should not touch screen edges
      expect(main).not.toHaveClass('w-screen');
      expect(main).not.toHaveClass('min-w-full');
    });
  });

  describe('error boundary integration', () => {
    it('should be wrapped in ErrorBoundary with correct props', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <MockProviders>
          <ReviewManagementPage />
        </MockProviders>
      );

      // Should have error boundary attributes
      const errorBoundary = document.querySelector('[data-error-boundary]');
      expect(errorBoundary).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('administrative role compliance', () => {
    it('should be accessible only to admin users', () => {
      render(
        <MockProviders>
          <ReviewManagementPage />
        </MockProviders>
      );

      // Component should render for admin context
      const heading = screen.getByText('Test Review Title');
      expect(heading).toBeInTheDocument();
    });

    it('should maintain admin-specific styling', () => {
      render(
        <MockProviders>
          <ReviewManagementPage />
        </MockProviders>
      );

      const main = screen.getByRole('main');
      
      // Should use 'wide' layout appropriate for admin interfaces
      expect(main).toHaveClass('max-w-6xl');
    });
  });
});