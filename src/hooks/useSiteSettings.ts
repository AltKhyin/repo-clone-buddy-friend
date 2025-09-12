// ABOUTME: Hook for managing site settings from SiteSettings table

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// =============================================================================
// TYPES
// =============================================================================

export interface SiteSetting {
  key: string;
  value: any;
  description?: string;
}

// =============================================================================
// HOOK
// =============================================================================

export const useSiteSettings = () => {
  const queryClient = useQueryClient();

  // Fetch all site settings
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async (): Promise<SiteSetting[]> => {
      const { data, error } = await supabase
        .from('SiteSettings')
        .select('*')
        .order('key');
      
      if (error) {
        console.error('❌ Error fetching site settings:', error);
        throw new Error(`Erro ao carregar configurações: ${error.message}`);
      }
      
      return data || [];
    },
    staleTime: 30000, // 30 seconds
  });

  // Get a specific setting by key
  const getSetting = (key: string, defaultValue?: any) => {
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : defaultValue;
  };

  // Update a setting
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: any; description?: string }) => {
      const { error } = await supabase
        .from('SiteSettings')
        .upsert({ key, value, description }, { onConflict: 'key' });
      
      if (error) {
        console.error('❌ Error updating site setting:', error);
        throw new Error(`Erro ao atualizar configuração: ${error.message}`);
      }
      
      return { key, value, description };
    },
    onSuccess: (updatedSetting) => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success(`Configuração "${updatedSetting.key}" atualizada com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('💥 Setting update failed:', error);
      toast.error(error.message || 'Erro ao atualizar configuração');
    }
  });

  return {
    settings,
    isLoading,
    getSetting,
    updateSetting: updateSettingMutation.mutateAsync,
    isUpdating: updateSettingMutation.isPending,
  };
};