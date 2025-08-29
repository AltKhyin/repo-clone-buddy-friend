# Marketplace & Split Payments

## Overview

Pagar.me enables marketplace functionality through split payments, allowing revenue sharing between multiple parties in a single transaction. This is essential for platforms that connect buyers with multiple sellers or service providers.

## Split Payment Architecture

### Revenue Distribution Models

```typescript
interface SplitRule {
  recipient_id: string;           // Recipient account ID
  amount?: number;               // Fixed amount in cents
  percentage?: number;           // Percentage of transaction (1-100)
  liable?: boolean;              // Responsible for chargebacks
  charge_processing_fee?: boolean; // Who pays Pagar.me fees
}

interface SplitPayment {
  amount: number;                // Total transaction amount
  split_rules: SplitRule[];      // Revenue distribution rules
}
```

### Split Configuration Examples

**Fixed Amount Split:**
```typescript
const fixedSplit: SplitPayment = {
  amount: 10000,  // R$ 100.00 total
  split_rules: [
    {
      recipient_id: 'rp_platform_123',
      amount: 1000,               // R$ 10.00 to platform
      liable: true,               // Platform handles chargebacks
      charge_processing_fee: true  // Platform pays fees
    },
    {
      recipient_id: 'rp_seller_456',
      amount: 9000,               // R$ 90.00 to seller
      liable: false,
      charge_processing_fee: false
    }
  ]
};
```

**Percentage-Based Split:**
```typescript
const percentageSplit: SplitPayment = {
  amount: 10000,  // R$ 100.00 total
  split_rules: [
    {
      recipient_id: 'rp_platform_123',
      percentage: 15,             // 15% to platform (R$ 15.00)
      liable: true,
      charge_processing_fee: true
    },
    {
      recipient_id: 'rp_author_789',
      percentage: 70,             // 70% to content author (R$ 70.00)
      liable: false,
      charge_processing_fee: false
    },
    {
      recipient_id: 'rp_reviewer_321',
      percentage: 15,             // 15% to reviewer (R$ 15.00)
      liable: false,
      charge_processing_fee: false
    }
  ]
};
```

## Recipient Management

### Creating Recipients

```typescript
interface PagarmeRecipient {
  name: string;
  email: string;
  document: string;
  document_type: 'cpf' | 'cnpj';
  type: 'individual' | 'corporation';
  bank_account: BankAccount;
  transfer_settings: {
    transfer_enabled: boolean;
    transfer_interval: 'daily' | 'weekly' | 'monthly';
    transfer_day?: number;       // For weekly/monthly intervals
  };
  metadata?: Record<string, string>;
}

const createRecipient = async (data: PagarmeRecipient): Promise<PagarmeRecipient> => {
  const response = await fetch('https://api.pagar.me/core/v5/recipients', {
    method: 'POST',
    headers: authenticatePagarme(PAGAR_ME_SECRET_KEY),
    body: JSON.stringify(data)
  });
  
  return response.json();
};
```

### Bank Account Configuration

```typescript
interface BankAccount {
  holder_name: string;
  holder_type: 'individual' | 'corporation';
  holder_document: string;
  bank: string;                  // Bank code (e.g., '033' for Santander)
  branch_number: string;         // Agency number
  branch_check_digit?: string;   // Agency check digit
  account_number: string;
  account_check_digit: string;
  type: 'checking' | 'savings';
}

// EVIDENS author recipient example
const createAuthorRecipient = async (authorData: AuthorData) => {
  return await createRecipient({
    name: authorData.name,
    email: authorData.email,
    document: authorData.cpf,
    document_type: 'cpf',
    type: 'individual',
    bank_account: authorData.bankAccount,
    transfer_settings: {
      transfer_enabled: true,
      transfer_interval: 'weekly',   // Weekly payouts
      transfer_day: 5               // Every Friday
    },
    metadata: {
      evidens_author_id: authorData.id,
      registration_date: new Date().toISOString()
    }
  });
};
```

## Subscription Splits

### Recurring Revenue Sharing

