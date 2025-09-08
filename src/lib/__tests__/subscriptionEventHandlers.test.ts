// ABOUTME: Tests for subscription event handlers ensuring correct lifecycle processing and business logic

import { describe, it, expect } from 'vitest';
import { 
  SubscriptionEventProcessor,
  SubscriptionAnalytics,
  SUBSCRIPTION_STATUS_MAPPING,
  SUBSCRIPTION_TIER_MAPPING,
  type SubscriptionEventType
} from '../subscriptionEventHandlers';

describe('Subscription Event Handlers', () => {
  
  describe('SubscriptionEventProcessor', () => {
    it('should process subscription creation event correctly', () => {
      const eventData = {
        id: 'sub_123',
        plan: {
          id: 'plan_abc',
          name: 'Premium Monthly',
          amount: 9999, // R$ 99.99
          interval: 'month',
          interval_count: 1
        },
        current_cycle: {
          start_at: '2025-01-09T00:00:00Z',
          end_at: '2025-02-09T00:00:00Z'
        },
        next_billing_at: '2025-02-09T00:00:00Z',
        created_at: '2025-01-09T12:00:00Z'
      };

      const result = SubscriptionEventProcessor.processSubscriptionEvent(
        'subscription.created',
        eventData,
        'user-123'
      );

      expect(result.userId).toBe('user-123');
      expect(result.eventType).toBe('subscription.created');
      
      expect(result.practitionerUpdates).toEqual({
        subscription_status: 'active',
        subscription_tier: 'premium',
        pagarme_subscription_id: 'sub_123',
        subscription_next_billing: '2025-02-09T00:00:00Z',
        subscription_plan_name: 'Premium Monthly',
        updated_at: expect.any(String)
      });

      expect(result.subscriptionRecord).toEqual({
        user_id: 'user-123',
        pagarme_subscription_id: 'sub_123',
        pagarme_plan_id: 'plan_abc',
        status: 'active',
        current_period_start: '2025-01-09T00:00:00Z',
        current_period_end: '2025-02-09T00:00:00Z',
        next_billing_date: '2025-02-09T00:00:00Z',
        created_at: '2025-01-09T12:00:00Z',
        updated_at: expect.any(String)
      });

      expect(result.businessLogic?.shouldSendWelcomeEmail).toBe(true);
      expect(result.businessLogic?.shouldActivateFeatures).toBe(true);
    });

    it('should process successful charge event correctly', () => {
      const eventData = {
        id: 'charge_456',
        amount: 9999,
        payment_method: 'credit_card',
        subscription: {
          id: 'sub_123',
          current_cycle: {
            start_at: '2025-02-09T00:00:00Z',
            end_at: '2025-03-09T00:00:00Z'
          },
          next_billing_at: '2025-03-09T00:00:00Z'
        }
      };

      const result = SubscriptionEventProcessor.processSubscriptionEvent(
        'subscription.charged',
        eventData,
        'user-123'
      );

      expect(result.practitionerUpdates).toEqual({
        subscription_status: 'active',
        subscription_next_billing: '2025-03-09T00:00:00Z',
        last_payment_date: expect.any(String),
        payment_metadata: {
          last_payment_amount: 9999,
          last_charge_id: 'charge_456',
          payment_method: 'credit_card',
          billing_cycle_count: expect.any(Number)
        }
      });

      expect(result.businessLogic?.shouldSendPaymentConfirmation).toBe(true);
      expect(result.businessLogic?.shouldResetFailureCount).toBe(true);
      expect(result.businessLogic?.shouldLogRevenue).toBe(true);
    });

    it('should process charge failure with escalating status', () => {
      const eventData = {
        id: 'charge_failed_789',
        status_reason: 'insufficient_funds',
        subscription: {
          id: 'sub_123'
        }
      };

      const result = SubscriptionEventProcessor.processSubscriptionEvent(
        'subscription.charge_failed',
        eventData,
        'user-123'
      );

      expect(result.practitionerUpdates?.subscription_status).toBe('past_due');
      expect(result.practitionerUpdates?.payment_metadata).toEqual({
        failure_count: 1,
        last_failure_date: expect.any(String),
        failure_reason: 'insufficient_funds',
        failed_charge_id: 'charge_failed_789'
      });

      expect(result.businessLogic?.shouldSendPaymentFailedEmail).toBe(true);
      expect(result.businessLogic?.shouldStartDunningProcess).toBe(true);
      expect(result.businessLogic?.shouldSuspendAccess).toBe(false); // Not yet suspended
    });

    it('should process subscription cancellation correctly', () => {
      const eventData = {
        id: 'sub_123',
        cancel_reason: 'user_requested'
      };

      const result = SubscriptionEventProcessor.processSubscriptionEvent(
        'subscription.canceled',
        eventData,
        'user-123'
      );

      expect(result.practitionerUpdates?.subscription_status).toBe('canceled');
      expect(result.practitionerUpdates?.subscription_canceled_at).toBeDefined();
      expect(result.practitionerUpdates?.payment_metadata).toEqual({
        cancellation_reason: 'user_requested',
        canceled_at: expect.any(String)
      });

      expect(result.subscriptionRecord?.status).toBe('canceled');
      expect(result.businessLogic?.shouldSendCancellationEmail).toBe(true);
      expect(result.businessLogic?.shouldTriggerWinBackCampaign).toBe(true);
    });

    it('should process subscription reactivation correctly', () => {
      const eventData = {
        id: 'sub_123',
        next_billing_at: '2025-02-09T00:00:00Z'
      };

      const result = SubscriptionEventProcessor.processSubscriptionEvent(
        'subscription.reactivated',
        eventData,
        'user-123'
      );

      expect(result.practitionerUpdates?.subscription_status).toBe('active');
      expect(result.practitionerUpdates?.subscription_next_billing).toBe('2025-02-09T00:00:00Z');
      expect(result.practitionerUpdates?.payment_metadata).toEqual({
        reactivated_at: expect.any(String),
        failure_count: 0 // Reset failure count
      });

      expect(result.businessLogic?.shouldSendReactivationEmail).toBe(true);
      expect(result.businessLogic?.shouldRestoreFeatures).toBe(true);
    });
  });

  describe('Subscription Analytics', () => {
    it('should calculate health score correctly', () => {
      const events: SubscriptionEventType[] = [
        'subscription.created',
        'subscription.charged',
        'subscription.charged', 
        'subscription.charge_failed',
        'subscription.charged'
      ];

      const healthScore = SubscriptionAnalytics.calculateHealthScore(events);
      
      // Base 100, then: charged (+5), charged (+5), charge_failed (-15), charged (+5) = 100
      // Since there's a Math.min(score + 5, 100) cap, the actual calculation is: 
      // 100 -> 100 (capped) -> 100 (capped) -> 85 -> 90
      expect(healthScore).toBe(90);
    });

    it('should predict churn risk correctly', () => {
      // Low risk: No failures, recent payment
      expect(SubscriptionAnalytics.predictChurnRisk(0, 10, 5)).toBe('low');
      
      // Medium risk: One failure or older payment
      expect(SubscriptionAnalytics.predictChurnRisk(1, 20, 5)).toBe('medium');
      
      // High risk: Two failures or very old payment
      expect(SubscriptionAnalytics.predictChurnRisk(2, 15, 5)).toBe('high');
      
      // Critical risk: Three or more failures
      expect(SubscriptionAnalytics.predictChurnRisk(3, 10, 5)).toBe('critical');
    });

    it('should calculate customer lifetime value correctly', () => {
      const monthlyAmount = 9999; // R$ 99.99
      const billingCycleCount = 6; // 6 months of history
      const churnRisk = 'low';

      const ltv = SubscriptionAnalytics.calculateLTV(
        monthlyAmount,
        billingCycleCount,
        churnRisk
      );

      // Base LTV: 9999 * 12 = 119988
      // Loyalty multiplier: 1 + (6 * 0.1) = 1.6
      // Churn multiplier: 1.0 (low risk)
      // Expected: 119988 * 1.6 * 1.0 = 191981
      expect(ltv).toBe(191981);
    });

    it('should apply churn risk multiplier to LTV calculation', () => {
      const monthlyAmount = 9999;
      const billingCycleCount = 3;

      const lowRiskLTV = SubscriptionAnalytics.calculateLTV(monthlyAmount, billingCycleCount, 'low');
      const highRiskLTV = SubscriptionAnalytics.calculateLTV(monthlyAmount, billingCycleCount, 'high');
      const criticalRiskLTV = SubscriptionAnalytics.calculateLTV(monthlyAmount, billingCycleCount, 'critical');

      // High risk should have lower LTV than low risk
      expect(highRiskLTV).toBeLessThan(lowRiskLTV);
      
      // Critical risk should have lowest LTV
      expect(criticalRiskLTV).toBeLessThan(highRiskLTV);
      expect(criticalRiskLTV).toBeLessThan(lowRiskLTV);
    });
  });

  describe('Subscription Status Mapping', () => {
    it('should map pagar.me statuses to EVIDENS statuses correctly', () => {
      expect(SUBSCRIPTION_STATUS_MAPPING.active).toBe('active');
      expect(SUBSCRIPTION_STATUS_MAPPING.trialing).toBe('trial');
      expect(SUBSCRIPTION_STATUS_MAPPING.past_due).toBe('past_due');
      expect(SUBSCRIPTION_STATUS_MAPPING.canceled).toBe('canceled');
      expect(SUBSCRIPTION_STATUS_MAPPING.unpaid).toBe('suspended');
    });
  });

  describe('Subscription Tier Mapping', () => {
    it('should map amounts to subscription tiers correctly', () => {
      expect(SUBSCRIPTION_TIER_MAPPING.getSubscriptionTier(500)).toBe('free');     // R$ 5.00
      expect(SUBSCRIPTION_TIER_MAPPING.getSubscriptionTier(1999)).toBe('basic');   // R$ 19.99
      expect(SUBSCRIPTION_TIER_MAPPING.getSubscriptionTier(9999)).toBe('premium'); // R$ 99.99
      expect(SUBSCRIPTION_TIER_MAPPING.getSubscriptionTier(29999)).toBe('enterprise'); // R$ 299.99
    });

    it('should handle edge cases for tier mapping', () => {
      expect(SUBSCRIPTION_TIER_MAPPING.getSubscriptionTier(0)).toBe('free');
      expect(SUBSCRIPTION_TIER_MAPPING.getSubscriptionTier(999)).toBe('free');
      expect(SUBSCRIPTION_TIER_MAPPING.getSubscriptionTier(1000)).toBe('basic');
      expect(SUBSCRIPTION_TIER_MAPPING.getSubscriptionTier(10000)).toBe('enterprise');
    });
  });
});