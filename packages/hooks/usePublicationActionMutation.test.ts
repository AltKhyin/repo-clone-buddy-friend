// ABOUTME: Tests for usePublicationActionMutation ensuring proper publication workflow actions with cache management

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from '../../src/test-utils';
import {
  usePublicationActionMutation,
  type PublicationAction,
  type PublicationActionResponse,
} from './usePublicationActionMutation';
import { resetIdCounter } from '../../src/test-utils/test-data-factories';

// Mock Supabase client
vi.mock('../../src/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('usePublicationActionMutation', () => {
  let mockInvoke: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    resetIdCounter();

    // Get reference to the mocked function
    const { supabase } = await import('../../src/integrations/supabase/client');
    mockInvoke = vi.mocked(supabase.functions.invoke);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Mutation Function', () => {
    it('should submit review for approval successfully', async () => {
      const mockResponse: PublicationActionResponse = {
        success: true,
        review: {
          id: 123,
          review_status: 'pending_review',
          reviewed_at: null,
          publication_notes: null,
        },
        message: 'Review submitted for approval',
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result } = renderHookWithQuery(() => usePublicationActionMutation());

      const action: PublicationAction = {
        reviewId: 123,
        action: 'submit_for_review',
        notes: 'Ready for review',
      };

      let mutationResult: any;
      await waitFor(async () => {
        mutationResult = await result.current.mutateAsync(action);
      });

      expect(mutationResult).toEqual(mockResponse);
      expect(mockInvoke).toHaveBeenCalledWith('admin-manage-publication', {
        body: action,
      });
    });

    it('should approve review successfully', async () => {
      const mockResponse: PublicationActionResponse = {
        success: true,
        review: {
          id: 123,
          review_status: 'approved',
          reviewed_at: '2025-01-01T12:00:00Z',
          publication_notes: 'Excellent content',
        },
        message: 'Review approved',
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result } = renderHookWithQuery(() => usePublicationActionMutation());

      const action: PublicationAction = {
        reviewId: 123,
        action: 'approve',
        reviewerId: 'reviewer-123',
        notes: 'Excellent content',
      };

      let mutationResult: any;
      await waitFor(async () => {
        mutationResult = await result.current.mutateAsync(action);
      });

      expect(mutationResult).toEqual(mockResponse);
      expect(mockInvoke).toHaveBeenCalledWith('admin-manage-publication', {
        body: action,
      });
    });

    it('should reject review successfully', async () => {
      const mockResponse: PublicationActionResponse = {
        success: true,
        review: {
          id: 123,
          review_status: 'rejected',
          reviewed_at: '2025-01-01T12:00:00Z',
          publication_notes: 'Needs more evidence',
        },
        message: 'Review rejected',
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result } = renderHookWithQuery(() => usePublicationActionMutation());

      const action: PublicationAction = {
        reviewId: 123,
        action: 'reject',
        reviewerId: 'reviewer-123',
        notes: 'Needs more evidence',
      };

      let mutationResult: any;
      await waitFor(async () => {
        mutationResult = await result.current.mutateAsync(action);
      });

      expect(mutationResult).toEqual(mockResponse);
    });

    it('should schedule review for publication', async () => {
      const scheduledDate = '2025-02-01T09:00:00Z';
      const mockResponse: PublicationActionResponse = {
        success: true,
        review: {
          id: 123,
          review_status: 'scheduled',
          scheduled_publish_at: scheduledDate,
          publication_notes: 'Scheduled for February release',
        },
        message: 'Review scheduled for publication',
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result } = renderHookWithQuery(() => usePublicationActionMutation());

      const action: PublicationAction = {
        reviewId: 123,
        action: 'schedule',
        scheduledDate,
        notes: 'Scheduled for February release',
      };

      let mutationResult: any;
      await waitFor(async () => {
        mutationResult = await result.current.mutateAsync(action);
      });

      expect(mutationResult).toEqual(mockResponse);
    });

    it('should publish review immediately', async () => {
      const mockResponse: PublicationActionResponse = {
        success: true,
        review: {
          id: 123,
          review_status: 'published',
          reviewed_at: '2025-01-01T12:00:00Z',
          publication_notes: 'Published immediately',
        },
        message: 'Review published successfully',
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result } = renderHookWithQuery(() => usePublicationActionMutation());

      const action: PublicationAction = {
        reviewId: 123,
        action: 'publish_now',
        notes: 'Published immediately',
      };

      let mutationResult: any;
      await waitFor(async () => {
        mutationResult = await result.current.mutateAsync(action);
      });

      expect(mutationResult).toEqual(mockResponse);
    });

    it('should unpublish review successfully', async () => {
      const mockResponse: PublicationActionResponse = {
        success: true,
        review: {
          id: 123,
          review_status: 'unpublished',
          publication_notes: 'Unpublished due to update needed',
        },
        message: 'Review unpublished',
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result } = renderHookWithQuery(() => usePublicationActionMutation());

      const action: PublicationAction = {
        reviewId: 123,
        action: 'unpublish',
        notes: 'Unpublished due to update needed',
      };

      let mutationResult: any;
      await waitFor(async () => {
        mutationResult = await result.current.mutateAsync(action);
      });

      expect(mutationResult).toEqual(mockResponse);
    });

    it('should archive review successfully', async () => {
      const mockResponse: PublicationActionResponse = {
        success: true,
        review: {
          id: 123,
          review_status: 'archived',
          publication_notes: 'Archived due to outdated information',
        },
        message: 'Review archived',
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result } = renderHookWithQuery(() => usePublicationActionMutation());

      const action: PublicationAction = {
        reviewId: 123,
        action: 'archive',
        notes: 'Archived due to outdated information',
      };

      let mutationResult: any;
      await waitFor(async () => {
        mutationResult = await result.current.mutateAsync(action);
      });

      expect(mutationResult).toEqual(mockResponse);
    });

    it('should handle Edge Function errors', async () => {
      const errorMessage = 'Insufficient permissions';
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      const { result } = renderHookWithQuery(() => usePublicationActionMutation());

      const action: PublicationAction = {
        reviewId: 123,
        action: 'approve',
      };

      await expect(async () => {
        await result.current.mutateAsync(action);
      }).rejects.toThrow(errorMessage);

      expect(mockInvoke).toHaveBeenCalledWith('admin-manage-publication', {
        body: action,
      });
    });

    it('should handle network errors', async () => {
      mockInvoke.mockRejectedValue(new Error('Connection timeout'));

      const { result } = renderHookWithQuery(() => usePublicationActionMutation());

      const action: PublicationAction = {
        reviewId: 123,
        action: 'submit_for_review',
      };

      await expect(async () => {
        await result.current.mutateAsync(action);
      }).rejects.toThrow('Connection timeout');
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate content queue queries on success', async () => {
      const mockResponse: PublicationActionResponse = {
        success: true,
        review: {
          id: 123,
          review_status: 'approved',
        },
        message: 'Review approved',
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result, queryClient } = renderHookWithQuery(() => usePublicationActionMutation());

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const action: PublicationAction = {
        reviewId: 123,
        action: 'approve',
      };

      await waitFor(async () => {
        await result.current.mutateAsync(action);
      });

      // Check that content queue queries were invalidated
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['admin', 'content-queue'],
      });
    });

    it('should invalidate analytics queries on success', async () => {
      const mockResponse: PublicationActionResponse = {
        success: true,
        review: {
          id: 123,
          review_status: 'published',
        },
        message: 'Review published',
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result, queryClient } = renderHookWithQuery(() => usePublicationActionMutation());

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const action: PublicationAction = {
        reviewId: 123,
        action: 'publish_now',
      };

      await waitFor(async () => {
        await result.current.mutateAsync(action);
      });

      // Check that analytics queries were invalidated
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['admin', 'analytics'],
      });
    });

    it('should update specific review cache immediately', async () => {
      const mockResponse: PublicationActionResponse = {
        success: true,
        review: {
          id: 123,
          review_status: 'approved',
          reviewed_at: '2025-01-01T12:00:00Z',
          publication_notes: 'Great content',
        },
        message: 'Review approved',
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result, queryClient } = renderHookWithQuery(() => usePublicationActionMutation());

      // Set up existing review cache
      const existingReview = {
        id: 123,
        title: 'Test Review',
        review_status: 'pending_review',
        reviewed_at: null,
        publication_notes: null,
      };

      queryClient.setQueryData(['admin', 'review', 123], existingReview);

      const action: PublicationAction = {
        reviewId: 123,
        action: 'approve',
        notes: 'Great content',
      };

      // Execute the mutation
      await result.current.mutateAsync(action);

      // Wait for the cache update to complete
      await waitFor(() => {
        const updatedReview = queryClient.getQueryData(['admin', 'review', 123]);
        expect(updatedReview).toEqual({
          ...existingReview,
          ...mockResponse.review,
        });
      });
    });

    it('should handle missing review cache gracefully', async () => {
      const mockResponse: PublicationActionResponse = {
        success: true,
        review: {
          id: 123,
          review_status: 'approved',
        },
        message: 'Review approved',
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result, queryClient } = renderHookWithQuery(() => usePublicationActionMutation());

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // No existing cache for this review

      const action: PublicationAction = {
        reviewId: 123,
        action: 'approve',
      };

      await waitFor(async () => {
        await result.current.mutateAsync(action);
      });

      // Should still attempt to update cache, but with undefined oldData
      expect(setQueryDataSpy).toHaveBeenCalledWith(['admin', 'review', 123], expect.any(Function));

      // The result should be undefined since there was no existing data
      const updatedReview = queryClient.getQueryData(['admin', 'review', 123]);
      expect(updatedReview).toBeUndefined();
    });

    it('should not invalidate queries on error', async () => {
      const errorMessage = 'Action failed';
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      const { result, queryClient } = renderHookWithQuery(() => usePublicationActionMutation());

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const action: PublicationAction = {
        reviewId: 123,
        action: 'approve',
      };

      await expect(async () => {
        await result.current.mutateAsync(action);
      }).rejects.toThrow(errorMessage);

      // No queries should be invalidated on error
      expect(invalidateQueriesSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should log errors appropriately', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errorMessage = 'Permission denied';
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      const { result } = renderHookWithQuery(() => usePublicationActionMutation());

      const action: PublicationAction = {
        reviewId: 123,
        action: 'approve',
      };

      await expect(async () => {
        await result.current.mutateAsync(action);
      }).rejects.toThrow(errorMessage);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Publication action failed:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('should handle mutation errors in onError callback', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errorMessage = 'Network failure';
      mockInvoke.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHookWithQuery(() => usePublicationActionMutation());

      const action: PublicationAction = {
        reviewId: 123,
        action: 'publish_now',
      };

      await expect(async () => {
        await result.current.mutateAsync(action);
      }).rejects.toThrow(errorMessage);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Publication action failed:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Type Safety', () => {
    it('should enforce required action fields', () => {
      const { result } = renderHookWithQuery(() => usePublicationActionMutation());

      // TypeScript should enforce reviewId and action are required
      // @ts-expect-error - missing required fields
      result.current.mutate({});

      // @ts-expect-error - missing action
      result.current.mutate({ reviewId: 123 });

      // @ts-expect-error - missing reviewId
      result.current.mutate({ action: 'approve' });

      // This should be valid
      result.current.mutate({ reviewId: 123, action: 'approve' });
    });

    it('should accept all valid action types', () => {
      const { result } = renderHookWithQuery(() => usePublicationActionMutation());

      // All these should be valid
      result.current.mutate({ reviewId: 123, action: 'submit_for_review' });
      result.current.mutate({ reviewId: 123, action: 'approve' });
      result.current.mutate({ reviewId: 123, action: 'reject' });
      result.current.mutate({ reviewId: 123, action: 'schedule' });
      result.current.mutate({ reviewId: 123, action: 'publish_now' });
      result.current.mutate({ reviewId: 123, action: 'unpublish' });
      result.current.mutate({ reviewId: 123, action: 'archive' });
    });

    it('should accept optional fields', () => {
      const { result } = renderHookWithQuery(() => usePublicationActionMutation());

      // These should be valid with optional fields
      result.current.mutate({
        reviewId: 123,
        action: 'schedule',
        scheduledDate: '2025-02-01T09:00:00Z',
        notes: 'Scheduled for later',
        reviewerId: 'reviewer-123',
      });
    });

    it('should provide proper response types', async () => {
      const mockResponse: PublicationActionResponse = {
        success: true,
        review: {
          id: 123,
          review_status: 'approved',
        },
        message: 'Success',
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result } = renderHookWithQuery(() => usePublicationActionMutation());

      const action: PublicationAction = {
        reviewId: 123,
        action: 'approve',
      };

      const response = await result.current.mutateAsync(action);

      // TypeScript should infer the correct response type
      expect(response.success).toBe(true);
      expect(response.review.id).toBe(123);
      expect(response.review.review_status).toBe('approved');
      expect(response.message).toBe('Success');
    });
  });

  describe('Different Action Scenarios', () => {
    it('should handle scheduling with all fields', async () => {
      const scheduledDate = '2025-03-15T10:00:00Z';
      const mockResponse: PublicationActionResponse = {
        success: true,
        review: {
          id: 123,
          review_status: 'scheduled',
          scheduled_publish_at: scheduledDate,
        },
        message: 'Scheduled successfully',
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result } = renderHookWithQuery(() => usePublicationActionMutation());

      const action: PublicationAction = {
        reviewId: 123,
        action: 'schedule',
        scheduledDate,
        notes: 'March release batch',
        reviewerId: 'admin-456',
      };

      const response = await result.current.mutateAsync(action);

      expect(response.review.scheduled_publish_at).toBe(scheduledDate);
      expect(mockInvoke).toHaveBeenCalledWith('admin-manage-publication', {
        body: action,
      });
    });

    it('should handle action without optional fields', async () => {
      const mockResponse: PublicationActionResponse = {
        success: true,
        review: {
          id: 123,
          review_status: 'published',
        },
        message: 'Published successfully',
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const { result } = renderHookWithQuery(() => usePublicationActionMutation());

      const action: PublicationAction = {
        reviewId: 123,
        action: 'publish_now',
        // No optional fields
      };

      const response = await result.current.mutateAsync(action);

      expect(response.success).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('admin-manage-publication', {
        body: action,
      });
    });
  });
});
