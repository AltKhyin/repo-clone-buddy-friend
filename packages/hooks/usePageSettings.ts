// ABOUTME: TanStack Query hook for page settings data following EVIDENS data access patterns

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

// Types for page settings
export interface PageSettings {
  id: string;
  page_id: string;
  title: string | null;
  description: string | null;
  banner_url: string | null;
  avatar_url: string | null;
  banner_urls: {
    small?: string;
    medium?: string;
    large?: string;
    xlarge?: string;
  } | null;
  theme_color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface UpdatePageSettingsData {
  title?: string;
  description?: string;
  banner_url?: string;
  avatar_url?: string;
  banner_urls?: Record<string, string>;
  theme_color?: string;
}

// Hook for fetching page settings by page_id [C4.2]
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
    cacheTime: 10 * 60 * 1000, // 10 minutes
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
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation hook for updating page settings [C4.2]
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
      // Get current user for updated_by field
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('page_settings')
        .update({
          ...updates,
          updated_by: user?.id,
        })
        .eq('page_id', pageId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update page settings: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries following EVIDENS cache patterns [C4.2]
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
    mutationFn: async (newSettings: Omit<PageSettings, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<PageSettings> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('page_settings')
        .insert({
          ...newSettings,
          created_by: user?.id,
          updated_by: user?.id,
        })
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

// Helper function to get responsive banner URL
export const getResponsiveBannerUrl = (settings: PageSettings | null, breakpoint: 'small' | 'medium' | 'large' | 'xlarge' = 'medium'): string | null => {
  if (!settings) return null;
  
  // Try responsive URLs first
  if (settings.banner_urls && typeof settings.banner_urls === 'object') {
    const responsiveUrl = settings.banner_urls[breakpoint];
    if (responsiveUrl) return responsiveUrl;
    
    // Fallback to largest available if requested size not found
    const fallbackOrder = ['xlarge', 'large', 'medium', 'small'];
    for (const size of fallbackOrder) {
      if (settings.banner_urls[size]) {
        return settings.banner_urls[size];
      }
    }
  }
  
  // Final fallback to single banner_url
  return settings.banner_url;
};

// Default page settings for fallback
export const getDefaultPageSettings = (pageId: string): Partial<PageSettings> => {
  const defaults = {
    acervo: {
      title: 'Acervo EVIDENS',
      description: 'Explore nossa coleção de reviews e conteúdo científico',
      theme_color: '#0F172A',
    },
    comunidade: {
      title: 'Comunidade EVIDENS',
      description: 'Participe das discussões e conecte-se com outros profissionais',
      theme_color: '#0F172A',
    },
    homepage: {
      title: 'EVIDENS',
      description: 'Medicina baseada em evidências',
      theme_color: '#0F172A',
    }
  };

  return defaults[pageId as keyof typeof defaults] || {
    title: pageId.charAt(0).toUpperCase() + pageId.slice(1),
    description: '',
    theme_color: '#0F172A',
  };
};