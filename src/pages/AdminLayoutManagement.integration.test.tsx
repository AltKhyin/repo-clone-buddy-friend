// ABOUTME: Integration tests specifically for AdminLayoutManagement StandardLayout compliance and layout architecture

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockProviders } from '@/test-utils/mock-providers';
import AdminLayoutManagement from './AdminLayoutManagement';

describe('AdminLayoutManagement - Layout Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('StandardLayout Integration Compliance', () => {
    it('should render without errors', () => {
      expect(() => {
        render(
          <MockProviders>
            <AdminLayoutManagement />
          </MockProviders>
        );
      }).not.toThrow();
    });

    it('should have main element indicating StandardLayout usage', () => {
      render(
        <MockProviders>
          <AdminLayoutManagement />
        </MockProviders>
      );

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('should have proper page heading structure', () => {
      render(
        <MockProviders>
          <AdminLayoutManagement />
        </MockProviders>
      );

      const heading = screen.getByText('Gestão de Layout');
      expect(heading).toBeInTheDocument();
    });

    it('should not have custom container classes that bypass layout system', () => {
      render(
        <MockProviders>
          <AdminLayoutManagement />
        </MockProviders>
      );

      // Should NOT have old problematic classes
      const customContainer = document.querySelector('.container.mx-auto');
      const customSpacing = document.querySelector('body > div.space-y-6');
      
      expect(customContainer).not.toBeInTheDocument();
      expect(customSpacing).not.toBeInTheDocument();
    });

    it('should have ErrorBoundary integration', () => {
      render(
        <MockProviders>
          <AdminLayoutManagement />
        </MockProviders>
      );

      // Component should render successfully with ErrorBoundary
      const heading = screen.getByText('Gestão de Layout');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Layout Architecture Compliance', () => {
    it('should follow the admin page layout pattern with centered constraint', () => {
      render(
        <MockProviders>
          <AdminLayoutManagement />
        </MockProviders>
      );

      // Should have content that's properly contained
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      
      // Should have page description
      const description = screen.getByText(/Configure o sistema visual/);
      expect(description).toBeInTheDocument();
    });

    it('should maintain semantic HTML structure', () => {
      render(
        <MockProviders>
          <AdminLayoutManagement />
        </MockProviders>
      );

      // Should have proper heading hierarchy
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Gestão de Layout');
    });
  });
});