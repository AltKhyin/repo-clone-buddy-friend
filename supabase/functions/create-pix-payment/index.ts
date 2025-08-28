// ABOUTME: Creates PIX payments through Pagar.me API for EVIDENS payment system
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

const PAGARME_SECRET_KEY = Deno.env.get('PAGARME_SECRET_KEY')
const PAGARME_API_URL = 'https://api.pagar.me/core/v5'

// =================================================================
// Helper Functions
// =================================================================

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

const createPagarmeHeaders = () => {
  if (!PAGARME_SECRET_KEY) {
    throw new Error('Pagar.me secret key not configured')
  }
  
  // Check for placeholder credentials
  if (PAGARME_SECRET_KEY.includes('placeholder') || 
      PAGARME_SECRET_KEY.includes('your_real') ||
      PAGARME_SECRET_KEY.includes('_here')) {
    throw new Error('Pagar.me credentials not configured. Please configure real API keys in the admin panel.')
  }
  
  // Validate key format
  if (!PAGARME_SECRET_KEY.startsWith('sk_')) {
    throw new Error('Invalid Pagar.me secret key format')
  }
  
  const authToken = btoa(`${PAGARME_SECRET_KEY}:`)
  
  return {
    'Authorization': `Basic ${authToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

// =================================================================
// Customer Management
// =================================================================

const createOrGetCustomer = async (customerData: any) => {
  // First, try to find existing customer by email
  const { data: existingUser } = await supabase
    .from('Practitioners')
    .select('pagarme_customer_id')
    .eq('email', customerData.email)
    .single()

  if (existingUser?.pagarme_customer_id) {
    return { id: existingUser.pagarme_customer_id }
  }

  // Create new customer in Pagar.me
  const customerPayload = {
    name: customerData.name,
    email: customerData.email,
    document: customerData.document?.replace(/\D/g, ''),
    type: customerData.document?.length > 11 ? 'company' : 'individual',
    address: {
      country: 'BR',
      state: 'SP',
      city: 'São Paulo',
      street: 'Rua Exemplo',
      street_number: '123',
      zipcode: '01234567'
    }
  }

  const response = await fetch(`${PAGARME_API_URL}/customers`, {
    method: 'POST',
    headers: createPagarmeHeaders(),
    body: JSON.stringify(customerPayload)
  })

  if (!response.ok) {
    let errorMessage = 'Failed to create customer'
    
    try {
      const errorData = await response.json()
      
      if (response.status === 401) {
        errorMessage = 'Credenciais do Pagar.me inválidas. Configure as chaves de API no painel administrativo.'
      } else if (response.status === 400) {
        errorMessage = errorData.message || 'Dados do cliente inválidos'
      } else {
        errorMessage = errorData.message || `Erro na API do Pagar.me (${response.status})`
      }
    } catch (parseError) {
      const errorText = await response.text()
      console.error('Failed to parse Pagar.me customer error response:', errorText)
      
      if (response.status === 401) {
        errorMessage = 'Credenciais do Pagar.me inválidas. Configure as chaves de API no painel administrativo.'
      } else {
        errorMessage = `Erro na API do Pagar.me (${response.status}): ${errorText.substring(0, 100)}`
      }
    }
    
    throw new Error(errorMessage)
  }

  const customer = await response.json()

  // Update user with Pagar.me customer ID
  await supabase
    .from('Practitioners')
    .update({ pagarme_customer_id: customer.id })
    .eq('email', customerData.email)

  return customer
}

// =================================================================
// PIX Payment Creation
// =================================================================

const createPixPayment = async (paymentData: any) => {
  const { customerId, amount, description, metadata } = paymentData

  // If we have metadata with customer info, create/get customer first
  let actualCustomerId = customerId
  if (metadata?.customerEmail && customerId === 'temp_customer_id') {
    const customer = await createOrGetCustomer({
      name: metadata.customerName,
      email: metadata.customerEmail,
      document: metadata.customerDocument
    })
    actualCustomerId = customer.id
  }

  // Create PIX payment order
  const orderPayload = {
    customer_id: actualCustomerId,
    items: [
      {
        description: description,
        quantity: 1,
        amount: amount
      }
    ],
    payments: [
      {
        payment_method: 'pix',
        pix: {
          expires_in: 3600, // 1 hour
          additional_info: [
            {
              name: 'Produto',
              value: description
            },
            {
              name: 'Plataforma',
              value: 'EVIDENS'
            }
          ]
        }
      }
    ],
    metadata: {
      platform: 'evidens',
      ...metadata
    }
  }

  const response = await fetch(`${PAGARME_API_URL}/orders`, {
    method: 'POST',
    headers: createPagarmeHeaders(),
    body: JSON.stringify(orderPayload)
  })

  if (!response.ok) {
    let errorMessage = 'Failed to create PIX payment'
    
    try {
      const errorData = await response.json()
      
      if (response.status === 401) {
        errorMessage = 'Credenciais do Pagar.me inválidas. Configure as chaves de API no painel administrativo.'
      } else if (response.status === 400) {
        errorMessage = errorData.message || 'Dados de pagamento inválidos'
      } else {
        errorMessage = errorData.message || `Erro na API do Pagar.me (${response.status})`
      }
    } catch (parseError) {
      const errorText = await response.text()
      console.error('Failed to parse Pagar.me error response:', errorText)
      
      if (response.status === 401) {
        errorMessage = 'Credenciais do Pagar.me inválidas. Configure as chaves de API no painel administrativo.'
      } else {
        errorMessage = `Erro na API do Pagar.me (${response.status}): ${errorText.substring(0, 100)}`
      }
    }
    
    throw new Error(errorMessage)
  }

  const order = await response.json()
  return order
}

// =================================================================
// Main Handler Function
// =================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    // Verify authentication
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!jwt) {
      return sendError('Missing authorization header', 401)
    }

    const { data: { user }, error } = await supabase.auth.getUser(jwt)
    if (error || !user) {
      return sendError('Unauthorized', 401)
    }

    // Parse request body
    const paymentData = await req.json()
    
    if (!paymentData.amount || !paymentData.description) {
      return sendError('Missing required fields: amount, description', 400)
    }

    if (paymentData.amount < 100) {
      return sendError('Minimum amount is R$ 1.00 (100 cents)', 400)
    }

    // Create PIX payment
    const order = await createPixPayment(paymentData)

    // Extract PIX information
    const charge = order.charges?.[0]
    const transaction = charge?.last_transaction
    
    const pixData = {
      order_id: order.id,
      charge_id: charge?.id,
      status: charge?.status,
      amount: order.amount,
      qr_code: transaction?.qr_code,
      qr_code_url: transaction?.qr_code_url,
      qr_code_text: transaction?.qr_code_text,
      expires_at: transaction?.expires_at,
      created_at: order.created_at
    }

    console.log(`PIX payment created for user ${user.id}: ${order.id}`)

    return sendSuccess(pixData)

  } catch (error) {
    console.error('PIX payment creation error:', error)
    return sendError(error.message || 'Internal server error', 500)
  }
})