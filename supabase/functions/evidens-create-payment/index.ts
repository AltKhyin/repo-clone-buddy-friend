// ABOUTME: EVIDENS payment creation Edge Function - handles PIX and Credit Card payments through Pagar.me

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  customerId: string; // Email or identifier
  amount: number; // Amount in cents
  description: string;
  paymentMethod: 'pix' | 'credit_card';
  cardToken?: string; // For credit card payments
  installments?: number; // For credit card payments
  metadata?: {
    customerName: string;
    customerEmail: string;
    customerDocument: string;
    planName: string;
  };
}

interface PagarmeCustomer {
  id: string;
  name: string;
  email: string;
  document: string;
  type: 'individual' | 'company';
  address?: {
    country: string;
    state: string;
    city: string;
    street: string;
    street_number: string;
    zipcode: string;
  };
  phones?: {
    mobile_phone?: {
      country_code: string;
      area_code: string;
      number: string;
    };
  };
}

interface PagarmeOrder {
  id: string;
  code: string;
  amount: number;
  currency: string;
  status: string;
  customer: PagarmeCustomer;
  charges: Array<{
    id: string;
    code: string;
    amount: number;
    currency: string;
    payment_method: string;
    status: string;
    last_transaction?: {
      id: string;
      transaction_type: string;
      status: string;
      qr_code?: string;
      qr_code_url?: string;
      qr_code_text?: string;
      expires_at?: string;
      authorization_code?: string;
      url?: string;
    };
  }>;
}

function sendError(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

function sendSuccess(data: any) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function createPagarmeCustomer(
  customerData: PaymentRequest['metadata'],
  pagarmeSecretKey: string
): Promise<PagarmeCustomer> {
  if (!customerData) {
    throw new Error('Customer data is required');
  }

  const authToken = btoa(`${pagarmeSecretKey}:`);
  
  const response = await fetch('https://api.pagar.me/core/v5/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: customerData.customerName,
      email: customerData.customerEmail,
      document: customerData.customerDocument.replace(/\D/g, ''),
      type: customerData.customerDocument.replace(/\D/g, '').length === 11 ? 'individual' : 'company',
      address: {
        country: 'BR',
        state: 'SP', // Default - can be enhanced later
        city: 'São Paulo', // Default - can be enhanced later  
        street: 'Rua Exemplo',
        street_number: '123',
        zipcode: '01310100'
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create customer: ${error.message || 'Unknown error'}`);
  }

  return await response.json();
}

async function createPagarmeOrder(
  request: PaymentRequest,
  pagarmeCustomerId: string,
  pagarmeSecretKey: string
): Promise<PagarmeOrder> {
  const authToken = btoa(`${pagarmeSecretKey}:`);
  
  const orderData: any = {
    code: `evidens-${Date.now()}`,
    amount: request.amount,
    currency: 'BRL',
    customer_id: pagarmeCustomerId,
    items: [{
      id: '1',
      description: request.description,
      amount: request.amount,
      quantity: 1
    }],
    payments: []
  };

  if (request.paymentMethod === 'pix') {
    orderData.payments.push({
      payment_method: 'pix',
      pix: {
        expires_in: 3600, // 1 hour expiration
        additional_info: [
          {
            name: 'Plano',
            value: request.metadata?.planName || 'EVIDENS'
          }
        ]
      }
    });
  } else if (request.paymentMethod === 'credit_card') {
    if (!request.cardToken) {
      throw new Error('Card token is required for credit card payments');
    }
    
    orderData.payments.push({
      payment_method: 'credit_card',
      credit_card: {
        installments: request.installments || 1,
        statement_descriptor: 'EVIDENS',
        card_token: request.cardToken
      }
    });
  }

  const response = await fetch('https://api.pagar.me/core/v5/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create order: ${error.message || 'Unknown error'}`);
  }

  return await response.json();
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return sendError('Method not allowed', 405);
  }

  try {
    // Parse request body
    const paymentRequest: PaymentRequest = await req.json();
    
    // Validate required fields
    if (!paymentRequest.customerId || !paymentRequest.amount || !paymentRequest.paymentMethod) {
      return sendError('Missing required fields: customerId, amount, paymentMethod');
    }

    if (paymentRequest.amount < 100) {
      return sendError('Minimum amount is R$ 1.00 (100 cents)');
    }

    // Get JWT token and validate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError('Missing or invalid authorization header', 401);
    }

    const jwt = authHeader.replace('Bearer ', '');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return sendError('Invalid authentication', 401);
    }

    // Get Pagar.me configuration
    const pagarmeSecretKey = Deno.env.get('PAGARME_SECRET_KEY');
    if (!pagarmeSecretKey) {
      return sendError('Payment system configuration error', 500);
    }

    // Check if user already has a Pagar.me customer ID
    const { data: practitioner } = await supabase
      .from('Practitioners')
      .select('evidens_pagarme_customer_id')
      .eq('id', user.id)
      .single();

    let pagarmeCustomerId = practitioner?.evidens_pagarme_customer_id;

    // Create customer if doesn't exist
    if (!pagarmeCustomerId) {
      const customer = await createPagarmeCustomer(paymentRequest.metadata, pagarmeSecretKey);
      pagarmeCustomerId = customer.id;

      // Update user with customer ID
      await supabase
        .from('Practitioners')
        .update({ evidens_pagarme_customer_id: pagarmeCustomerId })
        .eq('id', user.id);
    }

    // Create Pagar.me order
    const order = await createPagarmeOrder(paymentRequest, pagarmeCustomerId, pagarmeSecretKey);

    // Get plan information for database record
    const planType = paymentRequest.metadata?.planName === 'Plano Premium' ? 'premium' : 
                    paymentRequest.metadata?.planName === 'Plano Enterprise' ? 'enterprise' : 'basic';

    // Save transaction to database
    const transactionData = {
      user_id: user.id,
      evidens_plan_type: planType,
      evidens_plan_price: paymentRequest.amount,
      pagarme_order_id: order.id,
      pagarme_charge_id: order.charges[0]?.id,
      amount: paymentRequest.amount,
      status: 'pending',
      payment_method: paymentRequest.paymentMethod,
      evidens_metadata: {
        customer_data: paymentRequest.metadata,
        pagarme_code: order.code
      }
    };

    // Add PIX-specific data if applicable
    if (paymentRequest.paymentMethod === 'pix' && order.charges[0]?.last_transaction) {
      const transaction = order.charges[0].last_transaction;
      transactionData.pix_qr_code = transaction.qr_code_text || transaction.qr_code;
      transactionData.pix_qr_code_url = transaction.qr_code_url;
      transactionData.pix_expires_at = transaction.expires_at ? new Date(transaction.expires_at).toISOString() : null;
    }

    const { error: dbError } = await supabase
      .from('evidens_payment_transactions')
      .insert(transactionData);

    if (dbError) {
      console.error('Database error:', dbError);
      return sendError('Failed to save transaction', 500);
    }

    // Return success response with order data
    return sendSuccess({
      id: order.id,
      code: order.code,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      payment_method: paymentRequest.paymentMethod,
      // PIX specific data
      qr_code: order.charges[0]?.last_transaction?.qr_code_text || order.charges[0]?.last_transaction?.qr_code,
      qr_code_url: order.charges[0]?.last_transaction?.qr_code_url,
      expires_at: order.charges[0]?.last_transaction?.expires_at,
      // Credit card specific data
      authorization_code: order.charges[0]?.last_transaction?.authorization_code,
      created_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return sendError(`Payment creation failed: ${error.message}`);
  }
});