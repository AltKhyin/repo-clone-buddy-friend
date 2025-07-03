// ABOUTME: TanStack Query hooks for page access control data fetching with caching

import { useQuery } from '@tanstack/react-query';
import { invokeFunctionGet } from '../../src/lib/supabase-functions';
import type { AccessLevel } from '../../src/lib/accessControl';

export interface PageAccessControl {
  id: number;
  page_path: string;
  required_access_level: AccessLevel;
  redirect_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageAccessControlQueryParams {
  filter?: {
    access_level?: AccessLevel;
    is_active?: boolean;
  };
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PageAccessControlResponse {
  data: PageAccessControl[];
  total_count: number;
}

/**
 * Hook to fetch page access control rule for a specific page
 */
export const usePageAccessQuery = (pagePath: string) => {
  return useQuery<PageAccessControl | null>({
    queryKey: ['page-access', pagePath],
    queryFn: async () => {
      try {
        const result = await invokeFunctionGet<PageAccessControl>('page-access-check', {
          page_path: pagePath,
        });
        return result;
      } catch (error) {
        // Return null for non-existent pages instead of throwing
        if (error instanceof Error && error.message.includes('not found')) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - access control rules don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch all page access control rules (admin only)
 */
export const usePageAccessControlQuery = (params?: PageAccessControlQueryParams) => {
  return useQuery<PageAccessControlResponse>({
    queryKey: ['page-access-control', params],
    queryFn: async () => {
      const result = await invokeFunctionGet<PageAccessControlResponse>(
        'admin-page-access-control',
        params
      );
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};
