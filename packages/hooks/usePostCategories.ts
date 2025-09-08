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

      // Query the database directly instead of non-existent Edge Function
      const { data, error } = await supabase
        .from('CommunityCategories')
        .select('*')
        .eq('is_active', true)
        .neq('hidden_from_user_selection', true) // Exclude hidden categories for regular users
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Categories fetch error:', error);
        throw new Error(error.message || 'Failed to fetch categories');
      }

      console.log('Categories fetched successfully:', data);
      return data || [];
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

      // Get user session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        throw new Error('Not authenticated');
      }

      // Use direct fetch with GET method instead of supabase.functions.invoke
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/get-post-categories?admin=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch admin categories: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data?.success) {
        console.error('Admin categories API returned failure:', data);
        throw new Error(data?.error?.message || 'Admin categories API returned failure');
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
