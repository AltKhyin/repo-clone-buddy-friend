
// ABOUTME: TanStack Query mutation hook for executing bulk operations on multiple content items

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

export interface BulkOperation {
  operation: 'bulk_publish' | 'bulk_schedule' | 'bulk_archive' | 'bulk_approve' | 'bulk_reject';
  reviewIds: number[];
  parameters?: {
    scheduledDate?: string;
    notes?: string;
    reviewerId?: string;
  };
}

export interface BulkOperationResponse {
  success: boolean;
  operationType: string;
  processed: number;
  total: number;
  results: Array<{
    reviewId: number;
    success: boolean;
    error?: string;
  }>;
  message: string;
}

const executeBulkOperation = async (operation: BulkOperation): Promise<BulkOperationResponse> => {
  const { data, error } = await supabase.functions.invoke('admin-bulk-operations', {
    body: operation,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useBulkOperationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: executeBulkOperation,
    onSuccess: (data) => {
      // Invalidate relevant queries based on operation type
      if (data.operationType.includes('content')) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'content-queue'] });
      }
      
      // Always invalidate analytics
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
    onError: (error) => {
      console.error('Bulk operation failed:', error);
    },
  });
};
