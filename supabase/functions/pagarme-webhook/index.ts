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
 * Validates Bearer token authentication for webhooks
 * Used for modern webhook authentication with API keys
 */
const validateBearerAuth = (authHeader: string | null): boolean => {
  // Try dedicated webhook token first, fallback to API secret key
  const webhookToken = Deno.env.get('PAGARME_WEBHOOK_TOKEN') || Deno.env.get('PAGARME_SECRET_KEY')
  
  if (!authHeader || !webhookToken) {
    return false
  }

  try {
    // Extract token from "Bearer {token}"
    if (!authHeader.startsWith('Bearer ')) {
      return false
    }
    
    const token = authHeader.replace('Bearer ', '')
    return token === webhookToken
  } catch (error) {
    console.error('Bearer auth validation error:', error)
    return false
  }
}

/**
 * Validates Pagar.me webhook signature with dual SHA-1/SHA-256 support
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

    console.log('🔐 Verifying webhook signature:', {
      signatureReceived: signature.substring(0, 20) + '...',
      bodyLength: body.length,
      secretConfigured: Boolean(webhookSecret)
    })

    const encoder = new TextEncoder()
    
    // Try both SHA-1 and SHA-256 (GitHub uses SHA-1 for X-Hub-Signature, SHA-256 for X-Hub-Signature-256)
    const algorithms = [
      { name: 'SHA-1', prefix: 'sha1' },
      { name: 'SHA-256', prefix: 'sha256' }
    ]
    
    for (const algo of algorithms) {
      try {
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(webhookSecret),
          { name: 'HMAC', hash: algo.name },
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
        
        // Compare signatures in different formats
        const expectedSignatures = [
          `${algo.prefix}=${computedHex}`,  // Standard format: sha1=abc123 or sha256=abc123
          computedHex,                      // Raw hex format: abc123
          `${computedHex}`                  // Ensure string comparison
        ]
        
        for (const expectedSig of expectedSignatures) {
          if (signature === expectedSig) {
            console.log(`✅ Webhook signature verified using ${algo.name}`)
            return true
          }
        }
      } catch (error) {
        console.log(`Failed ${algo.name} verification:`, error.message)
      }
    }
    
    console.log('❌ All signature verification methods failed')
    return false
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

    // If we can't find the user, handle unlinked payments for payment-to-auth flow
    if (!userId) {
      console.warn(`User not found for customer ID: ${customerId}`)
      
      // For successful payments without linked users, store payment data for future auth bridging
      if (webhookEvent.type === 'order.paid' || webhookEvent.type === 'charge.paid') {
        await handleUnlinkedPayment(eventData, webhookEvent)
      }
      
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

    // Process different event types - SIMPLIFIED to essential events only
    switch (webhookEvent.type) {
      // ✅ ESSENTIAL: Payment confirmation (consolidates order.paid + charge.paid)
      case 'order.paid':
      case 'charge.paid':
        await handlePaymentConfirmed(userId, eventData)
        break
        
      // ✅ ESSENTIAL: Payment failure (consolidates order.payment_failed + charge.failed)
      case 'order.payment_failed':
      case 'charge.failed':
        await handlePaymentFailed(userId, eventData)
        break
        
      // ✅ ESSENTIAL: Subscription created 
      case 'subscription.created':
        await handleSubscriptionCreated(userId, eventData)
        break
        
      // ✅ ESSENTIAL: Subscription canceled (handles both spellings)
      case 'subscription.canceled':
      case 'subscription.cancelled':
        await handleSubscriptionCanceled(userId, eventData)
        break
        
      // ✅ ESSENTIAL: Subscription renewal (consolidates charge.paid + charged)
      case 'subscription.charge.paid':
      case 'subscription.charged':
        await handleSubscriptionRenewal(userId, eventData)
        break
        
      // ✅ ESSENTIAL: Subscription charge failure (consolidates charge_failed + payment_failed)
      case 'subscription.charge_failed':
      case 'subscription.payment_failed':
        await handleSubscriptionChargeFailed(userId, eventData)
        break
        
      // 🤔 POTENTIALLY UNNECESSARY: These events might be redundant
      case 'subscription.charge_created':
        console.log(`⚠️ Received potentially unnecessary event: ${webhookEvent.type}`)
        await handleSubscriptionChargeCreated(userId, eventData)
        break
        
      case 'subscription.trial_ended':
        console.log(`⚠️ Received potentially unnecessary event: ${webhookEvent.type}`)
        await handleSubscriptionTrialEnded(userId, eventData)
        break
        
      case 'subscription.reactivated':
        console.log(`⚠️ Received potentially unnecessary event: ${webhookEvent.type}`)
        await handleSubscriptionReactivated(userId, eventData)
        break
        
      case 'subscription.suspended':
        console.log(`⚠️ Received potentially unnecessary event: ${webhookEvent.type}`)
        await handleSubscriptionSuspended(userId, eventData)
        break
        
      default:
        console.log(`❓ Unhandled event type: ${webhookEvent.type} - consider if this needs handling`)
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

/**
 * Handles payments from users without accounts (payment-to-auth flow)
 * Stores payment data for later retrieval during auth process
 */
