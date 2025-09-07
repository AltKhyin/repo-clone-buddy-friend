// ABOUTME: Handles Pagar.me webhook events for payment processing following EVIDENS security patterns
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =================================================================
// Environment & Configuration
// =================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// =================================================================
// Dual Webhook Authentication System
// =================================================================

/**
 * Validates HTTP Basic Authentication for webhooks
 * Used when "Habilitar autenticação" is enabled in Pagar.me dashboard
 */
const validateBasicAuth = (authHeader: string | null): boolean => {
  const webhookUser = Deno.env.get('PAGARME_WEBHOOK_USER')
  const webhookPassword = Deno.env.get('PAGARME_WEBHOOK_PASSWORD')
  
  if (!authHeader || !webhookUser || !webhookPassword) {
    return false
  }

  try {
    // Extract credentials from "Basic base64encodedCredentials"
    if (!authHeader.startsWith('Basic ')) {
      return false
    }
    
    const base64Credentials = authHeader.replace('Basic ', '')
    const credentials = atob(base64Credentials)
    const [username, password] = credentials.split(':')

    return username === webhookUser && password === webhookPassword
  } catch (error) {
    console.error('Basic auth validation error:', error)
    return false
  }
}

/**
 * Validates Pagar.me webhook signature
 * Provides cryptographic verification of webhook authenticity
 */
