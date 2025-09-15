// ABOUTME: Pagar.me Webhook V2.0 Handler - Production-ready webhook processing with comprehensive error handling
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Webhook authentication configuration
const WEBHOOK_CONFIG = {
  // Hardcoded Basic Auth credentials (fallback)
  basicAuth: {
    username: 'Reviews',
    password: '#Pipoquinha12'
  },

  // Environment variable overrides
  username: Deno.env.get('PAGARME_WEBHOOK_USER') || 'Reviews',
  password: Deno.env.get('PAGARME_WEBHOOK_PASSWORD') || '#Pipoquinha12',
  secretKey: Deno.env.get('PAGARME_SECRET_KEY') || 'sk_503afc1f882248718635c3e92591c79c'
}

// Authenticate webhook request
const authenticateWebhook = (authHeader: string | null): { success: boolean; method: string; details: string } => {
  if (!authHeader) {
    return { success: false, method: 'none', details: 'Missing authorization header' }
  }

  // Try Basic Authentication first (Pagar.me webhook standard)
  if (authHeader.startsWith('Basic ')) {
    const encoded = authHeader.replace('Basic ', '')
    try {
      const decoded = atob(encoded)
      const [username, password] = decoded.split(':')

      const validBasicAuth = (
        (username === WEBHOOK_CONFIG.username && password === WEBHOOK_CONFIG.password) ||
        (username === WEBHOOK_CONFIG.basicAuth.username && password === WEBHOOK_CONFIG.basicAuth.password)
      )

      if (validBasicAuth) {
        return { success: true, method: 'Basic Auth', details: `Valid credentials for user: ${username}` }
      } else {
        return { success: false, method: 'Basic Auth', details: `Invalid credentials. Got: ${username}:${password.substring(0, 3)}...` }
      }
    } catch (error) {
      return { success: false, method: 'Basic Auth', details: `Failed to decode: ${error.message}` }
    }
  }

  // Try Bearer token (for API key authentication)
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    const validBearer = token === WEBHOOK_CONFIG.secretKey || token.startsWith('sk_')

    if (validBearer) {
      return { success: true, method: 'Bearer Token', details: `Valid API key: ${token.substring(0, 15)}...` }
    } else {
      return { success: false, method: 'Bearer Token', details: `Invalid API key. Expected: sk_503afc1...` }
    }
  }

  return { success: false, method: 'unknown', details: 'Unsupported authentication method' }
}

// Find user by email (customer email from webhook)
const findUserByEmail = async (supabase: any, email: string) => {
  try {
    // First try to find user in auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (!authError && authUsers?.users) {
      const authUser = authUsers.users.find((u: any) => u.email === email)
      if (authUser) {
        // Check if user exists in practitioners table
        const { data: practitioner, error: pracError } = await supabase
          .from('Practitioners')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (!pracError && practitioner) {
          return { user: practitioner, source: 'practitioners' }
        }
      }
    }

    // Fallback: try pending account links
    const { data: pendingLink, error: linkError } = await supabase
      .from('pending_account_links')
      .select('*')
      .eq('email', email)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!linkError && pendingLink) {
      return { user: pendingLink, source: 'pending_account_links' }
    }

    return { user: null, source: 'not_found' }
  } catch (error) {
    console.error('Error finding user by email:', error)
    return { user: null, source: 'error', error: error.message }
  }
}

