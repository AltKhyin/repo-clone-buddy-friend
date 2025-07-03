// ABOUTME: Tests for EnhancedProtectedRoute component ensuring unified access control with 4-tier system

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EnhancedProtectedRoute } from './EnhancedProtectedRoute';
import { createTestQueryClient } from '../../test-utils/test-query-client';

// Mock dependencies
vi.mock('../../store/auth', () => ({
  useAuthStore: vi.fn(),
}));

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

describe('EnhancedProtectedRoute', () => {
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

  describe('4-tier access control mode', () => {
    it('should render content when user has 4-tier access via database config', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockUsePageAccessControl = await import('../../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: {
          id: 'user123',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'premium',
        },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: true,
        isLoading: false,
        userAccessLevel: 'premium',
        requiredAccessLevel: 'free',
        redirectUrl: null,
        pageConfig: { id: 1, page_path: '/test-page', required_access_level: 'free' },
      });

      renderWithProviders(
        <EnhancedProtectedRoute>
          <TestComponent />
        </EnhancedProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should fallback to role-based protection when no database config exists', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockUsePageAccessControl = await import('../../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: { id: 'user123', app_metadata: { role: 'admin' } },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      // No database config found
      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: true, // Should still grant access based on role fallback
        isLoading: false,
        userAccessLevel: 'editor_admin',
        requiredAccessLevel: 'public', // Default fallback
        redirectUrl: null,
        pageConfig: null,
      });

      renderWithProviders(
        <EnhancedProtectedRoute requiredRole="admin">
          <TestComponent />
        </EnhancedProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should redirect when user lacks access according to 4-tier system', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockUsePageAccessControl = await import('../../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: { id: 'user123', app_metadata: { role: 'practitioner' }, subscription_tier: 'free' },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: false,
        isLoading: false,
        userAccessLevel: 'free',
        requiredAccessLevel: 'premium',
        redirectUrl: '/upgrade',
        pageConfig: { id: 1, page_path: '/test-page', required_access_level: 'premium' },
      });

      renderWithProviders(
        <EnhancedProtectedRoute>
          <TestComponent />
        </EnhancedProtectedRoute>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/upgrade');
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('legacy role-based protection mode', () => {
    it('should protect routes using legacy role system when specified', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockUsePageAccessControl = await import('../../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: { id: 'user123', app_metadata: { role: 'admin' } },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      // Page access control should not be used in legacy mode
      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: true,
        isLoading: false,
        userAccessLevel: 'editor_admin',
        requiredAccessLevel: 'public',
        redirectUrl: null,
        pageConfig: null,
      });

      renderWithProviders(
        <EnhancedProtectedRoute mode="legacy-role" requiredRole="admin">
          <TestComponent />
        </EnhancedProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should deny access in legacy mode when user lacks required role', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockUsePageAccessControl = await import('../../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: { id: 'user123', app_metadata: { role: 'practitioner' } },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: false,
        isLoading: false,
        userAccessLevel: 'free',
        requiredAccessLevel: 'public',
        redirectUrl: null,
        pageConfig: null,
      });

      renderWithProviders(
        <EnhancedProtectedRoute
          mode="legacy-role"
          requiredRole="admin"
          fallbackPath="/acesso-negado"
        >
          <TestComponent />
        </EnhancedProtectedRoute>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/acesso-negado');
      });
    });
  });

  describe('authentication handling', () => {
    it('should redirect unauthenticated users to login', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockUsePageAccessControl = await import('../../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: false,
        isLoading: false,
        userAccessLevel: 'public',
        requiredAccessLevel: 'free',
        redirectUrl: '/login',
        pageConfig: null,
      });

      renderWithProviders(
        <EnhancedProtectedRoute>
          <TestComponent />
        </EnhancedProtectedRoute>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should show loading state while authentication is being checked', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockUsePageAccessControl = await import('../../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: null,
        session: null,
        isLoading: true,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: false,
        isLoading: true,
        userAccessLevel: 'public',
        requiredAccessLevel: 'public',
        redirectUrl: null,
        pageConfig: null,
      });

      renderWithProviders(
        <EnhancedProtectedRoute>
          <TestComponent />
        </EnhancedProtectedRoute>
      );

      expect(screen.getByText('Verificando acesso...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('configuration options', () => {
    it('should use custom loading component when provided', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockUsePageAccessControl = await import('../../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: null,
        session: null,
        isLoading: true,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: false,
        isLoading: true,
        userAccessLevel: 'public',
        requiredAccessLevel: 'public',
        redirectUrl: null,
        pageConfig: null,
      });

      const CustomLoading = () => <div>Custom Access Check...</div>;

      renderWithProviders(
        <EnhancedProtectedRoute loadingComponent={<CustomLoading />}>
          <TestComponent />
        </EnhancedProtectedRoute>
      );

      expect(screen.getByText('Custom Access Check...')).toBeInTheDocument();
    });

    it('should support both 4-tier access levels and legacy roles in props', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockUsePageAccessControl = await import('../../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: { id: 'user123', app_metadata: { role: 'admin' } },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: true,
        isLoading: false,
        userAccessLevel: 'editor_admin',
        requiredAccessLevel: 'premium',
        redirectUrl: null,
        pageConfig: null,
      });

      renderWithProviders(
        <EnhancedProtectedRoute
          requiredAccessLevel="premium"
          requiredRole="admin"
          redirectUrl="/custom-redirect"
        >
          <TestComponent />
        </EnhancedProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });
});
