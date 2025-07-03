// ABOUTME: Mutation hooks for page access control CRUD operations with cache invalidation

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  invokeFunctionPost,
  invokeFunctionPut,
  invokeFunctionDelete,
} from '../../src/lib/supabase-functions';
import { supabase } from '../../src/integrations/supabase/client';
import type { PageAccessControl } from './usePageAccessQuery';

interface CreatePageAccessControlData {
  page_path: string;
  required_access_level: string;
  redirect_url?: string;
  is_active?: boolean;
}

interface UpdatePageAccessControlData {
  id: number;
  required_access_level?: string;
  redirect_url?: string;
  is_active?: boolean;
}

/**
 * Hook to create new page access control rule
 */
export const useCreatePageAccessControlMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<PageAccessControl, Error, CreatePageAccessControlData>({
    mutationFn: async data => {
      return await invokeFunctionPost<PageAccessControl>('admin-page-access-control', data);
    },
    onSuccess: () => {
      // Invalidate all page access control queries to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['page-access-control'],
      });
    },
  });
};

/**
 * Hook to update existing page access control rule
 */
export const useUpdatePageAccessControlMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<PageAccessControl, Error, UpdatePageAccessControlData>({
    mutationFn: async data => {
      return await invokeFunctionPut<PageAccessControl>('admin-page-access-control', data);
    },
    onSuccess: data => {
      // Invalidate list queries and specific page query
      queryClient.invalidateQueries({
        queryKey: ['page-access-control'],
      });
      queryClient.invalidateQueries({
        queryKey: ['page-access', data.page_path],
      });
    },
  });
};

/**
 * Hook to delete page access control rule
 */
export const useDeletePageAccessControlMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, number>({
    mutationFn: async id => {
      return await invokeFunctionDelete<{ success: boolean; message: string }>(
        'admin-page-access-control',
        { id }
      );
    },
    onSuccess: () => {
      // Invalidate all page access queries
      queryClient.invalidateQueries({
        queryKey: ['page-access-control'],
      });
      queryClient.invalidateQueries({
        queryKey: ['page-access'],
      });
    },
  });
};