// Handle successful payment webhook
const handlePaymentSuccess = async (supabase: any, webhookData: any) => {
  try {
    console.log('🎉 Processing successful payment webhook:', webhookData.type)

    const customerEmail = webhookData.data.customer.email
    const customerId = webhookData.data.customer.id
    const amount = webhookData.data.amount
    const paymentMethod = webhookData.data.charges?.[0]?.payment_method || 'unknown'

    console.log('📧 Customer Email:', customerEmail)
    console.log('👤 Customer ID:', customerId)
    console.log('💰 Amount:', amount)
    console.log('💳 Payment Method:', paymentMethod)

    // Find user by email
    const userLookup = await findUserByEmail(supabase, customerEmail)
    console.log('🔍 User lookup result:', userLookup)

    if (!userLookup.user) {
      console.log('❌ User not found, storing unlinked payment data')
      return await handleUnlinkedPayment(supabase, webhookData)
    }

    if (userLookup.source === 'practitioners') {
      // User exists - activate premium subscription
      const user = userLookup.user

      console.log('✅ Found existing user, activating premium subscription')
      const { error: updateError } = await supabase
        .from('Practitioners')
        .update({
          subscription_tier: 'premium',
          subscription_starts_at: new Date().toISOString(),
          subscription_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('❌ Failed to update user subscription:', updateError)
        return { processed: false, error: 'subscription_update_failed' }
      }

      console.log('🎯 Premium subscription activated for user:', user.id)
      return { processed: true, action: 'subscription_activated', userId: user.id }

    } else if (userLookup.source === 'pending_account_links') {
      // Payment-to-auth flow - mark pending link as processed
      const pendingLink = userLookup.user

      console.log('📋 Found pending account link, updating payment status')
      const { error: updateError } = await supabase
        .from('pending_account_links')
        .update({
          payment_data: {
            ...pendingLink.payment_data,
            paidAt: new Date().toISOString(),
            pagarmeCustomerId: customerId,
            pagarmeOrderId: webhookData.data.id,
            paymentConfirmed: true
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingLink.id)

      if (updateError) {
        console.error('❌ Failed to update pending payment:', updateError)
        return { processed: false, error: 'pending_link_update_failed' }
      }

      console.log('✅ Pending payment link updated successfully')
      return { processed: true, action: 'pending_payment_updated', linkId: pendingLink.id }
    }

    return { processed: false, error: 'unhandled_user_source' }

  } catch (error) {
    console.error('❌ Error processing payment success:', error)
    return { processed: false, error: error.message }
  }
}

// Handle unlinked payment (when user not found)
const handleUnlinkedPayment = async (supabase: any, webhookData: any) => {
  try {
    console.log('📝 Storing unlinked payment data for payment-to-auth flow')

    const customerData = webhookData.data.customer
    const paymentData = {
      pagarmeOrderId: webhookData.data.id,
      pagarmeCustomerId: customerData.id,
      amount: webhookData.data.amount,
      paymentMethod: webhookData.data.charges?.[0]?.payment_method || 'unknown',
      paidAt: new Date().toISOString(),
      webhookType: webhookData.type
    }

    // Create a temporary token for linking
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const { error: insertError } = await supabase
      .from('pending_account_links')
      .insert({
        email: customerData.email,
        token: token,
        payment_data: paymentData,
        customer_data: {
          name: customerData.name,
          email: customerData.email,
          document: customerData.document,
          pagarmeCustomerId: customerData.id
        },
        plan_data: {
          amount: webhookData.data.amount,
          description: webhookData.data.items?.[0]?.description || 'EVIDENS Premium Access'
        },
        link_type: 'registration',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })

    if (insertError) {
      console.error('❌ Failed to store unlinked payment:', insertError)
      return { processed: false, error: 'unlinked_storage_failed' }
    }

    console.log('✅ Unlinked payment stored successfully for email:', customerData.email)
    return { processed: true, action: 'unlinked_payment_stored', email: customerData.email }

  } catch (error) {
    console.error('❌ Error in handleUnlinkedPayment:', error)
    return { processed: false, error: error.message }
  }
}

// Log webhook event for debugging and insert into realtime table
const logWebhookEvent = async (supabase: any, eventData: any, result: any) => {
  try {
    const webhookLog = {
      eventId: eventData.id,
      eventType: eventData.type,
      processed: result.processed,
      action: result.action,
      timestamp: new Date().toISOString()
    }

    console.log('📊 Webhook Event Log:', webhookLog)

    // Insert webhook event into payment_webhooks table for realtime listening
    const paymentId = extractPaymentId(eventData)
    const customerId = eventData.data?.customer?.id
    const amount = eventData.data?.amount
    const paymentMethod = eventData.data?.charges?.[0]?.payment_method || 'unknown'

    if (paymentId) {
      const { error: insertError } = await supabase
        .from('payment_webhooks')
        .insert({
          payment_id: paymentId,
          event_type: eventData.type,
          customer_id: customerId,
          amount: amount,
          status: getPaymentStatus(eventData.type),
          payment_method: paymentMethod,
          webhook_data: {
            eventId: eventData.id,
            eventType: eventData.type,
            processed: result.processed,
            action: result.action,
            customerEmail: eventData.data?.customer?.email,
            timestamp: new Date().toISOString()
          }
        })

      if (insertError) {
        console.error('❌ Failed to insert webhook event for realtime:', insertError)
      } else {
        console.log('✅ Webhook event inserted for realtime tracking:', paymentId)
      }
    }
  } catch (error) {
    console.error('❌ Failed to log webhook event:', error)
  }
}

// Extract payment ID from webhook data
const extractPaymentId = (eventData: any): string | null => {
  try {
    // For PIX payments, payment ID is usually in eventData.data.id
    if (eventData.data?.id) {
      return eventData.data.id
    }

    // For credit card subscriptions, might be in charges
    if (eventData.data?.charges?.[0]?.id) {
      return eventData.data.charges[0].id
    }

    // Fallback to order ID if available
    if (eventData.data?.order?.id) {
      return eventData.data.order.id
    }

    return null
  } catch (error) {
    console.error('❌ Error extracting payment ID:', error)
    return null
  }
}

// Get payment status from event type
const getPaymentStatus = (eventType: string): string => {
  switch (eventType) {
    case 'charge.paid':
    case 'order.paid':
      return 'paid'
    case 'charge.failed':
    case 'charge.payment_failed':
    case 'order.payment_failed':
      return 'failed'
    default:
      return 'pending'
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    const authHeader = req.headers.get('Authorization')

    // Debug: Log incoming webhook headers
    const allHeaders = Object.fromEntries(req.headers.entries())
    console.log('🔍 Webhook received with headers:', {
      hasAuth: Boolean(authHeader),
      authHeaderValue: authHeader ? authHeader.substring(0, 20) + '...' : 'none',
      hasSignature: Boolean(req.headers.get('X-Hub-Signature-256')),
      signatureHeaderValue: req.headers.get('X-Hub-Signature-256') || 'none',
      contentType: req.headers.get('Content-Type'),
      userAgent: req.headers.get('User-Agent'),
      allHeaders: Object.keys(allHeaders)
    })

    // Authenticate the webhook request
    const authResult = authenticateWebhook(authHeader)

    if (authResult.method === 'Basic Auth' && authResult.success) {
      console.log('✅ HTTP Basic Auth validation passed with configured credentials')
    } else if (authResult.method === 'Bearer Token' && authResult.success) {
      console.log('✅ Bearer Token Auth validation passed')
    } else {
      console.error(`❌ ${authResult.method} Auth validation failed`)
      console.error('Auth details:', authResult.details)

      if (authResult.method === 'Bearer Token') {
        console.log('Expected Bearer token format: Bearer sk_503afc1...')
      }

      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          details: authResult.details
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse webhook payload
    const webhookData = await req.json()
    console.log(`Processing webhook event: ${webhookData.type}`)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    let result = { processed: false, error: 'unhandled_event_type' }

    // Route webhook events to handlers
    switch (webhookData.type) {
      case 'order.paid':
      case 'charge.paid':
        result = await handlePaymentSuccess(supabase, webhookData)
        break

      case 'order.payment_failed':
      case 'charge.failed':
        console.log('💔 Payment failed webhook received')
        result = { processed: true, action: 'payment_failed_logged' }
        break

      default:
        console.log('ℹ️ Unhandled webhook event type:', webhookData.type)
        result = { processed: false, error: 'unhandled_event_type' }
    }

    // Log the webhook event
    await logWebhookEvent(supabase, webhookData, result)

    if (result.processed) {
      console.log('✅ Webhook processed successfully:', result.action)
      return new Response(
        JSON.stringify({
          received: true,
          processed: true,
          action: result.action
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      console.error('❌ Webhook processing failed:', result.error)
      return new Response(
        JSON.stringify({
          received: true,
          processed: false,
          error: result.error
        }),
        {
          status: 200, // Return 200 to prevent Pagar.me retries for business logic errors
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('❌ Webhook processing error:', error)

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})