```typescript
// Create subscription with automatic split rules
const createSplitSubscription = async (customerData: CustomerData, planId: string) => {
  const subscription = await fetch('https://api.pagar.me/core/v5/subscriptions', {
    method: 'POST',
    headers: authenticatePagarme(PAGAR_ME_SECRET_KEY),
    body: JSON.stringify({
      customer_id: customerData.id,
      plan_id: planId,
      payment_method: 'credit_card',
      card_id: customerData.card_id,
      
      // Automatic split for all recurring payments
      split_rules: [
        {
          recipient_id: 'rp_evidens_platform',
          percentage: 30,          // 30% to EVIDENS platform
          liable: true,
          charge_processing_fee: true
        },
        {
          recipient_id: 'rp_content_creator',
          percentage: 70,          // 70% to content creator
          liable: false,
          charge_processing_fee: false
        }
      ],
      
      metadata: {
        subscription_type: 'content_creator_revenue_share',
        creator_id: customerData.creator_id
      }
    })
  });
  
  return subscription.json();
};
```

## Advanced Use Cases

### Dynamic Split Rules

```typescript
// Calculate dynamic splits based on business logic
export const calculateDynamicSplit = (
  totalAmount: number,
  authorTier: 'bronze' | 'silver' | 'gold',
  reviewCount: number
): SplitRule[] => {
  
  // Dynamic percentage based on author performance
  const authorPercentages = {
    bronze: 60,    // New authors get 60%
    silver: 70,    // Established authors get 70%
    gold: 80       // Top authors get 80%
  };
  
  const authorPercentage = authorPercentages[authorTier];
  const platformPercentage = 100 - authorPercentage;
  
  return [
    {
      recipient_id: 'rp_evidens_platform',
      percentage: platformPercentage,
      liable: true,
      charge_processing_fee: true
    },
    {
      recipient_id: getAuthorRecipientId(authorTier),
      percentage: authorPercentage,
      liable: false,
      charge_processing_fee: false
    }
  ];
};
```

### Multi-Party Splits

```typescript
// Complex revenue sharing for collaborative content
export const createCollaborativeSplit = (
  totalAmount: number,
  collaborators: Collaborator[]
): SplitRule[] => {
  const platformFee = 20; // 20% to platform
  const remainingPercentage = 80;
  
  const collaboratorSplit = remainingPercentage / collaborators.length;
  
  return [
    // Platform gets fixed percentage
    {
      recipient_id: 'rp_evidens_platform',
      percentage: platformFee,
      liable: true,
      charge_processing_fee: true
    },
    // Split remainder equally among collaborators
    ...collaborators.map(collab => ({
      recipient_id: collab.recipient_id,
      percentage: Math.floor(collaboratorSplit),
      liable: false,
      charge_processing_fee: false
    }))
  ];
};
```

## Transfer Management

### Automated Transfers

```typescript
interface TransferSchedule {
  recipient_id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_week?: number;          // For weekly (0=Sunday, 6=Saturday)
  day_of_month?: number;         // For monthly (1-31)
  minimum_amount?: number;       // Minimum amount to trigger transfer
}

// Configure automatic transfer schedules
const configureTransfers = async (recipientId: string, schedule: TransferSchedule) => {
  await fetch(`https://api.pagar.me/core/v5/recipients/${recipientId}/transfer-settings`, {
    method: 'PUT',
    headers: authenticatePagarme(PAGAR_ME_SECRET_KEY),
    body: JSON.stringify({
      transfer_enabled: true,
      transfer_interval: schedule.frequency,
      transfer_day: schedule.day_of_week || schedule.day_of_month,
      minimum_amount: schedule.minimum_amount || 1000  // R$ 10.00 minimum
    })
  });
};
```

## EVIDENS Marketplace Implementation

### Author Revenue System

```typescript
// EVIDENS-specific marketplace patterns
export class EvidensMarketplace {
  
  // Register new content author as recipient
  async registerAuthor(authorData: AuthorData): Promise<string> {
    const recipient = await createRecipient({
      name: authorData.name,
      email: authorData.email,
      document: authorData.cpf,
      document_type: 'cpf',
      type: 'individual',
      bank_account: authorData.bankAccount,
      transfer_settings: {
        transfer_enabled: true,
        transfer_interval: 'weekly',
        transfer_day: 5  // Fridays
      },
      metadata: {
        evidens_author_id: authorData.id,
        tier: 'bronze',  // Start all authors at bronze
        join_date: new Date().toISOString()
      }
    });
    
    // Update author record in Supabase
    await supabase
      .from('authors')
      .update({ 
        pagar_me_recipient_id: recipient.id,
        revenue_share_active: true 
      })
      .eq('id', authorData.id);
    
    return recipient.id;
  }
  
