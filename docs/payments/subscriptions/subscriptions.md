# Subscription Management with Pagar.me

## Overview

Pagar.me provides comprehensive subscription billing through a two-tier system:
- **Plans**: Reusable templates defining billing intervals, pricing, and terms
- **Subscriptions**: Active customer subscriptions linked to plans

## Plan Management

### Creating Plans

Plans are templates that define billing structure and can be reused across multiple customers.

```typescript
// Plan creation interface
interface PagarmePlan {
  name: string;                    // Plan display name
  description?: string;            // Plan description 
  interval: 'month' | 'week' | 'day' | 'year'; // Billing frequency
  interval_count: number;          // Number of intervals between charges
  trial_period_days?: number;      // Free trial days
  billing_type: 'prepaid' | 'postpaid' | 'exact_day';
  billing_day?: number;           // Required if billing_type is 'exact_day'
  minimum_price?: number;         // Minimum charge amount (in cents)
  payment_methods: PaymentMethod[]; // ['credit_card', 'boleto', 'pix']
  installments: number[];         // Allowed installment options
  statement_descriptor?: string;   // Max 13 characters
  currency: 'BRL';
  items: PlanItem[];
  metadata?: Record<string, string>;
}

interface PlanItem {
  name: string;
  description?: string;
  quantity: number;
  cycles?: number;               // Number of billing cycles (optional = infinite)
  pricing_scheme: {
    scheme_type: 'unit' | 'tier' | 'volume';
    price: number;               // Price in cents
  };
}
```

**Plan Creation Example:**
```typescript
const createPlan = async (): Promise<PagarmePlan> => {
  const response = await fetch('https://api.pagar.me/core/v5/plans', {
    method: 'POST',
    headers: authenticatePagarme(PAGAR_ME_SECRET_KEY),
    body: JSON.stringify({
      name: 'EVIDENS Premium',
      description: 'Plano mensal premium com acesso completo',
      interval: 'month',
      interval_count: 1,
      trial_period_days: 7,        // 7-day free trial
      billing_type: 'prepaid',     // Charge before period starts
      minimum_price: 1000,         // R$ 10.00 minimum
      payment_methods: ['credit_card', 'pix'],
      installments: [1],           // Only monthly payments
      statement_descriptor: 'EVIDENS',
      currency: 'BRL',
      items: [
        {
          name: 'Acesso Premium EVIDENS',
          quantity: 1,
          pricing_scheme: {
            scheme_type: 'unit',
            price: 4990              // R$ 49.90 per month
          }
        }
      ],
      metadata: {
        plan_type: 'premium',
        feature_access: 'full'
      }
    })
  });
  
  return response.json();
};
```

### Billing Types

| Type | Description | Use Case |
|------|-------------|----------|
| `prepaid` | Charge before service period | Standard SaaS subscriptions |
| `postpaid` | Charge after service period | Usage-based billing |
| `exact_day` | Charge on specific day of month | Enterprise contracts |

### Plan Items & Pricing

**One-time vs Recurring Items:**
```typescript
const planWithMixedItems = {
  items: [
    {
      name: 'Monthly Subscription',
      quantity: 1,
      // No cycles = infinite billing
      pricing_scheme: { scheme_type: 'unit', price: 4990 }
    },
    {
      name: 'Setup Fee',
      quantity: 1,
      cycles: 1,                   // Only charge once
      pricing_scheme: { scheme_type: 'unit', price: 9990 }
    }
  ]
};
```

## Subscription Lifecycle

### Creating Subscriptions

Subscriptions tie customers to plans with specific payment methods.

```typescript
interface PagarmeSubscription {
  code?: string;                   // Your internal subscription ID
  start_at?: string;              // ISO 8601 date (defaults to immediate)
  customer?: PagarmeCustomer;     // OR customer_id if existing
  customer_id?: string;           
  plan_id?: string;               // Use existing plan
  billing_type?: 'prepaid' | 'postpaid' | 'exact_day';
  billing_day?: number;           // Required if billing_type is 'exact_day'
  interval?: 'month' | 'week' | 'day' | 'year';
  interval_count?: number;
  minimum_price?: number;
  items?: SubscriptionItem[];     // Override plan items
  discounts?: Discount[];
  increments?: Increment[];
  payment_method: PaymentMethod;
  metadata?: Record<string, string>;
}
```