const handleUnlinkedPayment = async (eventData: any, webhookEvent: WebhookEvent): Promise<void> => {
  console.log('Storing unlinked payment data for payment-to-auth flow')
  
  try {
    const customer = eventData.customer || {}
    const paymentData = {
      pagarme_payment_id: eventData.id || webhookEvent.id,
      customer_name: customer.name || '',
      customer_email: customer.email || '',
      customer_document: customer.document || '',
      customer_phone: customer.phones?.[0] || '',
      amount_paid: eventData.amount || 0,
      payment_method: eventData.payment_method || 'pix',
      plan_purchased: eventData.metadata?.plan_name || 'premium',
      payment_date: new Date().toISOString(),
      webhook_event_id: webhookEvent.id,
      status: 'paid_unlinked', // Special status for unlinked payments
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours to link
      created_at: new Date().toISOString()
    }

    // Store in a simple payment_bridge table for retrieval during auth
    const { error } = await supabase
      .from('payment_bridge')
      .insert(paymentData)

    if (error) {
      console.error('Failed to store unlinked payment data:', error)
      throw error
    }

    console.log(`Successfully stored unlinked payment data for payment ID: ${paymentData.pagarme_payment_id}`)
  } catch (error) {
    console.error('Error in handleUnlinkedPayment:', error)
    throw error
  }
}

