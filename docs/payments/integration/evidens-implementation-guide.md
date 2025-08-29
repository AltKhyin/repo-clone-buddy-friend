# EVIDENS-Specific Pagar.me Integration Guide

## Overview

This guide provides complete implementation patterns for integrating Pagar.me payments within the EVIDENS architecture, following the established patterns of TanStack Query, Supabase Edge Functions, and the existing codebase structure.

## Database Schema Extensions

### User Table Extensions

```sql
-- Add payment-related fields to existing users table (C2.1 pattern)
ALTER TABLE users 
ADD COLUMN pagarme_customer_id text,
ADD COLUMN subscription_id text,
ADD COLUMN subscription_status text CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
ADD COLUMN subscription_plan_id text,
ADD COLUMN trial_ends_at timestamp with time zone,
ADD COLUMN payment_method_id text,
ADD COLUMN billing_data jsonb,
ADD COLUMN revenue_share_recipient_id text; -- For authors/creators

-- Create index for payment queries
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_pagarme_customer ON users(pagarme_customer_id);
```

### Payment Events Table

```sql
-- Track payment events for analytics and debugging
CREATE TABLE payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  event_type text NOT NULL,
  pagarme_object_id text NOT NULL,
  pagarme_object_type text NOT NULL,
  status text NOT NULL,
  amount integer,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- Admin and user read access
CREATE POLICY "Admin can view all payment events" ON payment_events
  FOR SELECT TO authenticated
  USING (get_my_claim('userrole') = 'admin');

CREATE POLICY "Users can view own payment events" ON payment_events  
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

## Edge Function Implementations

### Customer Management Function

```typescript
// supabase/functions/payment-customer/index.ts
import { createClient } from '@supabase/supabase-js';
import { corsHeaders, sendSuccess, sendError } from '../_shared/utils.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const PAGAR_ME_SECRET_KEY = Deno.env.get('PAGAR_ME_SECRET_KEY')!;

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Authenticate user
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { user, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !user) {
    return sendError('Unauthorized', 401);
  }

  if (req.method === 'POST') {
    try {
      const { customerData } = await req.json();
      
      // Check if user already has Pagar.me customer
      const { data: existingUser } = await supabase
        .from('users')
        .select('pagarme_customer_id')
        .eq('id', user.id)
        .single();
        
      if (existingUser?.pagarme_customer_id) {
        return sendSuccess({ customer_id: existingUser.pagarme_customer_id });
      }
      
      // Create Pagar.me customer
      const response = await fetch('https://api.pagar.me/core/v5/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(PAGAR_ME_SECRET_KEY + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: customerData.name,
          email: user.email,
          document: customerData.document,
          document_type: customerData.document_type,
          type: 'individual',
          address: customerData.address,
          phones: customerData.phones,
          metadata: {
            evidens_user_id: user.id,
            created_via: 'evidens_app'
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        return sendError(`Customer creation failed: ${error.message}`, 400);
      }
      
      const customer = await response.json();
      
      // Update user record with customer ID
      await supabase
        .from('users')
        .update({ 
          pagarme_customer_id: customer.id,
          billing_data: customerData
        })
        .eq('id', user.id);
      
      return sendSuccess({ customer_id: customer.id });
      
    } catch (error) {
      console.error('Customer creation error:', error);
      return sendError('Customer creation failed', 500);
    }
  }
  
  if (req.method === 'GET') {
    // Get existing customer data
    const { data: userData } = await supabase
      .from('users')
      .select('pagarme_customer_id, billing_data')
      .eq('id', user.id)
      .single();
      
    if (!userData?.pagarme_customer_id) {
      return sendError('No customer found', 404);
    }
    
    return sendSuccess({
      customer_id: userData.pagarme_customer_id,
      billing_data: userData.billing_data
    });
  }

  return sendError('Method not allowed', 405);
}
```

### Subscription Management Function

```typescript
// supabase/functions/payment-subscription/index.ts
export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { user, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !user) return sendError('Unauthorized', 401);

  if (req.method === 'POST') {
    try {
      const { planTier, paymentMethod, cardToken, couponCode } = await req.json();
      
      // Get customer data
      const { data: userData } = await supabase
        .from('users')
        .select('pagarme_customer_id, billing_data')
        .eq('id', user.id)
        .single();
        
      if (!userData?.pagarme_customer_id) {
        return sendError('Customer not found. Create customer first.', 400);
      }
      
      // Prepare subscription data
      const subscriptionData = {
        customer_id: userData.pagarme_customer_id,
        billing_type: 'prepaid',
        interval: 'month',
        interval_count: 1,
        trial_period_days: 14,       // 14-day trial for all plans
        minimum_price: 100,
        items: [
          {
            description: `EVIDENS ${planTier.charAt(0).toUpperCase() + planTier.slice(1)}`,
            quantity: 1,
            pricing_scheme: {
              scheme_type: 'unit',
              price: getPlanPrice(planTier)
            }
          }
        ],
        payment_method: paymentMethod,
        statement_descriptor: 'EVIDENS',
        currency: 'BRL',
        metadata: {
          evidens_user_id: user.id,
          plan_tier: planTier,
          created_via: 'evidens_app'
        }
      };
      
      // Apply payment method specific data
      if (paymentMethod === 'credit_card' && cardToken) {
        subscriptionData.card_token = cardToken;
        subscriptionData.credit_card = {
          installments: 1,
          statement_descriptor: 'EVIDENS'
        };
      }
      
      // Apply coupon if provided
      if (couponCode) {
        const couponValidation = await validateCouponCode(couponCode, user.id);
        if (couponValidation.isValid) {
          subscriptionData.discounts = [couponValidation.discount];
        }
      }
      
      // Create subscription with Pagar.me
      const response = await fetch('https://api.pagar.me/core/v5/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(PAGAR_ME_SECRET_KEY + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        return sendError(`Subscription creation failed: ${error.message}`, 400);
      }
      
      const subscription = await response.json();
      
      // Update user record with subscription details
      await supabase
        .from('users')
        .update({
          subscription_id: subscription.id,
          subscription_status: subscription.status,
          subscription_plan_id: planTier,
          trial_ends_at: subscription.trial_ends_at
        })
        .eq('id', user.id);
      
      // Log subscription event
      await supabase
        .from('payment_events')
        .insert({
          user_id: user.id,
          event_type: 'subscription.created',
          pagarme_object_id: subscription.id,
          pagarme_object_type: 'subscription',
          status: subscription.status,
          amount: subscription.amount,
          metadata: { plan_tier: planTier }
        });
      
      return sendSuccess({
        subscription_id: subscription.id,
        status: subscription.status,
        trial_ends_at: subscription.trial_ends_at
      });
      
    } catch (error) {
      console.error('Subscription creation error:', error);
      return sendError('Subscription creation failed', 500);
    }
  }
  
  if (req.method === 'DELETE') {
    // Cancel subscription
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_id')
        .eq('id', user.id)
        .single();
        
      if (!userData?.subscription_id) {
        return sendError('No active subscription found', 404);
      }
      
      // Cancel with Pagar.me
      const response = await fetch(`https://api.pagar.me/core/v5/subscriptions/${userData.subscription_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${btoa(PAGAR_ME_SECRET_KEY + ':')}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        return sendError(`Subscription cancellation failed: ${error.message}`, 400);
      }
      
      // Update user record
      await supabase
        .from('users')
        .update({
          subscription_status: 'canceled'
        })
        .eq('id', user.id);
      
      return sendSuccess({ message: 'Subscription canceled successfully' });
      
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      return sendError('Subscription cancellation failed', 500);
    }
  }

  return sendError('Method not allowed', 405);
}

// Helper function for plan pricing
function getPlanPrice(tier: string): number {
  const prices = {
    basic: 1990,      // R$ 19.90
    premium: 4990,    // R$ 49.90
    enterprise: 9990  // R$ 99.90
  };
  return prices[tier] || prices.basic;
}
```

### Webhook Handler Function

```typescript
// supabase/functions/pagar-me-webhook/index.ts
import { createHmac } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return sendError('Method not allowed', 405);
  }
  
  try {
    const body = await req.text();
    const signature = req.headers.get('X-Hub-Signature-256');
    
    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, PAGAR_ME_WEBHOOK_SECRET)) {
      return sendError('Invalid signature', 401);
    }
    
    const event = JSON.parse(body);
    
    // Process different event types
    switch (event.type) {
      case 'order.paid':
        await handleOrderPaid(event.data.object);
        break;
        
      case 'order.payment_failed':
        await handleOrderPaymentFailed(event.data.object);
        break;
        
      case 'subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
        
      case 'subscription.charged':
        await handleSubscriptionCharged(event.data.object);
        break;
        
      case 'subscription.payment_failed':
        await handleSubscriptionPaymentFailed(event.data.object);
        break;
        
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data.object);
        break;
        
      default:
        console.log(`Unhandled webhook type: ${event.type}`);
    }
    
    return sendSuccess({ message: 'Webhook processed successfully' });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return sendError('Webhook processing failed', 500);
  }
}

// Webhook event handlers
async function handleSubscriptionCharged(subscription: any) {
  // Update user subscription status
  await supabase
    .from('users')
    .update({
      subscription_status: 'active'
    })
    .eq('subscription_id', subscription.id);
    
  // Log payment event
  await supabase
    .from('payment_events')
    .insert({
      user_id: subscription.metadata?.evidens_user_id,
      event_type: 'subscription.charged',
      pagarme_object_id: subscription.id,
      pagarme_object_type: 'subscription',
      status: 'paid',
      amount: subscription.current_cycle?.amount
    });
    
  // Send confirmation email (implement as needed)
  await sendPaymentConfirmationEmail(subscription);
}

async function handleSubscriptionPaymentFailed(subscription: any) {
  // Update user subscription status
  await supabase
    .from('users')
    .update({
      subscription_status: 'past_due'
    })
    .eq('subscription_id', subscription.id);
    
  // Log failure event
  await supabase
    .from('payment_events')
    .insert({
      user_id: subscription.metadata?.evidens_user_id,
      event_type: 'subscription.payment_failed',
      pagarme_object_id: subscription.id,
      pagarme_object_type: 'subscription',
      status: 'failed',
      metadata: {
        failure_reason: subscription.current_cycle?.payment?.last_transaction?.acquirer_message
      }
    });
    
  // Send payment failure notification
  await sendPaymentFailureNotification(subscription);
}
```

## Frontend Integration Hooks

### Customer Management Hook

```typescript
// src/hooks/mutations/useCustomerMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateCustomerRequest {
  name: string;
  document: string;
  document_type: 'cpf' | 'cnpj';
  address: CustomerAddress;
  phones: CustomerPhones;
}

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCustomerRequest) => {
      const response = await fetch('/api/v1/payment-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerData: data })
      });
      
      if (!response.ok) {
        throw new Error(`Customer creation failed: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate user status to reflect customer creation
      queryClient.invalidateQueries({ queryKey: ['user-status'] });
    }
  });
};

