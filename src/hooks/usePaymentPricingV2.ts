// ABOUTME: V2.0 Pre-request pricing calculation engine with discount logic isolation

import { useMemo } from 'react';
import type { 
  PaymentPlanV2Row,
  DiscountConfigV2,
  InstallmentConfigV2,
  PricingCalculationResult,
  InstallmentOption 
} from '@/types/paymentV2.types';

// =============================================================================
// PRICING CONSTANTS (V2 Specific)
// =============================================================================

const INSTALLMENT_FEES = {
  1: 0.0299,   // 2.99% for 1x (credit card processing fee)
  2: 0.0499,   // 4.99% for 2x
  3: 0.0699,   // 6.99% for 3x
  6: 0.0999,   // 9.99% for 6x
  12: 0.1499,  // 14.99% for 12x
} as const;

const MIN_INSTALLMENT_VALUE = 500; // R$ 5.00 minimum per installment (in cents)
const MAX_INSTALLMENTS = 12;
const MIN_PLAN_VALUE = 100; // R$ 1.00 minimum plan value (in cents)

// =============================================================================
// CORE PRICING FUNCTIONS
// =============================================================================

/**
 * Calculate discount amount based on configuration
 */
export const calculateDiscount = (
  baseAmount: number, 
  discountConfig: DiscountConfigV2 | null
): number => {
  if (!discountConfig?.enabled) return 0;
  
  switch (discountConfig.type) {
    case 'percentage':
      const percentage = discountConfig.percentage || 0;
      return Math.round(baseAmount * percentage);
      
    case 'fixed_amount':
      const fixedAmount = discountConfig.fixedAmount || 0;
      return Math.min(fixedAmount, baseAmount - MIN_PLAN_VALUE);
      
    case 'bulk_discount':
      if (discountConfig.bulkThresholds) {
        // Find the highest applicable threshold
        const applicableThreshold = discountConfig.bulkThresholds
          .filter(threshold => baseAmount >= threshold.minimumAmount)
          .sort((a, b) => b.minimumAmount - a.minimumAmount)[0];
          
        if (applicableThreshold) {
          return Math.round(baseAmount * applicableThreshold.discountPercentage);
        }
      }
      return 0;
      
    default:
      return 0;
  }
};

/**
 * Calculate final amount after discount
 */
export const calculateFinalAmount = (
  baseAmount: number, 
  discountConfig: DiscountConfigV2 | null
): number => {
  const discountAmount = calculateDiscount(baseAmount, discountConfig);
  const finalAmount = baseAmount - discountAmount;
  return Math.max(MIN_PLAN_VALUE, finalAmount);
};

/**
 * Calculate installment options with fees
 */
export const calculateInstallmentOptions = (
  finalAmount: number,
  installmentConfig: InstallmentConfigV2 | null
): InstallmentOption[] => {
  if (!installmentConfig?.enabled || !installmentConfig.options) {
    // Default: single payment only
    return [{
      installments: 1,
      feeRate: INSTALLMENT_FEES[1],
      totalAmount: Math.round(finalAmount * (1 + INSTALLMENT_FEES[1])),
      installmentAmount: Math.round(finalAmount * (1 + INSTALLMENT_FEES[1])),
      totalFees: Math.round(finalAmount * INSTALLMENT_FEES[1])
    }];
  }

  return installmentConfig.options
    .filter(option => {
      // Validate installment count
      if (option.installments < 1 || option.installments > MAX_INSTALLMENTS) {
        return false;
      }
      
      // Check minimum installment value
      const totalWithFees = finalAmount * (1 + option.feeRate);
      const installmentValue = totalWithFees / option.installments;
      return installmentValue >= MIN_INSTALLMENT_VALUE;
    })
    .map(option => {
      const totalFees = Math.round(finalAmount * option.feeRate);
      const totalAmount = finalAmount + totalFees;
      const installmentAmount = Math.round(totalAmount / option.installments);
      
      return {
        installments: option.installments,
        feeRate: option.feeRate,
        totalAmount,
        installmentAmount,
        totalFees
      };
    })
    .sort((a, b) => a.installments - b.installments);
};

