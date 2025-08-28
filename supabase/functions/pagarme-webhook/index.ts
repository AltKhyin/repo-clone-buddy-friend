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

    // Find the user associated with this payment
    let userId: string | null = null
    
    if (customerId) {
      const { data: user } = await supabase
        .from('Practitioners')
        .select('id')
        .eq('pagarme_customer_id', customerId)
        .single()
      
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

    // Process different event types
    switch (webhookEvent.type) {
      case 'order.paid':
      case 'charge.paid':
        await handlePaymentConfirmed(userId, eventData)
        break
        
      case 'order.payment_failed':
      case 'charge.failed':
        await handlePaymentFailed(userId, eventData)
        break
        
      case 'subscription.created':
        await handleSubscriptionCreated(userId, eventData)
        break
        
      case 'subscription.canceled':
        await handleSubscriptionCanceled(userId, eventData)
        break
        
      case 'subscription.charge.paid':
        await handleSubscriptionRenewal(userId, eventData)
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
  
  const { error } = await supabase
    .from('Practitioners')
    .update({
      subscription_status: 'active',
      subscription_expires_at: calculateExpirationDate(eventData),
      payment_metadata: {
        last_payment_date: new Date().toISOString(),
        last_payment_amount: eventData.amount
      }
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update user subscription: ${error.message}`)
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