export const useCustomerData = () => {
  return useQuery({
    queryKey: ['customer-data'],
    queryFn: async () => {
      const response = await fetch('/api/v1/payment-customer');
      if (!response.ok) {
        throw new Error('Failed to fetch customer data');
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000,    // 10 minutes
    retry: 1
  });
};
```

### Subscription Management Hooks

```typescript
// src/hooks/mutations/useSubscriptionMutations.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface CreateSubscriptionRequest {
  planTier: 'basic' | 'premium' | 'enterprise';
  paymentMethod: 'credit_card' | 'pix' | 'boleto';
  cardToken?: string;
  couponCode?: string;
}

export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateSubscriptionRequest) => {
      const response = await fetch('/api/v1/payment-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Subscription creation failed');
      }
      
      return response.json();
    },
    onSuccess: (subscription) => {
      // Update all relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-status'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      
      // Optimistic update for immediate UI feedback
      queryClient.setQueryData(['subscription-status'], {
        status: subscription.status,
        trial_ends_at: subscription.trial_ends_at,
        plan_tier: subscription.plan_tier
      });
    }
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/v1/payment-subscription', {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Subscription cancellation failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-status'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      
      // Optimistic update
      queryClient.setQueryData(['subscription-status'], {
        status: 'canceled'
      });
    }
  });
};

