// ABOUTME: TanStack Query hooks for managing shared admin chart configurations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import { ChartConfig, ChartConfigDB, ChartFormData } from '@/types/analytics';

// Fetch all shared chart configurations
export const useChartConfigs = () => {
  return useQuery({
    queryKey: ['chart-configs'],
    queryFn: async (): Promise<ChartConfigDB[]> => {
      console.log('🔍 Fetching shared chart configurations...');

      const { data, error } = await supabase
        .from('analytics_chart_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching chart configs:', error);
        throw new Error(`Failed to fetch chart configs: ${error.message}`);
      }

      console.log('✅ Chart configs loaded:', data?.length || 0);
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create a new chart configuration
export const useCreateChartConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ChartFormData): Promise<ChartConfigDB> => {
      console.log('📊 Creating new chart config:', formData.name);

      const { data, error } = await supabase
        .from('analytics_chart_configs')
        .insert([{
          ...formData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating chart config:', error);
        throw new Error(`Failed to create chart config: ${error.message}`);
      }

      console.log('✅ Chart config created:', data.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-configs'] });
    }
  });
};

// Update an existing chart configuration
export const useUpdateChartConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: Partial<ChartFormData> }): Promise<ChartConfigDB> => {
      console.log('📊 Updating chart config:', id);

      const { data, error } = await supabase
        .from('analytics_chart_configs')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating chart config:', error);
        throw new Error(`Failed to update chart config: ${error.message}`);
      }

      console.log('✅ Chart config updated:', data.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-configs'] });
    }
  });
};

// Delete a chart configuration
export const useDeleteChartConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      console.log('🗑️ Deleting chart config:', id);

      const { error } = await supabase
        .from('analytics_chart_configs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting chart config:', error);
        throw new Error(`Failed to delete chart config: ${error.message}`);
      }

      console.log('✅ Chart config deleted:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-configs'] });
    }
  });
};

// Get a single chart configuration by ID
export const useChartConfig = (id: string) => {
  return useQuery({
    queryKey: ['chart-config', id],
    queryFn: async (): Promise<ChartConfigDB | null> => {
      if (!id) return null;

      console.log('🔍 Fetching chart config:', id);

      const { data, error } = await supabase
        .from('analytics_chart_configs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        console.error('❌ Error fetching chart config:', error);
        throw new Error(`Failed to fetch chart config: ${error.message}`);
      }

      console.log('✅ Chart config loaded:', data.name);
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Duplicate an existing chart configuration
export const useDuplicateChartConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceId: string): Promise<ChartConfigDB> => {
      console.log('📋 Duplicating chart config:', sourceId);

      // First, fetch the source config
      const { data: sourceConfig, error: fetchError } = await supabase
        .from('analytics_chart_configs')
        .select('*')
        .eq('id', sourceId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch source config: ${fetchError.message}`);
      }

      // Create a copy with modified name
      const { id, created_at, updated_at, created_by, ...configData } = sourceConfig;
      const duplicatedConfig = {
        ...configData,
        name: `${configData.name} (Copy)`,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { data, error } = await supabase
        .from('analytics_chart_configs')
        .insert([duplicatedConfig])
        .select()
        .single();

      if (error) {
        console.error('❌ Error duplicating chart config:', error);
        throw new Error(`Failed to duplicate chart config: ${error.message}`);
      }

      console.log('✅ Chart config duplicated:', data.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-configs'] });
    }
  });
};