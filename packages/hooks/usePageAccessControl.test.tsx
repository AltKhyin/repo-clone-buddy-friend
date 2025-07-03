// ABOUTME: Tests for page access control hook ensuring proper user access checking and redirect handling

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePageAccessControl } from './usePageAccessControl';
import { createTestQueryClient } from '../../src/test-utils/test-query-client';

// Mock dependencies
vi.mock('../../src/store/auth', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('./usePageAccessQuery', () => ({
  usePageAccessQuery: vi.fn(),
}));

vi.mock('../../src/lib/accessControl', () => ({
  hasAccessLevel: vi.fn(),
  getUserAccessLevel: vi.fn(),
}));

describe('usePageAccessControl', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('access level checking', () => {
    it('should allow access when user has sufficient access level', async () => {
      const mockUseAuthStore = await import('../../src/store/auth');
      const mockUsePageAccessQuery = await import('./usePageAccessQuery');
      const mockAccessControl = await import('../../src/lib/accessControl');

      // Mock authenticated user with premium access
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

      // Mock page requiring free access
      vi.mocked(mockUsePageAccessQuery.usePageAccessQuery).mockReturnValue({
        data: {
          id: 1,
          page_path: '/premium-content',
          required_access_level: 'free',
          redirect_url: '/upgrade',
          is_active: true,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
      } as any);

      // Mock access level functions
      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('premium');
      vi.mocked(mockAccessControl.hasAccessLevel).mockReturnValue(true);

      const { result } = renderHook(() => usePageAccessControl('/premium-content'), { wrapper });

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.redirectUrl).toBeNull();
      expect(result.current.userAccessLevel).toBe('premium');
      expect(result.current.requiredAccessLevel).toBe('free');
    });

    it('should deny access when user has insufficient access level', async () => {
      const mockUseAuthStore = await import('../../src/store/auth');
      const mockUsePageAccessQuery = await import('./usePageAccessQuery');
      const mockAccessControl = await import('../../src/lib/accessControl');

      // Mock authenticated user with free access
      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: { id: 'user123', app_metadata: { role: 'practitioner' }, subscription_tier: 'free' },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      // Mock page requiring premium access
      vi.mocked(mockUsePageAccessQuery.usePageAccessQuery).mockReturnValue({
        data: {
          id: 1,
          page_path: '/premium-content',
          required_access_level: 'premium',
          redirect_url: '/upgrade',
          is_active: true,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
      } as any);

      // Mock access level functions
      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('free');
      vi.mocked(mockAccessControl.hasAccessLevel).mockReturnValue(false);

      const { result } = renderHook(() => usePageAccessControl('/premium-content'), { wrapper });

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(false);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.redirectUrl).toBe('/upgrade');
      expect(result.current.userAccessLevel).toBe('free');
      expect(result.current.requiredAccessLevel).toBe('premium');
    });

    it('should allow access to public pages for anonymous users', async () => {
      const mockUseAuthStore = await import('../../src/store/auth');
      const mockUsePageAccessQuery = await import('./usePageAccessQuery');
      const mockAccessControl = await import('../../src/lib/accessControl');

      // Mock anonymous user
      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      // Mock public page
      vi.mocked(mockUsePageAccessQuery.usePageAccessQuery).mockReturnValue({
        data: {
          id: 1,
          page_path: '/public-page',
          required_access_level: 'public',
          redirect_url: '/login',
          is_active: true,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
      } as any);

      // Mock access level functions
      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('public');
      vi.mocked(mockAccessControl.hasAccessLevel).mockReturnValue(true);

      const { result } = renderHook(() => usePageAccessControl('/public-page'), { wrapper });

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(true);
      });

      expect(result.current.userAccessLevel).toBe('public');
      expect(result.current.requiredAccessLevel).toBe('public');
      expect(result.current.redirectUrl).toBeNull();
    });

    it('should allow access to uncontrolled pages by default', async () => {
      const mockUseAuthStore = await import('../../src/store/auth');
      const mockUsePageAccessQuery = await import('./usePageAccessQuery');
      const mockAccessControl = await import('../../src/lib/accessControl');

      // Mock authenticated user
      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: { id: 'user123', app_metadata: { role: 'practitioner' }, subscription_tier: 'free' },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      // Mock page not found in access control
      vi.mocked(mockUsePageAccessQuery.usePageAccessQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
      } as any);

      // Mock access level functions
      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('free');
      vi.mocked(mockAccessControl.hasAccessLevel).mockReturnValue(true);

      const { result } = renderHook(() => usePageAccessControl('/uncontrolled-page'), { wrapper });

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(true);
      });

      expect(result.current.userAccessLevel).toBe('free');
      expect(result.current.requiredAccessLevel).toBe('public'); // Default
      expect(result.current.redirectUrl).toBeNull();
    });

    it('should handle loading states correctly', async () => {
      const mockUseAuthStore = await import('../../src/store/auth');
      const mockUsePageAccessQuery = await import('./usePageAccessQuery');

      // Mock loading auth state
      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: null,
        session: null,
        isLoading: true,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      // Mock loading page access query
      vi.mocked(mockUsePageAccessQuery.usePageAccessQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        isSuccess: false,
      } as any);

      const { result } = renderHook(() => usePageAccessControl('/admin/dashboard'), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.hasAccess).toBe(false);
      expect(result.current.redirectUrl).toBeNull();
    });

    it('should use default redirect URL when page config missing', async () => {
      const mockUseAuthStore = await import('../../src/store/auth');
      const mockUsePageAccessQuery = await import('./usePageAccessQuery');
      const mockAccessControl = await import('../../src/lib/accessControl');

      // Mock anonymous user
      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      // Mock page not found in access control
      vi.mocked(mockUsePageAccessQuery.usePageAccessQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
      } as any);

      // Mock access level functions
      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('public');
      vi.mocked(mockAccessControl.hasAccessLevel).mockReturnValue(false);

      const { result } = renderHook(
        () =>
          usePageAccessControl('/some-protected-page', {
            defaultRequiredLevel: 'free',
            defaultRedirectUrl: '/custom-login',
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(false);
      });

      expect(result.current.redirectUrl).toBe('/custom-login');
      expect(result.current.requiredAccessLevel).toBe('free');
    });
  });
});
