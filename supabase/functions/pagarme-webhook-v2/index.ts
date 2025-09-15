// ABOUTME: Pagar.me Webhook V2.0 Handler - Production-ready webhook processing with comprehensive error handling
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Webhook authentication configuration
const WEBHOOK_CONFIG = {
  username: Deno.env.get('PAGARME_WEBHOOK_USER'),
  password: Deno.env.get('PAGARME_WEBHOOK_PASSWORD'),
  secretKey: Deno.env.get('PAGARME_SECRET_KEY')
}

// Validation
if (!WEBHOOK_CONFIG.username || !WEBHOOK_CONFIG.password || !WEBHOOK_CONFIG.secretKey) {
  throw new Error('Missing required webhook credentials. Set PAGARME_WEBHOOK_USER, PAGARME_WEBHOOK_PASSWORD, and PAGARME_SECRET_KEY environment variables.');
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

    // Note: pending_account_links table is no longer used
    // New users are handled directly via Supabase invitation system

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
    const paymentId = extractPaymentId(webhookData)

    console.log('📧 Customer Email:', customerEmail)
    console.log('👤 Customer ID:', customerId)
    console.log('💰 Amount:', amount)
    console.log('💳 Payment Method:', paymentMethod)

    // Find user by email
    const userLookup = await findUserByEmail(supabase, customerEmail)
    console.log('🔍 User lookup result:', userLookup)

    if (!userLookup.user) {
      console.log('❌ User not found, storing unlinked payment data')
      return await handleNewUserInvitation(supabase, webhookData)
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

      // 🔥 ANALYTICS WEBHOOK: Send analytics data to Make.com after successful payment
      await sendAnalyticsWebhookWithRealData(supabase, webhookData, userLookup, paymentId)

      return { processed: true, action: 'subscription_activated', userId: user.id }

    }

    // Note: pending_account_links flow removed - new users handled via direct invitation

    return { processed: false, error: 'unhandled_user_source' }

  } catch (error) {
    console.error('❌ Error processing payment success:', error)
    return { processed: false, error: error.message }
  }
}