// Real-time subscription status
export const useSubscriptionStatus = () => {
  return useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const response = await fetch('/api/v1/subscription/status');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,     // 5 minutes
    refetchOnWindowFocus: true,   // Check when user returns to app
    select: (data) => ({
      ...data,
      isTrialing: data.status === 'trialing',
      isActive: ['active', 'trialing'].includes(data.status),
      isPastDue: data.status === 'past_due',
      isCanceled: data.status === 'canceled',
      daysUntilTrialEnd: data.trial_ends_at ? 
        Math.ceil((new Date(data.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0
    })
  });
};
```

### Payment Status Hook

```typescript
// src/hooks/queries/usePaymentQueries.ts
export const usePaymentHistory = () => {
  return useQuery({
    queryKey: ['payment-history'],
    queryFn: async () => {
      const response = await fetch('/api/v1/payments/history');
      return response.json();
    },
    select: (data) => ({
      payments: data.payment_events || [],
      totalPaid: data.payment_events
        ?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
      failedPayments: data.payment_events?.filter(p => p.status === 'failed') || [],
      lastSuccessfulPayment: data.payment_events?.find(p => p.status === 'paid')
    })
  });
};

// Monitor subscription health
export const useSubscriptionHealth = () => {
  const { data: subscriptionStatus } = useSubscriptionStatus();
  const { data: paymentHistory } = usePaymentHistory();
  
  return useMemo(() => {
    if (!subscriptionStatus || !paymentHistory) return null;
    
    const recentFailures = paymentHistory.failedPayments
      .filter(p => {
        const daysSince = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 30; // Last 30 days
      });
    
    return {
      health_score: calculateHealthScore(subscriptionStatus, recentFailures),
      risk_level: calculateRiskLevel(recentFailures.length),
      requires_attention: subscriptionStatus.isPastDue || recentFailures.length >= 2,
      next_billing_date: subscriptionStatus.next_billing_date,
      payment_method_status: getPaymentMethodHealth(paymentHistory)
    };
  }, [subscriptionStatus, paymentHistory]);
};
```

## Component Integration Patterns

### Subscription Status Component

```typescript
// src/components/billing/SubscriptionStatus.tsx
import { useSubscriptionStatus, useSubscriptionHealth } from '@/hooks/queries/usePaymentQueries';

export function SubscriptionStatus() {
  const { data: status, isLoading } = useSubscriptionStatus();
  const health = useSubscriptionHealth();
  
  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-24 rounded-lg" />;
  }
  
  if (!status) {
    return <EmptySubscriptionState />;
  }
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            EVIDENS {status.plan_tier?.charAt(0).toUpperCase() + status.plan_tier?.slice(1)}
          </h3>
          <p className="text-sm text-gray-600">
            {getStatusMessage(status)}
          </p>
        </div>
        
        <div className="text-right">
          <SubscriptionStatusBadge status={status.status} />
          {health?.requires_attention && (
            <Alert className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {getHealthAlert(health)}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
      
      {status.isTrialing && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm">
            Trial ends in {status.daysUntilTrialEnd} days
          </p>
          <Progress 
            value={(14 - status.daysUntilTrialEnd) / 14 * 100} 
            className="mt-2"
          />
        </div>
      )}
      
      <div className="mt-4 flex gap-2">
        {status.isPastDue && <RetryPaymentButton />}
        {status.isActive && <ManageSubscriptionButton />}
        {!status.isActive && <UpgradeSubscriptionButton />}
      </div>
    </Card>
  );
}

