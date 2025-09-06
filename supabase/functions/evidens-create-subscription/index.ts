// ABOUTME: EVIDENS subscription creation Edge Function - handles recurring billing through Pagar.me V5 API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionRequest {
  planId: string; // Our PaymentPlans table ID
  paymentMethod: 'credit_card' | 'pix';
  cardToken?: string; // For credit card subscriptions
  cardData?: {
    number: string;
    holderName: string;
    expirationMonth: string;
    expirationYear: string;
    cvv: string;
  };
  metadata?: {
    customerName: string;
    customerEmail: string;
    customerDocument: string;
    customerPhone: string;
  };
  billingAddress?: {
    line_1: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
  };
}

interface PagarmeCustomer {
  id: string;
  name: string;
  email: string;
  document: string;
  type: 'individual' | 'company';
}

interface PagarmeSubscription {
  id: string;
  code: string;
  status: string;
  interval: string;
  interval_count: number;
  billing_type: string;
  next_billing_at: string;
  customer: PagarmeCustomer;
  current_cycle?: {
    id: string;
    start_at: string;
    end_at: string;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    amount: number;
    pricing_scheme: {
      price: number;
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
  cardData: SubscriptionRequest['cardData'],
  pagarmePublicKey: string
): Promise<string> {
  if (!cardData) {
    throw new Error('Card data is required for tokenization');
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

  console.log('Tokenizing card for subscription...', { 
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
    console.error('Card tokenization failed:', { 
      status: response.status, 
      error: error.message || 'Unknown error',
      cardLast4: cardNumber.slice(-4)
    });
    throw new Error(`Failed to tokenize card: ${error.message || 'Unknown error'}`);
  }

  const tokenResponse = await response.json();
  console.log('Card tokenized successfully for subscription:', { 
    tokenId: tokenResponse.id,
    cardLast4: cardNumber.slice(-4)
  });
  
  return tokenResponse.id;
}

async function createOrGetCustomer(
  customerData: SubscriptionRequest['metadata'],
  billingAddress: SubscriptionRequest['billingAddress'],
  pagarmeCustomerId: string | null,
  pagarmeSecretKey: string
): Promise<PagarmeCustomer> {
  if (!customerData) {
    throw new Error('Customer data is required');
  }

  const authToken = btoa(`${pagarmeSecretKey}:`);
  
  // If we have an existing customer ID, try to update it
  if (pagarmeCustomerId) {
    try {
      const response = await fetch(`https://api.pagar.me/core/v5/customers/${pagarmeCustomerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('Using existing customer for subscription:', pagarmeCustomerId);
        return await response.json();
      }
    } catch (error) {
      console.log('Existing customer not found, creating new one:', error);
    }
  }

  // Create new customer
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

async function createPagarmeSubscription(
  plan: any,
  pagarmeCustomerId: string,
  request: SubscriptionRequest,
  pagarmeSecretKey: string
): Promise<PagarmeSubscription> {
  const authToken = btoa(`${pagarmeSecretKey}:`);
  
  // Build subscription payload
  const subscriptionData: any = {
    code: `evidens-sub-${plan.id}-${Date.now()}`,
    customer_id: pagarmeCustomerId,
    billing_type: plan.billing_type || 'prepaid',
    interval: plan.billing_interval || 'month',
    interval_count: plan.billing_interval_count || 1,
    minimum_price: 100, // R$ 1.00 minimum
    items: [
      {
        description: plan.name,
        quantity: 1,
        pricing_scheme: {
          scheme_type: 'unit',
          price: plan.amount // Already in cents
        }
      }
    ],
    payment_method: request.paymentMethod,
    metadata: {
      evidens_plan_id: plan.id,
      evidens_plan_type: plan.type,
      evidens_days: plan.days.toString(),
      supabase_user_id: 'will_be_set_later' // Will be updated after JWT verification
    }
  };

  // Add payment method specific data
  if (request.paymentMethod === 'credit_card') {
    if (!request.cardToken) {
      throw new Error('Card token is required for credit card subscriptions');
    }
    
    subscriptionData.credit_card = {
      installments: 1,
      statement_descriptor: 'EVIDENS',
      card_token: request.cardToken
    };

    // Add billing address if provided
    if (request.billingAddress) {
      subscriptionData.credit_card.card = {
        billing_address: {
          line_1: request.billingAddress.line_1,
          zip_code: request.billingAddress.zip_code.replace(/\D/g, ''),
          city: request.billingAddress.city,
          state: request.billingAddress.state,
          country: request.billingAddress.country
        }
      };
    }
  } else if (request.paymentMethod === 'pix') {
    // PIX subscriptions require special handling
    subscriptionData.pix = {
      expires_in: 3600 // 1 hour for first payment
    };
  }

  console.log('Creating Pagar.me subscription:', {
    planId: plan.id,
    customerId: pagarmeCustomerId,
    interval: subscriptionData.interval,
    amount: plan.amount
  });

  const response = await fetch('https://api.pagar.me/core/v5/subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscriptionData)
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Pagar.me subscription creation failed:', error);
    
    // Handle specific error cases
    if (error.message && error.message.includes('Customer not found')) {
      throw new Error(`CUSTOMER_NOT_FOUND:${pagarmeCustomerId}`);
    }
    
    throw new Error(`Failed to create subscription: ${error.message || 'Unknown error'}`);
  }

  const subscription = await response.json();
  console.log('Pagar.me subscription created successfully:', {
    subscriptionId: subscription.id,
    status: subscription.status,
    nextBilling: subscription.next_billing_at
  });
  
  return subscription;
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
    const subscriptionRequest: SubscriptionRequest = await req.json();
    
    // Validate required fields
    if (!subscriptionRequest.planId || !subscriptionRequest.paymentMethod) {
      return sendError('Missing required fields: planId, paymentMethod');
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

    // Get payment plan from our database
    const { data: plan, error: planError } = await supabase
      .from('PaymentPlans')
      .select('*')
      .eq('id', subscriptionRequest.planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return sendError('Payment plan not found or inactive', 404);
    }

    // Verify plan is subscription type
    if (plan.type !== 'subscription') {
      return sendError('Plan is not a subscription plan', 400);
    }

    // Get Pagar.me configuration
    const pagarmeSecretKey = Deno.env.get('PAGARME_SECRET_KEY');
    const pagarmePublicKey = Deno.env.get('PAGARME_PUBLIC_KEY');
    if (!pagarmeSecretKey || !pagarmePublicKey) {
      return sendError('Payment system configuration error', 500);
    }

    // Get user's Pagar.me customer data
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

    // Handle server-side card tokenization if needed
    if (subscriptionRequest.paymentMethod === 'credit_card' && subscriptionRequest.cardToken === 'tokenize_on_server') {
      if (!subscriptionRequest.cardData) {
        return sendError('Card data is required for server-side tokenization', 400);
      }
      
      console.log('Performing server-side card tokenization for subscription...');
      try {
        subscriptionRequest.cardToken = await tokenizeCard(subscriptionRequest.cardData, pagarmePublicKey);
        console.log('Server-side tokenization successful for subscription');
      } catch (tokenError) {
        console.error('Server-side tokenization failed:', tokenError);
        return sendError(`Card tokenization failed: ${tokenError.message}`, 400);
      }
    }

    // Create or get customer
    const customer = await createOrGetCustomer(
      subscriptionRequest.metadata,
      subscriptionRequest.billingAddress,
      pagarmeCustomerId,
      pagarmeSecretKey
    );
    pagarmeCustomerId = customer.id;

    // Update user with customer ID if not already set
    if (!practitioner?.evidens_pagarme_customer_id) {
      const { error: updateError } = await supabase
        .from('Practitioners')
        .update({ evidens_pagarme_customer_id: pagarmeCustomerId })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update practitioner with customer ID:', updateError);
      }
    }

    // Create Pagar.me subscription
    let subscription;
    try {
      subscription = await createPagarmeSubscription(
        plan,
        pagarmeCustomerId,
        subscriptionRequest,
        pagarmeSecretKey
      );
    } catch (error) {
      // Handle test/prod customer ID mismatch
      if (error.message.startsWith('CUSTOMER_NOT_FOUND:')) {
        console.log('Customer not found, creating new one for subscription...');
        
        const newCustomer = await createOrGetCustomer(
          subscriptionRequest.metadata,
          subscriptionRequest.billingAddress,
          null,
          pagarmeSecretKey
        );
        pagarmeCustomerId = newCustomer.id;
        
        // Update database with new customer ID
        await supabase
          .from('Practitioners')
          .update({ evidens_pagarme_customer_id: pagarmeCustomerId })
          .eq('id', user.id);
        
        // Retry subscription creation
        subscription = await createPagarmeSubscription(
          plan,
          pagarmeCustomerId,
          subscriptionRequest,
          pagarmeSecretKey
        );
      } else {
        throw error;
      }
    }

    // Update plan usage count
    await supabase
      .from('PaymentPlans')
      .update({ 
        usage_count: (plan.usage_count || 0) + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', plan.id);

    // Save subscription to database
    const subscriptionData = {
      user_id: user.id,
      pagarme_subscription_id: subscription.id,
      evidens_plan_id: plan.id,
      evidens_plan_type: plan.type,
      status: subscription.status,
      interval: subscription.interval,
      interval_count: subscription.interval_count,
      billing_type: subscription.billing_type,
      amount: plan.amount,
      next_billing_at: subscription.next_billing_at ? new Date(subscription.next_billing_at).toISOString() : null,
      payment_method: subscriptionRequest.paymentMethod,
      evidens_metadata: {
        customer_data: subscriptionRequest.metadata,
        pagarme_customer_id: pagarmeCustomerId,
        pagarme_code: subscription.code,
        plan_details: {
          name: plan.name,
          days: plan.days,
          billing_interval: plan.billing_interval,
          billing_interval_count: plan.billing_interval_count
        }
      }
    };

    const { error: dbError } = await supabase
      .from('evidens_subscriptions')
      .insert(subscriptionData);

    if (dbError) {
      console.error('Database error saving subscription:', dbError);
      return sendError('Failed to save subscription', 500);
    }

    // Return success response
    return sendSuccess({
      id: subscription.id,
      code: subscription.code,
      status: subscription.status,
      interval: subscription.interval,
      interval_count: subscription.interval_count,
      billing_type: subscription.billing_type,
      next_billing_at: subscription.next_billing_at,
      amount: plan.amount,
      currency: 'BRL',
      payment_method: subscriptionRequest.paymentMethod,
      plan: {
        id: plan.id,
        name: plan.name,
        days: plan.days,
        type: plan.type
      },
      created_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    return sendError(`Subscription creation failed: ${error.message}`);
  }
});