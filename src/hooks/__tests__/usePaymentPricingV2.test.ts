// ABOUTME: TDD tests for usePaymentPricingV2 hook ensuring accurate pricing calculations

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  usePaymentPricingV2,
  calculateDiscount,
  calculateFinalAmount,
  calculateInstallmentOptions,
  calculatePixDiscount,
  calculateCompletePricing,
  validatePricingConfig
} from '../usePaymentPricingV2';
import type { PaymentPlanV2Row, DiscountConfigV2, InstallmentConfigV2 } from '@/types/paymentV2.types';

// =============================================================================
// MOCK DATA
// =============================================================================

const mockBasicPlan: PaymentPlanV2Row = {
  id: '1',
  name: 'Basic Plan',
  description: 'Test plan',
  base_amount: 1000, // R$ 10.00
  final_amount: 1000,
  plan_type: 'premium',
  duration_days: 365,
  installment_config: {
    enabled: true,
    options: [
      { installments: 1, feeRate: 0.0299 },
      { installments: 3, feeRate: 0.0699 }
    ]
  },
  discount_config: null,
  pix_config: {
    enabled: true,
    discountPercentage: 0.05 // 5% PIX discount
  },
  credit_card_config: {
    enabled: true,
    requireCvv: true
  },
  is_active: true,
  slug: 'basic-plan',
  usage_count: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  created_by: null
};

const mockDiscountConfig: DiscountConfigV2 = {
  enabled: true,
  type: 'percentage',
  percentage: 0.20 // 20% discount
};

const mockFixedDiscountConfig: DiscountConfigV2 = {
  enabled: true,
  type: 'fixed_amount',
  fixedAmount: 200 // R$ 2.00 discount
};

const mockBulkDiscountConfig: DiscountConfigV2 = {
  enabled: true,
  type: 'bulk_discount',
  bulkThresholds: [
    { minimumAmount: 500, discountPercentage: 0.10 },
    { minimumAmount: 1000, discountPercentage: 0.15 },
    { minimumAmount: 2000, discountPercentage: 0.20 }
  ]
};

// =============================================================================
// DISCOUNT CALCULATION TESTS
// =============================================================================

describe('calculateDiscount', () => {
  it('should return 0 when discount is disabled', () => {
    const result = calculateDiscount(1000, { enabled: false, type: 'percentage' });
    expect(result).toBe(0);
  });

  it('should return 0 when discount config is null', () => {
    const result = calculateDiscount(1000, null);
    expect(result).toBe(0);
  });

  it('should calculate percentage discount correctly', () => {
    const result = calculateDiscount(1000, mockDiscountConfig);
    expect(result).toBe(200); // 20% of 1000 = 200
  });

  it('should calculate fixed amount discount correctly', () => {
    const result = calculateDiscount(1000, mockFixedDiscountConfig);
    expect(result).toBe(200); // Fixed R$ 2.00
  });

  it('should calculate bulk discount correctly', () => {
    const result = calculateDiscount(1000, mockBulkDiscountConfig);
    expect(result).toBe(150); // 15% of 1000 for bulk threshold
  });

  it('should apply highest bulk discount threshold', () => {
    const result = calculateDiscount(2500, mockBulkDiscountConfig);
    expect(result).toBe(500); // 20% of 2500 = 500
  });

  it('should not exceed minimum plan value with fixed discount', () => {
    const largeFixedDiscount: DiscountConfigV2 = {
      enabled: true,
      type: 'fixed_amount',
      fixedAmount: 950 // Almost the full amount
    };
    const result = calculateDiscount(1000, largeFixedDiscount);
    expect(result).toBe(900); // Limited to leave minimum 100 cents
  });
});

// =============================================================================
// FINAL AMOUNT CALCULATION TESTS
// =============================================================================

describe('calculateFinalAmount', () => {
  it('should return base amount when no discount', () => {
    const result = calculateFinalAmount(1000, null);
    expect(result).toBe(1000);
  });

  it('should apply percentage discount correctly', () => {
    const result = calculateFinalAmount(1000, mockDiscountConfig);
    expect(result).toBe(800); // 1000 - 200 = 800
  });

  it('should enforce minimum plan value', () => {
    const extremeDiscount: DiscountConfigV2 = {
      enabled: true,
      type: 'fixed_amount',
      fixedAmount: 999
    };
    const result = calculateFinalAmount(1000, extremeDiscount);
    expect(result).toBe(100); // Minimum value enforced
  });
});