**Direct Subscription Creation (without plan):**
```typescript
const createSubscription = async (customerId: string): Promise<PagarmeSubscription> => {
  return await fetch('https://api.pagar.me/core/v5/subscriptions', {
    method: 'POST',
    headers: authenticatePagarme(PAGAR_ME_SECRET_KEY),
    body: JSON.stringify({
      customer_id: customerId,
      billing_type: 'prepaid',
      interval: 'month',
      interval_count: 1,
      minimum_price: 100,
      items: [
        {
          description: 'EVIDENS Premium Access',
          quantity: 1,
          cycles: 12,              // 12 months subscription
          pricing_scheme: {
            scheme_type: 'unit',
            price: 4990
          }
        }
      ],
      payment_method: 'credit_card',
      card_id: cardId,             // Use stored card
      credit_card: {
        installments: 1,
        statement_descriptor: 'EVIDENS'
      },
      metadata: {
        subscription_type: 'premium',
        user_id: userId
      }
    })
  }).then(res => res.json());
};
```

### Subscription States

| Status | Description | Next Actions |
|--------|-------------|--------------|
| `trialing` | In free trial period | Monitor trial end |
| `active` | Active subscription with successful billing | Monitor renewal |
| `past_due` | Failed payment, grace period active | Retry payment |
| `canceled` | User canceled, no future billing | Reactivation possible |
| `unpaid` | Payment failures exceeded retry limit | Manual intervention required |

## Billing Management

### Automatic vs Manual Billing

```typescript
// Enable manual billing control
const enableManualBilling = async (subscriptionId: string): Promise<void> => {
  await fetch(`https://api.pagar.me/core/v5/subscriptions/${subscriptionId}/manual-billing`, {
    method: 'POST',
    headers: authenticatePagarme(PAGAR_ME_SECRET_KEY),
    body: JSON.stringify({ enabled: true })
  });
};

// Create manual invoice
const createManualInvoice = async (subscriptionId: string): Promise<PagarmeInvoice> => {
  return await fetch('https://api.pagar.me/core/v5/invoices', {
    method: 'POST',
    headers: authenticatePagarme(PAGAR_ME_SECRET_KEY),
    body: JSON.stringify({
      subscription_id: subscriptionId,
      auto_advance: true
    })
  }).then(res => res.json());
};
```

### Billing Date Management

**Critical Business Rules:**
1. **Active Cycle**: Can only reschedule within next cycle if current cycle is billed
2. **Scheduled Subscription**: Date must be within next cycle interval
3. **Unbilled Cycle**: New date must be before current cycle end
4. **Daily Intervals**: Billing date changes not allowed

```typescript
const updateBillingDate = async (subscriptionId: string, newDate: string): Promise<void> => {
  // Validate date restrictions based on subscription status
  await fetch(`https://api.pagar.me/core/v5/subscriptions/${subscriptionId}/billing-date`, {
    method: 'PUT',
    headers: authenticatePagarme(PAGAR_ME_SECRET_KEY),
    body: JSON.stringify({
      billing_at: newDate  // ISO 8601 format
    })
  });
};
```

## Pricing & Discounts

### Discount System

```typescript
interface Discount {
  discount_type: 'percentage' | 'amount';
  value: number;                 // Percentage (1-100) or amount in cents
  cycles?: number;              // Number of cycles to apply (optional = infinite)
}

// Example: 20% off for first 3 months
const welcomeDiscount: Discount = {
  discount_type: 'percentage',
  value: 20,
  cycles: 3
};
```

### Price Increments

```typescript
interface Increment {
  increment_type: 'percentage' | 'amount';
  value: number;
  cycles?: number;
}

// Example: 10% price increase after first year
const annualIncrease: Increment = {
  increment_type: 'percentage',
  value: 10,
  cycles: 12                     // Apply after 12 monthly cycles
};
```

## Advanced Subscription Features

### Payment Method Updates

```typescript
// Update subscription payment method
const updateSubscriptionPayment = async (
  subscriptionId: string, 
  cardId: string
): Promise<void> => {
  await fetch(`https://api.pagar.me/core/v5/subscriptions/${subscriptionId}/card`, {
    method: 'PUT',
    headers: authenticatePagarme(PAGAR_ME_SECRET_KEY),
    body: JSON.stringify({
      card_id: cardId
    })
  });
};
```

### Subscription Items Management

```typescript
// Add item to existing subscription
const addSubscriptionItem = async (
  subscriptionId: string,
  item: SubscriptionItem
): Promise<PagarmeSubscriptionItem> => {
  return await fetch(`https://api.pagar.me/core/v5/subscriptions/${subscriptionId}/items`, {
    method: 'POST',
    headers: authenticatePagarme(PAGAR_ME_SECRET_KEY),
    body: JSON.stringify(item)
  }).then(res => res.json());
};

