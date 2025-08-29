# Coupons & Promotional Pricing

## Overview

Pagar.me supports flexible discount and increment systems for both one-time payments and recurring subscriptions. This enables sophisticated promotional campaigns and pricing strategies.

## Discount System

### Discount Types

```typescript
interface Discount {
  discount_type: 'percentage' | 'amount';
  value: number;                 // Percentage (1-100) or amount in cents
  cycles?: number;              // Number of billing cycles to apply
}

interface Increment {
  increment_type: 'percentage' | 'amount';  
  value: number;
  cycles?: number;
}
```

### Percentage Discounts

```typescript
// Welcome promotion: 50% off first month
const welcomeDiscount: Discount = {
  discount_type: 'percentage',
  value: 50,
  cycles: 1                      // Only first billing cycle
};

// Student discount: 20% off for 6 months
const studentDiscount: Discount = {
  discount_type: 'percentage', 
  value: 20,
  cycles: 6
};

// Loyalty discount: 10% off forever
const loyaltyDiscount: Discount = {
  discount_type: 'percentage',
  value: 10
  // No cycles = applies to all future billing cycles
};
```

### Fixed Amount Discounts

```typescript
// Fixed discount examples
const newCustomerDiscount: Discount = {
  discount_type: 'amount',
  value: 1000,                   // R$ 10.00 off
  cycles: 3                      // First 3 months
};

// Holiday promotion: R$ 25 off annual plan
const holidayDiscount: Discount = {
  discount_type: 'amount', 
  value: 2500,                   // R$ 25.00 off
  cycles: 1                      // One-time discount
};
```

## Price Increments

### Graduated Pricing

```typescript
// Price increase after promotional period
const promotionalIncrement: Increment = {
  increment_type: 'percentage',
  value: 25,                     // 25% increase 
  cycles: 12                     // After 12 months of discounted pricing
};

// Annual price adjustment
const annualAdjustment: Increment = {
  increment_type: 'amount',
  value: 500,                    // R$ 5.00 increase
  cycles: 12                     // Every 12 months
};
```

## Coupon Management System

### EVIDENS Coupon Implementation

```typescript
interface EvidensCoupon {
  code: string;                  // Coupon code (e.g., "WELCOME2024")
  type: 'percentage' | 'fixed_amount';
  value: number;
  max_uses?: number;             // Usage limit
  expires_at?: string;           // Expiration date
  applies_to: 'all' | 'specific_plans' | 'first_payment_only';
  plan_ids?: string[];           // If applies_to is 'specific_plans'
  minimum_amount?: number;       // Minimum order amount required
  user_limit?: number;          // Max uses per customer
  metadata?: {
    campaign_name?: string;
    created_by?: string;
    target_audience?: string;
  };
}

// Coupon validation and application
export const applyCoupon = async (
  couponCode: string, 
  subscriptionData: any
): Promise<{ discount: Discount; isValid: boolean }> => {
  
  // Validate coupon exists and is active
  const coupon = await validateCoupon(couponCode);
  
  if (!coupon.isValid) {
    throw new Error('Invalid or expired coupon code');
  }
  
  // Apply usage restrictions
  if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
    throw new Error('Coupon usage limit exceeded');
  }
  
  // Check minimum amount requirement
  if (coupon.minimum_amount && subscriptionData.amount < coupon.minimum_amount) {
    throw new Error(`Minimum order amount of R$ ${coupon.minimum_amount / 100} required`);
  }
  
  // Convert to Pagar.me discount format
  const discount: Discount = {
    discount_type: coupon.type === 'percentage' ? 'percentage' : 'amount',
    value: coupon.value,
    cycles: coupon.applies_to === 'first_payment_only' ? 1 : undefined
  };
  
  return { discount, isValid: true };
};
```

## Promotional Campaign Examples

### Black Friday Campaign

