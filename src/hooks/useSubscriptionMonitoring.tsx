// ABOUTME: Real-time subscription monitoring and analytics for comprehensive business intelligence

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionAnalytics, type SubscriptionEventType } from '@/lib/subscriptionEventHandlers';

/**
 * Subscription metrics interface
 */
export interface SubscriptionMetrics {
  // Overview metrics
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  pastDueSubscriptions: number;
  suspendedSubscriptions: number;
  canceledSubscriptions: number;
  
  // Revenue metrics
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerUser: number;
  
  // Health metrics
  churnRate: number;
  growthRate: number;
  retentionRate: number;
  
  // Risk metrics
  highRiskSubscriptions: number;
  criticalRiskSubscriptions: number;
  
  // Plan distribution
  planDistribution: Record<string, number>;
  tierDistribution: Record<string, number>;
}

/**
 * Subscription event summary
 */
export interface SubscriptionEventSummary {
  eventType: SubscriptionEventType;
  count: number;
  lastOccurred: string;
  affectedUsers: number;
}

/**
 * Individual subscription health data
 */
export interface SubscriptionHealthData {
  userId: string;
  subscriptionId: string;
  status: string;
  healthScore: number;
  churnRisk: 'low' | 'medium' | 'high' | 'critical';
  lifetimeValue: number;
  daysSinceLastPayment: number;
  failureCount: number;
  billingCycleCount: number;
  nextBillingDate: string | null;
  planName: string;
  monthlyAmount: number;
}

/**
 * Fetches comprehensive subscription metrics
 */
const fetchSubscriptionMetrics = async (): Promise<SubscriptionMetrics> => {
  
  // Fetch all subscription data
  const { data: subscriptions, error } = await supabase
    .from('Practitioners')
    .select(`
      id,
      subscription_status,
      subscription_tier,
      pagarme_subscription_id,
      last_payment_date,
      subscription_next_billing,
      payment_metadata,
      subscription_plan_name,
      created_at
    `)
    .not('pagarme_subscription_id', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch subscription metrics: ${error.message}`);
  }

  const subs = subscriptions || [];
  
  // Calculate basic counts
  const totalSubscriptions = subs.length;
  const activeSubscriptions = subs.filter(s => s.subscription_status === 'active').length;
  const trialSubscriptions = subs.filter(s => s.subscription_status === 'trial').length;
  const pastDueSubscriptions = subs.filter(s => s.subscription_status === 'past_due').length;
  const suspendedSubscriptions = subs.filter(s => s.subscription_status === 'suspended').length;
  const canceledSubscriptions = subs.filter(s => s.subscription_status === 'canceled').length;

  // Calculate revenue metrics (simplified - would need plan pricing data for accuracy)
  const activeSubs = subs.filter(s => ['active', 'trial', 'past_due'].includes(s.subscription_status));
  
  // Estimate monthly amounts based on subscription tier
  const tierAmounts = {
    'free': 0,
    'basic': 1999, // R$ 19.99
    'premium': 9999, // R$ 99.99
    'enterprise': 29999 // R$ 299.99
  };

  let totalMonthlyRevenue = 0;
  const planDistribution: Record<string, number> = {};
  const tierDistribution: Record<string, number> = {};

  activeSubs.forEach(sub => {
    const tierAmount = tierAmounts[sub.subscription_tier as keyof typeof tierAmounts] || tierAmounts.basic;
    totalMonthlyRevenue += tierAmount;
    
    // Count plan distribution
    const planName = sub.subscription_plan_name || 'Unknown';
    planDistribution[planName] = (planDistribution[planName] || 0) + 1;
    
    // Count tier distribution
    const tier = sub.subscription_tier || 'basic';
    tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
  });

  const monthlyRecurringRevenue = totalMonthlyRevenue;
  const annualRecurringRevenue = monthlyRecurringRevenue * 12;
  const averageRevenuePerUser = activeSubs.length > 0 ? monthlyRecurringRevenue / activeSubs.length : 0;

  // Calculate health metrics (simplified)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const newSubscriptions = subs.filter(s => 
    s.created_at && new Date(s.created_at) > thirtyDaysAgo
  ).length;
  
  const churnedSubscriptions = subs.filter(s => 
    s.subscription_status === 'canceled' &&
    s.payment_metadata &&
    (s.payment_metadata as any).canceled_at &&
    new Date((s.payment_metadata as any).canceled_at) > thirtyDaysAgo
  ).length;

  const churnRate = totalSubscriptions > 0 ? (churnedSubscriptions / totalSubscriptions) * 100 : 0;
  const growthRate = totalSubscriptions > 0 ? (newSubscriptions / totalSubscriptions) * 100 : 0;
  const retentionRate = 100 - churnRate;

  // Calculate risk metrics
  let highRiskSubscriptions = 0;
  let criticalRiskSubscriptions = 0;

  subs.forEach(sub => {
    const failureCount = (sub.payment_metadata as any)?.failure_count || 0;
    const lastPayment = sub.last_payment_date ? new Date(sub.last_payment_date) : null;
    const daysSinceLastPayment = lastPayment 
      ? Math.floor((new Date().getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const churnRisk = SubscriptionAnalytics.predictChurnRisk(
      failureCount,
      daysSinceLastPayment,
      1 // Simplified billing cycle count
    );

    if (churnRisk === 'high') highRiskSubscriptions++;
    if (churnRisk === 'critical') criticalRiskSubscriptions++;
  });

  return {
    totalSubscriptions,
    activeSubscriptions,
    trialSubscriptions,
    pastDueSubscriptions,
    suspendedSubscriptions,
    canceledSubscriptions,
    monthlyRecurringRevenue,
    annualRecurringRevenue,
    averageRevenuePerUser,
    churnRate,
    growthRate,
    retentionRate,
    highRiskSubscriptions,
    criticalRiskSubscriptions,
    planDistribution,
    tierDistribution
  };
};

/**
 * Fetches recent subscription events for monitoring
 */
const fetchSubscriptionEvents = async (limit = 50): Promise<SubscriptionEventSummary[]> => {
  
  const { data: events, error } = await supabase
    .from('payment_events')
    .select('*')
    .like('event_type', 'subscription.%')
    .order('processed_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch subscription events: ${error.message}`);
  }

  // Group events by type
  const eventSummary: Record<string, SubscriptionEventSummary> = {};

  events?.forEach(event => {
    const eventType = event.event_type as SubscriptionEventType;
    
    if (!eventSummary[eventType]) {
      eventSummary[eventType] = {
        eventType,
        count: 0,
        lastOccurred: event.processed_at || '',
        affectedUsers: 0
      };
    }
    
    eventSummary[eventType].count++;
    
    if (event.processed_at && event.processed_at > eventSummary[eventType].lastOccurred) {
      eventSummary[eventType].lastOccurred = event.processed_at;
    }
  });

  return Object.values(eventSummary);
};