// Update item in subscription
const updateSubscriptionItem = async (
  subscriptionId: string,
  itemId: string,
  updates: Partial<SubscriptionItem>
): Promise<PagarmeSubscriptionItem> => {
  return await fetch(`https://api.pagar.me/core/v5/subscriptions/${subscriptionId}/items/${itemId}`, {
    method: 'PUT',
    headers: authenticatePagarme(PAGAR_ME_SECRET_KEY),
    body: JSON.stringify(updates)
  }).then(res => res.json());
};
```

## EVIDENS Integration Patterns

### Subscription Hook Example

```typescript
// TanStack Query hook for subscription management
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateSubscriptionRequest) => {
      const response = await fetch('/api/v1/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Subscription creation failed: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (newSubscription) => {
      // Invalidate user queries to reflect subscription status
      queryClient.invalidateQueries({ queryKey: ['user-status'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      
      // Optimistic update for immediate UI feedback
      queryClient.setQueryData(['user-subscription'], newSubscription);
    }
  });
};

export const useSubscriptionStatus = () => {
  return useQuery({
    queryKey: ['user-subscription'],
    queryFn: async () => {
      const response = await fetch('/api/v1/subscription/status');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,      // 5 minutes
    gcTime: 10 * 60 * 1000         // 10 minutes
  });
};
```

### Edge Function Pattern

```typescript
// supabase/functions/subscription/index.ts
import { authenticatePagarme } from '../_shared/auth.ts';

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  
  // Verify user authentication
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { user, error } = await supabase.auth.getUser(jwt);
  if (error || !user) return sendError('Unauthorized', 401);
  
  if (req.method === 'POST') {
    try {
      const { planId, paymentMethod } = await req.json();
      
      // Create subscription with Pagar.me
      const subscription = await fetch('https://api.pagar.me/core/v5/subscriptions', {
        method: 'POST',
        headers: authenticatePagarme(PAGAR_ME_SECRET_KEY),
        body: JSON.stringify({
          customer_id: user.user_metadata.pagarme_customer_id,
          plan_id: planId,
          payment_method: paymentMethod,
          metadata: {
            supabase_user_id: user.id,
            created_via: 'evidens_app'
          }
        })
      });
      
      const subscriptionData = await subscription.json();
      
      // Update user record in Supabase
      await supabase
        .from('users')
        .update({ 
          subscription_id: subscriptionData.id,
          subscription_status: subscriptionData.status,
          subscription_plan: planId
        })
        .eq('id', user.id);
      
      return sendSuccess(subscriptionData);
      
    } catch (error) {
      console.error('Subscription creation failed:', error);
      return sendError('Subscription creation failed', 500);
    }
  }
  
  return sendError('Method not allowed', 405);
}
```

### Subscription Status Management

```typescript
// Real-time subscription status tracking
export const useSubscriptionStatusUpdates = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('subscription_updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${user.id}` 
      }, (payload) => {
        // Invalidate subscription queries when user data updates
        queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      })
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [user?.id]);
};
```

## Validation Schemas

```typescript
import { z } from 'zod';

export const planCreationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  interval: z.enum(['month', 'week', 'day', 'year']),
  interval_count: z.number().min(1).max(365),
  trial_period_days: z.number().min(0).max(365).optional(),
  billing_type: z.enum(['prepaid', 'postpaid', 'exact_day']),
  billing_day: z.number().min(1).max(31).optional(),
  minimum_price: z.number().min(100),  // R$ 1.00 minimum
  payment_methods: z.array(z.enum(['credit_card', 'boleto', 'pix'])),
  installments: z.array(z.number().min(1).max(12)),
  items: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().min(1),
    cycles: z.number().min(1).optional(),
    pricing_scheme: z.object({
      scheme_type: z.enum(['unit', 'tier', 'volume']),
      price: z.number().min(100)
    })
  }))
});

