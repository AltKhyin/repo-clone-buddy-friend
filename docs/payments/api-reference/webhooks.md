# Pagar.me Webhook Integration Guide

## Overview

Webhooks provide real-time notifications about payment events, ensuring EVIDENS stays synchronized with Pagar.me payment status changes. This guide covers webhook setup, security verification, event handling, and integration patterns.

## Webhook Event Structure

### **Core Webhook Payload**

```typescript
interface PagarmeWebhookPayload {
  id: string;                    // Event ID
  account: {                     // Account information
    id: string;                  // Pagar.me account ID
    name: string;                // Account name
  };
  type: WebhookEventType;        // Event type
  created_at: string;            // Event timestamp (ISO)
  data: {                        // Event data object
    object: any;                 // The actual object (order, charge, etc.)
  };
}

type WebhookEventType = 
  // Order events
  | 'order.created'
  | 'order.paid' 
  | 'order.payment_failed'
  | 'order.canceled'
  | 'order.refunded'
  
  // Charge events  
  | 'charge.created'
  | 'charge.paid'
  | 'charge.failed'
  | 'charge.canceled'
  | 'charge.refunded'
  | 'charge.not_authorized'
  | 'charge.processing'
  
  // Transaction events
  | 'transaction.created'
  | 'transaction.paid'
  | 'transaction.failed'
  | 'transaction.refunded'
  
  // Customer events
  | 'customer.created'
  | 'customer.updated'
  
  // Subscription events (for future use)
  | 'subscription.created'
  | 'subscription.canceled'
  | 'subscription.payment_success'
  | 'subscription.payment_failed';
```

## Webhook Security

### **Webhook Signature Verification**

```typescript
// EVIDENS Webhook Security Pattern
import { createHmac } from 'crypto';

export const verifyWebhookSignature = (
  rawBody: string, 
  signature: string, 
  webhookSecret: string
): boolean => {
  try {
    // Pagar.me uses HMAC-SHA256 for webhook signatures
    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(rawBody, 'utf8')
      .digest('hex');
    
    // Signature format: sha256=<hash>
    const receivedSignature = signature.replace('sha256=', '');
    
    // Secure comparison to prevent timing attacks
    return secureCompare(expectedSignature, receivedSignature);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
};

// Timing-safe string comparison
const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};
```

### **EVIDENS Webhook Edge Function**

```typescript
// Edge Function: pagarme-webhook
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

export default async function handler(req: Request) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Get webhook secret from environment
    const webhookSecret = Deno.env.get('PAGARME_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return new Response('Server configuration error', { status: 500 });
    }

    // Get raw body and signature
    const rawBody = await req.text();
    const signature = req.headers.get('X-Hub-Signature-256') || '';
    
    // Verify webhook authenticity
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse webhook payload
    const webhook: PagarmeWebhookPayload = JSON.parse(rawBody);
    
    // Log webhook event (without sensitive data)
    console.log(`Received webhook: ${webhook.type} for ${webhook.data.object.id}`);
    
    // Route to appropriate handler
    const result = await routeWebhookEvent(webhook);
    
    return new Response(JSON.stringify({ 
      received: true, 
      eventId: webhook.id,
      processed: result.processed 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
}

// Route webhook events to appropriate handlers
const routeWebhookEvent = async (webhook: PagarmeWebhookPayload) => {
  switch (webhook.type) {
    // Order events
    case 'order.paid':
      return handleOrderPaid(webhook.data.object);
    case 'order.payment_failed':
      return handleOrderPaymentFailed(webhook.data.object);
    case 'order.canceled':
      return handleOrderCanceled(webhook.data.object);
      
    // Charge events
    case 'charge.paid':
      return handleChargePaid(webhook.data.object);
    case 'charge.failed':
      return handleChargeFailed(webhook.data.object);
    case 'charge.not_authorized':
      return handleChargeNotAuthorized(webhook.data.object);
      
    default:
      console.log('Unhandled webhook event type:', webhook.type);
      return { processed: false, reason: 'unhandled_event_type' };
  }
};
```

## Webhook Event Handlers

### **Order Event Handlers**

