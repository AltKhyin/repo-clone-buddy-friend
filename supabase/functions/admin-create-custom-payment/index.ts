// ABOUTME: Admin-only Edge Function to create custom one-time payments for users with subscription time management

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { authenticateUser, createSuccessResponse, createErrorResponse } from '../_shared/api-helpers.ts';

interface AdminPaymentRequest {
  targetUserId: string; // User to create payment for
  amount: number; // Amount in cents
  description: string;
  paymentMethod: 'pix' | 'credit_card';
  subscriptionDaysToGrant: number; // Days to add to subscription
  adminNotes?: string; // Admin notes for tracking
  cardToken?: string; // For credit card payments
  installments?: number; // For credit card payments
  metadata: {
    customerName: string;
    customerEmail: string;
    customerDocument: string;
    customerPhone: string;
    planName: string;
    adminCreated: boolean; // Mark as admin-created
    adminUserId: string; // ID of admin who created
  };
  billingAddress?: {
    line_1: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
  };
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
    };
  }>;
}

async function validateAdminPermission(supabase: any, user: any): Promise<void> {
  // Check if user has admin role in database
  const { data: practitioner, error } = await supabase
    .from('Practitioners')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !practitioner) {
    throw new Error('FORBIDDEN: User not found in system');
  }

  if (practitioner.role !== 'admin') {
    throw new Error('FORBIDDEN: Admin privileges required');
  }
}

async function getTargetUser(supabase: any, targetUserId: string): Promise<any> {
  const { data: targetUser, error } = await supabase
    .from('Practitioners')
    .select('id, full_name, evidens_pagarme_customer_id, pagarme_customer_id, subscription_tier, subscription_start_date, subscription_end_date')
    .eq('id', targetUserId)
    .single();

  if (error || !targetUser) {
    throw new Error('VALIDATION_FAILED: Target user not found');
  }

  return targetUser;
}

async function tokenizeCard(
  cardData: AdminPaymentRequest['cardData'],
  pagarmeSecretKey: string
): Promise<string> {
  if (!cardData) {
    throw new Error('Card data is required for tokenization');
  }

  const pagarmePublicKey = Deno.env.get('PAGARME_PUBLIC_KEY');
  if (!pagarmePublicKey) {
    throw new Error('Pagar.me public key not configured for tokenization');
  }
  
  const cardNumber = cardData.number.replace(/\D/g, '');
  
  if (cardNumber.length < 13 || cardNumber.length > 19) {
    throw new Error('Invalid card number length');
  }
  
  const tokenPayload = {
    type: 'card',
    card: {
      number: cardNumber,
      holder_name: cardData.holderName,
      exp_month: parseInt(cardData.expirationMonth),
      exp_year: parseInt(`20${cardData.expirationYear}`),
      cvv: cardData.cvv
    }
  };

  console.log('Admin tokenizing card...', { 
    last4: cardNumber.slice(-4),
    holderName: cardData.holderName.replace(/./g, '*'),
    expiry: `${cardData.expirationMonth}/${cardData.expirationYear}`
  });

  const response = await fetch(`https://api.pagar.me/core/v5/tokens?appId=${pagarmePublicKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tokenPayload)
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Admin card tokenization failed:', { 
      status: response.status, 
      error: error.message || 'Unknown error',
      cardLast4: cardNumber.slice(-4)
    });
    throw new Error(`Failed to tokenize card: ${error.message || 'Unknown error'}`);
  }

  const tokenResponse = await response.json();
  console.log('Admin card tokenized successfully:', { 
    tokenId: tokenResponse.id,
    cardLast4: cardNumber.slice(-4)
  });
  
  return tokenResponse.id;
}

async function createOrUpdatePagarmeCustomer(
  customerData: AdminPaymentRequest['metadata'],
  billingAddress: AdminPaymentRequest['billingAddress'],
  pagarmeSecretKey: string,
  existingCustomerId?: string
): Promise<PagarmeCustomer> {
  if (!customerData) {
    throw new Error('Customer data is required');
  }

  const authToken = btoa(`${pagarmeSecretKey}:`);
  const cleanDocument = customerData.customerDocument.replace(/\D/g, '');
  const documentLength = cleanDocument.length;
  
  let documentType: string;
  let customerType: string;
  
  if (documentLength === 11) {
    documentType = 'CPF';
    customerType = 'individual';
  } else if (documentLength === 14) {
    documentType = 'CNPJ';
    customerType = 'company';
  } else {
    documentType = 'PASSPORT';
    customerType = 'individual';
  }

  const customerPayload = {
    name: customerData.customerName,
    email: customerData.customerEmail,
    document: cleanDocument,
    document_type: documentType,
    type: customerType,
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

  const method = existingCustomerId ? 'PUT' : 'POST';
  const url = existingCustomerId 
    ? `https://api.pagar.me/core/v5/customers/${existingCustomerId}`
    : 'https://api.pagar.me/core/v5/customers';

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerPayload)
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`Admin Pagar.me customer ${method} failed:`, error);
    throw new Error(`Failed to ${method === 'PUT' ? 'update' : 'create'} customer: ${error.message || 'Unknown error'}`);
  }

  console.log(`Admin customer ${method === 'PUT' ? 'updated' : 'created'} successfully:`, existingCustomerId || 'new customer');
  return await response.json();
}

