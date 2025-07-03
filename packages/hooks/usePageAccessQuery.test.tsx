// ABOUTME: Tests for page access control query hook ensuring proper data fetching and caching

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePageAccessQuery, usePageAccessControlQuery } from './usePageAccessQuery';
import { createTestQueryClient } from '../../src/test-utils/test-query-client';

// Mock the Supabase function invocation
vi.mock('@/lib/supabase-functions', () => ({
  invokeFunctionGet: vi.fn(),
  invokeFunctionPost: vi.fn(),
}));

describe('usePageAccessQuery', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('usePageAccessQuery', () => {
    it('should fetch page access control for specific page', async () => {
      const mockPageAccess = {
        page_path: '/admin/dashboard',
        required_access_level: 'editor_admin',
        redirect_url: '/login',
        is_active: true,
      };

      const mockInvokeFunctionGet = await import('@/lib/supabase-functions');
      vi.mocked(mockInvokeFunctionGet.invokeFunctionGet).mockResolvedValue(mockPageAccess);

      const { result } = renderHook(() => usePageAccessQuery('/admin/dashboard'), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPageAccess);
    });

    it('should handle non-existent pages gracefully', async () => {
      const mockInvokeFunctionGet = await import('@/lib/supabase-functions');
      vi.mocked(mockInvokeFunctionGet.invokeFunctionGet).mockResolvedValue(null);

      const { result } = renderHook(() => usePageAccessQuery('/non-existent-page'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it('should use correct query key for caching', () => {
      const { result } = renderHook(() => usePageAccessQuery('/admin/dashboard'), { wrapper });

      // Query key should include page path for proper caching
      expect(
        queryClient.getQueryCache().find({
          queryKey: ['page-access', '/admin/dashboard'],
        })
      ).toBeDefined();
    });

    it('should have correct stale time for caching', () => {
      const { result } = renderHook(() => usePageAccessQuery('/admin/dashboard'), { wrapper });

      // Should have 5 minute stale time for access control rules
      const query = queryClient.getQueryCache().find({
        queryKey: ['page-access', '/admin/dashboard'],
      });

      expect(query?.options.staleTime).toBe(5 * 60 * 1000);
    });
  });

  describe('usePageAccessControlQuery', () => {
    it('should fetch all page access control rules', async () => {
      const mockPageAccessRules = [
        {
          id: 1,
          page_path: '/admin/dashboard',
          required_access_level: 'editor_admin',
          redirect_url: '/login',
          is_active: true,
        },
        {
          id: 2,
          page_path: '/premium-content',
          required_access_level: 'premium',
          redirect_url: '/upgrade',
          is_active: true,
        },
      ];

      const mockInvokeFunctionGet = await import('@/lib/supabase-functions');
      vi.mocked(mockInvokeFunctionGet.invokeFunctionGet).mockResolvedValue({
        data: mockPageAccessRules,
        total_count: 2,
      });

      const { result } = renderHook(() => usePageAccessControlQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toEqual(mockPageAccessRules);
      expect(result.current.data?.total_count).toBe(2);
    });

    it('should support filtering by access level', async () => {
      const mockInvokeFunctionGet = await import('@/lib/supabase-functions');
      vi.mocked(mockInvokeFunctionGet.invokeFunctionGet).mockResolvedValue({
        data: [],
        total_count: 0,
      });

      renderHook(() => usePageAccessControlQuery({ filter: { access_level: 'premium' } }), {
        wrapper,
      });

      await waitFor(() => {
        expect(mockInvokeFunctionGet.invokeFunctionGet).toHaveBeenCalledWith(
          'admin-page-access-control',
          expect.objectContaining({
            filter: { access_level: 'premium' },
          })
        );
      });
    });

    it('should support search functionality', async () => {
      const mockInvokeFunctionGet = await import('@/lib/supabase-functions');
      vi.mocked(mockInvokeFunctionGet.invokeFunctionGet).mockResolvedValue({
        data: [],
        total_count: 0,
      });

      renderHook(() => usePageAccessControlQuery({ search: 'admin' }), { wrapper });

      await waitFor(() => {
        expect(mockInvokeFunctionGet.invokeFunctionGet).toHaveBeenCalledWith(
          'admin-page-access-control',
          expect.objectContaining({
            search: 'admin',
          })
        );
      });
    });

    it('should handle errors gracefully', async () => {
      const mockInvokeFunctionGet = await import('@/lib/supabase-functions');
      vi.mocked(mockInvokeFunctionGet.invokeFunctionGet).mockRejectedValue(
        new Error('Failed to fetch page access rules')
      );

      const { result } = renderHook(() => usePageAccessControlQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });
});
