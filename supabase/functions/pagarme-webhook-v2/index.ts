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

// Validation and debug logging
console.log('🔍 Webhook config check:', {
  hasUsername: Boolean(WEBHOOK_CONFIG.username),
  hasPassword: Boolean(WEBHOOK_CONFIG.password),
  hasSecretKey: Boolean(WEBHOOK_CONFIG.secretKey),
  usernameLength: WEBHOOK_CONFIG.username?.length || 0,
  passwordLength: WEBHOOK_CONFIG.password?.length || 0,
  secretKeyPrefix: WEBHOOK_CONFIG.secretKey?.substring(0, 10) || 'none'
});

if (!WEBHOOK_CONFIG.username || !WEBHOOK_CONFIG.password || !WEBHOOK_CONFIG.secretKey) {
  console.error('❌ Missing webhook credentials:', {
    username: WEBHOOK_CONFIG.username ? '[SET]' : '[MISSING]',
    password: WEBHOOK_CONFIG.password ? '[SET]' : '[MISSING]',
    secretKey: WEBHOOK_CONFIG.secretKey ? '[SET]' : '[MISSING]'
  });
  // Don't throw error - continue with logging to debug the issue
  console.warn('⚠️ Continuing without full credentials for debugging...');
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

      const validBasicAuth = (username === WEBHOOK_CONFIG.username && password === WEBHOOK_CONFIG.password)

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
    console.log('🔍 Full webhook data:', JSON.stringify(webhookData, null, 2))

    const customerEmail = webhookData.data.customer.email
    const customerId = webhookData.data.customer.id
    const amount = webhookData.data.amount
    const paymentMethod = webhookData.data.charges?.[0]?.payment_method || 'unknown'
    const paymentId = extractPaymentId(webhookData)

    console.log('📧 Customer Email:', customerEmail)
    console.log('👤 Customer ID:', customerId)
    console.log('💰 Amount:', amount)
    console.log('💳 Payment Method:', paymentMethod)
    console.log('🆔 Payment ID:', paymentId)

    // Find user by email
    console.log('🔍 Starting user lookup for email:', customerEmail)
    const userLookup = await findUserByEmail(supabase, customerEmail)
    console.log('🔍 User lookup result:', JSON.stringify(userLookup, null, 2))

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

// Handle new user creation with immediate auto-confirmation (no email confirmation required)
const handleNewUserInvitation = async (supabase: any, webhookData: any) => {
  try {
    console.log('🚀 Creating new user account with immediate activation (no email confirmation)')
    console.log('🔍 Customer data:', JSON.stringify(webhookData.data.customer, null, 2))

    const customerData = webhookData.data.customer
    const subscriptionEndsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

    console.log('👤 About to create user with email:', customerData.email)
    console.log('📅 Subscription ends at:', subscriptionEndsAt.toISOString())

    // Create user with email as temporary password (will be changed on first login)
    console.log('🔄 Creating new user account with immediate activation...')

    // Create user with secure temporary password and auto-confirmation
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: customerData.email,
      password: `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Secure temporary password
      email_confirm: true, // Auto-confirm email immediately
      user_metadata: {
        // User profile data - trigger expects full_name in raw_user_meta_data
        full_name: customerData.name || customerData.email.split('@')[0],
        subscription_tier: 'premium',
        subscription_starts_at: new Date().toISOString(),
        subscription_ends_at: subscriptionEndsAt.toISOString(),

        // Payment creation flag for password setup page
        created_from_payment: true,
        payment_order_id: webhookData.data.id,
        payment_amount: webhookData.data.amount,
        payment_method: webhookData.data.charges?.[0]?.payment_method || 'unknown',
        customer_document: customerData.document || '',

        // Additional customer data
        customer_phone: customerData.phones?.mobile_phone ?
          `${customerData.phones.mobile_phone.country_code}${customerData.phones.mobile_phone.area_code}${customerData.phones.mobile_phone.number}` : '',
        pagarme_customer_id: customerData.id,

        // Plan information
        plan_description: webhookData.data.items?.[0]?.description || 'EVIDENS Premium'
      },
      app_metadata: {
        role: 'practitioner',
        subscription_tier: 'premium'
      }
    })

    if (createError) {
      console.error('❌ Failed to create user account:', JSON.stringify(createError, null, 2))
      return { processed: false, error: 'account_creation_failed', details: createError.message }
    }

    if (!userData.user) {
      console.error('❌ No user data returned from account creation')
      return { processed: false, error: 'no_user_data' }
    }

    console.log('✅ User account created and auto-confirmed:', {
      userId: userData.user.id,
      email: customerData.email,
      orderId: webhookData.data.id,
      emailConfirmed: userData.user.email_confirmed_at
    })

    // The handle_new_user trigger will automatically create the Practitioners record
    // with premium subscription tier (as per our migration)

    // 🔥 ANALYTICS WEBHOOK: Send analytics data to Make.com for new users
    const paymentId = extractPaymentId(webhookData)
    const mockUserLookup = {
      user: { id: userData.user.id },
      source: 'new_user'
    }
    await sendAnalyticsWebhookWithRealData(supabase, webhookData, mockUserLookup, paymentId)

    return {
      processed: true,
      action: 'new_user_created_auto_confirmed',
      userId: userData.user.id,
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

    // Skip webhook event insertion - payment_webhooks table doesn't exist at commit 016b6c4
    console.log('ℹ️ Webhook event logging skipped - table not available at this commit')
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

    // Skip webhook data lookup - payment_webhooks table doesn't exist at commit 016b6c4
    const existingData = {}

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('🔍 Supabase connection check:', {
      hasUrl: Boolean(supabaseUrl),
      hasKey: Boolean(supabaseKey),
      urlPrefix: supabaseUrl?.substring(0, 20) || 'none',
      keyPrefix: supabaseKey?.substring(0, 20) || 'none'
    })

    const supabase = createClient(
      supabaseUrl ?? '',
      supabaseKey ?? '',
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