// Helper functions
const getStatusMessage = (status: any): string => {
  switch (status.status) {
    case 'trialing':
      return `Free trial active until ${format(new Date(status.trial_ends_at), 'MMM dd, yyyy')}`;
    case 'active':
      return 'Active subscription';
    case 'past_due':
      return 'Payment failed - please update payment method';
    case 'canceled':
      return 'Subscription canceled';
    default:
      return 'Unknown status';
  }
};
```

### Payment Method Manager

```typescript
// src/components/billing/PaymentMethodManager.tsx
export function PaymentMethodManager() {
  const { data: paymentMethods } = usePaymentMethods();
  const createCard = useCreatePaymentMethod();
  const updateSubscriptionPayment = useUpdateSubscriptionPayment();
  
  const handleAddCard = async (cardData: CardData) => {
    try {
      // Tokenize card on frontend (PCI compliance)
      const cardToken = await tokenizeCard(cardData);
      
      // Create payment method via Edge Function
      const paymentMethod = await createCard.mutateAsync({ cardToken });
      
      // Optionally update current subscription
      if (confirm('Use this card for your active subscription?')) {
        await updateSubscriptionPayment.mutateAsync({
          payment_method_id: paymentMethod.id
        });
      }
      
      toast.success('Payment method added successfully');
      
    } catch (error) {
      toast.error(`Failed to add payment method: ${error.message}`);
    }
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment Methods</h3>
      
      {paymentMethods?.map(method => (
        <PaymentMethodCard 
          key={method.id}
          method={method}
          onUpdate={updateSubscriptionPayment.mutate}
        />
      ))}
      
      <AddPaymentMethodForm onSubmit={handleAddCard} />
    </div>
  );
}
```

## Error Handling Patterns

### EVIDENS-Specific Error Handler

```typescript
// src/utils/paymentErrorHandler.ts
export class PaymentErrorHandler {
  