  // Process payment with author revenue share
  async processReviewPayment(
    customerId: string,
    authorId: string,
    amount: number
  ): Promise<PagarmeOrder> {
    
    // Get author tier for dynamic split calculation
    const { data: author } = await supabase
      .from('authors')
      .select('tier, pagar_me_recipient_id')
      .eq('id', authorId)
      .single();
    
    const splitRules = calculateDynamicSplit(amount, author.tier, 0);
    
    return await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers: authenticatePagarme(PAGAR_ME_SECRET_KEY),
      body: JSON.stringify({
        customer_id: customerId,
        amount,
        items: [{
          description: `Review Content by ${author.name}`,
          amount,
          quantity: 1
        }],
        split_rules: splitRules,
        metadata: {
          evidens_transaction_type: 'content_purchase',
          author_id: authorId,
          revenue_model: 'dynamic_split'
        }
      })
    }).then(res => res.json());
  }
}
```

### Revenue Analytics

```typescript
// Track marketplace performance
export const useMarketplaceAnalytics = () => {
  return useQuery({
    queryKey: ['marketplace-analytics'],
    queryFn: async () => {
      // Aggregate revenue data across recipients
      const response = await fetch('/api/v1/marketplace/analytics');
      return response.json();
    },
    staleTime: 30 * 60 * 1000,    // 30 minutes
    select: (data) => ({
      totalRevenue: data.total_amount,
      platformRevenue: data.platform_amount, 
      authorRevenue: data.author_amount,
      topAuthors: data.top_performers,
      revenueByTier: data.tier_breakdown
    })
  });
};
```

## Security & Compliance

### Split Rule Validation

```typescript
import { z } from 'zod';

export const splitRuleSchema = z.object({
  recipient_id: z.string().min(1),
  amount: z.number().min(100).optional(),        // Minimum R$ 1.00
  percentage: z.number().min(1).max(100).optional(),
  liable: z.boolean().default(false),
  charge_processing_fee: z.boolean().default(false)
}).refine(data => {
  // Must have either amount OR percentage, not both
  return (data.amount && !data.percentage) || (!data.amount && data.percentage);
}, {
  message: "Must specify either amount or percentage, not both"
});

export const validateSplitRules = (rules: SplitRule[], totalAmount: number) => {
  // Validate percentage splits don't exceed 100%
  const totalPercentage = rules
    .filter(rule => rule.percentage)
    .reduce((sum, rule) => sum + (rule.percentage || 0), 0);
    
  if (totalPercentage > 100) {
    throw new Error('Split percentages cannot exceed 100%');
  }
  
  // Validate fixed amount splits don't exceed total
  const totalFixedAmount = rules
    .filter(rule => rule.amount)
    .reduce((sum, rule) => sum + (rule.amount || 0), 0);
    
  if (totalFixedAmount > totalAmount) {
    throw new Error('Split amounts cannot exceed transaction total');
  }
  
  // At least one recipient must be liable for chargebacks
  const hasLiableRecipient = rules.some(rule => rule.liable);
  if (!hasLiableRecipient) {
    throw new Error('At least one recipient must be liable for chargebacks');
  }
};
```

## Error Handling

### Split Payment Failures

```typescript
const handleSplitPaymentError = (error: PagarmeError) => {
  switch (error.code) {
    case 'recipient_not_found':
      throw new Error('One or more recipients do not exist');
      
    case 'recipient_not_active':
      throw new Error('Recipient account is not active for receiving transfers');
      
    case 'split_amount_invalid':
      throw new Error('Split amounts do not match transaction total');
      
    case 'split_percentage_invalid':
      throw new Error('Split percentages exceed 100%');
      
    case 'recipient_balance_insufficient':
      throw new Error('Recipient has insufficient balance for liability');
      
    default:
      throw new Error(`Split payment failed: ${error.message}`);
  }
};
```

## Integration Patterns

### EVIDENS Revenue Sharing Hook

```typescript
export const useCreateSplitPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateSplitPaymentRequest) => {
      // Calculate dynamic splits
      const splitRules = calculateDynamicSplit(
        data.amount,
        data.authorTier,
        data.reviewCount
      );
      
      // Validate before submission
      validateSplitRules(splitRules, data.amount);
      
      const response = await fetch('/api/v1/payments/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          split_rules: splitRules
        })
      });
      
      if (!response.ok) {
        throw new Error(`Split payment failed: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (payment) => {
      // Update marketplace analytics
      queryClient.invalidateQueries({ queryKey: ['marketplace-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['author-earnings'] });
      
      // Update payment history
      queryClient.setQueryData(['payment-history'], (old: any) => 
        old ? [payment, ...old] : [payment]
      );
    }
  });
};
```

### Subscription Splits

```typescript
// Apply split rules to recurring subscriptions
const createSubscriptionWithSplits = async (subscriptionData: any) => {
  return await fetch('https://api.pagar.me/core/v5/subscriptions', {
    method: 'POST', 
    headers: authenticatePagarme(PAGAR_ME_SECRET_KEY),
    body: JSON.stringify({
      ...subscriptionData,
      
      // Split rules applied to every recurring payment
      split_rules: [
        {
          recipient_id: 'rp_evidens_platform',
          percentage: 30,
          liable: true,
          charge_processing_fee: true
        },
        {
          recipient_id: subscriptionData.author_recipient_id,
          percentage: 70,
          liable: false,
          charge_processing_fee: false
        }
      ]
    })
  }).then(res => res.json());
};
```

## Transfer Monitoring

### Transfer Status Tracking

```typescript
export const useTransferHistory = (recipientId: string) => {
  return useQuery({
    queryKey: ['transfers', recipientId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/recipients/${recipientId}/transfers`);
      return response.json();
    },
    select: (data) => ({
      transfers: data.data,
      totalTransferred: data.total_amount,
      pendingAmount: data.pending_amount,
      lastTransfer: data.data[0]
    })
  });
};