```typescript
const blackFridayCampaign = {
  coupons: [
    {
      code: 'BLACKFRIDAY50',
      type: 'percentage' as const,
      value: 50,
      expires_at: '2024-11-30T23:59:59Z',
      applies_to: 'all',
      max_uses: 1000,
      user_limit: 1,
      metadata: {
        campaign_name: 'Black Friday 2024',
        target_audience: 'general'
      }
    },
    {
      code: 'CYBER25',
      type: 'amount' as const,
      value: 2500,                 // R$ 25.00 off
      expires_at: '2024-12-02T23:59:59Z',
      applies_to: 'specific_plans',
      plan_ids: ['plan_premium', 'plan_enterprise'],
      minimum_amount: 5000,        // Minimum R$ 50.00
      metadata: {
        campaign_name: 'Cyber Monday 2024',
        target_audience: 'premium_prospects'
      }
    }
  ]
};
```

### Student & Educational Discounts

```typescript
const educationalPromotions = {
  student_discount: {
    discount_type: 'percentage',
    value: 30,                   // 30% off for students
    cycles: 12,                  // Full year discount
    verification_required: true,
    eligibility_check: async (email: string) => {
      // Check for educational email domains
      const eduDomains = ['.edu.br', '.edu', '.ac.br'];
      return eduDomains.some(domain => email.includes(domain));
    }
  },
  
  teacher_discount: {
    discount_type: 'percentage',
    value: 40,                   // 40% off for teachers
    verification_required: true,
    documentation_required: ['teaching_certificate', 'school_id']
  }
};
```

## Advanced Promotional Logic

### Dynamic Discount Calculation

```typescript
export const calculateDynamicDiscount = (
  customerData: PagarmeCustomer,
  planAmount: number,
  loyaltyTier: 'bronze' | 'silver' | 'gold'
): Discount[] => {
  
  const discounts: Discount[] = [];
  
  // First-time customer discount
  if (!customerData.metadata?.previous_subscriptions) {
    discounts.push({
      discount_type: 'percentage',
      value: 25,                 // 25% off first month
      cycles: 1
    });
  }
  
  // Loyalty tier discounts
  const loyaltyDiscounts = {
    bronze: 5,   // 5% ongoing discount
    silver: 10,  // 10% ongoing discount  
    gold: 15     // 15% ongoing discount
  };
  
  if (loyaltyTier !== 'bronze') {
    discounts.push({
      discount_type: 'percentage',
      value: loyaltyDiscounts[loyaltyTier]
      // No cycles = permanent discount
    });
  }
  
  // Large plan discount
  if (planAmount >= 10000) {  // Plans over R$ 100
    discounts.push({
      discount_type: 'amount',
      value: 1000,               // R$ 10.00 off
      cycles: 1
    });
  }
  
  return discounts;
};
```

### Referral Program Implementation

```typescript
interface ReferralDiscount {
  referrer_benefit: Discount;    // Benefit for existing customer
  referee_benefit: Discount;     // Benefit for new customer
  requirements: {
    min_active_months: number;
    max_referrals_per_month: number;
  };
}

const evidensReferralProgram: ReferralDiscount = {
  referrer_benefit: {
    discount_type: 'amount',
    value: 2490,                 // R$ 24.90 credit
    cycles: 1                    // One-time benefit
  },
  referee_benefit: {
    discount_type: 'percentage',
    value: 50,                   // 50% off first month
    cycles: 1
  },
  requirements: {
    min_active_months: 2,        // Referrer must be active 2+ months
    max_referrals_per_month: 5   // Limit abuse
  }
};

// Apply referral discount
export const applyReferralDiscount = async (
  referrerUserId: string,
  newSubscriptionData: any
) => {
  // Validate referrer eligibility
  const referrer = await validateReferrerEligibility(referrerUserId);
  
  if (!referrer.isEligible) {
    throw new Error('Referrer not eligible for program');
  }
  
  // Create subscription with referee discount
  const subscription = await createSubscription({
    ...newSubscriptionData,
    discounts: [evidensReferralProgram.referee_benefit],
    metadata: {
      ...newSubscriptionData.metadata,
      referral_code: referrer.code,
      referrer_user_id: referrerUserId
    }
  });
  
  // Apply referrer credit
  await applyReferrerCredit(referrerUserId, evidensReferralProgram.referrer_benefit);
  
  return subscription;
};
```