const verifyWebhookSignature = async (request: Request, signature: string | null): Promise<boolean> => {
  if (!signature) {
    return false
  }

  try {
    const body = await request.text()
    const webhookSecret = Deno.env.get('PAGARME_WEBHOOK_SECRET')
    
    if (!webhookSecret) {
      return false
    }

    // Verify signature using crypto
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const computedSignature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    )
    
    const computedHex = Array.from(new Uint8Array(computedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    // Compare signatures securely (handle different signature formats)
    const expectedSignature = `sha256=${computedHex}`
    return signature === expectedSignature || signature === computedHex
  } catch (error) {
    console.error('Signature verification failed:', error)
    return false
  }
}

// =================================================================
// Webhook Event Processing
// =================================================================

interface WebhookEvent {
  id: string
  object: string
  type: string
  data: any
  created_at: string
  api_version: string
}

interface PaymentEventData {
  user_id: string
  event_type: string
  event_data: any
  pagarme_transaction_id?: string
  webhook_id: string
  processing_status: 'pending' | 'processed' | 'failed'
}

const processPaymentEvent = async (webhookEvent: WebhookEvent): Promise<void> => {
  console.log(`Processing webhook event: ${webhookEvent.type}`)
  
  try {
    // Extract relevant data from webhook
    const eventData = webhookEvent.data
    const customerId = eventData?.customer?.id
    const orderId = eventData?.id
    const chargeId = eventData?.charges?.[0]?.id
    const subscriptionId = eventData?.subscription?.id

    // Find the user associated with this payment (check both customer ID fields)
    let userId: string | null = null
    
    if (customerId) {
      // Try evidens_pagarme_customer_id first (newer field)
      let { data: user } = await supabase
        .from('Practitioners')
        .select('id')
        .eq('evidens_pagarme_customer_id', customerId)
        .single()
      
      // If not found, try legacy pagarme_customer_id field
      if (!user) {
        const result = await supabase
          .from('Practitioners')
          .select('id')
          .eq('pagarme_customer_id', customerId)
          .single()
        user = result.data
      }
      
      userId = user?.id
    }

    // If we can't find the user, log and continue
    if (!userId) {
      console.warn(`User not found for customer ID: ${customerId}`)
      // Still log the event for debugging
      await logPaymentEvent({
        user_id: 'unknown',
        event_type: webhookEvent.type,
        event_data: eventData,
        pagarme_transaction_id: orderId || chargeId || subscriptionId,
        webhook_id: webhookEvent.id,
        processing_status: 'failed'
      })
      return
    }

    // Process different event types with comprehensive subscription support
    switch (webhookEvent.type) {
      // One-time payment events
      case 'order.paid':
      case 'charge.paid':
        await handlePaymentConfirmed(userId, eventData)
        break
        
      case 'order.payment_failed':
      case 'charge.failed':
        await handlePaymentFailed(userId, eventData)
        break
        
      // Subscription lifecycle events
      case 'subscription.created':
        await handleSubscriptionCreated(userId, eventData)
        break
        
      case 'subscription.canceled':
      case 'subscription.cancelled':
        await handleSubscriptionCanceled(userId, eventData)
        break
        
      // Recurring charge events
      case 'subscription.charge_created':
        await handleSubscriptionChargeCreated(userId, eventData)
        break
        
      case 'subscription.charge.paid':
      case 'subscription.charged':
        await handleSubscriptionRenewal(userId, eventData)
        break
        
      case 'subscription.charge_failed':
      case 'subscription.payment_failed':
        await handleSubscriptionChargeFailed(userId, eventData)
        break
        
      // Subscription status changes
      case 'subscription.trial_ended':
        await handleSubscriptionTrialEnded(userId, eventData)
        break
        
      case 'subscription.reactivated':
        await handleSubscriptionReactivated(userId, eventData)
        break
        
      case 'subscription.suspended':
        await handleSubscriptionSuspended(userId, eventData)
        break
        
      default:
        console.log(`Unhandled event type: ${webhookEvent.type}`)
    }

    // Log successful processing
    await logPaymentEvent({
      user_id: userId,
      event_type: webhookEvent.type,
      event_data: eventData,
      pagarme_transaction_id: orderId || chargeId || subscriptionId,
      webhook_id: webhookEvent.id,
      processing_status: 'processed'
    })

  } catch (error) {
    console.error('Error processing webhook event:', error)
    
    // Log failed processing
    await logPaymentEvent({
      user_id: 'error',
      event_type: webhookEvent.type,
      event_data: webhookEvent.data,
      pagarme_transaction_id: webhookEvent.id,
      webhook_id: webhookEvent.id,
      processing_status: 'failed'
    })
    
    throw error
  }
}

// =================================================================
// Payment Event Handlers
// =================================================================

const handlePaymentConfirmed = async (userId: string, eventData: any): Promise<void> => {
  console.log(`Payment confirmed for user: ${userId}`)
  
  // Update user subscription status to active
  const { error } = await supabase
    .from('Practitioners')
    .update({
      subscription_status: 'active',
      subscription_expires_at: calculateExpirationDate(eventData),
      payment_metadata: {
        last_payment_date: new Date().toISOString(),
        last_payment_amount: eventData.amount,
        last_payment_method: eventData.payment_method || 'pix'
      }
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update user subscription: ${error.message}`)
  }
}

const handlePaymentFailed = async (userId: string, eventData: any): Promise<void> => {
  console.log(`Payment failed for user: ${userId}`)
  
  // Update user subscription status based on current status
  const { data: user } = await supabase
    .from('Practitioners')
    .select('subscription_status')
    .eq('id', userId)
    .single()

  // If user is currently active, mark as past_due
  // If already past_due, mark as suspended
  const newStatus = user?.subscription_status === 'active' ? 'past_due' : 'suspended'
  
  const { error } = await supabase
    .from('Practitioners')
    .update({
      subscription_status: newStatus,
      payment_metadata: {
        last_failed_payment: new Date().toISOString(),
        failure_reason: eventData.status_reason || 'unknown'
      }
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update user after payment failure: ${error.message}`)
  }
}

const handleSubscriptionCreated = async (userId: string, eventData: any): Promise<void> => {
  console.log(`Subscription created for user: ${userId}`)
  
  const { error } = await supabase
    .from('Practitioners')
    .update({
      subscription_id: eventData.id,
      subscription_plan: eventData.plan?.name || 'monthly',
      subscription_status: 'active',
      subscription_expires_at: calculateExpirationDate(eventData)
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update user subscription: ${error.message}`)
  }
}

const handleSubscriptionCanceled = async (userId: string, eventData: any): Promise<void> => {
  console.log(`Subscription canceled for user: ${userId}`)
  
  const { error } = await supabase
    .from('Practitioners')
    .update({
      subscription_status: 'canceled'
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update user subscription: ${error.message}`)
  }
}

const handleSubscriptionRenewal = async (userId: string, eventData: any): Promise<void> => {
  console.log(`Subscription renewed for user: ${userId}`)
  
  // Update both local Practitioners table and evidens_subscriptions table
  const { error: practitionerError } = await supabase
    .from('Practitioners')
    .update({
      subscription_status: 'active',
      subscription_expires_at: calculateExpirationDate(eventData),
      payment_metadata: {
        last_payment_date: new Date().toISOString(),
        last_payment_amount: eventData.amount,
        last_charge_id: eventData.id
      },
      last_payment_date: new Date().toISOString(),
      next_billing_date: eventData.subscription?.next_billing_at ? new Date(eventData.subscription.next_billing_at).toISOString() : null
    })
    .eq('id', userId)

  if (practitionerError) {
    throw new Error(`Failed to update practitioner subscription: ${practitionerError.message}`)
  }
  
  // Update subscription record if it exists
  if (eventData.subscription?.id) {
    const { error: subscriptionError } = await supabase
      .from('evidens_subscriptions')
      .update({
        status: 'active',
        current_period_start: eventData.subscription.current_cycle?.start_at ? new Date(eventData.subscription.current_cycle.start_at).toISOString() : null,
        current_period_end: eventData.subscription.current_cycle?.end_at ? new Date(eventData.subscription.current_cycle.end_at).toISOString() : null,
        next_billing_at: eventData.subscription.next_billing_at ? new Date(eventData.subscription.next_billing_at).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('pagarme_subscription_id', eventData.subscription.id)

    if (subscriptionError) {
      console.error('Failed to update subscription record:', subscriptionError)
    }
  }
}

const handleSubscriptionChargeCreated = async (userId: string, eventData: any): Promise<void> => {
  console.log(`Subscription charge created for user: ${userId}`)
  
  // Mark user as processing payment (optional status for UI feedback)
  const { error } = await supabase
    .from('Practitioners')
    .update({
      payment_metadata: {
        ...JSON.parse(eventData.metadata || '{}'),
        pending_charge_id: eventData.id,
        pending_charge_amount: eventData.amount,
        pending_charge_created_at: new Date().toISOString()
      }
    })
    .eq('id', userId)

  if (error) {
    console.error('Failed to update pending charge info:', error)
  }
}

const handleSubscriptionChargeFailed = async (userId: string, eventData: any): Promise<void> => {
  console.log(`Subscription charge failed for user: ${userId}`)
  
  // Get current subscription status to determine next state
  const { data: user } = await supabase
    .from('Practitioners')
    .select('subscription_status, payment_metadata')
    .eq('id', userId)
    .single()

  // Determine new status based on current state and failure count
  let newStatus = 'past_due'
  const failureCount = (user?.payment_metadata as any)?.failure_count || 0
  
  if (failureCount >= 2) {
    newStatus = 'suspended'
  }
  
  const { error } = await supabase
    .from('Practitioners')
    .update({
      subscription_status: newStatus,
      payment_metadata: {
        ...user?.payment_metadata,
        last_failed_payment: new Date().toISOString(),
        failure_reason: eventData.status_reason || 'unknown',
        failure_count: failureCount + 1,
        failed_charge_id: eventData.id
      }
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update user after charge failure: ${error.message}`)
  }
  
  // Update subscription record status
  if (eventData.subscription?.id) {
    const { error: subscriptionError } = await supabase
      .from('evidens_subscriptions')
      .update({
        status: newStatus === 'suspended' ? 'unpaid' : 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('pagarme_subscription_id', eventData.subscription.id)

    if (subscriptionError) {
      console.error('Failed to update subscription status after failure:', subscriptionError)
    }
  }
}

const handleSubscriptionTrialEnded = async (userId: string, eventData: any): Promise<void> => {
  console.log(`Subscription trial ended for user: ${userId}`)
  
  const { error } = await supabase
    .from('Practitioners')
    .update({
      subscription_status: 'active', // Assumes first billing cycle starts
      payment_metadata: {
        trial_ended_at: new Date().toISOString(),
        subscription_id: eventData.id
      }
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update user after trial end: ${error.message}`)
  }
}

const handleSubscriptionReactivated = async (userId: string, eventData: any): Promise<void> => {
  console.log(`Subscription reactivated for user: ${userId}`)
  
  const { error } = await supabase
    .from('Practitioners')
    .update({
      subscription_status: 'active',
      subscription_expires_at: calculateExpirationDate(eventData),
      payment_metadata: {
        reactivated_at: new Date().toISOString(),
        previous_failure_count: 0 // Reset failure count
      }
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to reactivate user subscription: ${error.message}`)
  }
  
  // Update subscription record
  if (eventData.id) {
    const { error: subscriptionError } = await supabase
      .from('evidens_subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('pagarme_subscription_id', eventData.id)

    if (subscriptionError) {
      console.error('Failed to update subscription record:', subscriptionError)
    }
  }
}

const handleSubscriptionSuspended = async (userId: string, eventData: any): Promise<void> => {
  console.log(`Subscription suspended for user: ${userId}`)
  
  const { error } = await supabase
    .from('Practitioners')
    .update({
      subscription_status: 'suspended',
      payment_metadata: {
        suspended_at: new Date().toISOString(),
        suspension_reason: eventData.status_reason || 'payment_failure'
      }
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to suspend user subscription: ${error.message}`)
  }
  
  // Update subscription record
  if (eventData.id) {
    const { error: subscriptionError } = await supabase
      .from('evidens_subscriptions')
      .update({
        status: 'unpaid',
        updated_at: new Date().toISOString()
      })
      .eq('pagarme_subscription_id', eventData.id)

    if (subscriptionError) {
      console.error('Failed to update suspended subscription record:', subscriptionError)
    }
  }
}

// =================================================================
// Helper Functions
// =================================================================

const calculateExpirationDate = (eventData: any): string => {
  // Default to 30 days from now for monthly subscriptions
  const expirationDate = new Date()
  
  // Extract billing cycle information if available
  if (eventData.plan?.interval === 'month') {
    expirationDate.setMonth(expirationDate.getMonth() + (eventData.plan.interval_count || 1))
  } else if (eventData.plan?.interval === 'year') {
    expirationDate.setFullYear(expirationDate.getFullYear() + (eventData.plan.interval_count || 1))
  } else {
    // Default to monthly
    expirationDate.setMonth(expirationDate.getMonth() + 1)
  }
  
  return expirationDate.toISOString()
}

const logPaymentEvent = async (eventData: PaymentEventData): Promise<void> => {
  const { error } = await supabase
    .from('payment_events')
    .insert({
      user_id: eventData.user_id,
      event_type: eventData.event_type,
      event_data: eventData.event_data,
      pagarme_transaction_id: eventData.pagarme_transaction_id,
      webhook_id: eventData.webhook_id,
      processing_status: eventData.processing_status,
      processed_at: new Date().toISOString()
    })

  if (error) {
    console.error('Failed to log payment event:', error)
  }
}

const sendSuccess = (data: any) => {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  )
}

const sendError = (message: string, status: number) => {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status 
    }
  )
}