// Monitor transfer failures
export const useTransferFailures = () => {
  return useQuery({
    queryKey: ['transfer-failures'],
    queryFn: async () => {
      const response = await fetch('/api/v1/transfers/failures');
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000,  // Check every 5 minutes
    select: (data) => ({
      failedTransfers: data.failed_transfers,
      requiresAction: data.failed_transfers.filter(t => t.status === 'requires_action')
    })
  });
};
```

## Business Rules & Compliance

### Brazilian Marketplace Regulations

```typescript
// Ensure compliance with Brazilian payment regulations
const validateMarketplaceLegal = (splitRules: SplitRule[], totalAmount: number) => {
  // Minimum transfer amount (R$ 1.00)
  const minimumTransfer = 100;
  
  splitRules.forEach(rule => {
    const transferAmount = rule.amount || (totalAmount * (rule.percentage || 0) / 100);
    
    if (transferAmount < minimumTransfer) {
      throw new Error('Transfer amounts must be at least R$ 1.00');
    }
  });
  
  // Platform must be liable for compliance
  const platformRule = splitRules.find(rule => 
    rule.recipient_id.includes('platform') || rule.liable
  );
  
  if (!platformRule || !platformRule.liable) {
    throw new Error('Platform must be liable for regulatory compliance');
  }
};
```

### Tax Reporting Integration

```typescript
// Generate tax reports for recipients
export const generateRecipientTaxReport = async (
  recipientId: string,
  year: number
): Promise<TaxReport> => {
  const transfers = await fetch(
    `/api/v1/recipients/${recipientId}/transfers?year=${year}`
  ).then(res => res.json());
  
  return {
    recipient_id: recipientId,
    total_received: transfers.reduce((sum, t) => sum + t.amount, 0),
    transfer_count: transfers.length,
    average_transfer: transfers.length > 0 ? 
      transfers.reduce((sum, t) => sum + t.amount, 0) / transfers.length : 0,
    tax_year: year,
    generated_at: new Date().toISOString()
  };
};
```

## Rate Limiting & Best Practices

- **Recipient Operations**: 100 requests/minute
- **Split Calculations**: Validate client-side before API calls
- **Transfer Monitoring**: Use webhooks instead of polling
- **Always** implement proper error boundaries for marketplace failures
- **Never** store bank account details in application database
- **Monitor** recipient account health and transfer success rates
- **Implement** automated alerts for failed transfers

## Next Steps

See also:
- [Subscription Management](subscriptions.md)
- [Webhook Events](../api-reference/webhooks.md)
- [Authentication](../api-reference/authentication.md)
- [Error Handling](../api-reference/error-handling.md)