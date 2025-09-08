// ABOUTME: Enhanced subscription event handling utilities for comprehensive lifecycle management

import { Database } from '@/integrations/supabase/types';

type Practitioner = Database['public']['Tables']['Practitioners']['Row'];
type EvidensSubscription = Database['public']['Tables']['evidens_subscriptions']['Row'];

/**
 * Subscription event types from pagar.me webhook
 */
export type SubscriptionEventType =
  | 'subscription.created'
  | 'subscription.canceled'
  | 'subscription.charge_created'
  | 'subscription.charged'
  | 'subscription.charge_failed'
  | 'subscription.trial_ended'
  | 'subscription.reactivated'
  | 'subscription.suspended'
  | 'subscription.updated'
  | 'subscription.expired';

/**
 * Subscription status mapping between pagar.me and EVIDENS
 */
export const SUBSCRIPTION_STATUS_MAPPING = {
  // Pagar.me status -> EVIDENS status
  'active': 'active',
  'trialing': 'trial',
  'past_due': 'past_due',
  'canceled': 'canceled',
  'unpaid': 'suspended',
  'incomplete': 'incomplete',
  'incomplete_expired': 'expired'
} as const;

/**
 * Subscription tier mapping based on plan configuration
 */
export const SUBSCRIPTION_TIER_MAPPING = {
  // Based on plan amount ranges (in cents)
  getSubscriptionTier: (amount: number): string => {
    if (amount <= 999) return 'free';           // Up to R$ 9.99
    if (amount <= 2999) return 'basic';         // R$ 10 - R$ 29.99
    if (amount <= 9999) return 'premium';       // R$ 30 - R$ 99.99
    return 'enterprise';                        // R$ 100+
  }
};

/**
 * Enhanced subscription event processing utilities
 */
export class SubscriptionEventProcessor {
  
