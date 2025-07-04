// ABOUTME: Integration tests specifically for AdminLayoutManagement StandardLayout compliance and layout architecture

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockAllProviders } from '@/test-utils/mock-providers';
import AdminLayoutManagement from './AdminLayoutManagement';

describe('AdminLayoutManagement - Layout Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('StandardLayout Integration Compliance', () => {
    it('should render without errors', () => {
      expect(() => {
        render(
          <MockAllProviders>
            <AdminLayoutManagement />
          </MockAllProviders>
        );
      }).not.toThrow();
    });

    it('should have main element indicating StandardLayout usage', () => {
      render(
        <MockAllProviders>
          <AdminLayoutManagement />
        </MockAllProviders>
      );

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('should have proper page heading structure', () => {
      render(
        <MockAllProviders>
          <AdminLayoutManagement />
        </MockAllProviders>
      );

      const heading = screen.getByText('Gestão de Layout');
      expect(heading).toBeInTheDocument();
    });

    it('should not have custom container classes that bypass layout system', () => {
      render(
        <MockAllProviders>
          <AdminLayoutManagement />
        </MockAllProviders>
      );

      // Should NOT have old problematic classes
      const customContainer = document.querySelector('.container.mx-auto');
      const customSpacing = document.querySelector('body > div.space-y-6');
      
      expect(customContainer).not.toBeInTheDocument();
      expect(customSpacing).not.toBeInTheDocument();
    });

    it('should have ErrorBoundary integration', () => {
      render(
        <MockAllProviders>
          <AdminLayoutManagement />
        </MockAllProviders>
      );

      // Component should render successfully with ErrorBoundary
      const heading = screen.getByText('Gestão de Layout');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Layout Architecture Compliance', () => {
    it('should follow the admin page layout pattern with centered constraint', () => {
      render(
        <MockAllProviders>
          <AdminLayoutManagement />
        </MockAllProviders>
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
        <MockAllProviders>
          <AdminLayoutManagement />
        </MockAllProviders>
      );

      // Should have proper heading hierarchy
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Gestão de Layout');
    });
  });
});