## Coupon Validation System

### Server-Side Validation

```typescript
// Edge Function for coupon validation
export const validateCouponCode = async (code: string, userId: string): Promise<CouponValidation> => {
  const { data: coupon } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();
    
  if (!coupon) {
    return { isValid: false, error: 'Coupon not found' };
  }
  
  // Check expiration
  if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
    return { isValid: false, error: 'Coupon has expired' };
  }
  
  // Check usage limits
  if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
    return { isValid: false, error: 'Coupon usage limit reached' };
  }
  
  // Check user usage limit
  const { count: userUsage } = await supabase
    .from('coupon_usage')
    .select('*', { count: 'exact' })
    .eq('coupon_code', code)
    .eq('user_id', userId);
    
  if (coupon.user_limit && userUsage >= coupon.user_limit) {
    return { isValid: false, error: 'User has exceeded coupon usage limit' };
  }
  
  return { 
    isValid: true, 
    coupon,
    discount: {
      discount_type: coupon.type,
      value: coupon.value,
      cycles: coupon.cycles
    }
  };
};
```

### Frontend Coupon Hook

```typescript
export const useCouponValidation = () => {
  return useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch('/api/v1/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      if (!response.ok) {
        throw new Error('Coupon validation failed');
      }
      
      return response.json();
    },
    retry: false  // Don't retry failed validations
  });
};

// Real-time coupon application
export const useApplyCoupon = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ code, subscriptionData }: ApplyCouponRequest) => {
      const validation = await validateCouponCode(code);
      
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      
      // Apply discount to subscription
      return {
        ...subscriptionData,
        discounts: [validation.discount],
        coupon_applied: {
          code,
          value: validation.coupon.value,
          type: validation.coupon.type
        }
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-preview'] });
    }
  });
};
```

## Business Rule Examples

### EVIDENS Promotional Strategies

```typescript
export class EvidensPromotions {
  
  // New user onboarding sequence
  static getOnboardingDiscount(registrationDate: Date): Discount[] {
    const daysSinceRegistration = Math.floor(
      (Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceRegistration <= 3) {
      // Early bird: 30% off if subscribe within 3 days
      return [{
        discount_type: 'percentage',
        value: 30,
        cycles: 2  // First 2 months
      }];
    }
    
    if (daysSinceRegistration <= 7) {
      // Standard welcome: 15% off first month
      return [{
        discount_type: 'percentage',
        value: 15,
        cycles: 1
      }];
    }
    
    return []; // No discount after 7 days
  }
  
  // Seasonal promotions
  static getSeasonalDiscount(): Discount | null {
    const now = new Date();
    const month = now.getMonth(); // 0-based
    
    // Black Friday (November)
    if (month === 10) {
      return {
        discount_type: 'percentage',
        value: 40,
        cycles: 1
      };
    }
    
    // Back to school (February)
    if (month === 1) {
      return {
        discount_type: 'percentage', 
        value: 25,
        cycles: 6  // Full semester
      };
    }
    
    return null;
  }
  
  // Win-back campaign for churned users
  static getWinBackOffer(monthsSinceChurn: number): Discount {
    if (monthsSinceChurn <= 3) {
      // Recent churn: generous offer
      return {
        discount_type: 'percentage',
        value: 60,
        cycles: 3
      };
    }
    
    if (monthsSinceChurn <= 12) {
      // Extended churn: standard offer  
      return {
        discount_type: 'percentage',
        value: 40,
        cycles: 2
      };
    }
    
    // Long-term churn: modest offer
    return {
      discount_type: 'percentage',
      value: 25,
      cycles: 1
    };
  }
}
```

### Subscription Pricing Strategies