```typescript
// Handle successful order payment
const handleOrderPaid = async (order: PagarmeOrder) => {
  try {
    const evidensUserId = order.metadata?.evidens_user_id;
    const planId = order.metadata?.evidens_plan_id;
    
    if (!evidensUserId) {
      console.error('Missing EVIDENS user ID in order metadata');
      return { processed: false, reason: 'missing_user_id' };
    }

    // 1. Update payment transaction status
    await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        paid_at: order.charges?.[0]?.paid_at,
        pagarme_charge_id: order.charges?.[0]?.id,
        updated_at: new Date().toISOString()
      })
      .eq('pagarme_order_id', order.id);

    // 2. Activate user subscription
    if (planId) {
      await supabase
        .from('users')
        .update({
          subscription_status: 'active',
          subscription_tier: planId,
          subscription_started_at: new Date().toISOString(),
          pagarme_last_payment_id: order.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', evidensUserId);
    }

    // 3. Log successful payment
    console.log(`Payment confirmed for user ${evidensUserId}, order ${order.id}`);
    
    // 4. Trigger post-payment actions (welcome email, access activation, etc.)
    await triggerPostPaymentActions(evidensUserId, order);

    return { processed: true, action: 'subscription_activated' };
    
  } catch (error) {
    console.error('Order paid handler error:', error);
    return { processed: false, reason: 'handler_error', error: error.message };
  }
};

// Handle failed order payment
const handleOrderPaymentFailed = async (order: PagarmeOrder) => {
  try {
    const evidensUserId = order.metadata?.evidens_user_id;
    
    if (!evidensUserId) {
      return { processed: false, reason: 'missing_user_id' };
    }

    // Update payment transaction status
    await supabase
      .from('payment_transactions')
      .update({
        status: 'failed',
        failure_reason: order.charges?.[0]?.last_transaction?.acquirer_message,
        updated_at: new Date().toISOString()
      })
      .eq('pagarme_order_id', order.id);

    // Trigger retry or alternative payment suggestions
    await triggerPaymentRetryFlow(evidensUserId, order);

    return { processed: true, action: 'payment_failed_handled' };
    
  } catch (error) {
    console.error('Order payment failed handler error:', error);
    return { processed: false, reason: 'handler_error' };
  }
};

// Handle order cancellation
const handleOrderCanceled = async (order: PagarmeOrder) => {
  try {
    const evidensUserId = order.metadata?.evidens_user_id;
    
    // Update payment transaction status
    await supabase
      .from('payment_transactions')
      .update({
        status: 'canceled',
        canceled_at: order.canceled_at,
        updated_at: new Date().toISOString()
      })
      .eq('pagarme_order_id', order.id);

    return { processed: true, action: 'order_canceled' };
    
  } catch (error) {
    console.error('Order canceled handler error:', error);
    return { processed: false, reason: 'handler_error' };
  }
};
```

### **Charge Event Handlers**

```typescript
// Handle successful charge payment
const handleChargePaid = async (charge: PagarmeCharge) => {
  try {
    // Update charge-specific data
    const updateData: any = {
      status: 'completed',
      paid_at: charge.paid_at,
      gateway_transaction_id: charge.last_transaction?.gateway_id,
      acquirer_name: charge.last_transaction?.acquirer_name,
      updated_at: new Date().toISOString()
    };

    // Add payment method specific data
    if (charge.payment_method === 'credit_card') {
      updateData.auth_code = charge.last_transaction?.auth_code;
      updateData.acquirer_tid = charge.last_transaction?.acquirer_tid;
      updateData.acquirer_nsu = charge.last_transaction?.acquirer_nsu;
    } else if (charge.payment_method === 'pix') {
      updateData.pix_end_to_end_id = charge.last_transaction?.acquirer_tid;
    }

    await supabase
      .from('payment_transactions')
      .update(updateData)
      .eq('pagarme_charge_id', charge.id);

    return { processed: true, action: 'charge_status_updated' };
    
  } catch (error) {
    console.error('Charge paid handler error:', error);
    return { processed: false, reason: 'handler_error' };
  }
};

// Handle failed charge
const handleChargeFailed = async (charge: PagarmeCharge) => {
  try {
    const failureReason = charge.last_transaction?.acquirer_message || 
                         charge.last_transaction?.gateway_response_errors?.[0] || 
                         'Payment processing failed';

    await supabase
      .from('payment_transactions')
      .update({
        status: 'failed',
        failure_reason: failureReason,
        gateway_transaction_id: charge.last_transaction?.gateway_id,
        updated_at: new Date().toISOString()
      })
      .eq('pagarme_charge_id', charge.id);

    return { processed: true, action: 'charge_failure_recorded' };
    
  } catch (error) {
    console.error('Charge failed handler error:', error);
    return { processed: false, reason: 'handler_error' };
  }
};
```

