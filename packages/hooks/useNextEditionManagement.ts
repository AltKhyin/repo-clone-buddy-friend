// ABOUTME: TanStack Query hooks for Next Edition countdown scheduling and suggestion moderation management.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

interface CountdownData {
  id: string;
  title: string;
  description: string | null;
  target_date: string;
  timezone: string;
  is_active: boolean;
  is_featured: boolean;
  display_format: string;
  completed_message: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface SuggestionData {
  id: number;
  title: string;
  description: string | null;
  submitted_by: string | null;
  upvotes: number;
  status: string;
  created_at: string;
  Practitioners?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface ReviewModeSettings {
  key: string;
  value: boolean;
  description: string | null;
}

// Get active countdown
export const useActiveCountdown = () => {
  return useQuery({
    queryKey: ['active-countdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('CommunityCountdowns')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch countdown: ${error.message}`);
      }

      return data as CountdownData | null;
    },
    staleTime: 30000, // Cache for 30 seconds
  });
};

// Get all suggestions with practitioner info
export const useSuggestions = () => {
  return useQuery({
    queryKey: ['all-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Suggestions')
        .select(`
          *,
          Practitioners (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch suggestions: ${error.message}`);
      }

      return data as SuggestionData[];
    },
    staleTime: 10000, // Cache for 10 seconds
  });
};

// Get review mode setting
export const useReviewMode = () => {
  return useQuery({
    queryKey: ['suggestion-review-mode'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('SiteSettings')
        .select('*')
        .eq('key', 'suggestion_review_mode')
        .single();

      if (error && error.code === 'PGRST116') {
        // Setting doesn't exist yet, return default (false)
        return { key: 'suggestion_review_mode', value: false, description: null };
      }

      if (error) {
        throw new Error(`Failed to fetch review mode: ${error.message}`);
      }

      return {
        key: data.key,
        value: typeof data.value === 'boolean' ? data.value : JSON.parse(data.value),
        description: data.description
      } as ReviewModeSettings;
    },
    staleTime: 30000,
  });
};

// Update countdown target date
export const useUpdateCountdown = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetDate: string) => {
      // First try to update existing countdown
      const { data: existing } = await supabase
        .from('CommunityCountdowns')
        .select('id')
        .eq('is_active', true)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('CommunityCountdowns')
          .update({ 
            target_date: targetDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw new Error(`Failed to update countdown: ${error.message}`);
        return data;
      } else {
        // Create new countdown if none exists
        const { data, error } = await supabase
          .from('CommunityCountdowns')
          .insert({
            title: 'Próxima Edição',
            description: 'Contagem regressiva para a próxima edição',
            target_date: targetDate,
            timezone: 'UTC',
            is_active: true,
            is_featured: true,
            display_format: 'days_hours_minutes'
          })
          .select()
          .single();

        if (error) throw new Error(`Failed to create countdown: ${error.message}`);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-countdown'] });
      queryClient.invalidateQueries({ queryKey: ['consolidated-homepage-feed'] });
    },
  });
};

// Toggle review mode
export const useToggleReviewMode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data, error } = await supabase
        .from('SiteSettings')
        .upsert({
          key: 'suggestion_review_mode',
          value: enabled,
          description: 'Whether new suggestions require admin approval before being displayed',
          category: 'community',
          is_public: false,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'key' 
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to update review mode: ${error.message}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestion-review-mode'] });
      queryClient.invalidateQueries({ queryKey: ['consolidated-homepage-feed'] });
    },
  });
};

// Delete individual suggestion
export const useDeleteSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionId: number) => {
      const { error } = await supabase
        .from('Suggestions')
        .delete()
        .eq('id', suggestionId);

      if (error) throw new Error(`Failed to delete suggestion: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['consolidated-homepage-feed'] });
    },
  });
};

// Wipe all suggestions
export const useWipeAllSuggestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('Suggestions')
        .delete()
        .neq('id', 0); // Delete all rows

      if (error) throw new Error(`Failed to wipe suggestions: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['consolidated-homepage-feed'] });
    },
  });
};

// Approve suggestion (for manual approval)
export const useApproveSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionId: number) => {
      const { data, error } = await supabase
        .from('Suggestions')
        .update({ status: 'approved' })
        .eq('id', suggestionId)
        .select()
        .single();

      if (error) throw new Error(`Failed to approve suggestion: ${error.message}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['consolidated-homepage-feed'] });
    },
  });
};