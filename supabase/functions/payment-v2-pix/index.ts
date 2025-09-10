// ABOUTME: PIX Payment V2.0 Edge Function for secure Pagar.me API integration (one-time payments)
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

interface PixPaymentRequest {
  code: string
  customer: {
    name: string
    type: 'individual'
    email: string
    document: string
    phones: {
      mobile_phone: {
        country_code: '55'
        area_code: string
        number: string
      }
    }
  }
  items: Array<{
    description: string
    quantity: 1
    amount: number
  }>
  payments: Array<{
    payment_method: 'pix'
    amount: number
    pix: {
      expires_in: number
    }
  }>
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
    const pixRequest: PixPaymentRequest = await req.json()
    
    console.log('PIX Payment V2.0 Edge Function - Processing PIX payment for user:', user.id)
    console.log('PIX Payment V2.0 Edge Function - Request:', JSON.stringify(pixRequest, null, 2))

    // Make request to Pagar.me API (Orders endpoint for PIX)
    const pagarmeResponse = await fetch(`${PAGARME_V2_CONFIG.baseURL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(PAGARME_V2_CONFIG.secretKey + ':')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(pixRequest),
    })

    const pagarmeData = await pagarmeResponse.json()
    
    console.log('PIX Payment V2.0 Edge Function - Pagar.me response status:', pagarmeResponse.status)
    console.log('PIX Payment V2.0 Edge Function - Pagar.me response:', JSON.stringify(pagarmeData, null, 2))

    if (!pagarmeResponse.ok) {
      console.error('PIX Payment V2.0 Edge Function - Pagar.me API Error:', pagarmeData)
      
      return new Response(
        JSON.stringify({ 
          error: pagarmeData.message || 'Erro no processamento do PIX',
          details: pagarmeData 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // TODO: Store PIX payment data in database if needed
    // const { error: dbError } = await supabaseClient
    //   .from('pix_payments_v2')
    //   .insert({
    //     user_id: user.id,
    //     pagarme_order_id: pagarmeData.id,
    //     status: pagarmeData.status,
    //     amount: pixRequest.payments[0].amount,
    //     qr_code: pagarmeData.charges?.[0]?.last_transaction?.qr_code,
    //     expires_at: pagarmeData.charges?.[0]?.last_transaction?.expires_at,
    //     created_at: new Date().toISOString()
    //   })

    console.log('PIX Payment V2.0 Edge Function - Success! PIX order created:', pagarmeData.id)

    return new Response(
      JSON.stringify({
        success: true,
        order: pagarmeData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('PIX Payment V2.0 Edge Function - Error:', error)
    
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