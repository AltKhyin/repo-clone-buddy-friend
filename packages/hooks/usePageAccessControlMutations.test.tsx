// ABOUTME: Tests for page access control mutation hooks ensuring proper CRUD operations and cache management

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCreatePageAccessControlMutation,
  useUpdatePageAccessControlMutation,
  useDeletePageAccessControlMutation,
} from './usePageAccessControlMutations';
import { createTestQueryClient } from '../../src/test-utils/test-query-client';

// Mock dependencies
vi.mock('../../src/lib/supabase-functions', () => ({
  invokeFunctionPost: vi.fn(),
  invokeFunctionGet: vi.fn(),
}));

describe('usePageAccessControlMutations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useCreatePageAccessControlMutation', () => {
    it('should create new page access control rule', async () => {
      const mockInvokeFunctionPost = await import('../../src/lib/supabase-functions');

      const mockRule = {
        id: 1,
        page_path: '/premium-feature',
        required_access_level: 'premium',
        redirect_url: '/upgrade',
        is_active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      };

      vi.mocked(mockInvokeFunctionPost.invokeFunctionPost).mockResolvedValue(mockRule);

      const { result } = renderHook(() => useCreatePageAccessControlMutation(), { wrapper });

      const ruleData = {
        page_path: '/premium-feature',
        required_access_level: 'premium',
        redirect_url: '/upgrade',
      };

      result.current.mutate(ruleData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockInvokeFunctionPost.invokeFunctionPost).toHaveBeenCalledWith(
        'admin-page-access-control',
        ruleData
      );
      expect(result.current.data).toEqual(mockRule);
    });

    it('should handle creation errors', async () => {
      const mockInvokeFunctionPost = await import('../../src/lib/supabase-functions');

      vi.mocked(mockInvokeFunctionPost.invokeFunctionPost).mockRejectedValue(
        new Error('Page path already exists')
      );

      const { result } = renderHook(() => useCreatePageAccessControlMutation(), { wrapper });

      result.current.mutate({
        page_path: '/duplicate-page',
        required_access_level: 'free',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Page path already exists');
    });

    it('should invalidate page access control queries on success', async () => {
      const mockInvokeFunctionPost = await import('../../src/lib/supabase-functions');

      vi.mocked(mockInvokeFunctionPost.invokeFunctionPost).mockResolvedValue({
        id: 1,
        page_path: '/test-page',
        required_access_level: 'free',
      });

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreatePageAccessControlMutation(), { wrapper });

      result.current.mutate({
        page_path: '/test-page',
        required_access_level: 'free',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['page-access-control'],
      });
    });
  });

  describe('useUpdatePageAccessControlMutation', () => {
    it('should update existing page access control rule', async () => {
      const mockInvokeFunctionPost = await import('../../src/lib/supabase-functions');

      const mockUpdatedRule = {
        id: 1,
        page_path: '/premium-feature',
        required_access_level: 'editor_admin',
        redirect_url: '/admin-login',
        is_active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-02',
      };

      // Mock PUT request (using POST function with different endpoint pattern)
      vi.mocked(mockInvokeFunctionPost.invokeFunctionPost).mockResolvedValue(mockUpdatedRule);

      const { result } = renderHook(() => useUpdatePageAccessControlMutation(), { wrapper });

      const updateData = {
        id: 1,
        required_access_level: 'editor_admin',
        redirect_url: '/admin-login',
      };

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUpdatedRule);
    });

    it('should handle update errors for non-existent rules', async () => {
      const mockInvokeFunctionPost = await import('../../src/lib/supabase-functions');

      vi.mocked(mockInvokeFunctionPost.invokeFunctionPost).mockRejectedValue(
        new Error('Page access rule not found')
      );

      const { result } = renderHook(() => useUpdatePageAccessControlMutation(), { wrapper });

      result.current.mutate({
        id: 999,
        required_access_level: 'premium',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Page access rule not found');
    });

    it('should invalidate specific page access queries on success', async () => {
      const mockInvokeFunctionPost = await import('../../src/lib/supabase-functions');

      const mockUpdatedRule = {
        id: 1,
        page_path: '/test-page',
        required_access_level: 'premium',
      };

      vi.mocked(mockInvokeFunctionPost.invokeFunctionPost).mockResolvedValue(mockUpdatedRule);

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdatePageAccessControlMutation(), { wrapper });

      result.current.mutate({ id: 1, required_access_level: 'premium' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['page-access-control'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['page-access', mockUpdatedRule.page_path],
      });
    });
  });

  describe('useDeletePageAccessControlMutation', () => {
    it('should delete page access control rule', async () => {
      const mockInvokeFunctionPost = await import('../../src/lib/supabase-functions');

      const mockResponse = {
        success: true,
        message: 'Page access rule deleted successfully',
      };

      vi.mocked(mockInvokeFunctionPost.invokeFunctionPost).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeletePageAccessControlMutation(), { wrapper });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it('should handle deletion errors for non-existent rules', async () => {
      const mockInvokeFunctionPost = await import('../../src/lib/supabase-functions');

      vi.mocked(mockInvokeFunctionPost.invokeFunctionPost).mockRejectedValue(
        new Error('Page access rule not found')
      );

      const { result } = renderHook(() => useDeletePageAccessControlMutation(), { wrapper });

      result.current.mutate(999);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Page access rule not found');
    });

    it('should invalidate all page access queries on successful deletion', async () => {
      const mockInvokeFunctionPost = await import('../../src/lib/supabase-functions');

      vi.mocked(mockInvokeFunctionPost.invokeFunctionPost).mockResolvedValue({
        success: true,
        message: 'Deleted successfully',
      });

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeletePageAccessControlMutation(), { wrapper });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['page-access-control'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['page-access'],
      });
    });
  });

  describe('loading and error states', () => {
    it('should handle loading states correctly', async () => {
      const mockInvokeFunctionPost = await import('../../src/lib/supabase-functions');

      vi.mocked(mockInvokeFunctionPost.invokeFunctionPost).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ id: 1 }), 100))
      );

      const { result } = renderHook(() => useCreatePageAccessControlMutation(), { wrapper });

      // Trigger mutation
      result.current.mutate({
        page_path: '/test',
        required_access_level: 'free',
      });

      // Check loading state immediately
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isPending).toBe(false);
    });

    it('should reset error state on new mutations', async () => {
      const mockInvokeFunctionPost = await import('../../src/lib/supabase-functions');

      // First call fails
      vi.mocked(mockInvokeFunctionPost.invokeFunctionPost)
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({ id: 1 });

      const { result } = renderHook(() => useCreatePageAccessControlMutation(), { wrapper });

      // First mutation fails
      result.current.mutate({
        page_path: '/test1',
        required_access_level: 'free',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Second mutation succeeds
      result.current.mutate({
        page_path: '/test2',
        required_access_level: 'free',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isError).toBe(false);
    });
  });
});