// =============================================================================
// INSTALLMENT CALCULATION TESTS
// =============================================================================

describe('calculateInstallmentOptions', () => {
  it('should return single payment when installments disabled', () => {
    const result = calculateInstallmentOptions(1000, { enabled: false, options: [] });
    expect(result).toHaveLength(1);
    expect(result[0].installments).toBe(1);
    expect(result[0].feeRate).toBe(0.0299);
  });

  it('should return single payment when config is null', () => {
    const result = calculateInstallmentOptions(1000, null);
    expect(result).toHaveLength(1);
    expect(result[0].installments).toBe(1);
  });

  it('should calculate installment options correctly', () => {
    const config: InstallmentConfigV2 = {
      enabled: true,
      options: [
        { installments: 1, feeRate: 0.0299 },
        { installments: 3, feeRate: 0.0699 }
      ]
    };
    
    const result = calculateInstallmentOptions(1000, config);
    expect(result).toHaveLength(2);
    
    // 1x payment
    expect(result[0].installments).toBe(1);
    expect(result[0].totalAmount).toBe(1030); // 1000 + 2.99% = 1029.9 ≈ 1030
    expect(result[0].installmentAmount).toBe(1030);
    
    // 3x payment
    expect(result[1].installments).toBe(3);
    expect(result[1].totalAmount).toBe(1070); // 1000 + 6.99% = 1069.9 ≈ 1070
    expect(result[1].installmentAmount).toBe(357); // 1070 / 3 ≈ 357
  });

  it('should filter out installments below minimum value', () => {
    const config: InstallmentConfigV2 = {
      enabled: true,
      options: [
        { installments: 1, feeRate: 0.0299 },
        { installments: 12, feeRate: 0.1499 } // This should be filtered out for small amounts
      ]
    };
    
    const result = calculateInstallmentOptions(100, config); // R$ 1.00
    expect(result).toHaveLength(1); // Only 1x should remain
    expect(result[0].installments).toBe(1);
  });

  it('should sort installment options by installment count', () => {
    const config: InstallmentConfigV2 = {
      enabled: true,
      options: [
        { installments: 6, feeRate: 0.0999 },
        { installments: 1, feeRate: 0.0299 },
        { installments: 3, feeRate: 0.0699 }
      ]
    };
    
    const result = calculateInstallmentOptions(2000, config);
    expect(result[0].installments).toBe(1);
    expect(result[1].installments).toBe(3);
    expect(result[2].installments).toBe(6);
  });
});

// =============================================================================
// PIX DISCOUNT TESTS
// =============================================================================