const handlePaymentConfirmed = async (userId: string, eventData: any): Promise<void> => {
  console.log(`Payment confirmed for user: ${userId}`)
  
  // Update user subscription status to active
  const { error } = await supabase
    .from('Practitioners')
    .update({
      subscription_status: 'active',
      subscription_end_date: await calculateAccessTimeFromWebhook(userId, eventData),
      subscription_tier: 'premium',
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
      subscription_end_date: await calculateAccessTimeFromWebhook(userId, eventData),
      subscription_tier: 'premium',
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
      subscription_end_date: await calculateAccessTimeFromWebhook(userId, eventData),
      subscription_tier: 'premium',
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
  console.log('🕐 Calculating expiration date from event data');
  
  // Try to get expiration from subscription data
  if (eventData.next_billing_at) {
    console.log('📅 Using next_billing_at for expiration:', eventData.next_billing_at);
    return new Date(eventData.next_billing_at).toISOString();
  }
  
  // Try to get from current cycle end
  if (eventData.current_cycle?.end_at) {
    console.log('📅 Using current_cycle.end_at for expiration:', eventData.current_cycle.end_at);
    return new Date(eventData.current_cycle.end_at).toISOString();
  }
  
  // Fallback: 30 days from now
  console.log('📅 No billing data found, using 30-day fallback');
  const fallbackDate = new Date();
  fallbackDate.setDate(fallbackDate.getDate() + 30);
  return fallbackDate.toISOString();
}

const calculateAccessTimeFromWebhook = async (userId: string, eventData: any): Promise<string> => {
  console.log('🕐 Calculating access time for webhook event');
  
  // Get current user access data
  const { data: currentUser, error: getUserError } = await supabase
    .from('Practitioners')
    .select('subscription_end_date')
    .eq('id', userId)
    .single();

  if (getUserError) {
    console.error('Failed to get user for access calculation:', getUserError);
    // Fallback to 30 days from now
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 30);
    return fallbackDate.toISOString();
  }

  // Try to get plan days from EVIDENS database using plan name
  let planDays = 30; // Default fallback
  
  if (eventData.plan?.name) {
    const { data: evidensPlan } = await supabase
      .from('PaymentPlans')
      .select('days')
      .ilike('name', `%${eventData.plan.name}%`)
      .single();
    
    if (evidensPlan && evidensPlan.days) {
      planDays = evidensPlan.days;
      console.log('📋 Found EVIDENS plan with days:', planDays);
    }
  }

  // Calculate new access time (same logic as Edge Function)
  let newEndDate: string;
  const paymentDate = new Date();
  
  if (!currentUser.subscription_end_date) {
    // No existing access - start from payment date
    console.log('📅 No existing access, creating new access period');
    const endDate = new Date(paymentDate);
    endDate.setDate(endDate.getDate() + planDays);
    newEndDate = endDate.toISOString();
  } else {
    const existingEndDate = new Date(currentUser.subscription_end_date);
    
    if (existingEndDate <= paymentDate) {
      // User is overdue - add FULL time from payment date
      console.log('📅 User is overdue, adding FULL purchased time from payment date');
      const endDate = new Date(paymentDate);
      endDate.setDate(endDate.getDate() + planDays);
      newEndDate = endDate.toISOString();
    } else {
      // User still has active access - extend existing time
      console.log('📅 User has active access, extending existing time');
      const endDate = new Date(existingEndDate);
      endDate.setDate(endDate.getDate() + planDays);
      newEndDate = endDate.toISOString();
    }
  }

  console.log('✅ Webhook calculated new access end date:', newEndDate);
  return newEndDate;
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
    const signatureHeader = req.headers.get('X-Hub-Signature') || 
                           req.headers.get('X-Hub-Signature-256') || 
                           req.headers.get('X-Pagarme-Signature') ||
                           req.headers.get('x-hub-signature') ||
                           req.headers.get('x-hub-signature-256')

    // Enhanced debugging to see exact headers
    const allHeaders = Object.fromEntries(req.headers.entries());
    console.log('Webhook received with headers:', {
      hasAuth: Boolean(authHeader),
      authHeaderValue: authHeader ? `${authHeader.substring(0, 50)}...` : 'none',
      hasSignature: Boolean(signatureHeader),
      signatureHeaderValue: signatureHeader ? `${signatureHeader.substring(0, 50)}...` : 'none',
      contentType: req.headers.get('Content-Type'),
      userAgent: req.headers.get('User-Agent'),
      allHeaders: Object.keys(allHeaders)
    })

    let authenticationPassed = false
    const authResults = {
      basicAuth: false,
      bearerAuth: false,
      signature: false
    }

    // Check HTTP Basic Authentication (when "Habilitar autenticação" is enabled)
    // Webhook credentials: Username="Reviews", Password="#Pipoquinha12"
    const webhookUser = Deno.env.get('PAGARME_WEBHOOK_USER') || 'Reviews'
    const webhookPassword = Deno.env.get('PAGARME_WEBHOOK_PASSWORD') || '#Pipoquinha12'
    
    if (webhookUser && webhookPassword) {
      authResults.basicAuth = validateBasicAuth(authHeader)
      if (authResults.basicAuth) {
        console.log('✅ HTTP Basic Auth validation passed with configured credentials')
        authenticationPassed = true
      } else {
        console.log('❌ HTTP Basic Auth validation failed')
        console.log(`Expected Basic Auth: ${Buffer.from(`${webhookUser}:${webhookPassword}`).toString('base64').substring(0, 10)}...`)
      }
    }

    // Check Bearer Token Authentication - PRIORITIZED for Pagar.me compatibility
    const webhookToken = Deno.env.get('PAGARME_SECRET_KEY') || Deno.env.get('PAGARME_WEBHOOK_TOKEN')
    if (webhookToken) {
      authResults.bearerAuth = validateBearerAuth(authHeader)
      if (authResults.bearerAuth) {
        console.log('✅ Bearer Token Auth validation passed with Pagar.me secret key')
        authenticationPassed = true
      } else {
        console.log('❌ Bearer Token Auth validation failed')
        console.log(`Expected Bearer token format: Bearer ${webhookToken.substring(0, 10)}...`)
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

    // CRITICAL FIX: Pagar.me expects Bearer token authentication based on error message
    // Error: {"code":401,"message":"Auth header is not 'Bearer {token}'"}
    if (!authenticationPassed) {
      console.error('Webhook authentication failed:', {
        basicAuthConfigured: Boolean(webhookUser && webhookPassword),
        bearerAuthConfigured: Boolean(webhookToken),
        signatureConfigured: Boolean(webhookSecret),
        authHeader: authHeader ? `${authHeader.substring(0, 20)}...` : 'none',
        authResults,
        availableEnvVars: {
          hasWebhookUser: Boolean(Deno.env.get('PAGARME_WEBHOOK_USER')),
          hasWebhookPassword: Boolean(Deno.env.get('PAGARME_WEBHOOK_PASSWORD')),
          hasWebhookToken: Boolean(Deno.env.get('PAGARME_WEBHOOK_TOKEN')),
          hasSecretKey: Boolean(Deno.env.get('PAGARME_SECRET_KEY')),
          hasWebhookSecret: Boolean(Deno.env.get('PAGARME_WEBHOOK_SECRET'))
        }
      })
      
      // Return the exact error format Pagar.me expects
      return sendError("Auth header is not 'Bearer {token}'", 401)
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