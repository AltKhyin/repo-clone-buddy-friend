// ABOUTME: Payment routing logic to determine subscription vs one-time payment flows based on plan configuration

import { Database } from '@/integrations/supabase/types';

type PaymentPlan = Database['public']['Tables']['PaymentPlans']['Row'];

/**
 * Payment flow types supported by the system
 */
export type PaymentFlowType = 'subscription' | 'one-time';

/**
 * Resolved plan pricing information with routing decision
 */
export interface ResolvedPlanPricing {
  // Basic plan info
  planId: string;
  name: string;
  description: string;
  
  // Pricing details  
  amount: number;
  finalAmount: number;
  hasPromotion: boolean;
  
  // Flow routing
  flowType: PaymentFlowType;
  
  // Subscription-specific
  interval?: 'day' | 'week' | 'month' | 'year';
  intervalCount?: number;
  
  // Metadata for tracking
  metadata: {
    originalAmount: number;
    promotional: boolean;
    planName: string;
    promotionalName?: string;
    discountAmount?: number;
    discountPercentage?: number;
  };
}

/**
 * Analyzes a PaymentPlan and determines the correct payment flow
 */
export function analyzePaymentFlow(plan: PaymentPlan): PaymentFlowType {
  // Direct mapping based on plan type
  if (plan.type === 'subscription' && plan.billing_interval) {
    return 'subscription';
  }
  
  if (plan.type === 'one-time') {
    return 'one-time';
  }
  
  // Fallback for edge cases - if no billing_interval, treat as one-time
  if (!plan.billing_interval) {
    console.warn(`Plan ${plan.id} has type '${plan.type}' but no billing_interval. Treating as one-time.`);
    return 'one-time';
  }
  
  // Default to subscription if type is subscription
  return 'subscription';
}

/**
 * Maps EVIDENS billing intervals to pagar.me intervals
 */
export function mapBillingInterval(billingInterval: string | null): {
  interval: 'day' | 'week' | 'month' | 'year';
  intervalCount: number;
} {
  switch (billingInterval) {
    case 'day':
      return { interval: 'day', intervalCount: 1 };
    case 'week':
      return { interval: 'week', intervalCount: 1 };
    case 'month':
      return { interval: 'month', intervalCount: 1 };
    case 'year':
      return { interval: 'year', intervalCount: 1 };
    default:
      console.warn(`Unknown billing interval: ${billingInterval}. Defaulting to monthly.`);
      return { interval: 'month', intervalCount: 1 };
  }
}

/**
 * Resolves promotional pricing using the new finalPrice system
 */
function resolvePromotionalPricing(plan: PaymentPlan): {
  finalAmount: number;
  hasPromotion: boolean;
  promotionalName?: string;
  discountAmount?: number;
  discountPercentage?: number;
} {
  const originalAmount = plan.amount;
  const promotionalConfig = plan.promotional_config as any;
  
  // Check if promotion is active and not expired
  if (!promotionalConfig?.isActive) {
    return {
      finalAmount: originalAmount,
      hasPromotion: false
    };
  }
  
  // Check expiration
  if (promotionalConfig.expiresAt) {
    const expirationDate = new Date(promotionalConfig.expiresAt);
    const now = new Date();
    
    if (now > expirationDate) {
      return {
        finalAmount: originalAmount,
        hasPromotion: false
      };
    }
  }
  
  // Use new finalPrice system if available
  if (promotionalConfig.finalPrice && promotionalConfig.finalPrice > 0) {
    const finalAmount = promotionalConfig.finalPrice;
    const discountAmount = originalAmount - finalAmount;
    const discountPercentage = Math.round((discountAmount / originalAmount) * 100);
    
    return {
      finalAmount,
      hasPromotion: true,
      promotionalName: promotionalConfig.customName || undefined,
      discountAmount,
      discountPercentage
    };
  }
  
  // Fallback to legacy promotional system
  if (promotionalConfig.promotionValue) {
    const finalAmount = originalAmount - promotionalConfig.promotionValue;
    const discountAmount = promotionalConfig.promotionValue;
    const discountPercentage = Math.round((discountAmount / originalAmount) * 100);
    
    return {
      finalAmount: Math.max(finalAmount, 50), // Minimum 50 cents
      hasPromotion: true,
      promotionalName: promotionalConfig.customName || undefined,
      discountAmount,
      discountPercentage
    };
  }
  
  // No valid promotion found
  return {
    finalAmount: originalAmount,
    hasPromotion: false
  };
}

