// ABOUTME: TanStack Query hooks for payment analytics and admin dashboard statistics in EVIDENS
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// =================================================================
// Type Definitions
// =================================================================

export interface PaymentStats {
  totalRevenue: number;
  activeSubscribers: number;
  conversionRate: number;
  pixPayments: number;
  revenueGrowth: string;
  subscriberGrowth: string;
  conversionGrowth: string;
  pixSuccessRate: string;
}

export interface RecentPayment {
  id: string;
  customerName: string;
  amount: number;
  method: string;
  status: 'confirmed' | 'pending' | 'failed';
  createdAt: string;
  pagarmeTransactionId?: string;
}

export interface SubscriptionPlan {
  name: string;
  price: number;
  interval: 'month' | 'year';
  subscriberCount: number;
}

// =================================================================
// Query Functions
// =================================================================

/**
 * Fetches payment statistics from Supabase
 * Calculates real metrics from Practitioners and payment_events tables
 */
const fetchPaymentStats = async (): Promise<PaymentStats> => {
  try {
    // Get active subscribers count
    const { data: activeSubscribers, error: subscribersError } = await supabase
      .from('Practitioners')
      .select('id, subscription_status, payment_metadata')
      .eq('subscription_status', 'active');

    if (subscribersError) throw subscribersError;

    // Get payment events from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentPayments, error: paymentsError } = await supabase
      .from('payment_events')
      .select('event_type, event_data, processed_at')
      .gte('processed_at', thirtyDaysAgo.toISOString())
      .eq('processing_status', 'processed');

    if (paymentsError) throw paymentsError;

    // Calculate metrics
    const totalActiveSubscribers = activeSubscribers?.length || 0;
    
    // Calculate total revenue from successful payments
    const confirmedPayments = recentPayments?.filter(p => 
      p.event_type === 'order.paid' || p.event_type === 'charge.paid'
    ) || [];
    
    const totalRevenue = confirmedPayments.reduce((sum, payment) => {
      const amount = payment.event_data?.amount || 0;
      return sum + (amount / 100); // Convert cents to reais
    }, 0);

    // Calculate PIX payments specifically
    const pixPayments = confirmedPayments.filter(p => 
      p.event_data?.payment_method === 'pix'
    ).length;

    // Calculate success rate for PIX
    const totalPixAttempts = recentPayments?.filter(p => 
      p.event_data?.payment_method === 'pix'
    ).length || 1;
    
    const pixSuccessRate = totalPixAttempts > 0 
      ? Math.round((pixPayments / totalPixAttempts) * 100)
      : 0;

    // PLACEHOLDER DATA - These will be replaced with real historical calculations
    return {
      totalRevenue,
      activeSubscribers: totalActiveSubscribers,
      conversionRate: totalActiveSubscribers > 0 ? 8.3 : 0, // HARDCODED: Will need historical visitor data
      pixPayments,
      revenueGrowth: "+18% este mês", // HARDCODED: Needs historical comparison
      subscriberGrowth: "+12% este mês", // HARDCODED: Needs historical comparison  
      conversionGrowth: "+2.1% este mês", // HARDCODED: Needs historical comparison
      pixSuccessRate: `${pixSuccessRate}% de sucesso`
    };
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    throw new Error('Falha ao carregar estatísticas de pagamento');
  }
};

/**
 * Fetches recent payment transactions
 * Gets last 10 payment events with customer information
 */
const fetchRecentPayments = async (limit = 10): Promise<RecentPayment[]> => {
  try {
    // Fetch payment events without join first
    const { data: paymentEvents, error } = await supabase
      .from('payment_events')
      .select(`
        id,
        event_type,
        event_data,
        processed_at,
        pagarme_transaction_id,
        user_id
      `)
      .eq('processing_status', 'processed')
      .in('event_type', ['order.paid', 'charge.paid', 'order.payment_failed', 'charge.failed'])
      .order('processed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (!paymentEvents || paymentEvents.length === 0) {
      return [];
    }

    // Get user IDs for fetching practitioner names separately
    const userIds = paymentEvents
      .map(event => event.user_id)
      .filter((id): id is string => id !== null && id !== 'unknown' && id !== 'error');

    // Fetch practitioner names separately if we have valid user IDs
    let practitionersMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: practitioners } = await supabase
        .from('Practitioners')
        .select('id, full_name')
        .in('id', userIds);
        
      if (practitioners) {
        practitionersMap = practitioners.reduce((acc, p) => ({
          ...acc,
          [p.id]: p.full_name || 'Cliente não identificado'
        }), {});
      }
    }

    // Transform payment events to RecentPayment format
    return paymentEvents.map(event => ({
      id: event.id,
      customerName: event.event_data?.customer?.name || 
                   practitionersMap[event.user_id] ||
                   'Cliente não identificado',
      amount: event.event_data?.amount || 0,
      method: event.event_data?.payment_method === 'pix' ? 'PIX' : 'Cartão',
      status: (event.event_type === 'order.paid' || event.event_type === 'charge.paid') 
              ? 'confirmed' as const
              : 'failed' as const,
      createdAt: event.processed_at,
      pagarmeTransactionId: event.pagarme_transaction_id
    }));
  } catch (error) {
    console.error('Error fetching recent payments:', error);
    return []; // Return empty array instead of throwing to prevent UI crashes
  }
};

