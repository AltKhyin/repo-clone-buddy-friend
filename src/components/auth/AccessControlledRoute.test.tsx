// ABOUTME: Tests for AccessControlledRoute component ensuring proper access control and redirect behavior

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccessControlledRoute } from './AccessControlledRoute';
import { createTestQueryClient } from '../../test-utils/test-query-client';

// Mock dependencies
vi.mock('../../../packages/hooks/usePageAccessControl', () => ({
  usePageAccessControl: vi.fn(),
}));

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/test-page' }),
  };
});

describe('AccessControlledRoute', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const TestComponent = () => <div>Protected Content</div>;

  const renderWithProviders = (component: React.ReactNode) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{component}</BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('access control', () => {
    it('should render protected content when user has access', async () => {
      const mockUsePageAccessControl = await import('../../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: true,
        isLoading: false,
        userAccessLevel: 'premium',
        requiredAccessLevel: 'free',
        redirectUrl: null,
        pageConfig: null,
      });

      renderWithProviders(
        <AccessControlledRoute>
          <TestComponent />
        </AccessControlledRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should redirect when user lacks access', async () => {
      const mockUsePageAccessControl = await import('../../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: false,
        isLoading: false,
        userAccessLevel: 'free',
        requiredAccessLevel: 'premium',
        redirectUrl: '/upgrade',
        pageConfig: null,
      });

      renderWithProviders(
        <AccessControlledRoute>
          <TestComponent />
        </AccessControlledRoute>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/upgrade');
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should show loading state while checking access', async () => {
      const mockUsePageAccessControl = await import('../../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: false,
        isLoading: true,
        userAccessLevel: 'public',
        requiredAccessLevel: 'public',
        redirectUrl: null,
        pageConfig: null,
      });

      renderWithProviders(
        <AccessControlledRoute>
          <TestComponent />
        </AccessControlledRoute>
      );

      expect(screen.getByText('Verificando acesso...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should use custom loading component when provided', async () => {
      const mockUsePageAccessControl = await import('../../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: false,
        isLoading: true,
        userAccessLevel: 'public',
        requiredAccessLevel: 'public',
        redirectUrl: null,
        pageConfig: null,
      });

      const CustomLoading = () => <div>Custom Loading...</div>;

      renderWithProviders(
        <AccessControlledRoute loadingComponent={<CustomLoading />}>
          <TestComponent />
        </AccessControlledRoute>
      );

      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Verificando acesso...')).not.toBeInTheDocument();
    });

    it('should use default redirect URL when none provided', async () => {
      const mockUsePageAccessControl = await import('../../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: false,
        isLoading: false,
        userAccessLevel: 'public',
        requiredAccessLevel: 'free',
        redirectUrl: null, // No redirect URL from config
        pageConfig: null,
      });

      renderWithProviders(
        <AccessControlledRoute>
          <TestComponent />
        </AccessControlledRoute>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should pass through custom access control options', async () => {
      const mockUsePageAccessControl = await import('../../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: true,
        isLoading: false,
        userAccessLevel: 'premium',
        requiredAccessLevel: 'premium',
        redirectUrl: null,
        pageConfig: null,
      });

      renderWithProviders(
        <AccessControlledRoute requiredLevel="premium" redirectUrl="/custom-redirect">
          <TestComponent />
        </AccessControlledRoute>
      );

      expect(mockUsePageAccessControl.usePageAccessControl).toHaveBeenCalledWith('/test-page', {
        defaultRequiredLevel: 'premium',
        defaultRedirectUrl: '/custom-redirect',
      });

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle missing pageConfig gracefully', async () => {
      const mockUsePageAccessControl = await import('../../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: true,
        isLoading: false,
        userAccessLevel: 'free',
        requiredAccessLevel: 'public',
        redirectUrl: null,
        pageConfig: null,
      });

      renderWithProviders(
        <AccessControlledRoute>
          <TestComponent />
        </AccessControlledRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should not redirect when access is granted', async () => {
      const mockUsePageAccessControl = await import('../../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: true,
        isLoading: false,
        userAccessLevel: 'premium',
        requiredAccessLevel: 'free',
        redirectUrl: '/upgrade', // Should be ignored when access is granted
        pageConfig: null,
      });

      renderWithProviders(
        <AccessControlledRoute>
          <TestComponent />
        </AccessControlledRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