  /**
   * Processes subscription lifecycle events with enhanced business logic
   */
  static processSubscriptionEvent(
    eventType: SubscriptionEventType,
    eventData: any,
    userId: string
  ): SubscriptionUpdateRequest {
    
    const baseUpdate: SubscriptionUpdateRequest = {
      userId,
      eventType,
      eventData,
      timestamp: new Date().toISOString()
    };

    switch (eventType) {
      case 'subscription.created':
        return {
          ...baseUpdate,
          practitionerUpdates: {
            subscription_status: 'active',
            subscription_tier: this.determineTierFromPlan(eventData.plan),
            pagarme_subscription_id: eventData.id,
            subscription_next_billing: eventData.next_billing_at,
            subscription_plan_name: eventData.plan?.name,
            updated_at: new Date().toISOString()
          },
          subscriptionRecord: {
            user_id: userId,
            pagarme_subscription_id: eventData.id,
            status: SUBSCRIPTION_STATUS_MAPPING.active,
            current_period_start: eventData.current_cycle?.start_at,
            current_period_end: eventData.current_cycle?.end_at,
            next_billing_date: eventData.next_billing_at,
            created_at: eventData.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          businessLogic: {
            shouldSendWelcomeEmail: true,
            shouldActivateFeatures: true,
            shouldLogAnalytics: true
          }
        };

      case 'subscription.charged':
        return {
          ...baseUpdate,
          practitionerUpdates: {
            subscription_status: 'active',
            subscription_next_billing: eventData.subscription?.next_billing_at,
            last_payment_date: new Date().toISOString(),
            payment_metadata: {
              last_payment_amount: eventData.amount,
              last_charge_id: eventData.id,
              payment_method: eventData.payment_method,
              billing_cycle_count: this.incrementBillingCycle(eventData)
            }
          },
          subscriptionRecord: {
            status: SUBSCRIPTION_STATUS_MAPPING.active,
            current_period_start: eventData.subscription?.current_cycle?.start_at,
            current_period_end: eventData.subscription?.current_cycle?.end_at,
            next_billing_date: eventData.subscription?.next_billing_at,
            updated_at: new Date().toISOString()
          },
          businessLogic: {
            shouldSendPaymentConfirmation: true,
            shouldResetFailureCount: true,
            shouldExtendAccess: true,
            shouldLogRevenue: true
          }
        };

      case 'subscription.charge_failed':
        const failureCount = this.getFailureCount(eventData);
        const newStatus = failureCount >= 3 ? 'suspended' : 'past_due';
        
        return {
          ...baseUpdate,
          practitionerUpdates: {
            subscription_status: newStatus,
            payment_metadata: {
              failure_count: failureCount,
              last_failure_date: new Date().toISOString(),
              failure_reason: eventData.status_reason || 'payment_failed',
              failed_charge_id: eventData.id
            }
          },
          subscriptionRecord: {
            status: newStatus === 'suspended' ? SUBSCRIPTION_STATUS_MAPPING.unpaid : SUBSCRIPTION_STATUS_MAPPING.past_due,
            updated_at: new Date().toISOString()
          },
          businessLogic: {
            shouldSendPaymentFailedEmail: true,
            shouldStartDunningProcess: newStatus === 'past_due',
            shouldSuspendAccess: newStatus === 'suspended',
            shouldLogChurnRisk: true
          }
        };

      case 'subscription.canceled':
        return {
          ...baseUpdate,
          practitionerUpdates: {
            subscription_status: 'canceled',
            subscription_canceled_at: new Date().toISOString(),
            payment_metadata: {
              cancellation_reason: eventData.cancel_reason || 'user_requested',
              canceled_at: new Date().toISOString()
            }
          },
          subscriptionRecord: {
            status: SUBSCRIPTION_STATUS_MAPPING.canceled,
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          businessLogic: {
            shouldSendCancellationEmail: true,
            shouldScheduleAccessRevocation: true,
            shouldTriggerWinBackCampaign: true,
            shouldLogChurn: true
          }
        };

      case 'subscription.reactivated':
        return {
          ...baseUpdate,
          practitionerUpdates: {
            subscription_status: 'active',
            subscription_next_billing: eventData.next_billing_at,
            payment_metadata: {
              reactivated_at: new Date().toISOString(),
              failure_count: 0 // Reset failure count
            }
          },
          subscriptionRecord: {
            status: SUBSCRIPTION_STATUS_MAPPING.active,
            reactivated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          businessLogic: {
            shouldSendReactivationEmail: true,
            shouldRestoreFeatures: true,
            shouldLogWinBack: true
          }
        };

      default:
        return baseUpdate;
    }
  }

  /**
   * Determines subscription tier based on plan configuration
   */
  private static determineTierFromPlan(plan: any): string {
    if (!plan) return 'basic';
    
    // Use plan metadata if available
    if (plan.metadata?.evidens_tier) {
      return plan.metadata.evidens_tier;
    }
    
    // Fallback to amount-based tier
    const planAmount = plan.amount || 0;
    return SUBSCRIPTION_TIER_MAPPING.getSubscriptionTier(planAmount);
  }

  /**
   * Gets failure count from event data or increments existing
   */
  private static getFailureCount(eventData: any): number {
    // Try to get from event metadata first
    if (eventData.metadata?.failure_count) {
      return parseInt(eventData.metadata.failure_count) + 1;
    }
    
    // Default increment
    return 1;
  }

  /**
   * Increments billing cycle count for analytics
   */
  private static incrementBillingCycle(eventData: any): number {
    const currentCount = eventData.subscription?.metadata?.billing_cycle_count || 0;
    return parseInt(currentCount) + 1;
  }
}

/**
 * Subscription update request interface
 */
export interface SubscriptionUpdateRequest {
  userId: string;
  eventType: SubscriptionEventType;
  eventData: any;
  timestamp: string;
  practitionerUpdates?: Partial<Practitioner>;
  subscriptionRecord?: Partial<EvidensSubscription>;
  businessLogic?: {
    shouldSendWelcomeEmail?: boolean;
    shouldSendPaymentConfirmation?: boolean;
    shouldSendPaymentFailedEmail?: boolean;
    shouldSendCancellationEmail?: boolean;
    shouldSendReactivationEmail?: boolean;
    shouldActivateFeatures?: boolean;
    shouldRestoreFeatures?: boolean;
    shouldSuspendAccess?: boolean;
    shouldScheduleAccessRevocation?: boolean;
    shouldStartDunningProcess?: boolean;
    shouldTriggerWinBackCampaign?: boolean;
    shouldResetFailureCount?: boolean;
    shouldExtendAccess?: boolean;
    shouldLogAnalytics?: boolean;
    shouldLogRevenue?: boolean;
    shouldLogChurn?: boolean;
    shouldLogChurnRisk?: boolean;
    shouldLogWinBack?: boolean;
  };
}

/**
 * Subscription analytics utilities
 */
export class SubscriptionAnalytics {
  
  /**
   * Calculates subscription health score based on event history
   */
  static calculateHealthScore(events: SubscriptionEventType[]): number {
    let score = 100;
    
    events.forEach(event => {
      switch (event) {
        case 'subscription.charge_failed':
          score -= 15;
          break;
        case 'subscription.suspended':
          score -= 25;
          break;
        case 'subscription.canceled':
          score = 0;
          break;
        case 'subscription.charged':
          score = Math.min(score + 5, 100);
          break;
        case 'subscription.reactivated':
          score = Math.min(score + 20, 100);
          break;
      }
    });
    
    return Math.max(score, 0);
  }

  /**
   * Predicts churn risk based on subscription patterns
   */
  static predictChurnRisk(
    failureCount: number,
    daysSinceLastPayment: number,
    billingCycleCount: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    
    if (failureCount >= 3) return 'critical';
    if (failureCount >= 2 || daysSinceLastPayment > 45) return 'high';
    if (failureCount >= 1 || daysSinceLastPayment > 35) return 'medium';
    if (billingCycleCount < 3 && daysSinceLastPayment > 25) return 'medium';
    
    return 'low';
  }

  /**
   * Calculates customer lifetime value based on subscription data
   */
  static calculateLTV(
    monthlyAmount: number,
    billingCycleCount: number,
    churnRisk: string
  ): number {
    
    // Base LTV calculation
    const baseLTV = monthlyAmount * 12; // Annual value
    
    // Adjust for billing history
    const loyaltyMultiplier = Math.min(1 + (billingCycleCount * 0.1), 2.0);
    
    // Adjust for churn risk
    const churnMultipliers = {
      'low': 1.0,
      'medium': 0.8,
      'high': 0.6,
      'critical': 0.3
    };
    
    const churnMultiplier = churnMultipliers[churnRisk as keyof typeof churnMultipliers] || 0.5;
    
    return Math.round(baseLTV * loyaltyMultiplier * churnMultiplier);
  }
}