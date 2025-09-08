// ABOUTME: Hook for managing customer support contact settings in admin panel

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomerSupportSettings {
  mode: 'simple' | 'advanced';
  // Simple mode - just a support URL
  supportUrl?: string;
  // Advanced mode - multiple contact options
  email: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
}

const DEFAULT_SETTINGS: CustomerSupportSettings = {
  mode: 'simple',
  supportUrl: '',
  email: 'suporte@evidens.com.br',
  phone: '',
  whatsapp: '',
  website: ''
};

/**
 * Hook for fetching customer support settings
 */
export const useCustomerSupportSettings = () => {
  return useQuery({
    queryKey: ['customer-support-settings'],
    queryFn: async (): Promise<CustomerSupportSettings> => {
      const { data, error } = await supabase
        .from('SiteSettings')
        .select('value')
        .eq('key', 'customer_support_contacts')
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          // No settings exist yet, return defaults
          return DEFAULT_SETTINGS;
        }
        throw new Error(`Failed to retrieve customer support settings: ${error.message}`);
      }
      
      if (!data?.value || data.value === '""' || data.value === '') {
        return DEFAULT_SETTINGS;
      }
      
      try {
        const parsedValue = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        return { ...DEFAULT_SETTINGS, ...parsedValue };
      } catch {
        console.error('Failed to parse customer support settings, using defaults');
        return DEFAULT_SETTINGS;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });
};

/**
 * Hook for updating customer support settings
 */
export const useUpdateCustomerSupportSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: CustomerSupportSettings) => {
      // Check if setting exists
      const { data: existingSetting } = await supabase
        .from('SiteSettings')
        .select('id')
        .eq('key', 'customer_support_contacts')
        .single();
        
      const settingsJson = JSON.stringify(settings);
      
      if (existingSetting) {
        // Update existing setting
        const { data, error } = await supabase
          .from('SiteSettings')
          .update({ 
            value: settingsJson,
            updated_at: new Date().toISOString()
          })
          .eq('key', 'customer_support_contacts')
          .select()
          .single();
          
        if (error) {
          throw new Error(`Failed to update customer support settings: ${error.message}`);
        }
        
        return data;
      } else {
        // Create new setting
        const { data, error } = await supabase
          .from('SiteSettings')
          .insert({
            key: 'customer_support_contacts',
            value: settingsJson,
            description: 'Customer support contact information for payment and auth pages'
          })
          .select()
          .single();
          
        if (error) {
          throw new Error(`Failed to create customer support settings: ${error.message}`);
        }
        
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-support-settings'] });
      toast.success('Configurações de suporte atualizadas com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error updating customer support settings:', error);
      toast.error(`Erro ao salvar configurações: ${error.message}`);
    },
  });
};

/**
 * Format contact for display in UI
 */
export const formatContact = (type: keyof CustomerSupportSettings, value: string): string => {
  switch (type) {
    case 'email':
      return `mailto:${value}`;
    case 'phone':
      return `tel:${value}`;
    case 'whatsapp':
      return `https://wa.me/${value.replace(/\D/g, '')}`;
    case 'website':
      return value.startsWith('http') ? value : `https://${value}`;
    default:
      return value;
  }
};

/**
 * Get primary contact method for display
 */
export const getPrimaryContact = (settings: CustomerSupportSettings): { type: string; value: string; formatted: string } => {
  // Simple mode: use support URL if available
  if (settings.mode === 'simple' && settings.supportUrl) {
    return {
      type: 'Suporte',
      value: 'Entre em contato',
      formatted: settings.supportUrl
    };
  }
  
  // Advanced mode: Priority: email > whatsapp > phone > website
  if (settings.email) {
    return {
      type: 'Email',
      value: settings.email,
      formatted: formatContact('email', settings.email)
    };
  }
  
  if (settings.whatsapp) {
    return {
      type: 'WhatsApp',
      value: settings.whatsapp,
      formatted: formatContact('whatsapp', settings.whatsapp)
    };
  }
  
  if (settings.phone) {
    return {
      type: 'Telefone',
      value: settings.phone,
      formatted: formatContact('phone', settings.phone)
    };
  }
  
  if (settings.website) {
    return {
      type: 'Website',
      value: settings.website,
      formatted: formatContact('website', settings.website)
    };
  }
  
  return {
    type: 'Email',
    value: DEFAULT_SETTINGS.email,
    formatted: formatContact('email', DEFAULT_SETTINGS.email)
  };
};