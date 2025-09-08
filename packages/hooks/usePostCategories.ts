// ABOUTME: TanStack Query hook for fetching active post categories from the CommunityCategories table.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

interface PostCategory {
  id: number;
  name: string;
  label: string;
  description?: string;
  text_color: string;
  border_color: string;
  background_color: string;
  icon_name?: string;
  display_order: number;
  is_active: boolean;
  is_system: boolean;
  hidden_from_user_selection?: boolean;
}

interface PostCategoriesResponse {
  success: boolean;
  categories: PostCategory[];
  count: number;
}

export const usePostCategories = () => {
  return useQuery({
    queryKey: ['post-categories'],
    queryFn: async (): Promise<PostCategory[]> => {
      console.log('Fetching post categories...');

      const { data, error } = await supabase.functions.invoke('get-post-categories');

      if (error) {
        console.error('Categories fetch error:', error);
        throw new Error(error.message || 'Failed to fetch categories');
      }

      if (!data?.success) {
        console.error('Categories API returned failure:', data);
        throw new Error('Categories API returned failure');
      }

      console.log('Categories fetched successfully:', data.categories);
      return data.categories || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook for admin users to get all categories including hidden ones
export const usePostCategoriesAdmin = () => {
  return useQuery({
    queryKey: ['post-categories-admin'],
    queryFn: async (): Promise<PostCategory[]> => {
      console.log('Fetching all post categories for admin...');

      const { data, error } = await supabase.functions.invoke('get-post-categories?admin=true');

      if (error) {
        console.error('Admin categories fetch error:', error);
        throw new Error(error.message || 'Failed to fetch admin categories');
      }

      if (!data?.success) {
        console.error('Admin categories API returned failure:', data);
        throw new Error('Admin categories API returned failure');
      }

      console.log('Admin categories fetched successfully:', data.categories);
      return data.categories || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