/**
 * Calculate PIX pricing with base fee and discount
 */
export const calculatePixPricing = (
  finalAmount: number,
  pixConfig: any
): { 
  baseFeeAmount: number; 
  discountAmount: number; 
  finalAmount: number;
  baseFeeRate: number;
  discountRate: number;
} => {
  if (!pixConfig?.enabled) {
    return { 
      baseFeeAmount: 0, 
      discountAmount: 0, 
      finalAmount: finalAmount,
      baseFeeRate: 0,
      discountRate: 0
    };
  }
  
  // Step 1: Apply base PIX processing fee (default 1.4%)
  const baseFeeRate = pixConfig.baseFeeRate || 0.014;
  const baseFeeAmount = Math.round(finalAmount * baseFeeRate);
  const amountWithBaseFee = finalAmount + baseFeeAmount;
  
  // Step 2: Apply PIX discount to incentivize immediate payment
  const discountRate = Math.min(pixConfig.discountPercentage || 0, 0.15); // Max 15% PIX discount
  const discountAmount = Math.round(amountWithBaseFee * discountRate);
  
  // Step 3: Calculate final PIX amount
  const pixFinalAmount = Math.max(MIN_PLAN_VALUE, amountWithBaseFee - discountAmount);
  
  return {
    baseFeeAmount,
    discountAmount,
    finalAmount: pixFinalAmount,
    baseFeeRate,
    discountRate
  };
};

/**
 * Main pricing calculation function
 */
export const calculateCompletePricing = (plan: PaymentPlanV2Row): PricingCalculationResult => {
  const baseAmount = plan.base_amount;
  const discountConfig = plan.discount_config as DiscountConfigV2 | null;
  const installmentConfig = plan.installment_config as InstallmentConfigV2 | null;
  const pixConfig = plan.pix_config;
  
  // Step 1: Calculate base discount
  const discountAmount = calculateDiscount(baseAmount, discountConfig);
  const finalAmount = calculateFinalAmount(baseAmount, discountConfig);
  
  // Step 2: Calculate installment options
  const installmentOptions = calculateInstallmentOptions(finalAmount, installmentConfig);
  
  // Step 3: Calculate PIX pricing with base fee and discount
  const pixPricing = calculatePixPricing(finalAmount, pixConfig);
  
  // Step 4: Calculate savings (discount + PIX savings vs original base amount)
  const pixNetSavings = Math.max(0, finalAmount - pixPricing.finalAmount); // Net savings from PIX vs credit card
  const totalSavingsAmount = discountAmount + pixNetSavings;
  const totalSavingsPercentage = baseAmount > 0 ? totalSavingsAmount / baseAmount : 0;
  
  return {
    baseAmount,
    discountAmount,
    finalAmount,
    installmentOptions,
    pixDiscount: {
      amount: pixPricing.discountAmount,
      percentage: pixPricing.discountRate
    },
    pixFinalAmount: pixPricing.finalAmount,
    savings: {
      amount: totalSavingsAmount,
      percentage: totalSavingsPercentage
    },
    metadata: {
      hasDiscount: discountAmount > 0,
      hasPixDiscount: pixPricing.discountAmount > 0,
      pixBaseFee: pixPricing.baseFeeAmount,
      pixBaseFeeRate: pixPricing.baseFeeRate,
      maxInstallments: Math.max(...installmentOptions.map(opt => opt.installments)),
      minInstallmentValue: Math.min(...installmentOptions.map(opt => opt.installmentAmount)),
      calculatedAt: new Date().toISOString()
    }
  };
};

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

