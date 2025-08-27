// ABOUTME: Simplified page settings hook matching cleaned database schema for Reddit parity

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

// Enhanced types with title system and icon avatar enhancements
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
  title_size_custom: number | null; // Custom title size in pixels
  prefix_size_custom: number | null;// Custom prefix size in pixels
  show_avatar: boolean | null;       // Whether to show avatar
  title_shadow: boolean | null;      // Whether title has shadow
  prefix_shadow: boolean | null;     // Whether prefix has shadow
  banner_url: string | null;
  banner_background_color: string | null; // Banner background color for transparency support
  avatar_url: string | null;
  avatar_type: string | null;       // 'image' or 'icon' - avatar type selector
  avatar_icon: string | null;       // Icon name for icon-based avatars
  avatar_icon_color: string | null; // Icon color (theme token or hex)
  avatar_background_color: string | null; // Avatar background color
  avatar_icon_size: number | null;  // Avatar icon size in pixels
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
  title_size_custom?: number | null;
  prefix_size_custom?: number | null;
  show_avatar?: boolean | null;
  title_shadow?: boolean | null;
  prefix_shadow?: boolean | null;
  banner_url?: string | null;
  banner_background_color?: string | null;
  avatar_url?: string | null;
  avatar_type?: string | null;
  avatar_icon?: string | null;
  avatar_icon_color?: string | null;
  avatar_background_color?: string | null;
  avatar_icon_size?: number | null;
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