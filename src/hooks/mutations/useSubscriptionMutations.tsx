// ABOUTME: V2 subscription mutations for simplified time + tier approach

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// V2 Subscription Actions Hook - Simplified for time + tier approach
export function useSubscriptionActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const cancelSubscription = async (subscriptionId: string, reason: string) => {
    // V2: Cancel is just setting tier to 'free' and clearing dates
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('Practitioners')
      .update({
        subscription_tier: 'free',
        subscription_ends_at: null,
        subscription_starts_at: null,
      })
      .eq('id', user.id);

    if (error) throw error;
    
    toast({
      title: 'Assinatura cancelada',
      description: 'Sua assinatura foi cancelada com sucesso.',
    });
    
    return { success: true };
  };

  const pauseSubscription = async (subscriptionId: string, reason: string) => {
    // V2: Pause by setting tier to 'free' but keeping end date for later reactivation
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('Practitioners')
      .update({
        subscription_tier: 'free',
        // Keep subscription_ends_at for reactivation reference
      })
      .eq('id', user.id);

    if (error) throw error;
    
    toast({
      title: 'Assinatura pausada',
      description: 'Sua assinatura foi pausada. Você pode reativá-la a qualquer momento.',
    });
    
    return { success: true };
  };

  const reactivateSubscription = async (subscriptionId: string) => {
    // V2: Reactivate by setting tier back to 'premium'
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('Practitioners')
      .update({
        subscription_tier: 'premium',
        subscription_starts_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;
    
    toast({
      title: 'Assinatura reativada',
      description: 'Sua assinatura foi reativada com sucesso.',
    });
    
    return { success: true };
  };

  return {
    cancelSubscription,
    pauseSubscription, 
    reactivateSubscription,
    isUpdating: false // Simplified for V2
  };
}

// V2 Update Subscription Hook
export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: { tier?: string; endDate?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const updateData: any = {};
      
      if (updates.tier) {
        updateData.subscription_tier = updates.tier;
      }
      
      if (updates.endDate) {
        updateData.subscription_ends_at = updates.endDate;
      }

      const { error } = await supabase
        .from('Practitioners')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;
      
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-status'] });
      queryClient.invalidateQueries({ queryKey: ['current-user-status'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-user-status'] });
      
      toast({
        title: 'Assinatura atualizada',
        description: 'Suas configurações de assinatura foram atualizadas.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Não foi possível atualizar a assinatura.',
        variant: 'destructive',
      });
    }
  });
}

// V2 Subscription Status Hook - Using existing enhanced user status
export function useSubscriptionStatus() {
  // This is now handled by useEnhancedUserStatus from useUserStatus.ts
  // Return a compatible interface for backward compatibility
  return {
    data: null, // Legacy compatibility
    isLoading: false,
    error: null,
  };
}