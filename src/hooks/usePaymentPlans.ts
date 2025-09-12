// ABOUTME: V1.0 Payment Plans hook for simpler payment system (uses PaymentPlans table)

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// TYPES
// =============================================================================

export interface PaymentPlanV1 {
  id: string;
  name: string;
  description?: string;
  amount: number; // in cents
  days: number;
  type: 'one-time' | 'subscription';
  billing_interval?: 'day' | 'week' | 'month' | 'year';
  billing_interval_count?: number;
  is_active: boolean;
  created_at: string;
  slug?: string;
  metadata?: Record<string, any>;
}

export interface UsePaymentPlansV1Result {
  plans: PaymentPlanV1[];
  activePlans: PaymentPlanV1[];
  isLoading: boolean;
  error: Error | null;
  getPlanById: (id: string) => PaymentPlanV1 | undefined;
  getPlanBySlug: (slug: string) => PaymentPlanV1 | undefined;
  refetch: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

export const usePaymentPlans = (): UsePaymentPlansV1Result => {
  const { 
    data: plans = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['payment-plans-v1'],
    queryFn: async (): Promise<PaymentPlanV1[]> => {
      console.log('🔄 Fetching V1 payment plans...');
      
      const { data, error } = await supabase
        .from('PaymentPlans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching V1 payment plans:', error);
        throw new Error(`Erro ao carregar planos: ${error.message}`);
      }
      
      console.log('✅ V1 payment plans loaded:', data?.length || 0);
      return data || [];
    },
    retry: (failureCount, error) => {
      return failureCount < 2 && !error.message.includes('permission');
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 30000, // 30 seconds
  });

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const activePlans = useMemo(() => {
    return plans.filter(plan => plan.is_active === true);
  }, [plans]);

  const getPlanById = (id: string): PaymentPlanV1 | undefined => {
    return plans.find(plan => plan.id === id);
  };

  const getPlanBySlug = (slug: string): PaymentPlanV1 | undefined => {
    return plans.find(plan => plan.slug === slug);
  };

  // =============================================================================
  // RETURN INTERFACE
  // =============================================================================

  return {
    plans,
    activePlans,
    isLoading,
    error,
    getPlanById,
    getPlanBySlug,
    refetch: () => refetch()
  };
};