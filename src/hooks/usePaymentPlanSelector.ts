// ABOUTME: V2.0 Payment plan selector hook for integrating with existing payment flow

import { useState, useMemo, useCallback } from 'react';
import { usePaymentPlansV2 } from './usePaymentPlansV2';
import { usePaymentPricingV2 } from './usePaymentPricingV2';
import { 
  buildPixPaymentRequestV2,
  buildSubscriptionRequestV2,
  type PixPaymentRequest,
  type PaymentV2Request
} from '@/lib/pagarme-v2';
import type { 
  PaymentPlanV2Row, 
  PricingCalculationResult,
  InstallmentOption 
} from '@/types/paymentV2.types';

// =============================================================================
// TYPES
// =============================================================================

export interface PaymentPlanSelectorState {
  selectedPlanId: string | null;
  selectedInstallments: number;
  paymentMethod: 'credit_card' | 'pix';
}

export interface PaymentPlanSelectorOptions {
  initialCustomParameter?: string | null;
  initialPaymentMethod?: 'credit_card' | 'pix' | null;
}

export interface UsePaymentPlanSelectorResult {
  // State
  state: PaymentPlanSelectorState;
  
  // Data
  availablePlans: PaymentPlanV2Row[];
  selectedPlan: PaymentPlanV2Row | null;
  pricing: PricingCalculationResult | null;
  isLoading: boolean;
  
  // Actions
  selectPlan: (planId: string) => void;
  selectInstallments: (installments: number) => void;
  selectPaymentMethod: (method: 'credit_card' | 'pix') => void;
  
  // Payment Request Builders
  buildPixRequest: (customerData: {
    name: string;
    email: string;
    document: string;
    phone: string;
  }) => PixPaymentRequest | null;
  
  buildCreditCardRequest: (customerData: {
    name: string;
    email: string;
    document: string;
    phone: string;
    zipCode: string;
    address: string;
    city: string;
    state: string;
    cardNumber: string;
    cardName: string;
    cardExpiry: string;
    cardCvv: string;
  }) => PaymentV2Request | null;
  
  // Utilities
  getSelectedInstallmentOption: () => InstallmentOption | null;
  getPixFinalAmount: () => number;
  getCreditCardFinalAmount: () => number;
  formatCurrency: (amount: number) => string;
}

// =============================================================================
// HOOK
// =============================================================================