/**
 * Fetches subscription plan information with subscriber counts
 */
const fetchSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    // Get subscriber counts by plan
    const { data: subscribers, error } = await supabase
      .from('Practitioners')
      .select('subscription_plan, subscription_status')
      .eq('subscription_status', 'active');

    if (error) throw error;

    // Count subscribers by plan
    const planCounts = subscribers?.reduce((acc, sub) => {
      const plan = sub.subscription_plan || 'monthly';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // HARDCODED: Plan definitions - these should eventually come from a plans table
    return [
      {
        name: 'Plano Mensal',
        price: 1990, // R$ 19.90 in cents
        interval: 'month' as const,
        subscriberCount: planCounts['monthly'] || planCounts[''] || 0
      },
      {
        name: 'Plano Anual', 
        price: 19104, // R$ 191.04 in cents (20% discount)
        interval: 'year' as const,
        subscriberCount: planCounts['yearly'] || planCounts['annual'] || 0
      }
    ];
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw new Error('Falha ao carregar planos de assinatura');
  }
};

/**
 * Checks if payment system is properly configured
 */
const checkPaymentConfiguration = async () => {
  try {
    // Check environment variables and localStorage fallback for development
    const pagarmePublicKey = import.meta.env.VITE_PAGARME_PUBLIC_KEY || localStorage.getItem('pagarme_public_key');
    const pagarmeSecretKey = import.meta.env.PAGARME_SECRET_KEY || localStorage.getItem('pagarme_secret_key');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const webhookEndpointId = import.meta.env.PAGARME_WEBHOOK_ENDPOINT_ID || localStorage.getItem('pagarme_webhook_id');
    
    // Determine environment based on keys
    const environment = pagarmePublicKey?.includes('test') ? 'Desenvolvimento' : 'Produção';
    
    // Check if configuration is complete
    const isConfigured = Boolean(pagarmePublicKey && pagarmeSecretKey && supabaseUrl);
    const pagarmeIntegration = isConfigured ? 'active' : 'inactive';
    
    // Webhook status - configured if we have webhook endpoint ID
    const webhookStatus = webhookEndpointId ? 'configured' : 'needs_configuration';
    
    // Additional validation for key formats
    const publicKeyValid = pagarmePublicKey?.startsWith('pk_');
    const secretKeyValid = pagarmeSecretKey?.startsWith('sk_');
    
    return {
      isConfigured: isConfigured && publicKeyValid && secretKeyValid,
      environment,
      webhookStatus,
      pagarmeIntegration,
      configSource: localStorage.getItem('pagarme_public_key') ? 'localStorage' : 'environment'
    };
  } catch (error) {
    console.error('Error checking payment configuration:', error);
    return {
      isConfigured: false,
      environment: 'Desenvolvimento',
      webhookStatus: 'needs_configuration',
      pagarmeIntegration: 'inactive',
      configSource: 'none'
    };
  }
};

// =================================================================
// Query Hooks
// =================================================================

/**
 * Hook to get payment dashboard statistics
 * Updates every 30 seconds for real-time admin monitoring
 */
export const usePaymentStats = () => {
  return useQuery({
    queryKey: ['payment-stats'],
    queryFn: fetchPaymentStats,
    staleTime: 30000, // Consider stale after 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds when tab is active
    refetchIntervalInBackground: false,
    retry: 2,
  });
};

/**
 * Hook to get recent payment transactions
 * For admin dashboard monitoring
 */
export const useRecentPayments = (limit = 10) => {
  return useQuery({
    queryKey: ['recent-payments', limit],
    queryFn: () => fetchRecentPayments(limit),
    staleTime: 15000, // Consider stale after 15 seconds
    refetchInterval: 15000, // More frequent updates for payment monitoring
    refetchIntervalInBackground: false,
    retry: 1, // Don't retry too aggressively to avoid API spam
  });
};

/**
 * Hook to get subscription plan information
 * Less frequent updates since this data changes slowly
 */
export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: fetchSubscriptionPlans,
    staleTime: 300000, // Consider stale after 5 minutes
    refetchInterval: 300000, // Refetch every 5 minutes
    refetchIntervalInBackground: false,
    retry: 2,
  });
};

/**
 * Hook to check payment system configuration status
 * For admin dashboard health monitoring
 */
export const usePaymentConfiguration = () => {
  return useQuery({
    queryKey: ['payment-configuration'],
    queryFn: checkPaymentConfiguration,
    staleTime: 60000, // Consider stale after 1 minute
    refetchOnWindowFocus: true,
    retry: 1,
  });
};