export const validatePricingConfig = (plan: PaymentPlanV2Row): string[] => {
  const errors: string[] = [];
  
  // Base amount validation
  if (plan.base_amount < MIN_PLAN_VALUE) {
    errors.push(`Valor base deve ser pelo menos ${MIN_PLAN_VALUE / 100} centavos`);
  }
  
  // Discount validation
  const discountConfig = plan.discount_config as DiscountConfigV2 | null;
  if (discountConfig?.enabled) {
    if (discountConfig.type === 'percentage') {
      if (!discountConfig.percentage || discountConfig.percentage <= 0 || discountConfig.percentage > 1) {
        errors.push('Desconto percentual deve estar entre 0% e 100%');
      }
    }
    
    if (discountConfig.type === 'fixed_amount') {
      if (!discountConfig.fixedAmount || discountConfig.fixedAmount <= 0) {
        errors.push('Valor do desconto deve ser maior que zero');
      }
      if (discountConfig.fixedAmount >= plan.base_amount) {
        errors.push('Desconto não pode ser maior ou igual ao valor base');
      }
    }
  }
  
  // Installment validation
  const installmentConfig = plan.installment_config as InstallmentConfigV2 | null;
  if (installmentConfig?.enabled && installmentConfig.options) {
    const finalAmount = calculateFinalAmount(plan.base_amount, discountConfig);
    
    for (const option of installmentConfig.options) {
      const totalWithFees = finalAmount * (1 + option.feeRate);
      const installmentValue = totalWithFees / option.installments;
      
      if (installmentValue < MIN_INSTALLMENT_VALUE) {
        errors.push(`Parcela de ${option.installments}x resulta em valor menor que o mínimo (R$ ${MIN_INSTALLMENT_VALUE / 100})`);
      }
    }
  }
  
  return errors;
};

// =============================================================================
// FORMATTING UTILITIES
// =============================================================================

export const formatCurrency = (amountInCents: number): string => {
  return (amountInCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

export const formatPercentage = (decimal: number): string => {
  return (decimal * 100).toLocaleString('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  });
};

export const formatInstallment = (option: InstallmentOption): string => {
  if (option.installments === 1) {
    return `À vista: ${formatCurrency(option.totalAmount)}`;
  }
  
  return `${option.installments}x de ${formatCurrency(option.installmentAmount)} (Total: ${formatCurrency(option.totalAmount)})`;
};

// =============================================================================
// MAIN HOOK
// =============================================================================

export interface UsePaymentPricingV2Props {
  plan: PaymentPlanV2Row | null;
  autoCalculate?: boolean;
}

export interface UsePaymentPricingV2Result {
  pricing: PricingCalculationResult | null;
  isValid: boolean;
  validationErrors: string[];
  formatCurrency: (amount: number) => string;
  formatPercentage: (decimal: number) => string;
  formatInstallment: (option: InstallmentOption) => string;
  calculatePreview: (overrides: Partial<PaymentPlanV2Row>) => PricingCalculationResult | null;
}

export const usePaymentPricingV2 = ({
  plan,
  autoCalculate = true
}: UsePaymentPricingV2Props): UsePaymentPricingV2Result => {
  
  // Main pricing calculation
  const pricing = useMemo(() => {
    if (!plan || !autoCalculate) return null;
    
    try {
      return calculateCompletePricing(plan);
    } catch (error) {
      console.error('Pricing calculation error:', error);
      return null;
    }
  }, [plan, autoCalculate]);
  
  // Validation
  const validationErrors = useMemo(() => {
    if (!plan) return [];
    return validatePricingConfig(plan);
  }, [plan]);
  
  const isValid = validationErrors.length === 0;
  
  // Preview calculation with overrides
  const calculatePreview = (overrides: Partial<PaymentPlanV2Row>): PricingCalculationResult | null => {
    if (!plan) return null;
    
    const previewPlan: PaymentPlanV2Row = { ...plan, ...overrides };
    
    try {
      return calculateCompletePricing(previewPlan);
    } catch (error) {
      console.error('Preview calculation error:', error);
      return null;
    }
  };
  
  return {
    pricing,
    isValid,
    validationErrors,
    formatCurrency,
    formatPercentage,
    formatInstallment,
    calculatePreview
  };
};