/**
 * Fetches detailed subscription health data for at-risk users
 */
const fetchSubscriptionHealthData = async (): Promise<SubscriptionHealthData[]> => {
  
  const { data: subscriptions, error } = await supabase
    .from('Practitioners')
    .select(`
      id,
      subscription_status,
      subscription_tier,
      pagarme_subscription_id,
      last_payment_date,
      subscription_next_billing,
      payment_metadata,
      subscription_plan_name
    `)
    .not('pagarme_subscription_id', 'is', null)
    .in('subscription_status', ['active', 'past_due', 'trial']);

  if (error) {
    throw new Error(`Failed to fetch subscription health data: ${error.message}`);
  }

  const healthData: SubscriptionHealthData[] = [];

  subscriptions?.forEach(sub => {
    const failureCount = (sub.payment_metadata as any)?.failure_count || 0;
    const lastPayment = sub.last_payment_date ? new Date(sub.last_payment_date) : null;
    const daysSinceLastPayment = lastPayment 
      ? Math.floor((new Date().getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    const billingCycleCount = (sub.payment_metadata as any)?.billing_cycle_count || 1;
    
    // Estimate monthly amount based on tier
    const tierAmounts = {
      'free': 0,
      'basic': 1999,
      'premium': 9999,
      'enterprise': 29999
    };
    const monthlyAmount = tierAmounts[sub.subscription_tier as keyof typeof tierAmounts] || tierAmounts.basic;

    const churnRisk = SubscriptionAnalytics.predictChurnRisk(
      failureCount,
      daysSinceLastPayment,
      billingCycleCount
    );

    const healthScore = SubscriptionAnalytics.calculateHealthScore([]);
    const lifetimeValue = SubscriptionAnalytics.calculateLTV(
      monthlyAmount,
      billingCycleCount,
      churnRisk
    );

    // Only include subscriptions that need attention
    if (churnRisk !== 'low' || daysSinceLastPayment > 30) {
      healthData.push({
        userId: sub.id,
        subscriptionId: sub.pagarme_subscription_id || '',
        status: sub.subscription_status || '',
        healthScore,
        churnRisk,
        lifetimeValue,
        daysSinceLastPayment,
        failureCount,
        billingCycleCount,
        nextBillingDate: sub.subscription_next_billing,
        planName: sub.subscription_plan_name || 'Unknown',
        monthlyAmount
      });
    }
  });

  // Sort by churn risk and health score
  healthData.sort((a, b) => {
    const riskOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    const riskDiff = riskOrder[b.churnRisk] - riskOrder[a.churnRisk];
    if (riskDiff !== 0) return riskDiff;
    
    return a.healthScore - b.healthScore; // Lower health score = higher priority
  });

  return healthData;
};

/**
 * Hook for fetching subscription metrics with real-time updates
 */
export const useSubscriptionMetrics = () => {
  return useQuery({
    queryKey: ['subscription-metrics'],
    queryFn: fetchSubscriptionMetrics,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
};

/**
 * Hook for fetching recent subscription events
 */
export const useSubscriptionEvents = (limit = 50) => {
  return useQuery({
    queryKey: ['subscription-events', limit],
    queryFn: () => fetchSubscriptionEvents(limit),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });
};

/**
 * Hook for fetching subscription health data
 */
export const useSubscriptionHealthData = () => {
  return useQuery({
    queryKey: ['subscription-health-data'],
    queryFn: fetchSubscriptionHealthData,
    refetchInterval: 120000, // Refetch every 2 minutes
    staleTime: 60000, // Consider data stale after 1 minute
  });
};

/**
 * Combined hook for comprehensive subscription monitoring
 */
export const useSubscriptionMonitoring = () => {
  const metrics = useSubscriptionMetrics();
  const events = useSubscriptionEvents();
  const healthData = useSubscriptionHealthData();

  return {
    metrics: metrics.data,
    events: events.data,
    healthData: healthData.data,
    isLoading: metrics.isLoading || events.isLoading || healthData.isLoading,
    isError: metrics.isError || events.isError || healthData.isError,
    error: metrics.error || events.error || healthData.error
  };
};