## Post-Payment Action Triggers

### **Automated User Actions**

```typescript
// Trigger actions after successful payment
const triggerPostPaymentActions = async (userId: string, order: PagarmeOrder) => {
  const actions = [];
  
  try {
    // 1. Send welcome email for new subscriptions
    if (order.metadata?.payment_flow === 'subscription_signup') {
      actions.push(
        fetch('/functions/v1/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, orderId: order.id })
        })
      );
    }
    
    // 2. Grant platform access
    actions.push(
      fetch('/functions/v1/activate-user-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planId: order.metadata?.evidens_plan_id })
      })
    );
    
    // 3. Update user analytics
    actions.push(
      fetch('/functions/v1/track-conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          orderId: order.id,
          campaignSource: order.metadata?.campaign_source,
          conversionValue: order.amount / 100
        })
      })
    );
    
    // Execute all actions concurrently
    await Promise.allSettled(actions);
    
    console.log(`Post-payment actions triggered for user ${userId}`);
    
  } catch (error) {
    console.error('Post-payment action error:', error);
    // Don't throw - webhook should still succeed even if post-actions fail
  }
};

// Trigger payment retry flow
const triggerPaymentRetryFlow = async (userId: string, order: PagarmeOrder) => {
  try {
    // Record payment attempt for analytics
    await fetch('/functions/v1/record-payment-attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        orderId: order.id,
        paymentMethod: order.payments?.[0]?.payment_method,
        failureReason: order.charges?.[0]?.last_transaction?.acquirer_message,
        attemptedAt: new Date().toISOString()
      })
    });
    
    // Send retry suggestion email after delay
    await fetch('/functions/v1/schedule-retry-email', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        orderId: order.id,
        delayMinutes: 60 // Send retry email after 1 hour
      })
    });
    
  } catch (error) {
    console.error('Payment retry flow error:', error);
  }
};
```

## Webhook Configuration

### **Webhook URL Setup**

**Webhook Endpoint**: `https://<your-supabase-project>.supabase.co/functions/v1/pagarme-webhook`

**Required Configuration in Pagar.me Dashboard**:
- **URL**: EVIDENS webhook endpoint
- **Events**: Select relevant events (order.paid, charge.failed, etc.)
- **Secret**: Generate secure webhook secret for signature verification
- **HTTP Method**: POST
- **Format**: JSON

### **Environment Configuration**

```bash
# Supabase Edge Function Environment Variables
PAGARME_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXX  # Webhook verification secret
PAGARME_SECRET_KEY=sk_XXXXXXXXXXXXXXXX        # API authentication
```

### **Webhook Event Subscription**

```typescript
// Configure which events EVIDENS should handle
export const EVIDENS_WEBHOOK_EVENTS = [
  // Critical order events
  'order.paid',
  'order.payment_failed', 
  'order.canceled',
  
  // Critical charge events
  'charge.paid',
  'charge.failed',
  'charge.not_authorized',
  'charge.processing',
  
  // Customer events (optional)
  'customer.updated',
  
  // Future: subscription events
  'subscription.payment_success',
  'subscription.payment_failed'
] as const;

// Event priority levels for processing
export const WEBHOOK_EVENT_PRIORITY = {
  'order.paid': 'high',           // Immediate subscription activation
  'charge.paid': 'high',          // Immediate access grant
  'order.payment_failed': 'medium', // Retry flow triggers
  'charge.failed': 'medium',       // Alternative payment suggestions
  'order.canceled': 'low',        // Cleanup operations
  'charge.not_authorized': 'medium' // Card decline handling
} as const;
```

## Event Processing Patterns

### **Idempotent Event Processing**

```typescript
// Ensure webhook events are processed only once
export const processWebhookEvent = async (webhook: PagarmeWebhookPayload) => {
  const eventId = webhook.id;
  
  // Check if event already processed
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id, processed_at')
    .eq('event_id', eventId)
    .single();
  
  if (existingEvent?.processed_at) {
    console.log(`Event ${eventId} already processed at ${existingEvent.processed_at}`);
    return { processed: true, duplicate: true };
  }
  
  try {
    // Record event processing start
    await supabase
      .from('webhook_events')
      .upsert({
        event_id: eventId,
        event_type: webhook.type,
        payload: webhook.data,
        received_at: webhook.created_at,
        processing_started_at: new Date().toISOString()
      });
    
    // Process the event
    const result = await routeWebhookEvent(webhook);
    
    // Record successful processing
    await supabase
      .from('webhook_events')
      .update({
        processed_at: new Date().toISOString(),
        processing_result: result,
        success: result.processed
      })
      .eq('event_id', eventId);
    
    return result;
    
  } catch (error) {
    // Record processing failure
    await supabase
      .from('webhook_events')
      .update({
        processed_at: new Date().toISOString(),
        processing_error: error.message,
        success: false
      })
      .eq('event_id', eventId);
    
    throw error;
  }
};
```

