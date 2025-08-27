// ABOUTME: Simplified page settings hook matching cleaned database schema for Reddit parity

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

// Enhanced types with title system enhancements
export interface PageSettings {
  id: string;
  page_id: string;
  title: string | null;
  title_prefix: string | null;      // Prefix text like "R."
  title_color: string | null;       // Title color (theme token or hex)
  prefix_color: string | null;      // Prefix color (theme token or hex)
  font_family: string | null;       // Font family for title/prefix
  title_size: string | null;        // Title text size (Tailwind classes)
  prefix_size: string | null;       // Prefix text size (Tailwind classes)
  banner_url: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdatePageSettingsData {
  title?: string | null;
  title_prefix?: string | null;
  title_color?: string | null;
  prefix_color?: string | null;
  font_family?: string | null;
  title_size?: string | null;
  prefix_size?: string | null;
  banner_url?: string | null;
  avatar_url?: string | null;
}

// Hook for fetching page settings by page_id
export const usePageSettings = (pageId: string) => {
  return useQuery({
    queryKey: ['page-settings', pageId],
    queryFn: async (): Promise<PageSettings | null> => {
      const { data, error } = await supabase
        .from('page_settings')
        .select('*')
        .eq('page_id', pageId)
        .eq('is_active', true)
        .single();

      if (error) {
        // Return null for missing settings (will use defaults)
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch page settings: ${error.message}`);
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - page settings don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching all page settings (admin use)
export const useAllPageSettings = () => {
  return useQuery({
    queryKey: ['page-settings', 'all'],
    queryFn: async (): Promise<PageSettings[]> => {
      const { data, error } = await supabase
        .from('page_settings')
        .select('*')
        .order('page_id');

      if (error) {
        throw new Error(`Failed to fetch all page settings: ${error.message}`);
      }

      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for admin data
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation hook for updating page settings
export const useUpdatePageSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      pageId, 
      updates 
    }: { 
      pageId: string; 
      updates: UpdatePageSettingsData; 
    }): Promise<PageSettings> => {
      const { data, error } = await supabase
        .from('page_settings')
        .update(updates)
        .eq('page_id', pageId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update page settings: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries following EVIDENS cache patterns
      queryClient.invalidateQueries({ queryKey: ['page-settings', data.page_id] });
      queryClient.invalidateQueries({ queryKey: ['page-settings', 'all'] });
      
      // Optimistic update for the specific page settings
      queryClient.setQueryData(['page-settings', data.page_id], data);
    },
    onError: (error) => {
      console.error('Page settings update failed:', error);
    }
  });
};

// Mutation hook for creating new page settings
export const useCreatePageSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newSettings: Omit<PageSettings, 'id' | 'created_at' | 'updated_at'>): Promise<PageSettings> => {
      const { data, error } = await supabase
        .from('page_settings')
        .insert(newSettings)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create page settings: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate and update cache
      queryClient.invalidateQueries({ queryKey: ['page-settings'] });
      queryClient.setQueryData(['page-settings', data.page_id], data);
    }
  });
};