async function createPagarmeOrder(
  request: AdminPaymentRequest,
  pagarmeCustomerId: string,
  pagarmeSecretKey: string
): Promise<PagarmeOrder> {
  const authToken = btoa(`${pagarmeSecretKey}:`);
  
  const orderData: any = {
    code: `admin-evidens-${Date.now()}`, // Mark as admin-created
    amount: request.amount,
    currency: 'BRL',
    customer_id: pagarmeCustomerId,
    items: [{
      id: '1',
      code: `admin-item-${Date.now()}`,
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
            value: request.metadata.planName || 'EVIDENS Admin Payment'
          },
          {
            name: 'Criado por Admin',
            value: 'true'
          }
        ]
      }
    });
  } else if (request.paymentMethod === 'credit_card') {
    if (!request.cardToken) {
      throw new Error('Card token is required for credit card payments');
    }
    
    const creditCardPayment: any = {
      payment_method: 'credit_card',
      credit_card: {
        installments: request.installments || 1,
        statement_descriptor: 'EVIDENS-ADM',
        card_token: request.cardToken
      }
    };

    if (request.billingAddress) {
      creditCardPayment.credit_card.card = {
        billing_address: {
          line_1: request.billingAddress.line_1,
          zip_code: request.billingAddress.zip_code.replace(/\D/g, ''),
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
    
    if (error.message && error.message.includes('Customer not found')) {
      throw new Error(`CUSTOMER_NOT_FOUND:${pagarmeCustomerId}`);
    }
    
    throw new Error(`Failed to create admin order: ${error.message || 'Unknown error'}`);
  }

  const order = await response.json();
  console.log('Admin Pagar.me Order Response:', JSON.stringify(order, null, 2));
  
  return order;
}

async function updateUserSubscription(
  supabase: any,
  targetUserId: string,
  subscriptionDaysToGrant: number,
  adminNotes: string,
  adminUserId: string
): Promise<void> {
  const now = new Date();
  const startDate = now.toISOString();
  const endDate = new Date(now.getTime() + (subscriptionDaysToGrant * 24 * 60 * 60 * 1000)).toISOString();

  const updateData = {
    subscription_start_date: startDate,
    subscription_end_date: endDate,
    subscription_created_by: 'admin',
    subscription_payment_method_used: 'admin_manual',
    admin_subscription_notes: adminNotes,
    subscription_days_granted: subscriptionDaysToGrant,
    last_payment_date: now.toISOString(),
    subscription_tier: 'premium' // Admin payments grant premium
  };

  const { error } = await supabase
    .from('Practitioners')
    .update(updateData)
    .eq('id', targetUserId);

  if (error) {
    throw new Error(`Failed to update user subscription: ${error.message}`);
  }

  console.log(`Admin updated subscription for user ${targetUserId}: ${subscriptionDaysToGrant} days granted`);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');

  // [C6.4.1] Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  if (req.method !== 'POST') {
    return createErrorResponse(new Error('Method not allowed'), {}, origin);
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // [C6.4.2] Authenticate user
    const authHeader = req.headers.get('Authorization');
    const user = await authenticateUser(supabase, authHeader);

    // Validate admin permission
    await validateAdminPermission(supabase, user);

    // Parse request body
    const paymentRequest: AdminPaymentRequest = await req.json();
    
    // Validate required fields
    if (!paymentRequest.targetUserId || !paymentRequest.amount || !paymentRequest.paymentMethod || !paymentRequest.subscriptionDaysToGrant) {
      throw new Error('VALIDATION_FAILED: Missing required fields: targetUserId, amount, paymentMethod, subscriptionDaysToGrant');
    }

    if (paymentRequest.amount < 1) {
      throw new Error('VALIDATION_FAILED: Minimum amount is R$ 0.01 (1 cent)');
    }

    if (paymentRequest.subscriptionDaysToGrant < 1 || paymentRequest.subscriptionDaysToGrant > 3650) {
      throw new Error('VALIDATION_FAILED: Subscription days must be between 1 and 3650 (10 years)');
    }

    // Get target user information
    const targetUser = await getTargetUser(supabase, paymentRequest.targetUserId);

    // Get Pagar.me configuration
    const pagarmeSecretKey = Deno.env.get('PAGARME_SECRET_KEY');
    if (!pagarmeSecretKey) {
      throw new Error('Payment system configuration error');
    }

    // Set admin metadata
    paymentRequest.metadata.adminCreated = true;
    paymentRequest.metadata.adminUserId = user.id;

    let pagarmeCustomerId = targetUser.evidens_pagarme_customer_id || targetUser.pagarme_customer_id;
    console.log('Admin creating payment for user:', paymentRequest.targetUserId, 'existing customer ID:', pagarmeCustomerId);

    // Create or update customer
    if (!pagarmeCustomerId) {
      console.log('Creating new Pagar.me customer for target user:', paymentRequest.targetUserId);
      const customer = await createOrUpdatePagarmeCustomer(paymentRequest.metadata, paymentRequest.billingAddress, pagarmeSecretKey);
      pagarmeCustomerId = customer.id;
      
      // Update target user with customer ID
      const { error: updateError } = await supabase
        .from('Practitioners')
        .update({ evidens_pagarme_customer_id: pagarmeCustomerId })
        .eq('id', paymentRequest.targetUserId);

      if (updateError) {
        console.error('Failed to update target user with customer ID:', updateError);
      }
    } else {
      console.log('Updating existing customer with current payment data...');
      try {
        await createOrUpdatePagarmeCustomer(paymentRequest.metadata, paymentRequest.billingAddress, pagarmeSecretKey, pagarmeCustomerId);
      } catch (updateError) {
        console.error('Failed to update customer data:', updateError);
        // Continue with payment - update failure shouldn't block payment
      }
    }

    // Handle server-side card tokenization if needed
    if (paymentRequest.paymentMethod === 'credit_card' && paymentRequest.cardToken === 'tokenize_on_server') {
      if (!paymentRequest.cardData) {
        throw new Error('VALIDATION_FAILED: Card data is required for server-side tokenization');
      }
      
      console.log('Performing admin server-side card tokenization...');
      try {
        paymentRequest.cardToken = await tokenizeCard(paymentRequest.cardData, pagarmeSecretKey);
        console.log('Admin server-side tokenization successful');
      } catch (tokenError) {
        console.error('Admin server-side tokenization failed:', tokenError);
        throw new Error(`Card tokenization failed: ${tokenError.message}`);
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
        console.log(`Admin: Customer ${oldCustomerId} not found (likely test/prod mismatch). Creating new customer...`);
        
        const newCustomer = await createOrUpdatePagarmeCustomer(paymentRequest.metadata, paymentRequest.billingAddress, pagarmeSecretKey);
        pagarmeCustomerId = newCustomer.id;
        console.log(`Admin created new customer: ${pagarmeCustomerId}`);
        
        // Update database with new customer ID
        const { error: updateError } = await supabase
          .from('Practitioners')
          .update({ evidens_pagarme_customer_id: pagarmeCustomerId })
          .eq('id', paymentRequest.targetUserId);
          
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
      
      let userMessage = gatewayError || acquirerMessage || 'Admin payment creation failed. Please try again.';
      console.error('Admin payment failed:', { acquirerMessage, gatewayError, paymentMethod: paymentRequest.paymentMethod });
      
      throw new Error(`Admin payment failed: ${userMessage}`);
    }

    // Update user subscription with granted time
    await updateUserSubscription(
      supabase,
      paymentRequest.targetUserId,
      paymentRequest.subscriptionDaysToGrant,
      paymentRequest.adminNotes || 'Admin-created payment',
      user.id
    );

    // Get plan information for database record
    const planType = paymentRequest.metadata?.planName === 'Plano Premium' ? 'premium' : 
                    paymentRequest.metadata?.planName === 'Plano Enterprise' ? 'enterprise' : 'admin_custom';

    // Save transaction to database
    const transactionData = {
      user_id: paymentRequest.targetUserId, // Payment is FOR the target user
      evidens_plan_type: planType,
      evidens_plan_price: paymentRequest.amount,
      pagarme_order_id: order.id,
      pagarme_charge_id: order.charges[0]?.id,
      amount: paymentRequest.amount,
      status: 'pending',
      payment_method: paymentRequest.paymentMethod,
      evidens_metadata: {
        customer_data: paymentRequest.metadata,
        pagarme_code: order.code,
        admin_created: true,
        admin_user_id: user.id,
        subscription_days_granted: paymentRequest.subscriptionDaysToGrant,
        admin_notes: paymentRequest.adminNotes
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
      console.error('Admin payment database error:', dbError);
      throw new Error('Failed to save admin transaction');
    }

    // Return success response with order data
    return createSuccessResponse({
      id: order.id,
      code: order.code,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      payment_method: paymentRequest.paymentMethod,
      target_user_id: paymentRequest.targetUserId,
      subscription_days_granted: paymentRequest.subscriptionDaysToGrant,
      admin_created: true,
      admin_user_id: user.id,
      // PIX specific data
      qr_code: order.charges[0]?.last_transaction?.qr_code_text || order.charges[0]?.last_transaction?.qr_code,
      qr_code_url: order.charges[0]?.last_transaction?.qr_code_url,
      expires_at: order.charges[0]?.last_transaction?.expires_at,
      // Credit card specific data
      authorization_code: order.charges[0]?.last_transaction?.authorization_code,
      created_at: new Date().toISOString()
    }, {}, origin);

  } catch (error) {
    console.error('Admin payment creation error:', error);
    return createErrorResponse(error, {}, origin);
  }
});