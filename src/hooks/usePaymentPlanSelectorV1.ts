// ABOUTME: V1.0 Payment plan selector hook with URL parameter support for simpler payment system

import { useState, useMemo, useCallback } from 'react';
import { usePaymentPlans } from './usePaymentPlans';
import type { PaymentPlanV1 } from './usePaymentPlans';

// =============================================================================
// TYPES
// =============================================================================

export interface PaymentPlanSelectorV1State {
  selectedPlanId: string | null;
  paymentMethod: 'credit_card' | 'pix';
}

export interface PaymentPlanSelectorV1Options {
  initialCustomParameter?: string | null;
  initialPaymentMethod?: 'credit_card' | 'pix' | null;
}

export interface UsePaymentPlanSelectorV1Result {
  // State
  state: PaymentPlanSelectorV1State;
  
  // Data
  availablePlans: PaymentPlanV1[];
  selectedPlan: PaymentPlanV1 | null;
  isLoading: boolean;
  
  // Actions
  selectPlan: (planId: string) => void;
  selectPaymentMethod: (method: 'credit_card' | 'pix') => void;
  
  // Utilities
  formatCurrency: (amount: number) => string;
}

// =============================================================================
// HOOK
// =============================================================================

export const usePaymentPlanSelectorV1 = (
  options: PaymentPlanSelectorV1Options = {}
): UsePaymentPlanSelectorV1Result => {
  const { initialCustomParameter, initialPaymentMethod } = options;
  
  const [state, setState] = useState<PaymentPlanSelectorV1State>({
    selectedPlanId: null,
    paymentMethod: initialPaymentMethod || 'credit_card'
  });

  // Get available plans
  const { plans, isLoading } = usePaymentPlans();
  const availablePlans = useMemo(() => {
    return plans.filter(plan => plan.is_active);
  }, [plans]);

  // Get selected plan
  const selectedPlan = useMemo(() => {
    if (!state.selectedPlanId) return null;
    return availablePlans.find(plan => plan.id === state.selectedPlanId) || null;
  }, [availablePlans, state.selectedPlanId]);

  // Initialize plan selection based on custom parameter or slug
  useMemo(() => {
    if (availablePlans.length === 0) return; // Wait for plans to load
    
    // Debug logging for URL parameter plan selection
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 usePaymentPlanSelectorV1 - Plan Selection Debug:', {
        initialCustomParameter,
        availablePlansCount: availablePlans.length,
        availablePlans: availablePlans.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug
        })),
        currentSelectedPlanId: state.selectedPlanId
      });
    }
    
    // If we already have a selected plan, don't override
    if (state.selectedPlanId && availablePlans.find(p => p.id === state.selectedPlanId)) {
      console.log('✅ Plan already selected, keeping current selection:', state.selectedPlanId);
      return;
    }
    
    // Try to find plan by slug if URL parameter provided
    if (initialCustomParameter) {
      console.log('🔍 Looking for plan with slug:', initialCustomParameter);
      
      const planBySlug = availablePlans.find(plan => {
        const matches = plan.slug === initialCustomParameter;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`  • Plan "${plan.name}": slug="${plan.slug}", matches=${matches}`);
        }
        
        return matches;
      });
      
      if (planBySlug) {
        console.log('✅ Found matching plan by slug:', {
          planId: planBySlug.id,
          planName: planBySlug.name,
          slug: planBySlug.slug
        });
        setState(prev => ({
          ...prev,
          selectedPlanId: planBySlug.id
        }));
        return;
      } else {
        console.warn('❌ No plan found with slug:', initialCustomParameter);
      }
    }
    
    // Fallback: auto-select first available plan if none found/specified
    if (!state.selectedPlanId && availablePlans.length > 0) {
      const fallbackPlan = availablePlans[0];
      console.log('⚠️ Using fallback plan selection:', {
        planId: fallbackPlan.id,
        planName: fallbackPlan.name
      });
      setState(prev => ({
        ...prev,
        selectedPlanId: fallbackPlan.id
      }));
    }
  }, [availablePlans, state.selectedPlanId, initialCustomParameter]);

  // Actions
  const selectPlan = useCallback((planId: string) => {
    setState(prev => ({
      ...prev,
      selectedPlanId: planId
    }));
  }, []);

  const selectPaymentMethod = useCallback((method: 'credit_card' | 'pix') => {
    setState(prev => ({
      ...prev,
      paymentMethod: method
    }));
  }, []);

  // Format currency helper
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  return {
    // State
    state,
    
    // Data
    availablePlans,
    selectedPlan,
    isLoading,
    
    // Actions
    selectPlan,
    selectPaymentMethod,
    
    // Utilities
    formatCurrency
  };
};