```typescript
// Complex pricing model with multiple discount layers
export const createTieredSubscription = async (
  customerData: CustomerData,
  planTier: 'basic' | 'premium' | 'enterprise'
) => {
  
  const baseAmounts = {
    basic: 1990,      // R$ 19.90
    premium: 4990,    // R$ 49.90  
    enterprise: 9990  // R$ 99.90
  };
  
  const discounts: Discount[] = [];
  const increments: Increment[] = [];
  
  // Apply promotional pricing
  const seasonalDiscount = EvidensPromotions.getSeasonalDiscount();
  if (seasonalDiscount) {
    discounts.push(seasonalDiscount);
  }
  
  // Apply onboarding discount
  const onboardingDiscounts = EvidensPromotions.getOnboardingDiscount(
    new Date(customerData.created_at)
  );
  discounts.push(...onboardingDiscounts);
  
  // Apply annual price increase for enterprise
  if (planTier === 'enterprise') {
    increments.push({
      increment_type: 'percentage',
      value: 5,        // 5% annual increase
      cycles: 12       // After first year
    });
  }
  
  return await fetch('https://api.pagar.me/core/v5/subscriptions', {
    method: 'POST',
    headers: authenticatePagarme(PAGAR_ME_SECRET_KEY),
    body: JSON.stringify({
      customer_id: customerData.id,
      billing_type: 'prepaid',
      interval: 'month',
      interval_count: 1,
      items: [{
        description: `EVIDENS ${planTier.charAt(0).toUpperCase() + planTier.slice(1)}`,
        quantity: 1,
        pricing_scheme: {
          scheme_type: 'unit',
          price: baseAmounts[planTier]
        }
      }],
      discounts,
      increments,
      payment_method: 'credit_card',
      metadata: {
        plan_tier: planTier,
        promotions_applied: discounts.length,
        campaign_source: 'evidens_app'
      }
    })
  }).then(res => res.json());
};
```

## A/B Testing Framework

### Promotional Testing

```typescript
// A/B test different promotional offers
export const getPromotionalVariant = (userId: string): 'control' | 'variant_a' | 'variant_b' => {
  // Simple hash-based assignment
  const hash = hashUserId(userId);
  const bucket = hash % 3;
  
  switch (bucket) {
    case 0: return 'control';     // No discount
    case 1: return 'variant_a';   // 20% off first month
    case 2: return 'variant_b';   // R$ 15 off first month
    default: return 'control';
  }
};

export const getVariantDiscount = (variant: string): Discount | null => {
  const discounts = {
    control: null,
    variant_a: {
      discount_type: 'percentage' as const,
      value: 20,
      cycles: 1
    },
    variant_b: {
      discount_type: 'amount' as const,
      value: 1500,  // R$ 15.00
      cycles: 1
    }
  };
  
  return discounts[variant] || null;
};
```

## Validation & Security

### Coupon Security

```typescript
import { z } from 'zod';

export const couponValidationSchema = z.object({
  code: z.string()
    .min(3)
    .max(20)
    .regex(/^[A-Z0-9]+$/, 'Coupon codes must be uppercase letters and numbers only'),
    
  type: z.enum(['percentage', 'fixed_amount']),
  
  value: z.number()
    .min(1)
    .refine((val, ctx) => {
      if (ctx.parent.type === 'percentage' && val > 100) {
        throw new z.ZodError([{
          code: z.ZodIssueCode.custom,
          message: 'Percentage discounts cannot exceed 100%',
          path: ['value']
        }]);
      }
      return true;
    }),
    
  expires_at: z.string().datetime().optional(),
  max_uses: z.number().min(1).optional(),
  user_limit: z.number().min(1).max(10).optional(),
  minimum_amount: z.number().min(100).optional() // Minimum R$ 1.00
});

// Prevent coupon abuse
export const validateCouponUsage = async (code: string, userId: string): Promise<boolean> => {
  const recentUsage = await supabase
    .from('coupon_usage')
    .select('created_at')
    .eq('user_id', userId)
    .eq('coupon_code', code)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
  // Prevent duplicate usage within 24 hours
  return recentUsage.data?.length === 0;
};
```

