// ABOUTME: V2.0 Payment system TypeScript type definitions with complete V1 isolation

import { Database } from '@/integrations/supabase/types';

// =============================================================================
// DATABASE TYPES (Generated from Supabase)
// =============================================================================

export type PaymentPlanV2Row = Database['public']['Tables']['paymentplansv2']['Row'];
export type PaymentPlanV2Insert = Database['public']['Tables']['paymentplansv2']['Insert'];
export type PaymentPlanV2Update = Database['public']['Tables']['paymentplansv2']['Update'];

// =============================================================================
// CONFIGURATION TYPES (JSON Schema Definitions)
// =============================================================================

/**
 * Installment configuration for credit card payments
 */
export interface InstallmentConfigV2 {
  enabled: boolean;
  options: Array<{
    installments: number;
    feeRate: number; // Percentage (e.g., 0.0299 for 2.99%)
    description?: string;
  }>;
  maxInstallments?: number;
  minAmountForInstallments?: number; // Minimum amount in cents to enable installments
}

/**
 * Discount configuration for pre-request calculation - Simplified
 */
export interface DiscountConfigV2 {
  enabled: boolean;
  type: 'percentage' | 'fixed_amount';
  
  // Percentage discount (e.g., 0.15 for 15% off)
  percentage?: number;
  
  // Fixed amount discount in cents
  fixedAmount?: number;
}

/**
 * PIX payment specific configuration - Simplified (PIX always enabled and free)
 */
export interface PixConfigV2 {
  enabled: boolean; // Always true
  expirationMinutes: number; // Default: 60
  baseFeeRate: number; // Always 0 (PIX is free)
  discountPercentage: number; // Always 0 (no additional PIX discounts)
}

/**
 * Credit card payment specific configuration
 */
export interface CreditCardConfigV2 {
  enabled: boolean;
  acceptedBrands?: Array<'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard'>;
  requireCvv?: boolean;
  requireBillingAddress?: boolean;
  antifraudEnabled?: boolean;
}

/**
 * Visual customization configuration - Simplified (minimal promotional features)
 */
export interface PromotionalConfigV2 {
  // Basic promotional settings only
  isActive: boolean;
}

/**
 * Display configuration for plan presentation - Simplified
 */
export interface DisplayConfigV2 {
  // Basic display options only
  showDiscountAmount: boolean;
  showSavingsAmount: boolean;
}

// =============================================================================
// PRICING CALCULATION TYPES
// =============================================================================

/**
 * Individual installment option with fees
 */
export interface InstallmentOption {
  installments: number;
  feeRate: number;
  totalAmount: number;
  installmentAmount: number;
  totalFees: number;
}

/**
 * Complete pricing calculation result (updated for V2.0)
 */
export interface PricingCalculationResult {
  baseAmount: number;
  discountAmount: number;
  finalAmount: number;
  installmentOptions: InstallmentOption[];
  pixDiscount: {
    amount: number;
    percentage: number;
  };
  pixFinalAmount: number;
  savings: {
    amount: number;
    percentage: number;
  };
  metadata: {
    hasDiscount: boolean;
    hasPixDiscount: boolean;
    pixBaseFee?: number;
    pixBaseFeeRate?: number;
    maxInstallments: number;
    minInstallmentValue: number;
    calculatedAt: string;
  };
}

/**
 * Pre-request pricing calculation result
 */
export interface PricingCalculationV2 {
  baseAmount: number; // Original price in cents
  discountAmount: number; // Total discount in cents
  finalAmount: number; // Final price after discount in cents
  
  // Installment pricing (if applicable)
  installmentPricing?: {
    installments: number;
    installmentAmount: number; // Per installment in cents
    totalAmount: number; // Total with fees in cents
    feeAmount: number; // Total fee in cents
    feeRate: number; // Fee percentage
  };
  
  // PIX pricing (if applicable)
  pixPricing?: {
    finalAmount: number; // May include additional PIX discount
    pixDiscountAmount?: number;
  };
  
  // Metadata for display and API calls
  metadata: {
    currencyCode: string;
    calculatedAt: string; // ISO timestamp
    discountApplied: boolean;
    installmentFeesApplied: boolean;
  };
}

/**
 * Pricing calculator input parameters
 */