// =================================================================
// Main Handler Function
// =================================================================

serve(async (req: Request) => {
  // [C6.4.1] Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  // Only accept POST requests for webhooks
  if (req.method !== 'POST') {
    return sendError('Method not allowed. Webhooks must use POST.', 405)
  }

  try {
    // =================================================================
    // Dual Authentication Validation
    // =================================================================

    const authHeader = req.headers.get('Authorization')
    const signatureHeader = req.headers.get('X-Hub-Signature-256') || 
                           req.headers.get('X-Pagarme-Signature') ||
                           req.headers.get('x-hub-signature-256')

    console.log('Webhook received:', {
      hasAuth: Boolean(authHeader),
      hasSignature: Boolean(signatureHeader),
      contentType: req.headers.get('Content-Type')
    })

    let authenticationPassed = false
    const authResults = {
      basicAuth: false,
      signature: false
    }

    // Check HTTP Basic Authentication (when "Habilitar autenticação" is enabled)
    const webhookUser = Deno.env.get('PAGARME_WEBHOOK_USER')
    const webhookPassword = Deno.env.get('PAGARME_WEBHOOK_PASSWORD')
    
    if (webhookUser && webhookPassword) {
      authResults.basicAuth = validateBasicAuth(authHeader)
      if (authResults.basicAuth) {
        console.log('✅ HTTP Basic Auth validation passed')
        authenticationPassed = true
      } else {
        console.log('❌ HTTP Basic Auth validation failed')
      }
    }

    // Check signature verification (cryptographic validation)
    const webhookSecret = Deno.env.get('PAGARME_WEBHOOK_SECRET')
    if (webhookSecret && signatureHeader) {
      // Clone request for signature verification (body can only be read once)
      const requestClone = req.clone()
      authResults.signature = await verifyWebhookSignature(requestClone, signatureHeader)
      if (authResults.signature) {
        console.log('✅ Webhook signature validation passed')
        authenticationPassed = true
      } else {
        console.log('❌ Webhook signature validation failed')
      }
    }

    // Require at least one authentication method to pass
    if (!authenticationPassed) {
      console.error('Webhook authentication failed:', {
        basicAuthConfigured: Boolean(webhookUser && webhookPassword),
        signatureConfigured: Boolean(webhookSecret),
        authResults
      })
      return sendError('Webhook authentication failed. Invalid credentials or signature.', 401)
    }

    // [C6.4.3] Parse webhook payload
    const webhookEvent: WebhookEvent = await req.json()
    
    if (!webhookEvent.id || !webhookEvent.type) {
      return sendError('Invalid webhook payload', 400)
    }

    // [C6.4.4] Process webhook event
    await processPaymentEvent(webhookEvent)
    
    console.log(`Successfully processed webhook: ${webhookEvent.id} (auth: ${JSON.stringify(authResults)})`)
    
    // [C6.4.5] Return success response
    return sendSuccess({ 
      received: true,
      webhook_id: webhookEvent.id,
      processed_at: new Date().toISOString(),
      authentication: authResults
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return sendError('Internal server error', 500)
  }
})