// Handle new user creation with Supabase native invitation (simplified)
const handleNewUserInvitation = async (supabase: any, webhookData: any) => {
  try {
    console.log('📧 Creating new user account via Supabase invitation')

    const customerData = webhookData.data.customer
    const paymentData = {
      pagarmeOrderId: webhookData.data.id,
      pagarmeCustomerId: customerData.id,
      amount: webhookData.data.amount,
      paymentMethod: webhookData.data.charges?.[0]?.payment_method || 'unknown',
      paidAt: new Date().toISOString(),
      webhookType: webhookData.type
    }

    // Calculate subscription end date (1 year from now)
    const subscriptionEndsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

    // Use Supabase's native invitation system with premium metadata
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      customerData.email,
      {
        // Redirect to account setup page after email confirmation
        redirectTo: `https://reviews.igoreckert.com.br/complete-registration`,
        data: {
          // User profile data
          full_name: customerData.name,
          subscription_tier: 'premium',
          subscription_starts_at: new Date().toISOString(),
          subscription_ends_at: subscriptionEndsAt.toISOString(),

          // Payment creation flag for password setup page
          created_from_payment: true,
          payment_order_id: webhookData.data.id,
          payment_amount: webhookData.data.amount,
          payment_method: paymentData.paymentMethod,
          customer_document: customerData.document,

          // Additional customer data
          customer_phone: customerData.phone,
          pagarme_customer_id: customerData.id,

          // Plan information
          plan_description: webhookData.data.items?.[0]?.description || 'EVIDENS Premium'
        }
      }
    )

    if (inviteError) {
      console.error('❌ Failed to send user invitation:', inviteError)
      return { processed: false, error: 'invitation_failed', details: inviteError.message }
    }

    if (!inviteData.user) {
      console.error('❌ No user data returned from invitation')
      return { processed: false, error: 'no_user_data' }
    }

    console.log('✅ User invitation sent successfully:', {
      userId: inviteData.user.id,
      email: customerData.email,
      orderId: webhookData.data.id
    })

    // 🔥 ANALYTICS WEBHOOK: Send analytics data to Make.com for new users too
    const paymentId = extractPaymentId(webhookData)
    const mockUserLookup = {
      user: { id: inviteData.user.id },
      source: 'new_user'
    }
    await sendAnalyticsWebhookWithRealData(supabase, webhookData, mockUserLookup, paymentId)

    return {
      processed: true,
      action: 'new_user_invited',
      userId: inviteData.user.id,
      email: customerData.email
    }

  } catch (error) {
    console.error('❌ Error in handleNewUserInvitation:', error)
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

// Send analytics webhook with real data from payment confirmation
const sendAnalyticsWebhookWithRealData = async (supabase: any, webhookData: any, userLookup: any, paymentId: string | null) => {
  try {
    console.log('📊 Sending analytics webhook with real payment data...')

    if (!paymentId) {
      console.warn('⚠️ No payment ID found, skipping analytics webhook')
      return
    }

    // Get any existing webhook data (simplified approach)
    const { data: existingWebhook } = await supabase
      .from('payment_webhooks')
      .select('webhook_data')
      .eq('payment_id', paymentId)
      .single()

    const existingData = existingWebhook?.webhook_data || {}

    // Extract real data from webhook
    const customerData = webhookData.data.customer
    const transactionData = webhookData.data
    const charges = transactionData.charges?.[0] || {}

    // Build payload using existing structure but with real data
    const analyticsPayload = {
      // Event metadata (real timing)
      event: {
        type: 'payment_success',
        timestamp: new Date().toISOString(),
        source: 'evidens_v2',
        platform: 'web',
        environment: Deno.env.get('ENVIRONMENT') === 'production' ? 'production' : 'development',
        session_id: `webhook_${Date.now()}`,
      },

      // Customer data (from webhook)
      customer: {
        name: customerData.name || '',
        email: customerData.email,
        document: customerData.document?.replace(/\D/g, '') || '',
        phone: customerData.phone?.replace(/\D/g, '') || '',
        address: {
          street: customerData.address?.street || '',
          zip_code: customerData.address?.zip_code || '',
          city: customerData.address?.city || '',
          state: customerData.address?.state || '',
          country: 'BR',
        },
        customer_id_hash: btoa(`${customerData.email}-${customerData.document || ''}`).slice(0, 12),
      },

      // Transaction details (from webhook)
      transaction: {
        id: paymentId,
        code: transactionData.code || 'unknown',
        payment_method: charges.payment_method || 'unknown',
        status: 'paid',
        currency: 'BRL',
        amounts: {
          base_amount: Math.round((transactionData.amount || 0) / 100 * 100) / 100,
          final_amount: Math.round((transactionData.amount || 0) / 100 * 100) / 100,
          discount_amount: 0, // Could be calculated if discount data available
          fee_amount: Math.round((charges.fee || 0) / 100 * 100) / 100,
        },
        ...(charges.installments > 1 && {
          installments: {
            count: charges.installments,
            amount_per_installment: Math.round((transactionData.amount || 0) / charges.installments / 100 * 100) / 100,
            total_with_fees: Math.round((transactionData.amount || 0) / 100 * 100) / 100,
            fee_rate: '0%', // Would need to be calculated from charges data
          },
        }),
      },

      // Product/Plan data (from webhook items and metadata)
      product: {
        plan_id: transactionData.metadata?.plan_id || transactionData.items?.[0]?.id || 'unknown',
        plan_name: transactionData.items?.[0]?.description || 'EVIDENS Premium',
        plan_type: transactionData.metadata?.plan_type || 'premium',
        duration_days: parseInt(transactionData.metadata?.duration_days) || 365,
        category: 'subscription',
        sku: `evidens-${transactionData.metadata?.plan_type || 'premium'}-${charges.installments || 1}x`,
        pricing_tier: (transactionData.metadata?.plan_type || 'premium') as 'basic' | 'premium' | 'enterprise',
      },

      // Marketing attribution (simplified - will be enhanced later)
      marketing: {
        source: undefined,
        medium: undefined,
        campaign: undefined,
        term: undefined,
        content: undefined,
        referrer: undefined,
        landing_page: undefined,
        custom_parameter: transactionData.metadata?.custom_parameter,
      },

      // Technical metadata (simplified)
      technical: {
        user_agent: 'webhook',
        ip_address: undefined,
        browser_info: {
          name: undefined,
          version: undefined,
          language: 'unknown',
        },
        device_info: {
          type: 'desktop',
          screen_resolution: undefined,
        },
      },

      // Conversion data (computed from real data)
      conversion: {
        value: Math.round((transactionData.amount || 0) / 100 * 100) / 100,
        currency: 'BRL',
        conversion_type: 'purchase',
        customer_lifetime_value: Math.round((transactionData.amount || 0) / 100 * 100) / 100,
        is_new_customer: !userLookup.exists, // Real calculation based on user lookup
      },
    }

    // Send to Make.com webhook using existing URL
    const webhookUrl = 'https://hook.us2.make.com/qjdetduht1g375p7l556yrrutbi3j6cv'

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(analyticsPayload),
    })

    if (!response.ok) {
      throw new Error(`Analytics webhook failed: ${response.status} ${response.statusText}`)
    }

    const responseText = await response.text()
    console.log('✅ Analytics Webhook - Success:', responseText || 'No response body')

  } catch (error) {
    // Non-blocking error - don't break user experience
    console.error('❌ Analytics Webhook - Error:', error)
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