  static handleSubscriptionError(error: any): { message: string; action: string } {
    const errorCode = error.code || error.type;
    
    switch (errorCode) {
      case 'card_declined':
        return {
          message: 'Seu cartão foi recusado. Verifique os dados ou tente outro cartão.',
          action: 'update_payment_method'
        };
        
      case 'insufficient_funds':
        return {
          message: 'Saldo insuficiente. Verifique seu limite disponível.',
          action: 'retry_later'
        };
        
      case 'expired_card':
        return {
          message: 'Cartão expirado. Adicione um novo cartão de crédito.',
          action: 'update_payment_method'
        };
        
      case 'customer_not_found':
        return {
          message: 'Dados de pagamento não encontrados. Recadastre suas informações.',
          action: 'recreate_customer'
        };
        
      default:
        return {
          message: 'Erro no processamento do pagamento. Tente novamente ou contate o suporte.',
          action: 'contact_support'
        };
    }
  }
  
  static handlePaymentError(error: any): UserFriendlyError {
    const handler = this.handleSubscriptionError(error);
    
    return {
      ...handler,
      canRetry: ['retry_later', 'update_payment_method'].includes(handler.action),
      supportContact: handler.action === 'contact_support'
    };
  }
}

// Error boundary for payment components
export const PaymentErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="p-6 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-lg font-semibold text-red-800">
            Erro no Sistema de Pagamentos
          </h3>
          <p className="text-red-600 mt-2">
            {PaymentErrorHandler.handlePaymentError(error).message}
          </p>
          <Button 
            onClick={resetErrorBoundary}
            variant="outline"
            className="mt-4"
          >
            Tentar Novamente
          </Button>
        </div>
      )}
      onError={(error) => {
        // Log error for monitoring
        console.error('Payment component error:', error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
```

## User Experience Patterns

### Subscription Flow Components

```typescript
// src/components/billing/SubscriptionFlow.tsx
export function SubscriptionFlow() {
  const [currentStep, setCurrentStep] = useState<'plan' | 'payment' | 'confirmation'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  
  const createSubscription = useCreateSubscription();
  const { data: subscriptionStatus } = useSubscriptionStatus();
  
  // Skip flow if user already has active subscription
  if (subscriptionStatus?.isActive) {
    return <ActiveSubscriptionManager />;
  }
  
  const handlePlanSelection = (plan: string) => {
    setSelectedPlan(plan);
    setCurrentStep('payment');
  };
  
  const handlePaymentSubmission = async (paymentData: PaymentData) => {
    try {
      await createSubscription.mutateAsync({
        planTier: selectedPlan,
        paymentMethod: paymentData.method,
        cardToken: paymentData.cardToken,
        couponCode: paymentData.couponCode
      });
      
      setCurrentStep('confirmation');
      
    } catch (error) {
      const friendlyError = PaymentErrorHandler.handlePaymentError(error);
      toast.error(friendlyError.message);
    }
  };
  
  return (
    <PaymentErrorBoundary>
      <div className="max-w-2xl mx-auto">
        <ProgressIndicator currentStep={currentStep} />
        
        {currentStep === 'plan' && (
          <PlanSelectionStep 
            onSelect={handlePlanSelection}
          />
        )}
        
        {currentStep === 'payment' && (
          <PaymentMethodStep
            selectedPlan={selectedPlan}
            onSubmit={handlePaymentSubmission}
            isLoading={createSubscription.isPending}
          />
        )}
        
        {currentStep === 'confirmation' && (
          <SubscriptionConfirmation />
        )}
      </div>
    </PaymentErrorBoundary>
  );
}
```

### Trial Countdown Component

```typescript
// src/components/billing/TrialCountdown.tsx
export function TrialCountdown() {
  const { data: status } = useSubscriptionStatus();
  
  if (!status?.isTrialing) return null;
  
  const daysLeft = status.daysUntilTrialEnd;
  const urgencyLevel = daysLeft <= 3 ? 'high' : daysLeft <= 7 ? 'medium' : 'low';
  
  return (
    <Alert className={cn(
      'mb-4',
      urgencyLevel === 'high' && 'border-red-500 bg-red-50',
      urgencyLevel === 'medium' && 'border-yellow-500 bg-yellow-50',
      urgencyLevel === 'low' && 'border-blue-500 bg-blue-50'
    )}>
      <Clock className="h-4 w-4" />
      <AlertTitle>
        {urgencyLevel === 'high' ? '⚠️ Trial Ending Soon' : '🎁 Free Trial Active'}
      </AlertTitle>
      <AlertDescription>
        Your trial ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. 
        {urgencyLevel === 'high' && ' Subscribe now to maintain access.'}
      </AlertDescription>
      
      {urgencyLevel !== 'low' && (
        <div className="mt-3">
          <Button size="sm" onClick={() => window.location.href = '/subscription'}>
            Choose Plan
          </Button>
        </div>
      )}
    </Alert>
  );
}
```

## Analytics Integration

### Payment Metrics Hook

```typescript
// src/hooks/queries/useAnalyticsQueries.ts
export const usePaymentAnalytics = (timeRange: 'week' | 'month' | 'year' = 'month') => {
  return useQuery({
    queryKey: ['payment-analytics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/v1/analytics/payments?range=${timeRange}`);
      return response.json();
    },
    staleTime: 30 * 60 * 1000,    // 30 minutes
    select: (data) => ({
      revenue: data.total_revenue,
      subscriptions: {
        new: data.new_subscriptions,
        churned: data.churned_subscriptions,
        net_growth: data.new_subscriptions - data.churned_subscriptions
      },
      payment_methods: {
        credit_card_percentage: data.credit_card_usage,
        pix_percentage: data.pix_usage,
        boleto_percentage: data.boleto_usage
      },
      trial_conversion_rate: data.trial_to_paid_conversion,
      average_revenue_per_user: data.arpu,
      churn_rate: data.monthly_churn_rate
    })
  });
};
```

## Testing Patterns

### Payment Integration Tests

```typescript
// src/hooks/__tests__/useSubscriptionMutations.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCreateSubscription } from '../mutations/useSubscriptionMutations';

describe('useCreateSubscription', () => {
  it('should create subscription with valid data', async () => {
    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        subscription_id: 'sub_test_123',
        status: 'trialing',
        trial_ends_at: '2024-02-15T00:00:00Z'
      })
    });
    
    const { result } = renderHook(() => useCreateSubscription(), {
      wrapper: QueryClientWrapper
    });
    
    await waitFor(() => {
      result.current.mutate({
        planTier: 'premium',
        paymentMethod: 'credit_card',
        cardToken: 'card_token_test'
      });
    });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(fetch).toHaveBeenCalledWith('/api/v1/payment-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planTier: 'premium',
        paymentMethod: 'credit_card', 
        cardToken: 'card_token_test'
      })
    });
  });
  
  it('should handle payment errors gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({
        message: 'Card declined'
      })
    });
    
    const { result } = renderHook(() => useCreateSubscription(), {
      wrapper: QueryClientWrapper
    });
    
    await waitFor(() => {
      result.current.mutate({
        planTier: 'basic',
        paymentMethod: 'credit_card',
        cardToken: 'invalid_card_token'
      });
    });
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error.message).toContain('Card declined');
    });
  });
});
```

## Security Implementation

### Rate Limiting for Payment Operations

```typescript
// Implement in Edge Functions
const paymentRateLimiter = {
  subscription_creation: 5,       // 5 attempts per hour
  payment_method_update: 10,      // 10 updates per hour  
  coupon_validation: 20,          // 20 validations per hour
  webhook_processing: 1000        // High limit for webhooks
};