export interface PricingCalculatorInput {
  paymentPlan: PaymentPlanV2Row;
  paymentMethod: 'pix' | 'credit_card';
  installments?: number; // Only for credit card
  promotionalCode?: string;
  userContext?: {
    userId?: string;
    isFirstPurchase?: boolean;
  };
}

// =============================================================================
// FORM DATA TYPES
// =============================================================================

/**
 * Payment plan creation/editing form data
 */
export interface PaymentPlanV2FormData {
  // Basic plan information
  name: string;
  description?: string;
  planType: 'premium'; // Always premium in simplified version
  durationDays: number;
  
  // Pricing
  baseAmount: number; // In cents
  finalAmount?: number; // Calculated based on discounts
  
  // Configuration objects
  installmentConfig: InstallmentConfigV2;
  discountConfig: DiscountConfigV2;
  pixConfig: PixConfigV2;
  creditCardConfig: CreditCardConfigV2;
  
  // Visual customization configurations
  promotionalConfig: PromotionalConfigV2;
  displayConfig: DisplayConfigV2;
  
  // Plan settings
  isActive?: boolean;
  slug?: string;
  
  // Custom URL parameter for direct linking
  customLinkParameter?: string;
}

/**
 * Payment plan search/filter parameters
 */
export interface PaymentPlanV2Filters {
  isActive?: boolean;
  searchQuery?: string; // Search in name/description
  createdAfter?: string; // ISO date
  createdBefore?: string; // ISO date
  minAmount?: number;
  maxAmount?: number;
}

// =============================================================================
// API TYPES (Integration with existing pagarme-v2.ts)
// =============================================================================

/**
 * Enhanced request data for V2 payment processing
 */
export interface PaymentRequestV2Data {
  planId: string;
  paymentMethod: 'pix' | 'credit_card';
  
  // Customer data (from existing PaymentV2Form)
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  customerPhone: string;
  
  // Address data (for credit card)
  billingAddress?: {
    street: string;
    zipCode: string;
    city: string;
    state: string;
  };
  
  // Credit card specific
  creditCardData?: {
    cardNumber: string;
    cardName: string;
    cardExpiry: string;
    cardCvv: string;
    installments: number;
  };
  
  // Pre-calculated pricing (V2 enhancement)
  pricingResult: PricingCalculationV2;
  
  // Promotional code (if used)
  promotionalCode?: string;
}

/**
 * V2 Payment processing response
 */
export interface PaymentResponseV2Data {
  success: boolean;
  paymentId: string;
  planId: string;
  paymentMethod: 'pix' | 'credit_card';
  
  // Payment-specific data
  pixData?: {
    qrCode: string;
    qrCodeUrl: string;
    expiresAt: string;
  };
  
  creditCardData?: {
    status: 'approved' | 'pending' | 'refused';
    installments?: number;
    cardBrand?: string;
    cardLastDigits?: string;
  };
  
  // Financial data
  amountPaid: number; // In cents
  finalAmount: number; // In cents
  discountApplied?: number; // In cents
  
  // Metadata
  processedAt: string; // ISO timestamp
  reference: string; // Internal reference
}

// =============================================================================
// HOOK RETURN TYPES
// =============================================================================

/**
 * usePaymentPlansV2 hook return type
 */
export interface UsePaymentPlansV2Result {
  // Data
  plans: PaymentPlanV2Row[];
  activePlans: PaymentPlanV2Row[];
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error handling
  error: Error | null;
  
  // Actions
  createPlan: (data: PaymentPlanV2FormData) => Promise<PaymentPlanV2Row>;
  updatePlan: (id: string, data: Partial<PaymentPlanV2FormData>) => Promise<PaymentPlanV2Row>;
  deletePlan: (id: string) => Promise<void>;
  togglePlan: (id: string, isActive: boolean) => Promise<PaymentPlanV2Row>;
  
  // Utilities
  getPlanById: (id: string) => PaymentPlanV2Row | undefined;
  getPlanBySlug: (slug: string) => PaymentPlanV2Row | undefined;
  refetch: () => Promise<void>;
}

/**
 * usePaymentPricingV2 hook return type
 */
export interface UsePaymentPricingV2Result {
  // Current calculation
  pricing: PricingCalculationV2 | null;
  
  // Loading state
  isCalculating: boolean;
  
  // Error handling
  error: Error | null;
  