/**
 * Resolves complete plan pricing and routing information
 */
export function resolvePlanPricingAndFlow(plan: PaymentPlan): ResolvedPlanPricing {
  // Analyze payment flow type
  const flowType = analyzePaymentFlow(plan);
  
  // Resolve promotional pricing
  const pricingInfo = resolvePromotionalPricing(plan);
  
  // Get billing interval info for subscriptions
  let interval: 'day' | 'week' | 'month' | 'year' | undefined;
  let intervalCount: number | undefined;
  
  if (flowType === 'subscription') {
    const billingInfo = mapBillingInterval(plan.billing_interval);
    interval = billingInfo.interval;
    intervalCount = billingInfo.intervalCount;
  }
  
  // Build display name
  const displayName = pricingInfo.promotionalName || plan.name;
  const description = pricingInfo.hasPromotion 
    ? `${displayName} - Promoção até ${new Date((plan.promotional_config as any)?.expiresAt || new Date()).toLocaleDateString()}`
    : displayName;
  
  return {
    planId: plan.id,
    name: displayName,
    description,
    amount: plan.amount,
    finalAmount: pricingInfo.finalAmount,
    hasPromotion: pricingInfo.hasPromotion,
    flowType,
    interval,
    intervalCount,
    metadata: {
      originalAmount: plan.amount,
      promotional: pricingInfo.hasPromotion,
      planName: plan.name,
      promotionalName: pricingInfo.promotionalName,
      discountAmount: pricingInfo.discountAmount,
      discountPercentage: pricingInfo.discountPercentage
    }
  };
}

/**
 * Payment routing decision matrix for debugging and analytics
 */
export interface PaymentRoutingAnalysis {
  totalPlans: number;
  subscriptionPlans: number;
  oneTimePlans: number;
  promotionalPlans: number;
  expiredPromotions: number;
  billingIntervals: Record<string, number>;
  avgAmounts: {
    subscription: number;
    oneTime: number;
  };
}

/**
 * Analyzes all plans and provides routing statistics
 */
export function analyzePaymentRouting(plans: PaymentPlan[]): PaymentRoutingAnalysis {
  const analysis: PaymentRoutingAnalysis = {
    totalPlans: plans.length,
    subscriptionPlans: 0,
    oneTimePlans: 0,
    promotionalPlans: 0,
    expiredPromotions: 0,
    billingIntervals: {},
    avgAmounts: {
      subscription: 0,
      oneTime: 0
    }
  };
  
  let subscriptionTotal = 0;
  let oneTimeTotal = 0;
  
  plans.forEach(plan => {
    const resolved = resolvePlanPricingAndFlow(plan);
    
    // Count flow types
    if (resolved.flowType === 'subscription') {
      analysis.subscriptionPlans++;
      subscriptionTotal += resolved.finalAmount;
      
      // Count billing intervals
      const intervalKey = plan.billing_interval || 'null';
      analysis.billingIntervals[intervalKey] = (analysis.billingIntervals[intervalKey] || 0) + 1;
    } else {
      analysis.oneTimePlans++;
      oneTimeTotal += resolved.finalAmount;
    }
    
    // Count promotions
    if (resolved.hasPromotion) {
      analysis.promotionalPlans++;
    }
    
    // Check for expired promotions
    const promotionalConfig = plan.promotional_config as any;
    if (promotionalConfig?.isActive && promotionalConfig.expiresAt) {
      const expirationDate = new Date(promotionalConfig.expiresAt);
      const now = new Date();
      
      if (now > expirationDate) {
        analysis.expiredPromotions++;
      }
    }
  });
  
  // Calculate averages
  analysis.avgAmounts.subscription = analysis.subscriptionPlans > 0 
    ? Math.round(subscriptionTotal / analysis.subscriptionPlans) 
    : 0;
    
  analysis.avgAmounts.oneTime = analysis.oneTimePlans > 0 
    ? Math.round(oneTimeTotal / analysis.oneTimePlans) 
    : 0;
  
  return analysis;
}