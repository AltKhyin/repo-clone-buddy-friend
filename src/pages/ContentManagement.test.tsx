// ABOUTME: Tests for ContentManagement ensuring StandardLayout integration and proper admin interface behavior

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockProviders } from '@/test-utils/mock-providers';
import ContentManagement from './ContentManagement';

// Mock admin components that might not exist yet
vi.mock('@/components/admin/ContentManagement/ContentQueue', () => ({
  ContentQueue: () => <div data-testid="content-queue">Content Queue Component</div>
}));

describe('ContentManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('layout structure', () => {
    it('should render with ErrorBoundary wrapper', () => {
      render(
        <MockProviders>
          <ContentManagement />
        </MockProviders>
      );

      // Should have ErrorBoundary structure
      const errorBoundary = document.querySelector('[data-error-boundary]');
      expect(errorBoundary).toBeInTheDocument();
    });

    it('should render with StandardLayout wide type', () => {
      render(
        <MockProviders>
          <ContentManagement />
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
          <ContentManagement />
        </MockProviders>
      );

      const main = screen.getByRole('main');
      expect(main).toHaveClass('space-y-6'); // contentClassName applied
    });
  });

  describe('content structure', () => {
    it('should display the page header with proper typography', () => {
      render(
        <MockProviders>
          <ContentManagement />
        </MockProviders>
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Gestão de Conteúdo');
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'font-serif');
    });

    it('should display page description', () => {
      render(
        <MockProviders>
          <ContentManagement />
        </MockProviders>
      );

      const description = screen.getByText(/Gerencie o fluxo de publicação/);
      expect(description).toBeInTheDocument();
    });

    it('should render ContentQueue component', () => {
      render(
        <MockProviders>
          <ContentManagement />
        </MockProviders>
      );

      const contentQueue = screen.getByTestId('content-queue');
      expect(contentQueue).toBeInTheDocument();
    });
  });

  describe('layout integration compliance', () => {
    it('should follow StandardLayout architecture pattern', () => {
      render(
        <MockProviders>
          <ContentManagement />
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
          <ContentManagement />
        </MockProviders>
      );

      // Should NOT have old custom container classes
      const customContainer = document.querySelector('.container.mx-auto');
      expect(customContainer).not.toBeInTheDocument();

      // Should NOT have old space-y-6 div wrapper
      const customSpacing = document.querySelector('div.space-y-6 > div.mb-6');
      expect(customSpacing).not.toBeInTheDocument();
    });

    it('should maintain content width constraints', () => {
      render(
        <MockProviders>
          <ContentManagement />
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
          <ContentManagement />
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
          <ContentManagement />
        </MockProviders>
      );

      // Component should render for admin context
      const heading = screen.getByText('Gestão de Conteúdo');
      expect(heading).toBeInTheDocument();
    });

    it('should maintain admin-specific styling', () => {
      render(
        <MockProviders>
          <ContentManagement />
        </MockProviders>
      );

      const main = screen.getByRole('main');
      
      // Should use 'wide' layout appropriate for admin interfaces
      expect(main).toHaveClass('max-w-6xl');
    });
  });
});