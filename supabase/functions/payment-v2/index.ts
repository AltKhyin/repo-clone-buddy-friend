// ABOUTME: Payment V2.0 Edge Function for secure Pagar.me API integration
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Pagar.me V2.0 configuration
const PAGARME_V2_CONFIG = {
  baseURL: 'https://api.pagar.me/core/v5',
  secretKey: 'sk_test_c2d9d4450e3d4ac5913c020779efbf14',
  publicKey: 'pk_test_gjB1ZQAFVBH5LDlG',
}

interface PaymentV2Request {
  code: string
  customer: {
    name: string
    type: 'individual'
    email: string
    document: string
    address: {
      line_1: string
      zip_code: string
      city: string
      state: string
      country: 'BR'
    }
    phones: {
      mobile_phone: {
        country_code: '55'
        area_code: string
        number: string
      }
    }
  }
  billing_type: 'prepaid'
  interval: 'month'
  interval_count: 1
  items: Array<{
    description: string
    quantity: 1
    code: string
    pricing_scheme: {
      scheme_type: 'unit'
      price: number
    }
  }>
  payment_method: 'credit_card'
  card?: {
    number: string
    holder_name: string
    exp_month: number
    exp_year: number
    cvv: string
    billing_address: {
      line_1: string
      zip_code: string
      city: string
      state: string
      country: 'BR'
    }
  }
  card_token?: string
  installments: number
  statement_descriptor: 'EVIDENS'
  metadata: {
    platform: 'evidens'
    plan_type: 'premium'
    installments: string
    base_price: number
    fee_included: number
    fee_rate: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client for user verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const paymentRequest: PaymentV2Request = await req.json()
    
    console.log('Payment V2.0 Edge Function - Processing payment for user:', user.id)
    
    // Check if we need to tokenize card data first
    let finalRequest = paymentRequest
    
    if (paymentRequest.card && !paymentRequest.card_token) {
      console.log('Payment V2.0 Edge Function - Tokenizing card data...')
      
      // Tokenize card data server-side (use public key as appId query parameter)
      const tokenResponse = await fetch(`${PAGARME_V2_CONFIG.baseURL}/tokens?appId=${PAGARME_V2_CONFIG.publicKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'card',
          card: {
            number: paymentRequest.card.number,
            holder_name: paymentRequest.card.holder_name,
            exp_month: paymentRequest.card.exp_month,
            exp_year: paymentRequest.card.exp_year,
            cvv: paymentRequest.card.cvv,
          },
        }),
      })

      const tokenData = await tokenResponse.json()

      if (!tokenResponse.ok) {
        console.error('Payment V2.0 Edge Function - Card tokenization failed:', tokenData)
        return new Response(
          JSON.stringify({ 
            error: tokenData.message || 'Erro na tokenização do cartão',
            details: tokenData 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('Payment V2.0 Edge Function - Card tokenized successfully:', tokenData.id)

      // Replace card data with token
      finalRequest = {
        ...paymentRequest,
        card_token: tokenData.id,
      }
      delete finalRequest.card // Remove raw card data
    }

    console.log('Payment V2.0 Edge Function - Final request:', JSON.stringify(finalRequest, null, 2))

    // Make request to Pagar.me API
    const pagarmeResponse = await fetch(`${PAGARME_V2_CONFIG.baseURL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(PAGARME_V2_CONFIG.secretKey + ':')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(finalRequest),
    })

    const pagarmeData = await pagarmeResponse.json()
    
    console.log('Payment V2.0 Edge Function - Pagar.me response status:', pagarmeResponse.status)
    console.log('Payment V2.0 Edge Function - Pagar.me response:', JSON.stringify(pagarmeData, null, 2))

    if (!pagarmeResponse.ok) {
      console.error('Payment V2.0 Edge Function - Pagar.me API Error:', pagarmeData)
      
      return new Response(
        JSON.stringify({ 
          error: pagarmeData.message || 'Erro no processamento do pagamento',
          details: pagarmeData 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // TODO: Store subscription data in database if needed
    // const { error: dbError } = await supabaseClient
    //   .from('subscriptions_v2')
    //   .insert({
    //     user_id: user.id,
    //     pagarme_subscription_id: pagarmeData.id,
    //     status: pagarmeData.status,
    //     plan_type: paymentRequest.metadata.plan_type,
    //     installments: paymentRequest.installments,
    //     total_amount: paymentRequest.items[0].pricing_scheme.price,
    //     created_at: new Date().toISOString()
    //   })

    console.log('Payment V2.0 Edge Function - Success! Subscription created:', pagarmeData.id)

    return new Response(
      JSON.stringify({
        success: true,
        subscription: pagarmeData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Payment V2.0 Edge Function - Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})