### **Retry Logic for Failed Processing**

```typescript
// Webhook retry mechanism for failed processing
export const retryFailedWebhookEvents = async () => {
  const { data: failedEvents } = await supabase
    .from('webhook_events')
    .select('*')
    .eq('success', false)
    .is('retry_count', null)
    .limit(10);
  
  if (!failedEvents?.length) {
    return { reprocessed: 0 };
  }
  
  let reprocessedCount = 0;
  
  for (const event of failedEvents) {
    try {
      // Reconstruct webhook payload
      const webhook: PagarmeWebhookPayload = {
        id: event.event_id,
        type: event.event_type,
        created_at: event.received_at,
        data: event.payload,
        account: { id: '', name: '' } // These aren't critical for processing
      };
      
      // Retry processing
      const result = await routeWebhookEvent(webhook);
      
      if (result.processed) {
        // Mark as successfully reprocessed
        await supabase
          .from('webhook_events')
          .update({
            success: true,
            retry_count: 1,
            last_retry_at: new Date().toISOString(),
            processing_result: result
          })
          .eq('event_id', event.event_id);
        
        reprocessedCount++;
      }
      
    } catch (error) {
      // Mark retry attempt
      await supabase
        .from('webhook_events')
        .update({
          retry_count: 1,
          last_retry_at: new Date().toISOString(),
          last_retry_error: error.message
        })
        .eq('event_id', event.event_id);
    }
  }
  
  return { reprocessed: reprocessedCount };
};
```

## Frontend Webhook Integration

### **Real-time Payment Updates**