export const subscriptionCreationSchema = z.object({
  customer_id: z.string().min(1),
  plan_id: z.string().min(1).optional(),
  code: z.string().max(52).optional(),
  start_at: z.string().datetime().optional(),
  payment_method: z.enum(['credit_card', 'boleto', 'pix']),
  card_id: z.string().optional(),
  metadata: z.record(z.string()).optional()
});
```

## Error Handling

### Common Subscription Errors

```typescript
const handleSubscriptionError = (error: PagarmeError) => {
  switch (error.type) {
    case 'invalid_request_error':
      if (error.parameter === 'billing_day') {
        throw new Error('Billing day must be between 1-28 for monthly subscriptions');
      }
      break;
      
    case 'card_error':
      if (error.code === 'card_declined') {
        throw new Error('Payment method declined. Please try another card.');
      }
      break;
      
    case 'api_error':
      if (error.code === 'processing_error') {
        throw new Error('Temporary processing issue. Please try again.');
      }
      break;
      
    default:
      throw new Error('Subscription operation failed. Please contact support.');
  }
};
```

### Retry Logic for Failed Charges

```typescript
export const handleFailedSubscriptionPayment = async (subscriptionId: string) => {
  const maxRetries = 3;
  const retryDelays = [24, 72, 168]; // Hours: 1 day, 3 days, 1 week
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Attempt payment retry
      const invoice = await fetch(`https://api.pagar.me/core/v5/subscriptions/${subscriptionId}/invoices`, {
        method: 'POST',
        headers: authenticatePagarme(PAGAR_ME_SECRET_KEY)
      });
      
      if (invoice.ok) {
        console.log(`Payment retry ${attempt + 1} succeeded`);
        return await invoice.json();
      }
      
    } catch (error) {
      console.log(`Payment retry ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries - 1) {
        // Schedule next retry
        const delayHours = retryDelays[attempt];
        await scheduleRetry(subscriptionId, delayHours);
      } else {
        // All retries failed, mark subscription as past due
        await markSubscriptionPastDue(subscriptionId);
      }
    }
  }
};
```

## Security & Compliance

### PCI Compliance for Recurring Payments

```typescript
// CRITICAL: Never store raw card data for subscriptions
// Always use card_id or card_token for recurring billing

const createSecureSubscription = async (customerData: CustomerData) => {
  // 1. First create/get customer
  const customer = await createOrGetCustomer(customerData);
  
  // 2. Tokenize card (frontend responsibility)
  const cardToken = await tokenizeCard(cardData); // Done on frontend
  
  // 3. Create subscription with token only
  const subscription = await fetch('https://api.pagar.me/core/v5/subscriptions', {
    method: 'POST',
    headers: authenticatePagarme(PAGAR_ME_SECRET_KEY),
    body: JSON.stringify({
      customer_id: customer.id,
      // Use token, never raw card data
      card_token: cardToken,
      // ... rest of subscription data
    })
  });
  
  return subscription.json();
};
```

### Webhook Integration for Subscription Events

```typescript
// Handle subscription lifecycle events
export const handleSubscriptionWebhook = async (event: PagarmeWebhookEvent) => {
  const { type, data } = event;
  
  switch (type) {
    case 'subscription.created':
      await updateUserSubscriptionStatus(data.object, 'active');
      await sendWelcomeEmail(data.object.customer);
      break;
      
    case 'subscription.charged':
      await updateUserSubscriptionStatus(data.object, 'active');
      await sendPaymentConfirmation(data.object);
      break;
      
    case 'subscription.payment_failed':
      await updateUserSubscriptionStatus(data.object, 'past_due');
      await sendPaymentFailureNotification(data.object);
      break;
      
    case 'subscription.canceled':
      await updateUserSubscriptionStatus(data.object, 'canceled');
      await sendCancellationConfirmation(data.object);
      break;
      
    case 'subscription.trial_ended':
      await processTrialExpiration(data.object);
      break;
  }
};
```

## Business Logic Examples

### EVIDENS Subscription Tiers

```typescript
// Define EVIDENS subscription plans
export const EVIDENS_PLANS = {
  BASIC: {
    name: 'EVIDENS Básico',
    price: 1990,                  // R$ 19.90
    features: ['5 reviews/month', 'Basic templates'],
    trial_days: 7
  },
  PREMIUM: {
    name: 'EVIDENS Premium', 
    price: 4990,                  // R$ 49.90
    features: ['Unlimited reviews', 'Advanced templates', 'Priority support'],
    trial_days: 14
  },
  ENTERPRISE: {
    name: 'EVIDENS Enterprise',
    price: 9990,                  // R$ 99.90
    features: ['Team collaboration', 'Custom integrations', 'Dedicated support'],
    trial_days: 30
  }
} as const;

// Create plan-based subscription
export const createEvidensSubscription = async (
  tier: keyof typeof EVIDENS_PLANS,
  customerData: CustomerData,
  paymentMethod: PaymentMethod
) => {
  const plan = EVIDENS_PLANS[tier];
  
  return await createSubscription({
    customer: customerData,
    billing_type: 'prepaid',
    interval: 'month',
    interval_count: 1,
    trial_period_days: plan.trial_days,
    items: [
      {
        description: plan.name,
        quantity: 1,
        pricing_scheme: {
          scheme_type: 'unit',
          price: plan.price
        }
      }
    ],
    payment_method: paymentMethod,
    metadata: {
      evidens_tier: tier,
      features: JSON.stringify(plan.features)
    }
  });
};
```

## Rate Limiting & Best Practices

- **Plan Operations**: 100 requests/minute
- **Subscription Operations**: 200 requests/minute  
- **Billing Operations**: 50 requests/minute
- **Always** implement exponential backoff for retries
- **Never** store sensitive payment data in your application
- **Always** validate billing date changes against business rules
- **Monitor** subscription health with automated alerts

## Next Steps

See also:
- [Authentication Guide](../api-reference/authentication.md)
- [Customer Management](../api-reference/customers.md) 
- [Webhook Implementation](../api-reference/webhooks.md)
- [Payment Methods](../payment-methods/) for integration patterns