describe('calculatePixDiscount', () => {
  it('should return zero discount when PIX disabled', () => {
    const result = calculatePixDiscount(1000, { enabled: false });
    expect(result.amount).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it('should calculate PIX discount correctly', () => {
    const result = calculatePixDiscount(1000, { 
      enabled: true, 
      discountPercentage: 0.05 
    });
    expect(result.amount).toBe(50); // 5% of 1000
    expect(result.percentage).toBe(0.05);
  });

  it('should limit PIX discount to maximum 15%', () => {
    const result = calculatePixDiscount(1000, { 
      enabled: true, 
      discountPercentage: 0.25 // 25% requested
    });
    expect(result.percentage).toBe(0.15); // Limited to 15%
    expect(result.amount).toBe(150); // 15% of 1000
  });
});

// =============================================================================
// COMPLETE PRICING CALCULATION TESTS
// =============================================================================

describe('calculateCompletePricing', () => {
  it('should calculate complete pricing for basic plan', () => {
    const result = calculateCompletePricing(mockBasicPlan);
    
    expect(result.baseAmount).toBe(1000);
    expect(result.discountAmount).toBe(0); // No discount configured
    expect(result.finalAmount).toBe(1000);
    expect(result.pixDiscount.amount).toBe(50); // 5% PIX discount
    expect(result.pixFinalAmount).toBe(950); // 1000 - 50
    expect(result.installmentOptions).toHaveLength(2);
    expect(result.metadata.hasDiscount).toBe(false);
    expect(result.metadata.hasPixDiscount).toBe(true);
  });

  it('should calculate complete pricing with percentage discount', () => {
    const planWithDiscount: PaymentPlanV2Row = {
      ...mockBasicPlan,
      discount_config: mockDiscountConfig
    };
    
    const result = calculateCompletePricing(planWithDiscount);
    
    expect(result.baseAmount).toBe(1000);
    expect(result.discountAmount).toBe(200); // 20% discount
    expect(result.finalAmount).toBe(800);
    expect(result.pixDiscount.amount).toBe(40); // 5% of 800
    expect(result.pixFinalAmount).toBe(760); // 800 - 40
    expect(result.savings.amount).toBe(240); // 200 + 40
    expect(result.savings.percentage).toBe(0.24); // 24% total savings
    expect(result.metadata.hasDiscount).toBe(true);
  });
});

// =============================================================================
// VALIDATION TESTS
// =============================================================================

describe('validatePricingConfig', () => {
  it('should validate plan with no errors', () => {
    const errors = validatePricingConfig(mockBasicPlan);
    expect(errors).toHaveLength(0);
  });

  it('should catch base amount too low', () => {
    const invalidPlan: PaymentPlanV2Row = {
      ...mockBasicPlan,
      base_amount: 50 // Below minimum
    };
    
    const errors = validatePricingConfig(invalidPlan);
    expect(errors).toContain(expect.stringContaining('Valor base deve ser pelo menos'));
  });

  it('should catch invalid percentage discount', () => {
    const invalidPlan: PaymentPlanV2Row = {
      ...mockBasicPlan,
      discount_config: {
        enabled: true,
        type: 'percentage',
        percentage: 1.5 // 150% - invalid
      }
    };
    
    const errors = validatePricingConfig(invalidPlan);
    expect(errors).toContain('Desconto percentual deve estar entre 0% e 100%');
  });

  it('should catch fixed discount equal to base amount', () => {
    const invalidPlan: PaymentPlanV2Row = {
      ...mockBasicPlan,
      discount_config: {
        enabled: true,
        type: 'fixed_amount',
        fixedAmount: 1000 // Equal to base amount
      }
    };
    
    const errors = validatePricingConfig(invalidPlan);
    expect(errors).toContain('Desconto não pode ser maior ou igual ao valor base');
  });
});

// =============================================================================
// HOOK TESTS
// =============================================================================

describe('usePaymentPricingV2', () => {
  it('should return null pricing when plan is null', () => {
    const { result } = renderHook(() => usePaymentPricingV2({ 
      plan: null 
    }));
    
    expect(result.current.pricing).toBeNull();
    expect(result.current.isValid).toBe(true); // No validation errors
    expect(result.current.validationErrors).toHaveLength(0);
  });

  it('should calculate pricing when plan is provided', () => {
    const { result } = renderHook(() => usePaymentPricingV2({ 
      plan: mockBasicPlan 
    }));
    
    expect(result.current.pricing).not.toBeNull();
    expect(result.current.pricing!.baseAmount).toBe(1000);
    expect(result.current.pricing!.finalAmount).toBe(1000);
    expect(result.current.isValid).toBe(true);
  });

  it('should not auto-calculate when disabled', () => {
    const { result } = renderHook(() => usePaymentPricingV2({ 
      plan: mockBasicPlan,
      autoCalculate: false
    }));
    
    expect(result.current.pricing).toBeNull();
  });

  it('should provide formatting utilities', () => {
    const { result } = renderHook(() => usePaymentPricingV2({ 
      plan: mockBasicPlan 
    }));
    
    expect(result.current.formatCurrency(1000)).toBe('R$ 10,00');
    expect(result.current.formatPercentage(0.15)).toBe('15,0%');
  });

  it('should calculate preview with overrides', () => {
    const { result } = renderHook(() => usePaymentPricingV2({ 
      plan: mockBasicPlan 
    }));
    
    const preview = result.current.calculatePreview({
      base_amount: 2000,
      discount_config: mockDiscountConfig
    });
    
    expect(preview).not.toBeNull();
    expect(preview!.baseAmount).toBe(2000);
    expect(preview!.discountAmount).toBe(400); // 20% of 2000
    expect(preview!.finalAmount).toBe(1600);
  });

  it('should detect validation errors', () => {
    const invalidPlan: PaymentPlanV2Row = {
      ...mockBasicPlan,
      base_amount: 50 // Invalid
    };
    
    const { result } = renderHook(() => usePaymentPricingV2({ 
      plan: invalidPlan 
    }));
    
    expect(result.current.isValid).toBe(false);
    expect(result.current.validationErrors.length).toBeGreaterThan(0);
  });
});