### Rate Limiting for Coupon Operations

```typescript
// Implement coupon validation rate limiting
const couponValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,      // 15 minutes
  max: 50,                       // 50 validations per window per IP
  message: 'Too many coupon validation attempts'
});

// Prevent brute force coupon guessing
const couponBruteForceProtection = rateLimit({
  windowMs: 60 * 60 * 1000,      // 1 hour
  max: 10,                       // 10 failed attempts per hour
  skip: (req) => {
    // Only apply to failed validations
    return req.body?.validation_success === true;
  },
  message: 'Too many failed coupon attempts. Try again later.'
});
```

## Integration with EVIDENS Features

### Trial Extension Coupons

```typescript
// Special coupons that extend trial periods
export const applyTrialExtensionCoupon = async (
  subscriptionId: string,
  extensionDays: number
) => {
  
  // Update subscription trial period
  const response = await fetch(`/api/v1/subscriptions/${subscriptionId}/extend-trial`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      additional_days: extensionDays,
      reason: 'coupon_extension'
    })
  });
  
  if (!response.ok) {
    throw new Error('Trial extension failed');
  }
  
  // Log coupon usage
  await logCouponUsage({
    type: 'trial_extension',
    days_extended: extensionDays,
    subscription_id: subscriptionId
  });
  
  return response.json();
};
```

### Content Access Promotions

```typescript
// Temporary premium access coupons
export const grantTemporaryPremiumAccess = async (
  userId: string,
  durationDays: number
) => {
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);
  
  // Update user permissions temporarily
  await supabase
    .from('user_permissions')
    .upsert({
      user_id: userId,
      permission_type: 'temporary_premium',
      granted_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      granted_via: 'promotional_coupon'
    });
  
  // Schedule automatic revocation
  await schedulePermissionRevocation(userId, expiresAt);
};
```

## Analytics & Reporting

### Promotional Performance Tracking

```typescript
export const useCouponAnalytics = (dateRange: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: ['coupon-analytics', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/v1/analytics/coupons?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`);
      return response.json();
    },
    select: (data) => ({
      totalCouponsUsed: data.total_usage,
      totalDiscountAmount: data.total_discount_value,
      topPerformingCoupons: data.top_coupons,
      conversionRate: data.coupon_to_subscription_rate,
      averageDiscount: data.average_discount_value,
      revenueImpact: data.revenue_impact
    })
  });
};
```

## Best Practices

### Promotional Campaign Guidelines

1. **Discount Limits**:
   - Maximum 70% percentage discounts
   - Fixed discounts should not exceed plan price
   - Always set expiration dates for time-limited offers

2. **Usage Controls**:
   - Implement user limits to prevent abuse
   - Set global usage limits for budget control
   - Monitor unusual usage patterns

3. **Business Logic**:
   - Stack discounts carefully (validate total discount)
   - Consider long-term revenue impact of permanent discounts
   - Use increments to recover promotional costs over time

4. **User Experience**:
   - Clearly communicate discount terms and duration
   - Show savings amount in confirmation emails
   - Provide countdown timers for expiring offers

## Rate Limiting & Security

- **Coupon Validation**: 50 requests per 15 minutes per IP
- **Coupon Application**: 10 attempts per hour per user  
- **Always** validate coupons server-side before applying
- **Never** expose coupon generation logic to frontend
- **Monitor** for unusual coupon usage patterns
- **Implement** automatic fraud detection for promotional abuse

## Next Steps

See also:
- [Subscription Management](subscriptions.md) for recurring discount application
- [Marketplace Integration](marketplace-and-splits.md) for revenue sharing
- [Webhook Events](../api-reference/webhooks.md) for real-time promotion tracking
- [Analytics](../advanced/analytics.md) for promotional performance measurement