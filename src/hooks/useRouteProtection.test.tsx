// ABOUTME: Tests for useRouteProtection hook ensuring proper route-level access control

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useRouteProtection } from './useRouteProtection';
import { createTestQueryClient } from '../test-utils/test-query-client';

// Mock dependencies
vi.mock('../../packages/hooks/usePageAccessControl', () => ({
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

describe('useRouteProtection', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );

  describe('route protection logic', () => {
    it('should return access granted when user has sufficient access', async () => {
      const mockUsePageAccessControl = await import('../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: true,
        isLoading: false,
        userAccessLevel: 'premium',
        requiredAccessLevel: 'free',
        redirectUrl: null,
        pageConfig: null,
      });

      const { result } = renderHook(() => useRouteProtection(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAllowed).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.shouldRedirect).toBe(false);
      expect(result.current.redirectUrl).toBeNull();
    });

    it('should return access denied when user lacks sufficient access', async () => {
      const mockUsePageAccessControl = await import('../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: false,
        isLoading: false,
        userAccessLevel: 'free',
        requiredAccessLevel: 'premium',
        redirectUrl: '/upgrade',
        pageConfig: null,
      });

      const { result } = renderHook(() => useRouteProtection(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAllowed).toBe(false);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.shouldRedirect).toBe(true);
      expect(result.current.redirectUrl).toBe('/upgrade');
    });

    it('should handle loading state correctly', async () => {
      const mockUsePageAccessControl = await import('../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: false,
        isLoading: true,
        userAccessLevel: 'public',
        requiredAccessLevel: 'public',
        redirectUrl: null,
        pageConfig: null,
      });

      const { result } = renderHook(() => useRouteProtection(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAllowed).toBe(false);
      expect(result.current.shouldRedirect).toBe(false);
      expect(result.current.redirectUrl).toBeNull();
    });

    it('should pass through custom options to access control', async () => {
      const mockUsePageAccessControl = await import('../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: true,
        isLoading: false,
        userAccessLevel: 'editor_admin',
        requiredAccessLevel: 'editor_admin',
        redirectUrl: null,
        pageConfig: null,
      });

      const { result } = renderHook(
        () =>
          useRouteProtection({
            requiredLevel: 'editor_admin',
            redirectUrl: '/admin-login',
          }),
        { wrapper }
      );

      expect(mockUsePageAccessControl.usePageAccessControl).toHaveBeenCalledWith('/test-page', {
        defaultRequiredLevel: 'editor_admin',
        defaultRedirectUrl: '/admin-login',
      });

      await waitFor(() => {
        expect(result.current.isAllowed).toBe(true);
      });
    });

    it('should provide access control metadata', async () => {
      const mockUsePageAccessControl = await import('../../packages/hooks/usePageAccessControl');

      const mockPageConfig = {
        id: 1,
        page_path: '/test-page',
        required_access_level: 'premium' as const,
        redirect_url: '/upgrade',
        is_active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      };

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: false,
        isLoading: false,
        userAccessLevel: 'free',
        requiredAccessLevel: 'premium',
        redirectUrl: '/upgrade',
        pageConfig: mockPageConfig,
      });

      const { result } = renderHook(() => useRouteProtection(), { wrapper });

      await waitFor(() => {
        expect(result.current.userAccessLevel).toBe('free');
      });

      expect(result.current.requiredAccessLevel).toBe('premium');
      expect(result.current.pageConfig).toEqual(mockPageConfig);
    });

    it('should handle automatic redirect when enabled', async () => {
      const mockUsePageAccessControl = await import('../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: false,
        isLoading: false,
        userAccessLevel: 'public',
        requiredAccessLevel: 'free',
        redirectUrl: '/login',
        pageConfig: null,
      });

      const { result } = renderHook(() => useRouteProtection({ autoRedirect: true }), { wrapper });

      await waitFor(() => {
        expect(result.current.shouldRedirect).toBe(true);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should not redirect when autoRedirect is false', async () => {
      const mockUsePageAccessControl = await import('../../packages/hooks/usePageAccessControl');

      vi.mocked(mockUsePageAccessControl.usePageAccessControl).mockReturnValue({
        hasAccess: false,
        isLoading: false,
        userAccessLevel: 'public',
        requiredAccessLevel: 'free',
        redirectUrl: '/login',
        pageConfig: null,
      });

      const { result } = renderHook(() => useRouteProtection({ autoRedirect: false }), { wrapper });

      await waitFor(() => {
        expect(result.current.shouldRedirect).toBe(true);
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