export const usePaymentPlanSelector = (
  options: PaymentPlanSelectorOptions = {}
): UsePaymentPlanSelectorResult => {
  const { initialCustomParameter, initialPaymentMethod } = options;
  
  const [state, setState] = useState<PaymentPlanSelectorState>({
    selectedPlanId: null, // Will be set based on custom parameter
    selectedInstallments: 1,
    paymentMethod: initialPaymentMethod || 'credit_card'
  });

  // Get available plans
  const { plans, isLoading } = usePaymentPlansV2();
  const availablePlans = useMemo(() => {
    return plans.filter(plan => plan.is_active);
  }, [plans]);

  // Get selected plan
  const selectedPlan = useMemo(() => {
    if (!state.selectedPlanId) return null;
    return availablePlans.find(plan => plan.id === state.selectedPlanId) || null;
  }, [availablePlans, state.selectedPlanId]);

  // Get pricing for selected plan
  const { 
    pricing, 
    formatCurrency 
  } = usePaymentPricingV2({
    plan: selectedPlan,
    autoCalculate: true
  });

  // Initialize plan selection based on custom parameter
  useMemo(() => {
    if (availablePlans.length === 0) return; // Wait for plans to load
    
    // Debug logging for URL parameter plan selection
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 usePaymentPlanSelector - Plan Selection Debug:', {
        initialCustomParameter,
        availablePlansCount: availablePlans.length,
        availablePlans: availablePlans.map(p => ({
          id: p.id,
          name: p.name,
          custom_link_parameter: p.custom_link_parameter
        })),
        currentSelectedPlanId: state.selectedPlanId
      });
    }
    
    // If we already have a selected plan, don't override
    if (state.selectedPlanId && availablePlans.find(p => p.id === state.selectedPlanId)) {
      console.log('✅ Plan already selected, keeping current selection:', state.selectedPlanId);
      return;
    }
    
    // Try to find plan by custom parameter if provided
    if (initialCustomParameter) {
      console.log('🔍 Looking for plan with custom parameter:', initialCustomParameter);
      
      const planByCustomParam = availablePlans.find(plan => {
        // Check if the plan has a custom_link_parameter that matches
        const planCustomParam = (plan as any)?.custom_link_parameter;
        const matches = planCustomParam === initialCustomParameter;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`  • Plan "${plan.name}": custom_link_parameter="${planCustomParam}", matches=${matches}`);
        }
        
        return matches;
      });
      
      if (planByCustomParam) {
        console.log('✅ Found matching plan by custom parameter:', {
          planId: planByCustomParam.id,
          planName: planByCustomParam.name,
          customParam: planByCustomParam.custom_link_parameter
        });
        setState(prev => ({
          ...prev,
          selectedPlanId: planByCustomParam.id
        }));
        return;
      } else {
        console.warn('❌ No plan found with custom parameter:', initialCustomParameter);
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
      selectedPlanId: planId,
      selectedInstallments: 1 // Reset to 1x when changing plans
    }));
  }, []);

  const selectInstallments = useCallback((installments: number) => {
    setState(prev => ({
      ...prev,
      selectedInstallments: installments
    }));
  }, []);

  const selectPaymentMethod = useCallback((method: 'credit_card' | 'pix') => {
    setState(prev => ({
      ...prev,
      paymentMethod: method
    }));
  }, []);

  // Get selected installment option
  const getSelectedInstallmentOption = (): InstallmentOption | null => {
    if (!pricing || !pricing.installmentOptions) return null;
    
    return pricing.installmentOptions.find(
      option => option.installments === state.selectedInstallments
    ) || null;
  };

  // Get final amounts
  const getPixFinalAmount = (): number => {
    return pricing?.pixFinalAmount || 0;
  };

  const getCreditCardFinalAmount = (): number => {
    const installmentOption = getSelectedInstallmentOption();
    return installmentOption?.totalAmount || pricing?.finalAmount || 0;
  };

  // Build PIX payment request
  const buildPixRequest = (customerData: {
    name: string;
    email: string;
    document: string;
    phone: string;
  }): PixPaymentRequest | null => {
    if (!selectedPlan || !pricing) return null;

    return buildPixPaymentRequestV2(customerData, {
      id: selectedPlan.id,
      name: selectedPlan.name,
      final_amount: selectedPlan.final_amount,
      pixFinalAmount: pricing.pixFinalAmount,
      pix_config: selectedPlan.pix_config,
      duration_days: selectedPlan.duration_days || 365
    });
  };

  // Build credit card payment request
  const buildCreditCardRequest = (customerData: {
    name: string;
    email: string;
    document: string;
    phone: string;
    zipCode: string;
    address: string;
    city: string;
    state: string;
    cardNumber: string;
    cardName: string;
    cardExpiry: string;
    cardCvv: string;
  }): PaymentV2Request | null => {
    if (!selectedPlan || !pricing) return null;

    const installmentOption = getSelectedInstallmentOption();
    if (!installmentOption) return null;

    return buildSubscriptionRequestV2(
      {
        ...customerData,
        installments: state.selectedInstallments
      },
      {
        id: selectedPlan.id,
        name: selectedPlan.name,
        final_amount: selectedPlan.final_amount,
        installment_config: selectedPlan.installment_config,
        duration_days: selectedPlan.duration_days || 365,
        plan_type: selectedPlan.plan_type || 'premium'
      },
      installmentOption
    );
  };

  return {
    // State
    state,
    
    // Data
    availablePlans,
    selectedPlan,
    pricing,
    isLoading,
    
    // Actions
    selectPlan,
    selectInstallments,
    selectPaymentMethod,
    
    // Payment Request Builders
    buildPixRequest,
    buildCreditCardRequest,
    
    // Utilities
    getSelectedInstallmentOption,
    getPixFinalAmount,
    getCreditCardFinalAmount,
    formatCurrency
  };
};