  // Actions
  calculatePricing: (input: PricingCalculatorInput) => Promise<PricingCalculationV2>;
  clearPricing: () => void;
  
  // Utilities
  formatPrice: (amountInCents: number) => string;
  formatInstallments: (installments: number, amount: number) => string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Payment plan status for UI display
 */
export type PaymentPlanV2Status = 'active' | 'inactive' | 'draft' | 'archived';

/**
 * Supported payment methods in V2 system
 */
export type PaymentMethodV2 = 'pix' | 'credit_card';

/**
 * Available installment options (aligned with pagarme-v2.ts)
 */
export type InstallmentOptionV2 = 1 | 3 | 6 | 12;

/**
 * Plan type categories
 */
export type PlanTypeV2 = 'premium' | 'basic' | 'custom';

/**
 * Currency formatting options
 */
export interface CurrencyFormatOptions {
  locale?: string; // Default: 'pt-BR'
  currency?: string; // Default: 'BRL'
  minimumFractionDigits?: number; // Default: 2
  maximumFractionDigits?: number; // Default: 2
}

// =============================================================================
// VALIDATION SCHEMAS (for use with Zod)
// =============================================================================

/**
 * Validation error type for form handling
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Form validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: PaymentPlanV2FormData;
}

// =============================================================================
// COMPONENT PROPS TYPES
// =============================================================================

/**
 * PaymentPlanV2Card component props
 */
export interface PaymentPlanV2CardProps {
  plan: PaymentPlanV2Row;
  onEdit: (plan: PaymentPlanV2Row) => void;
  onDelete: (planId: string) => void;
  onToggle: (planId: string, isActive: boolean) => void;
  onDuplicate?: (plan: PaymentPlanV2Row) => void;
  showActions?: boolean;
  isLoading?: boolean;
}

/**
 * PricingCalculatorV2 component props
 */
export interface PricingCalculatorV2Props {
  plan: PaymentPlanV2Row;
  paymentMethod: PaymentMethodV2;
  installments?: InstallmentOptionV2;
  promotionalCode?: string;
  onPricingChange?: (pricing: PricingCalculationV2) => void;
  showBreakdown?: boolean;
  className?: string;
}

/**
 * PaymentPlanV2Form component props
 */
export interface PaymentPlanV2FormProps {
  plan?: PaymentPlanV2Row; // For editing
  onSubmit: (data: PaymentPlanV2FormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit' | 'duplicate';
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * V2 Payment system specific errors
 */
export type PaymentV2ErrorCode = 
  | 'INVALID_PLAN'
  | 'PRICING_CALCULATION_FAILED'
  | 'DISCOUNT_EXPIRED'
  | 'PROMOTIONAL_CODE_INVALID'
  | 'INSTALLMENT_NOT_ALLOWED'
  | 'PAYMENT_METHOD_DISABLED'
  | 'AMOUNT_BELOW_MINIMUM'
  | 'DATABASE_ERROR'
  | 'VALIDATION_ERROR';

export interface PaymentV2Error extends Error {
  code: PaymentV2ErrorCode;
  details?: Record<string, unknown>;
  timestamp: string;
}

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================

export type {
  // Database types
  PaymentPlanV2Row as PaymentPlanV2,
  PaymentPlanV2Insert,
  PaymentPlanV2Update,
  
  // Configuration types
  InstallmentConfigV2,
  DiscountConfigV2,
  PixConfigV2,
  CreditCardConfigV2,
  PromotionalConfigV2,
  DisplayConfigV2,
  
  // Pricing types
  PricingCalculationV2,
  PricingCalculatorInput,
  
  // Form types
  PaymentPlanV2FormData,
  PaymentPlanV2Filters,
  
  // API types
  PaymentRequestV2Data,
  PaymentResponseV2Data,
  
  // Hook types
  UsePaymentPlansV2Result,
  UsePaymentPricingV2Result,
  
  // Utility types
  PaymentPlanV2Status,
  PaymentMethodV2,
  InstallmentOptionV2,
  PlanTypeV2,
  CurrencyFormatOptions,
  
  // Validation types
  ValidationError,
  ValidationResult,
  
  // Component props types
  PaymentPlanV2CardProps,
  PricingCalculatorV2Props,
  PaymentPlanV2FormProps,
  
  // Error types
  PaymentV2ErrorCode,
  PaymentV2Error,
};