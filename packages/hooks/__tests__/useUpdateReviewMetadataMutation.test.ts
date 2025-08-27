// ABOUTME: Tests for review metadata mutation with integer field sanitization

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useUpdateReviewMetadataMutation } from '../useUpdateReviewMetadataMutation';

// Mock the supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    update: vi.fn(() => ({
      eq: vi.fn(() => ({ error: null })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({ error: null })),
    })),
    insert: vi.fn(() => ({ error: null })),
  })),
};

vi.mock('../../src/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useUpdateReviewMetadataMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('integer field sanitization', () => {
    it('should convert empty string reading_time_minutes to null', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateReviewMetadataMutation(), { wrapper });

      // Mock successful update
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      }));
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      await result.current.mutateAsync({
        reviewId: 1,
        metadata: {
          title: 'Test Review',
          reading_time_minutes: '', // Empty string should become null
        },
      });

      // Verify that the update was called with null instead of empty string
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Review',
          reading_time_minutes: null,
        })
      );
    });

    it('should convert invalid number reading_time_minutes to null', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateReviewMetadataMutation(), { wrapper });

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      }));
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      await result.current.mutateAsync({
        reviewId: 1,
        metadata: {
          title: 'Test Review',
          reading_time_minutes: 'invalid', // Invalid number should become null
        },
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Review',
          reading_time_minutes: null,
        })
      );
    });

    it('should convert negative reading_time_minutes to null', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateReviewMetadataMutation(), { wrapper });

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      }));
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      await result.current.mutateAsync({
        reviewId: 1,
        metadata: {
          title: 'Test Review',
          reading_time_minutes: -5, // Negative number should become null
        },
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Review',
          reading_time_minutes: null,
        })
      );
    });

    it('should preserve valid positive reading_time_minutes', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateReviewMetadataMutation(), { wrapper });

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      }));
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      await result.current.mutateAsync({
        reviewId: 1,
        metadata: {
          title: 'Test Review',
          reading_time_minutes: 8, // Valid number should be preserved
        },
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Review',
          reading_time_minutes: 8,
        })
      );
    });

    it('should handle string representation of valid numbers', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateReviewMetadataMutation(), { wrapper });

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      }));
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      await result.current.mutateAsync({
        reviewId: 1,
        metadata: {
          title: 'Test Review',
          reading_time_minutes: '15', // String number should be converted to number
        },
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Review',
          reading_time_minutes: 15,
        })
      );
    });

    it('should convert whitespace-only reading_time_minutes to null', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateReviewMetadataMutation(), { wrapper });

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      }));
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      await result.current.mutateAsync({
        reviewId: 1,
        metadata: {
          title: 'Test Review',
          reading_time_minutes: '   ', // Whitespace should become null
        },
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Review',
          reading_time_minutes: null,
        })
      );
    });
  });

  describe('error handling', () => {
    it('should throw error when database update fails', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateReviewMetadataMutation(), { wrapper });

      // Mock database error
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: { message: 'Database error' } })),
        })),
      });

      await expect(
        result.current.mutateAsync({
          reviewId: 1,
          metadata: { title: 'Test Review' },
        })
      ).rejects.toThrow('Failed to update review: Database error');
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate relevant queries on success', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useUpdateReviewMetadataMutation(), { wrapper });

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      }));
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      await result.current.mutateAsync({
        reviewId: 123,
        metadata: { title: 'Test Review' },
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['admin', 'review', '123'],
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['admin', 'content-queue'],
        });
      });
    });
  });
});