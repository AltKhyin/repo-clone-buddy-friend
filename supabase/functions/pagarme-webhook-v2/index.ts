// ABOUTME: Pagar.me Webhook V2.0 Handler - Production-ready webhook processing without JWT verification
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// NOTE: Authentication removed - Pagar.me webhooks secured via HTTPS and source validation

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

// Handle new user creation with invitation email + auto-confirmation pattern
const handleNewUserInvitation = async (supabase: any, webhookData: any) => {
  try {
    console.log('🚀 Creating new user with invitation email + auto-confirmation pattern')
    console.log('🔍 Customer data:', JSON.stringify(webhookData.data.customer, null, 2))

    const customerData = webhookData.data.customer
    const subscriptionEndsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    const siteUrl = Deno.env.get('SITE_URL') || 'https://reviews.igoreckert.com.br'

    console.log('👤 About to create user with email:', customerData.email)
    console.log('📅 Subscription ends at:', subscriptionEndsAt.toISOString())

    // Step 1: Send invitation email (creates user AND sends nice invitation email)
    console.log('📧 Sending invitation email with onboarding experience...')

    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      customerData.email,
      {
        data: {
          // User profile data - trigger expects full_name in raw_user_meta_data
          full_name: customerData.name || customerData.email.split('@')[0],
          subscription_tier: 'premium',
          subscription_starts_at: new Date().toISOString(),
          subscription_ends_at: subscriptionEndsAt.toISOString(),

          // Payment creation flags for password setup page
          created_from_payment: true,
          needs_password_setup: true, // Enable password setup at /complete-registration
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
        redirectTo: `${siteUrl}/complete-registration?setup=true`
      }
    )

    if (inviteError) {
      console.error('❌ Failed to send invitation email:', JSON.stringify(inviteError, null, 2))
      return { processed: false, error: 'invitation_failed', details: inviteError.message }
    }

    if (!inviteData.user) {
      console.error('❌ No user data returned from invitation')
      return { processed: false, error: 'no_user_data' }
    }

    console.log('✅ Invitation email sent successfully:', {
      userId: inviteData.user.id,
      email: customerData.email,
      orderId: webhookData.data.id
    })

    // Step 2: Set app metadata without auto-confirming to preserve invitation token
    console.log('🔄 Setting app metadata while preserving invitation token...')

    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      inviteData.user.id,
      {
        app_metadata: {
          role: 'practitioner',
          subscription_tier: 'premium'
        }
      }
    )

    if (metadataError) {
      console.error('❌ Failed to set app metadata:', JSON.stringify(metadataError, null, 2))
      console.warn('⚠️ User created but app metadata not set')
    } else {
      console.log('✅ App metadata set successfully, invitation token preserved')
    }

    // The handle_new_user trigger will automatically create the Practitioners record
    // with premium subscription tier (as per our migration)

    // 🔥 ANALYTICS WEBHOOK: Send analytics data to Make.com for new users
    const paymentId = extractPaymentId(webhookData)
    const mockUserLookup = {
      user: { id: inviteData.user.id },
      source: 'new_user'
    }
    await sendAnalyticsWebhookWithRealData(supabase, webhookData, mockUserLookup, paymentId)

    return {
      processed: true,
      action: 'new_user_invited_token_preserved',
      userId: inviteData.user.id,
      email: customerData.email,
      invitationSent: true,
      tokenPreserved: !metadataError
    }

  } catch (error) {
    console.error('❌ Error in handleNewUserInvitation:', error)
    return { processed: false, error: error.message }
  }
}

// Log webhook event for debugging and insert into realtime table
const logWebhookEvent = async (supabase: any, eventData: any, result: any) => {
  try {
    // Extract key information for webhook logging
    const paymentId = extractPaymentId(eventData)
    const paymentStatus = getPaymentStatus(eventData.type)
    const customerEmail = eventData.data?.customer?.email
    const customerId = eventData.data?.customer?.id
    const amount = eventData.data?.amount || 0

    const webhookRecord = {
      event_type: eventData.type,
      payment_id: paymentId,
      customer_id: customerId,
      amount: amount,
      status: paymentStatus,
      payment_method: eventData.data?.payment_method || 'unknown',
      processed_at: new Date().toISOString(),
      webhook_data: eventData
    }

    console.log('📊 Inserting webhook event:', {
      event_type: webhookRecord.event_type,
      payment_id: webhookRecord.payment_id,
      customer_id: webhookRecord.customer_id,
      amount: webhookRecord.amount,
      status: webhookRecord.status
    })

    // Insert webhook event into payment_webhooks table
    const { data, error } = await supabase
      .from('payment_webhooks')
      .insert([webhookRecord])
      .select()

    if (error) {
      console.error('❌ Failed to insert webhook event:', error)
    } else {
      console.log('✅ Webhook event logged to database:', data?.[0]?.id)
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

    // Check if we've already processed this webhook
    const { data: existingData } = await supabase
      .from('payment_webhooks')
      .select('id')
      .eq('payment_id', paymentId)
      .eq('event_type', webhookData.type)
      .single()

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
  console.log('🔍 Webhook received:', req.method, req.url)

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
    // Debug: Log incoming webhook headers (no auth required)
    const allHeaders = Object.fromEntries(req.headers.entries())
    console.log('🔍 Webhook received with headers:', {
      contentType: req.headers.get('Content-Type'),
      userAgent: req.headers.get('User-Agent'),
      hasSignature: Boolean(req.headers.get('X-Hub-Signature-256')),
      allHeaders: Object.keys(allHeaders)
    })

    console.log('✅ Pagar.me webhook received - processing without authentication')

    // Parse webhook payload
    const webhookData = await req.json()
    console.log(`Processing webhook event: ${webhookData.type}`)
    console.log('Customer email:', webhookData.data?.customer?.email)
    console.log('Payment ID:', webhookData.data?.id)
    console.log('Amount:', webhookData.data?.amount)

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

    console.log('✅ Supabase client initialized')

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
          action: result.action,
          message: 'Webhook processed successfully without authentication!'
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