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
    customerPhone: string;
    planName: string;
  };
  // Billing address for credit card payments
  billingAddress?: {
    line_1: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
  };
  // Optional card data for server-side tokenization
  cardData?: {
    number: string;
    holderName: string;
    expirationMonth: string;
    expirationYear: string;
    cvv: string;
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

async function tokenizeCard(
  cardData: PaymentRequest['cardData'],
  pagarmeSecretKey: string
): Promise<string> {
  if (!cardData) {
    throw new Error('Card data is required for tokenization');
  }

  // Get the public key from environment (tokenization requires public key, not secret)
  const pagarmePublicKey = Deno.env.get('PAGARME_PUBLIC_KEY');
  if (!pagarmePublicKey) {
    throw new Error('Pagar.me public key not configured for tokenization');
  }
  
  // Clean and validate card number - remove spaces and non-digits
  const cardNumber = cardData.number.replace(/\D/g, '');
  
  // Basic card number validation
  if (cardNumber.length < 13 || cardNumber.length > 19) {
    throw new Error('Invalid card number length');
  }
  
  const tokenPayload = {
    type: 'card',
    card: {
      number: cardNumber,
      holder_name: cardData.holderName,
      exp_month: parseInt(cardData.expirationMonth),
      exp_year: parseInt(`20${cardData.expirationYear}`), // Convert YY to YYYY
      cvv: cardData.cvv
    }
  };

  // Log only last 4 digits for security
  console.log('Tokenizing card...', { 
    last4: cardNumber.slice(-4),
    holderName: cardData.holderName.replace(/./g, '*'), // Mask holder name in logs
    expiry: `${cardData.expirationMonth}/${cardData.expirationYear}`
  });

  // Tokenization uses public key as query parameter, NO Authorization header
  const response = await fetch(`https://api.pagar.me/core/v5/tokens?appId=${pagarmePublicKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // NO Authorization header allowed for tokenization
    },
    body: JSON.stringify(tokenPayload)
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Card tokenization failed:', { 
      status: response.status, 
      error: error.message || 'Unknown error',
      // Never log actual card data
      cardLast4: cardNumber.slice(-4)
    });
    throw new Error(`Failed to tokenize card: ${error.message || 'Unknown error'}`);
  }

  const tokenResponse = await response.json();
  console.log('Card tokenized successfully:', { 
    tokenId: tokenResponse.id,
    cardLast4: cardNumber.slice(-4)
  });
  
  return tokenResponse.id;
}

async function updatePagarmeCustomer(
  customerId: string,
  customerData: PaymentRequest['metadata'],
  billingAddress: PaymentRequest['billingAddress'],
  pagarmeSecretKey: string
): Promise<PagarmeCustomer> {
  if (!customerData) {
    throw new Error('Customer data is required');
  }

  const authToken = btoa(`${pagarmeSecretKey}:`);
  
  // Clean and validate document
  const cleanDocument = customerData.customerDocument.replace(/\D/g, '');
  const documentLength = cleanDocument.length;
  
  // Determine document type and customer type
  let documentType: string;
  let customerType: string;
  
  if (documentLength === 11) {
    documentType = 'CPF';
    customerType = 'individual';
  } else if (documentLength === 14) {
    documentType = 'CNPJ';
    customerType = 'company';
  } else {
    // Fallback for international documents
    documentType = 'PASSPORT';
    customerType = 'individual';
  }

  // Build customer update payload
  const customerPayload = {
    name: customerData.customerName,
    email: customerData.customerEmail,
    document: cleanDocument,
    document_type: documentType,
    type: customerType,
    // Required phones object for PSP integration
    phones: {
      mobile_phone: customerData.customerPhone ? {
        country_code: '55',
        area_code: customerData.customerPhone.replace(/\D/g, '').substring(2, 4) || '11',
        number: customerData.customerPhone.replace(/\D/g, '').substring(4) || '999999999'
      } : {
        country_code: '55',
        area_code: '11',
        number: '999999999'
      }
    },
    // Use actual user billing address if provided
    address: billingAddress ? {
      country: billingAddress.country || 'BR',
      state: billingAddress.state,
      city: billingAddress.city,
      line_1: billingAddress.line_1,
      line_2: '',
      zip_code: billingAddress.zip_code.replace(/\D/g, '')
    } : {
      country: 'BR',
      state: 'SP',
      city: 'São Paulo',
      line_1: 'Endereço não informado',
      line_2: '',
      zip_code: '01310100'
    }
  };

  const response = await fetch(`https://api.pagar.me/core/v5/customers/${customerId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerPayload)
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Pagar.me customer update failed:', error);
    throw new Error(`Failed to update customer: ${error.message || 'Unknown error'}`);
  }

  console.log('Customer updated successfully:', customerId);
  return await response.json();
}

async function createPagarmeCustomer(
  customerData: PaymentRequest['metadata'],
  billingAddress: PaymentRequest['billingAddress'],
  pagarmeSecretKey: string
): Promise<PagarmeCustomer> {
  if (!customerData) {
    throw new Error('Customer data is required');
  }

  const authToken = btoa(`${pagarmeSecretKey}:`);
  
  // Clean and validate document
  const cleanDocument = customerData.customerDocument.replace(/\D/g, '');
  const documentLength = cleanDocument.length;
  
  // Determine document type and customer type
  let documentType: string;
  let customerType: string;
  
  if (documentLength === 11) {
    documentType = 'CPF';
    customerType = 'individual';
  } else if (documentLength === 14) {
    documentType = 'CNPJ';
    customerType = 'company';
  } else {
    // Fallback for international documents
    documentType = 'PASSPORT';
    customerType = 'individual';
  }

  // Build customer payload with all required fields
  const customerPayload = {
    name: customerData.customerName,
    email: customerData.customerEmail,
    document: cleanDocument,
    document_type: documentType,
    type: customerType,
    // Required phones object for PSP integration
    phones: {
      mobile_phone: customerData.customerPhone ? {
        country_code: '55',
        area_code: customerData.customerPhone.replace(/\D/g, '').substring(2, 4) || '11', // Extract area code from formatted phone
        number: customerData.customerPhone.replace(/\D/g, '').substring(4) || '999999999' // Extract number from formatted phone
      } : {
        // Minimal fallback only when no phone provided
        country_code: '55',
        area_code: '11',
        number: '999999999'
      }
    },
    // Use actual user billing address if provided, otherwise use minimal fallback
    address: billingAddress ? {
      country: billingAddress.country || 'BR',
      state: billingAddress.state,
      city: billingAddress.city,
      line_1: billingAddress.line_1,
      line_2: '', // Optional field
      zip_code: billingAddress.zip_code.replace(/\D/g, '') // Clean formatting
    } : {
      // Minimal fallback only if no billing address provided
      country: 'BR',
      state: 'SP', // Default state as fallback only
      city: 'São Paulo', // Default city as fallback only
      line_1: 'Endereço não informado',
      line_2: '',
      zip_code: '01310100' // Default ZIP as fallback only
    }
  };

  const response = await fetch('https://api.pagar.me/core/v5/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerPayload)
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Pagar.me customer creation failed:', error);
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
      code: `item-${Date.now()}`, // Required: Item code
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
    
    // Build credit card payment with proper structure including billing address
    const creditCardPayment: any = {
      payment_method: 'credit_card',
      credit_card: {
        installments: request.installments || 1,
        statement_descriptor: 'EVIDENS',
        card_token: request.cardToken
      }
    };

    // Add billing address if provided (required by Pagar.me for some configurations)
    if (request.billingAddress) {
      creditCardPayment.credit_card.card = {
        billing_address: {
          line_1: request.billingAddress.line_1,
          zip_code: request.billingAddress.zip_code.replace(/\D/g, ''), // Remove formatting
          city: request.billingAddress.city,
          state: request.billingAddress.state,
          country: request.billingAddress.country
        }
      };
    }
    
    orderData.payments.push(creditCardPayment);
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
    
    // Check if customer not found (likely test/prod key mismatch)
    if (error.message && error.message.includes('Customer not found')) {
      throw new Error(`CUSTOMER_NOT_FOUND:${pagarmeCustomerId}`);
    }
    
    throw new Error(`Failed to create order: ${error.message || 'Unknown error'}`);
  }

  const order = await response.json();
  
  // Debug logging for PIX response structure
  console.log('Pagar.me Order Response:', JSON.stringify(order, null, 2));
  if (order.charges?.[0]?.last_transaction) {
    console.log('PIX Transaction Data:', JSON.stringify(order.charges[0].last_transaction, null, 2));
  }
  
  return order;
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

    if (paymentRequest.amount < 1) {
      return sendError('Minimum amount is R$ 0.01 (1 cent)');
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
    const { data: practitioner, error: practitionerError } = await supabase
      .from('Practitioners')
      .select('evidens_pagarme_customer_id, pagarme_customer_id')
      .eq('id', user.id)
      .single();

    if (practitionerError) {
      console.error('Failed to fetch practitioner:', practitionerError);
      return sendError('User not found in system', 404);
    }

    let pagarmeCustomerId = practitioner?.evidens_pagarme_customer_id || practitioner?.pagarme_customer_id;
    console.log('Existing customer ID:', pagarmeCustomerId);

    // Create customer if doesn't exist
    if (!pagarmeCustomerId) {
      console.log('Creating new Pagar.me customer for user:', user.id);
      const customer = await createPagarmeCustomer(paymentRequest.metadata, paymentRequest.billingAddress, pagarmeSecretKey);
      pagarmeCustomerId = customer.id;
      console.log('Created customer with ID:', pagarmeCustomerId);

      // Update user with customer ID
      const { error: updateError } = await supabase
        .from('Practitioners')
        .update({ evidens_pagarme_customer_id: pagarmeCustomerId })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update practitioner with customer ID:', updateError);
        return sendError('Failed to save customer information', 500);
      }
    } else {
      console.log('Using existing customer ID:', pagarmeCustomerId);
      
      // Update existing customer with current data to ensure consistency
      console.log('Updating existing customer with current payment data...');
      try {
        await updatePagarmeCustomer(pagarmeCustomerId, paymentRequest.metadata, paymentRequest.billingAddress, pagarmeSecretKey);
        console.log('Customer data updated successfully');
      } catch (updateError) {
        console.error('Failed to update customer data:', updateError);
        // Continue with payment - update failure shouldn't block payment unless critical
        console.log('Continuing with payment using existing customer data');
      }
    }

    // Handle server-side card tokenization if needed
    if (paymentRequest.paymentMethod === 'credit_card' && paymentRequest.cardToken === 'tokenize_on_server') {
      if (!paymentRequest.cardData) {
        return sendError('Card data is required for server-side tokenization', 400);
      }
      
      console.log('Performing server-side card tokenization...');
      try {
        paymentRequest.cardToken = await tokenizeCard(paymentRequest.cardData, pagarmeSecretKey);
        console.log('Server-side tokenization successful');
      } catch (tokenError) {
        console.error('Server-side tokenization failed:', tokenError);
        return sendError(`Card tokenization failed: ${tokenError.message}`, 400);
      }
    }

    // Create Pagar.me order
    let order;
    try {
      order = await createPagarmeOrder(paymentRequest, pagarmeCustomerId, pagarmeSecretKey);
    } catch (error) {
      // Handle test/prod customer ID mismatch
      if (error.message.startsWith('CUSTOMER_NOT_FOUND:')) {
        const oldCustomerId = error.message.split(':')[1];
        console.log(`Customer ${oldCustomerId} not found (likely test/prod mismatch). Creating new customer...`);
        
        // Create new customer in current environment
        const newCustomer = await createPagarmeCustomer(paymentRequest.metadata, paymentRequest.billingAddress, pagarmeSecretKey);
        pagarmeCustomerId = newCustomer.id;
        console.log(`Created new customer: ${pagarmeCustomerId}`);
        
        // Update database with new customer ID
        const { error: updateError } = await supabase
          .from('Practitioners')
          .update({ evidens_pagarme_customer_id: pagarmeCustomerId })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Failed to update with new customer ID:', updateError);
        }
        
        // Retry order creation with new customer
        order = await createPagarmeOrder(paymentRequest, pagarmeCustomerId, pagarmeSecretKey);
      } else {
        throw error;
      }
    }
    
    // Check if order or payment failed
    if (order.status === 'failed' || order.charges?.[0]?.status === 'failed') {
      const transaction = order.charges?.[0]?.last_transaction;
      const acquirerMessage = transaction?.acquirer_message;
      const gatewayError = transaction?.gateway_response?.errors?.[0]?.message;
      
      // Create user-friendly error message based on payment method and error details
      let userMessage = '';
      let errorType = 'payment_failed';
      
      if (paymentRequest.paymentMethod === 'credit_card') {
        // Credit card specific error handling
        if (acquirerMessage?.includes('não autorizada')) {
          userMessage = 'Cartão recusado pelo banco. Entre em contato com seu banco ou tente outro cartão.';
          errorType = 'card_declined';
        } else if (acquirerMessage?.includes('saldo insuficiente') || acquirerMessage?.includes('limite')) {
          userMessage = 'Saldo insuficiente. Verifique seu limite ou tente outro cartão.';
          errorType = 'insufficient_funds';
        } else if (acquirerMessage?.includes('dados inválidos') || acquirerMessage?.includes('invalid')) {
          userMessage = 'Dados do cartão inválidos. Verifique as informações e tente novamente.';
          errorType = 'invalid_card_data';
        } else if (acquirerMessage?.includes('vencido') || acquirerMessage?.includes('expired')) {
          userMessage = 'Cartão vencido. Use um cartão válido.';
          errorType = 'expired_card';
        } else {
          userMessage = gatewayError || acquirerMessage || 'Falha no pagamento com cartão. Tente novamente ou use outro método.';
          errorType = 'card_processing_error';
        }
        console.error('Credit card payment failed:', { acquirerMessage, gatewayError, errorType });
      } else {
        // PIX specific error handling
        userMessage = gatewayError || acquirerMessage || 'Falha ao gerar código PIX. Tente novamente.';
        errorType = 'pix_generation_failed';
        console.error('PIX payment failed:', { acquirerMessage, gatewayError, errorType });
      }
      
      return sendError(`Payment failed: ${userMessage}`, 400);
    }

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