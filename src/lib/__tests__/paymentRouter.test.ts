// ABOUTME: Tests for payment routing logic ensuring correct subscription vs one-time payment decisions

import { describe, it, expect } from 'vitest';
import { 
  analyzePaymentFlow, 
  mapBillingInterval, 
  resolvePlanPricingAndFlow,
  analyzePaymentRouting 
} from '../paymentRouter';
import type { Database } from '@/integrations/supabase/types';

type PaymentPlan = Database['public']['Tables']['PaymentPlans']['Row'];

describe('Payment Router', () => {
  describe('analyzePaymentFlow', () => {
    it('should identify subscription plans correctly', () => {
      const subscriptionPlan: PaymentPlan = {
        id: 'test-sub',
        name: 'Monthly Plan',
        type: 'subscription',
        amount: 9999,
        billing_interval: 'month',
        is_active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        promotional_config: null,
        display_config: null
      };

      const result = analyzePaymentFlow(subscriptionPlan);
      expect(result).toBe('subscription');
    });

    it('should identify one-time plans correctly', () => {
      const oneTimePlan: PaymentPlan = {
        id: 'test-onetime',
        name: 'One-time Purchase',
        type: 'one-time',
        amount: 19999,
        billing_interval: null,
        is_active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        promotional_config: null,
        display_config: null
      };

      const result = analyzePaymentFlow(oneTimePlan);
      expect(result).toBe('one-time');
    });

    it('should fallback to one-time for plans without billing interval', () => {
      const ambiguousPlan: PaymentPlan = {
        id: 'test-ambiguous',
        name: 'Ambiguous Plan',
        type: 'subscription',
        amount: 9999,
        billing_interval: null, // Missing billing interval
        is_active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        promotional_config: null,
        display_config: null
      };

      const result = analyzePaymentFlow(ambiguousPlan);
      expect(result).toBe('one-time');
    });
  });

  describe('mapBillingInterval', () => {
    it('should map standard intervals correctly', () => {
      expect(mapBillingInterval('day')).toEqual({ interval: 'day', intervalCount: 1 });
      expect(mapBillingInterval('week')).toEqual({ interval: 'week', intervalCount: 1 });
      expect(mapBillingInterval('month')).toEqual({ interval: 'month', intervalCount: 1 });
      expect(mapBillingInterval('year')).toEqual({ interval: 'year', intervalCount: 1 });
    });

    it('should default to monthly for unknown intervals', () => {
      expect(mapBillingInterval('unknown')).toEqual({ interval: 'month', intervalCount: 1 });
      expect(mapBillingInterval(null)).toEqual({ interval: 'month', intervalCount: 1 });
    });
  });

  describe('resolvePlanPricingAndFlow', () => {
    it('should resolve subscription plan with promotion correctly', () => {
      const planWithPromotion: PaymentPlan = {
        id: 'test-promo',
        name: 'Premium Plan',
        type: 'subscription',
        amount: 39900, // R$ 399.00
        billing_interval: 'year',
        is_active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        promotional_config: {
          isActive: true,
          finalPrice: 24990, // R$ 249.90
          customName: 'Early Bird Special',
          expiresAt: '2025-12-31T23:59:59Z' // Future date
        },
        display_config: null
      };

      const result = resolvePlanPricingAndFlow(planWithPromotion);

      expect(result.flowType).toBe('subscription');
      expect(result.amount).toBe(39900);
      expect(result.finalAmount).toBe(24990);
      expect(result.hasPromotion).toBe(true);
      expect(result.name).toBe('Early Bird Special');
      expect(result.interval).toBe('year');
      expect(result.intervalCount).toBe(1);
      expect(result.metadata.promotional).toBe(true);
      expect(result.metadata.discountAmount).toBe(14910);
    });

    it('should resolve one-time plan without promotion correctly', () => {
      const oneTimePlan: PaymentPlan = {
        id: 'test-onetime',
        name: 'Single Purchase',
        type: 'one-time',
        amount: 9999,
        billing_interval: null,
        is_active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        promotional_config: null,
        display_config: null
      };

      const result = resolvePlanPricingAndFlow(oneTimePlan);

      expect(result.flowType).toBe('one-time');
      expect(result.amount).toBe(9999);
      expect(result.finalAmount).toBe(9999);
      expect(result.hasPromotion).toBe(false);
      expect(result.name).toBe('Single Purchase');
      expect(result.interval).toBeUndefined();
      expect(result.intervalCount).toBeUndefined();
      expect(result.metadata.promotional).toBe(false);
    });

    it('should handle expired promotions correctly', () => {
      const expiredPromoPlan: PaymentPlan = {
        id: 'test-expired',
        name: 'Expired Promo Plan',
        type: 'subscription',
        amount: 19999,
        billing_interval: 'month',
        is_active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        promotional_config: {
          isActive: true,
          finalPrice: 14999,
          expiresAt: '2024-12-31T23:59:59Z' // Past date
        },
        display_config: null
      };

      const result = resolvePlanPricingAndFlow(expiredPromoPlan);

      expect(result.hasPromotion).toBe(false);
      expect(result.finalAmount).toBe(19999); // Should use original amount
      expect(result.metadata.promotional).toBe(false);
    });
  });

  describe('analyzePaymentRouting', () => {
    it('should provide comprehensive routing analysis', () => {
      const plans: PaymentPlan[] = [
        {
          id: 'plan-1',
          name: 'Monthly Sub',
          type: 'subscription',
          amount: 9999,
          billing_interval: 'month',
          is_active: true,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
          promotional_config: { isActive: true, finalPrice: 7999, expiresAt: '2025-12-31' },
          display_config: null
        },
        {
          id: 'plan-2',
          name: 'One-time',
          type: 'one-time',
          amount: 19999,
          billing_interval: null,
          is_active: true,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
          promotional_config: null,
          display_config: null
        },
        {
          id: 'plan-3',
          name: 'Yearly Sub',
          type: 'subscription',
          amount: 99999,
          billing_interval: 'year',
          is_active: true,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
          promotional_config: null,
          display_config: null
        }
      ];

      const analysis = analyzePaymentRouting(plans);

      expect(analysis.totalPlans).toBe(3);
      expect(analysis.subscriptionPlans).toBe(2);
      expect(analysis.oneTimePlans).toBe(1);
      expect(analysis.promotionalPlans).toBe(1);
      expect(analysis.billingIntervals).toEqual({
        'month': 1,
        'year': 1
      });
      expect(analysis.avgAmounts.subscription).toBeGreaterThan(0);
      expect(analysis.avgAmounts.oneTime).toBe(19999);
    });
  });
});