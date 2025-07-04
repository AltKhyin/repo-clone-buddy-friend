// ABOUTME: TanStack Query mutation hook for bulk admin operations with proper error handling and cache invalidation

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import { BulkOperationRequest, BulkOperationResponse } from '../../src/types/admin';

const executeBulkOperation = async (
  request: BulkOperationRequest
): Promise<BulkOperationResponse> => {
  const { data, error } = await supabase.functions.invoke('admin-bulk-content-actions', {
    body: request,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useAdminBulkOperations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: executeBulkOperation,
    onSuccess: (data, variables) => {
      // Invalidate all admin queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'review'] });
      
      // Log successful bulk operation
      console.log(`Bulk ${variables.action} completed:`, {
        processed: data.processedCount,
        failed: data.failedCount,
        reviewIds: variables.reviewIds,
      });
    },
    onError: (error, variables) => {
      console.error(`Bulk ${variables.action} failed:`, error);
    },
  });
};