```typescript
// Listen for payment updates via Supabase Realtime
export const useRealtimePaymentUpdates = (userId?: string) => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!userId) return;
    
    // Subscribe to payment transaction updates
    const subscription = supabase
      .channel(`payment_updates:${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'payment_transactions',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const updatedTransaction = payload.new;
        
        // Update relevant queries based on payment status change
        if (updatedTransaction.status === 'completed') {
          queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
          queryClient.invalidateQueries({ queryKey: ['payment-history'] });
          
          toast.success('Pagamento confirmado! Acesso liberado.');
        } else if (updatedTransaction.status === 'failed') {
          queryClient.invalidateQueries({ queryKey: ['payment-history'] });
          
          toast.error('Pagamento não foi processado. Tente outro método.');
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, queryClient]);
};
```

### **Webhook Event Monitoring UI**

```typescript
// Component to display recent webhook events (admin view)
export const WebhookEventMonitor = () => {
  const { data: recentEvents, isLoading } = useQuery({
    queryKey: ['webhook-events'],
    queryFn: async () => {
      const { data } = await supabase
        .from('webhook_events')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(20);
      
      return data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  if (isLoading) {
    return <div>Loading webhook events...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Webhook Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentEvents?.map((event) => (
            <div key={event.event_id} className="flex justify-between items-center p-2 border rounded">
              <div>
                <span className="font-medium">{event.event_type}</span>
                <span className="text-sm text-gray-600 ml-2">
                  {new Date(event.received_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {event.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-xs px-2 py-1 rounded ${
                  event.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {event.success ? 'Processed' : 'Failed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

## Webhook Testing

### **Webhook Testing Utilities**

```typescript
// Test webhook processing locally
export const testWebhookProcessing = async (eventType: WebhookEventType, testData: any) => {
  const webhookSecret = 'test_webhook_secret';
  
  // Create test webhook payload
  const testWebhook: PagarmeWebhookPayload = {
    id: `evt_test_${Date.now()}`,
    type: eventType,
    created_at: new Date().toISOString(),
    account: { id: 'test_account', name: 'Test Account' },
    data: { object: testData }
  };
  
  const payload = JSON.stringify(testWebhook);
  const signature = createHmac('sha256', webhookSecret)
    .update(payload, 'utf8')
    .digest('hex');
  
  try {
    const response = await fetch('/functions/v1/pagarme-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': `sha256=${signature}`
      },
      body: payload
    });
    
    const result = await response.json();
    
    console.log(`Webhook test ${eventType}:`, response.status === 200 ? 'PASS' : 'FAIL');
    console.log('Response:', result);
    
    return { success: response.ok, result };
    
  } catch (error) {
    console.error(`Webhook test ${eventType} failed:`, error);
    return { success: false, error: error.message };
  }
};

// Test complete payment flow with webhooks
export const testPaymentWebhookFlow = async () => {
  console.log('Testing complete payment webhook flow...');
  
  const testOrder = {
    id: `order_test_${Date.now()}`,
    code: `TEST_${Date.now()}`,
    amount: 2990, // R$ 29.90
    status: 'paid',
    charges: [{
      id: `charge_test_${Date.now()}`,
      status: 'paid',
      amount: 2990,
      payment_method: 'pix',
      paid_at: new Date().toISOString(),
      last_transaction: {
        id: `trans_test_${Date.now()}`,
        qr_code: 'test_qr_code',
        qr_code_url: 'test_qr_url'
      }
    }],
    metadata: {
      evidens_user_id: 'test_user_123',
      evidens_plan_id: 'monthly',
      payment_flow: 'subscription_signup'
    }
  };
  
  // Test order.paid webhook
  const orderPaidTest = await testWebhookProcessing('order.paid', testOrder);
  
  // Test charge.paid webhook
  const chargePaidTest = await testWebhookProcessing('charge.paid', testOrder.charges[0]);
  
  return {
    orderPaidTest,
    chargePaidTest,
    overallSuccess: orderPaidTest.success && chargePaidTest.success
  };
};
```

## Webhook Monitoring & Debugging

### **Webhook Health Monitoring**

```typescript
// Monitor webhook health and performance
export const useWebhookHealthMonitoring = () => {
  return useQuery({
    queryKey: ['webhook-health'],
    queryFn: async () => {
      const { data: events } = await supabase
        .from('webhook_events')
        .select('event_type, success, received_at, processing_error')
        .gte('received_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('received_at', { ascending: false });
      
      if (!events?.length) {
        return {
          totalEvents: 0,
          successRate: 0,
          failureRate: 0,
          commonErrors: [],
          status: 'no_data'
        };
      }
      
      const totalEvents = events.length;
      const successfulEvents = events.filter(e => e.success).length;
      const successRate = (successfulEvents / totalEvents) * 100;
      
      // Common error analysis
      const errors = events
        .filter(e => !e.success && e.processing_error)
        .reduce((acc, e) => {
          acc[e.processing_error] = (acc[e.processing_error] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      const commonErrors = Object.entries(errors)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([error, count]) => ({ error, count }));
      
      return {
        totalEvents,
        successRate: Math.round(successRate * 100) / 100,
        failureRate: Math.round((100 - successRate) * 100) / 100,
        commonErrors,
        status: successRate > 95 ? 'healthy' : successRate > 85 ? 'warning' : 'critical'
      };
    },
    refetchInterval: 60000, // Check every minute
  });
};
```

### **Webhook Debugging Tools**

```typescript
// Debug webhook events
export const debugWebhookEvent = async (eventId: string) => {
  const { data: event } = await supabase
    .from('webhook_events')
    .select('*')
    .eq('event_id', eventId)
    .single();
  
  if (!event) {
    return { found: false };
  }
  
  // Reconstruct and reprocess event
  const webhook: PagarmeWebhookPayload = {
    id: event.event_id,
    type: event.event_type,
    created_at: event.received_at,
    data: event.payload,
    account: { id: '', name: 'Debug' }
  };
  
  console.log('Debugging webhook event:', {
    eventId,
    type: webhook.type,
    receivedAt: event.received_at,
    processedAt: event.processed_at,
    success: event.success,
    error: event.processing_error,
    payload: webhook.data
  });
  
  // Reprocess if failed
  if (!event.success) {
    try {
      const result = await routeWebhookEvent(webhook);
      console.log('Reprocessing result:', result);
      return { found: true, reprocessed: true, result };
    } catch (error) {
      console.error('Reprocessing failed:', error);
      return { found: true, reprocessed: false, error: error.message };
    }
  }
  
  return { found: true, alreadyProcessed: true };
};
```

## Database Schema for Webhooks

### **Webhook Events Table**

```sql
-- Table to track webhook event processing
CREATE TABLE webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,           -- Pagar.me event ID
  event_type text NOT NULL,                -- Webhook event type
  payload jsonb NOT NULL,                  -- Full webhook payload
  received_at timestamptz NOT NULL,        -- When webhook was received
  processing_started_at timestamptz,       -- When processing began
  processed_at timestamptz,                -- When processing completed
  success boolean DEFAULT false,           -- Processing success status
  processing_result jsonb,                 -- Processing result data
  processing_error text,                   -- Error message if failed
  retry_count integer DEFAULT 0,           -- Number of retry attempts
  last_retry_at timestamptz,               -- Last retry timestamp
  last_retry_error text,                   -- Last retry error
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_received ON webhook_events(received_at);
CREATE INDEX idx_webhook_events_success ON webhook_events(success);
CREATE INDEX idx_webhook_events_retry ON webhook_events(success, retry_count) 
  WHERE success = false;
```

## Error Recovery Patterns

### **Webhook Failure Recovery**

```typescript
// Automated recovery for webhook processing failures
export const useWebhookRecovery = () => {
  return useMutation({
    mutationFn: async ({ 
      eventId, 
      forceReprocess = false 
    }: {
      eventId: string;
      forceReprocess?: boolean;
    }) => {
      const { data: event } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('event_id', eventId)
        .single();
      
      if (!event) {
        throw new Error('Webhook event not found');
      }
      
      if (event.success && !forceReprocess) {
        return { recovered: false, reason: 'already_processed' };
      }
      
      // Reprocess the webhook event
      const webhook: PagarmeWebhookPayload = {
        id: event.event_id,
        type: event.event_type,
        created_at: event.received_at,
        data: event.payload,
        account: { id: '', name: 'Recovery' }
      };
      
      const result = await routeWebhookEvent(webhook);
      
      // Update event record
      await supabase
        .from('webhook_events')
        .update({
          success: result.processed,
          processed_at: new Date().toISOString(),
          processing_result: result,
          retry_count: (event.retry_count || 0) + 1,
          last_retry_at: new Date().toISOString()
        })
        .eq('event_id', eventId);
      
      return { 
        recovered: result.processed, 
        result,
        attemptNumber: (event.retry_count || 0) + 1
      };
    },
    onSuccess: ({ recovered, attemptNumber }) => {
      if (recovered) {
        toast.success(`Webhook event recovered on attempt ${attemptNumber}`);
      } else {
        toast.error('Webhook recovery failed');
      }
    }
  });
};
```

## Best Practices

### **Webhook Reliability**
- **Idempotency**: Always check if event was already processed
- **Timeout Handling**: Process webhooks within 10 seconds
- **Error Logging**: Log all failures with context
- **Retry Strategy**: Implement exponential backoff for retries

### **Security Best Practices**
- **Signature Verification**: Always verify webhook signatures
- **Secret Rotation**: Rotate webhook secrets quarterly
- **Rate Limiting**: Implement webhook rate limiting
- **Error Disclosure**: Never expose sensitive data in error responses

### **Performance Optimization**
- **Async Processing**: Process webhook events asynchronously when possible
- **Database Updates**: Use batch updates for multiple records
- **Cache Invalidation**: Strategically invalidate only necessary caches
- **Event Deduplication**: Prevent duplicate event processing

## Integration Checklist

### **Webhook Infrastructure**
- [ ] Webhook Edge Function deployed (`pagarme-webhook`)
- [ ] Webhook signature verification implemented
- [ ] Webhook secret configured in environment variables
- [ ] Webhook URL configured in Pagar.me dashboard

### **Event Processing**
- [ ] Order event handlers implemented (paid, failed, canceled)
- [ ] Charge event handlers implemented (paid, failed, not_authorized)
- [ ] Idempotent event processing configured
- [ ] Event retry logic implemented for failures

### **Database Integration**
- [ ] `webhook_events` table created with proper indexes
- [ ] Payment transaction updates working via webhooks
- [ ] User subscription activation via webhooks functional
- [ ] Realtime payment updates working in frontend

### **Monitoring & Debugging**
- [ ] Webhook health monitoring dashboard implemented
- [ ] Webhook event debugging tools available
- [ ] Webhook failure recovery mechanisms working
- [ ] Webhook performance metrics tracking

---

**Next Steps**: 
1. [PIX Implementation](../payment-methods/pix.md) - Complete PIX payment integration
2. [Credit Card Processing](../payment-methods/credit-card.md) - Implement card payments  
3. [Edge Function Templates](../edge-functions/README.md) - Payment Edge Function examples