// Example usage in Edge Function
const checkRateLimit = async (operation: string, userId: string): Promise<boolean> => {
  const key = `payment_${operation}_${userId}`;
  const current = await redis.get(key);
  const limit = paymentRateLimiter[operation] || 10;
  
  if (current && parseInt(current) >= limit) {
    return false;
  }
  
  await redis.setex(key, 3600, (parseInt(current || '0') + 1).toString());
  return true;
};
```

## Monitoring & Alerting

### Payment Health Monitoring

```typescript
// Monitor critical payment metrics
export const setupPaymentMonitoring = () => {
  
  // Monitor failed payment rate
  useEffect(() => {
    const checkFailureRate = async () => {
      const { data } = await supabase
        .from('payment_events')
        .select('status')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
        
      const failures = data?.filter(e => e.status === 'failed').length || 0;
      const total = data?.length || 0;
      const failureRate = total > 0 ? (failures / total) * 100 : 0;
      
      // Alert if failure rate exceeds 15%
      if (failureRate > 15) {
        await sendAlert({
          type: 'high_failure_rate',
          metric: failureRate,
          timeframe: '1_hour'
        });
      }
    };
    
    // Check every 15 minutes
    const interval = setInterval(checkFailureRate, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
};
```

## Rate Limiting & Best Practices

- **Subscription Operations**: 5 requests/hour per user
- **Payment Method Updates**: 10 requests/hour per user
- **Coupon Validations**: 20 requests/hour per user
- **Always** implement proper error boundaries around payment components
- **Never** store sensitive payment data in application state
- **Monitor** subscription health and payment success rates
- **Implement** graceful degradation for payment service outages
- **Use** optimistic updates for better user experience
- **Always** validate payment data server-side

## Next Steps

See also:
- [Subscription Management](../subscriptions/subscriptions.md)
- [Payment Methods](../payment-methods/) for specific implementation guides
- [Webhook Configuration](../api-reference/webhooks.md) 
- [Security Guidelines](../api-reference/authentication.md)