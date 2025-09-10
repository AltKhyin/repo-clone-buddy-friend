// ABOUTME: Admin-only Edge Function to create custom recurring subscription plans for users with flexible billing periods

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { authenticateUser, createSuccessResponse, createErrorResponse } from '../_shared/api-helpers.ts';

interface AdminSubscriptionRequest {
  targetUserId: string; // User to create subscription for
  planName: string; // Custom plan name
  amount: number; // Amount in cents
  billingInterval: 'month' | 'year'; // Billing frequency
  intervalCount: number; // Billing interval count (e.g., 3 months, 6 months)
  description: string;
  adminNotes?: string; // Admin notes for tracking
  metadata: {
    customerName: string;
    customerEmail: string;
    customerDocument: string;
    customerPhone: string;
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
  // Optional trial period
  trialDays?: number;
  // Payment method for subscription
  paymentMethod: 'credit_card' | 'boleto';
  cardToken?: string; // For credit card subscriptions
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
  start_at: string;
  interval: string;
  interval_count: number;
  billing_type: string;
  current_cycle: {
    start_at: string;
    end_at: string;
  };
  customer: PagarmeCustomer;
  items: Array<{
    id: string;
    name: string;
    status: string;
    pricing_scheme: {
      price: number;
    };
  }>;
  status: string;
}

async function validateAdminPermission(supabase: any, user: any): Promise<void> {
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
    .select('id, full_name, evidens_pagarme_customer_id, pagarme_customer_id, subscription_tier, subscription_start_date, subscription_end_date, subscription_id')
    .eq('id', targetUserId)
    .single();

  if (error || !targetUser) {
    throw new Error('VALIDATION_FAILED: Target user not found');
  }

  return targetUser;
}

async function createOrUpdatePagarmeCustomer(
  customerData: AdminSubscriptionRequest['metadata'],
  billingAddress: AdminSubscriptionRequest['billingAddress'],
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
    ? `https://sdx-api.pagar.me/core/v5/customers/${existingCustomerId}`
    : 'https://sdx-api.pagar.me/core/v5/customers';

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
    console.error(`Admin subscription customer ${method} failed:`, error);
    throw new Error(`Failed to ${method === 'PUT' ? 'update' : 'create'} customer: ${error.message || 'Unknown error'}`);
  }

  console.log(`Admin subscription customer ${method === 'PUT' ? 'updated' : 'created'} successfully`);
  return await response.json();
}

async function createPagarmeSubscription(
  request: AdminSubscriptionRequest,
  pagarmeCustomerId: string,
  pagarmeSecretKey: string
): Promise<PagarmeSubscription> {
  const authToken = btoa(`${pagarmeSecretKey}:`);
  
  // Calculate start date (immediate or with trial period)
  const now = new Date();
  const startDate = request.trialDays && request.trialDays > 0 
    ? new Date(now.getTime() + (request.trialDays * 24 * 60 * 60 * 1000))
    : now;

  const subscriptionData: any = {
    code: `admin-sub-${Date.now()}`, // Mark as admin-created subscription
    start_at: startDate.toISOString(),
    interval: request.billingInterval,
    interval_count: request.intervalCount,
    billing_type: 'prepaid', // Standard for subscriptions
    customer_id: pagarmeCustomerId,
    items: [{
      name: request.planName,
      quantity: 1,
      pricing_scheme: {
        scheme_type: 'unit',
        price: request.amount,
        price_brackets: [{
          start_quantity: 1,
          price: request.amount,
          overage_price: 0
        }]
      }
    }],
    payment_settings: {
      payment_method: request.paymentMethod,
      success_url: 'https://reviews.igoreckert.com.br/pagamento-sucesso',
      allowed_payment_methods: [request.paymentMethod]
    },
    // Add metadata to track admin creation
    metadata: {
      admin_created: 'true',
      admin_user_id: request.metadata.adminUserId,
      target_user_id: request.targetUserId,
      admin_notes: request.adminNotes || '',
      created_via: 'admin_panel'
    }
  };

  // Add trial period if specified
  if (request.trialDays && request.trialDays > 0) {
    subscriptionData.trial_days = request.trialDays;
    subscriptionData.trial_enabled = true;
  }

  // Configure payment method specific settings
  if (request.paymentMethod === 'credit_card') {
    if (!request.cardToken) {
      throw new Error('Card token is required for credit card subscriptions');
    }
    
    subscriptionData.payment_settings.credit_card = {
      installments: 1, // Subscriptions are typically single installment
      card_token: request.cardToken,
      statement_descriptor: 'EVIDENS-SUB'
    };

    // Add billing address if provided
    if (request.billingAddress) {
      subscriptionData.payment_settings.credit_card.card = {
        billing_address: {
          line_1: request.billingAddress.line_1,
          zip_code: request.billingAddress.zip_code.replace(/\D/g, ''),
          city: request.billingAddress.city,
          state: request.billingAddress.state,
          country: request.billingAddress.country
        }
      };
    }
  } else if (request.paymentMethod === 'boleto') {
    subscriptionData.payment_settings.boleto = {
      bank: '033', // Santander default, can be configured
      instructions: `Pagamento da assinatura ${request.planName} - EVIDENS`,
      due_at: new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString() // 7 days due date
    };
  }

  console.log('Creating admin subscription with data:', JSON.stringify(subscriptionData, null, 2));

  const response = await fetch('https://sdx-api.pagar.me/core/v5/subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscriptionData)
  });

  if (!response.ok) {
    const error = await response.json();
    
    if (error.message && error.message.includes('Customer not found')) {
      throw new Error(`CUSTOMER_NOT_FOUND:${pagarmeCustomerId}`);
    }
    
    console.error('Admin subscription creation failed:', error);
    throw new Error(`Failed to create admin subscription: ${error.message || 'Unknown error'}`);
  }

  const subscription = await response.json();
  console.log('Admin Subscription Created:', JSON.stringify(subscription, null, 2));
  
  return subscription;
}

async function updateUserSubscriptionData(
  supabase: any,
  targetUserId: string,
  subscription: PagarmeSubscription,
  adminNotes: string,
  adminUserId: string,
  trialDays?: number
): Promise<void> {
  const now = new Date();
  
  // Calculate subscription end date based on billing cycle
  const intervalMultiplier = subscription.interval === 'month' ? 30 : 365;
  const subscriptionDays = intervalMultiplier * subscription.interval_count;
  const endDate = new Date(now.getTime() + (subscriptionDays * 24 * 60 * 60 * 1000));

  const updateData = {
    subscription_id: subscription.id,
    subscription_start_date: subscription.start_at,
    subscription_end_date: endDate.toISOString(),
    subscription_created_by: 'admin',
    subscription_payment_method_used: 'admin_subscription',
    admin_subscription_notes: adminNotes,
    subscription_tier: 'premium', // Admin subscriptions grant premium
    next_billing_date: subscription.current_cycle?.end_at || null,
  };

  // Handle trial period
  if (trialDays && trialDays > 0) {
    updateData.trial_end_date = new Date(now.getTime() + (trialDays * 24 * 60 * 60 * 1000)).toISOString();
  }

  const { error } = await supabase
    .from('Practitioners')
    .update(updateData)
    .eq('id', targetUserId);

  if (error) {
    throw new Error(`Failed to update user subscription data: ${error.message}`);
  }

  console.log(`Admin updated subscription data for user ${targetUserId}: ${subscription.id}`);
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
    const subscriptionRequest: AdminSubscriptionRequest = await req.json();
    
    // Validate required fields
    if (!subscriptionRequest.targetUserId || !subscriptionRequest.amount || !subscriptionRequest.planName || !subscriptionRequest.billingInterval) {
      throw new Error('VALIDATION_FAILED: Missing required fields: targetUserId, amount, planName, billingInterval');
    }

    if (subscriptionRequest.amount < 100) { // Minimum R$ 1.00 for subscriptions
      throw new Error('VALIDATION_FAILED: Minimum subscription amount is R$ 1.00 (100 cents)');
    }

    if (!['month', 'year'].includes(subscriptionRequest.billingInterval)) {
      throw new Error('VALIDATION_FAILED: Billing interval must be month or year');
    }

    if (subscriptionRequest.intervalCount < 1 || subscriptionRequest.intervalCount > 12) {
      throw new Error('VALIDATION_FAILED: Interval count must be between 1 and 12');
    }

    if (subscriptionRequest.trialDays && (subscriptionRequest.trialDays < 0 || subscriptionRequest.trialDays > 365)) {
      throw new Error('VALIDATION_FAILED: Trial days must be between 0 and 365');
    }

    // Get target user information
    const targetUser = await getTargetUser(supabase, subscriptionRequest.targetUserId);

    // Check if user already has an active subscription
    if (targetUser.subscription_id) {
      console.warn(`User ${subscriptionRequest.targetUserId} already has subscription ${targetUser.subscription_id}. This will replace it.`);
    }

    // Get Pagar.me configuration
    const pagarmeSecretKey = Deno.env.get('PAGARME_SECRET_KEY');
    if (!pagarmeSecretKey) {
      throw new Error('Payment system configuration error');
    }

    // Set admin metadata
    subscriptionRequest.metadata.adminCreated = true;
    subscriptionRequest.metadata.adminUserId = user.id;

    let pagarmeCustomerId = targetUser.evidens_pagarme_customer_id || targetUser.pagarme_customer_id;
    console.log('Admin creating subscription for user:', subscriptionRequest.targetUserId, 'existing customer ID:', pagarmeCustomerId);

    // Create or update customer
    if (!pagarmeCustomerId) {
      console.log('Creating new Pagar.me customer for subscription target user:', subscriptionRequest.targetUserId);
      const customer = await createOrUpdatePagarmeCustomer(subscriptionRequest.metadata, subscriptionRequest.billingAddress, pagarmeSecretKey);
      pagarmeCustomerId = customer.id;
      
      // Update target user with customer ID
      const { error: updateError } = await supabase
        .from('Practitioners')
        .update({ evidens_pagarme_customer_id: pagarmeCustomerId })
        .eq('id', subscriptionRequest.targetUserId);

      if (updateError) {
        console.error('Failed to update target user with customer ID:', updateError);
      }
    } else {
      console.log('Updating existing customer for subscription...');
      try {
        await createOrUpdatePagarmeCustomer(subscriptionRequest.metadata, subscriptionRequest.billingAddress, pagarmeSecretKey, pagarmeCustomerId);
      } catch (updateError) {
        console.error('Failed to update customer for subscription:', updateError);
        // Continue - update failure shouldn't block subscription creation
      }
    }

    // Create Pagar.me subscription
    let subscription;
    try {
      subscription = await createPagarmeSubscription(subscriptionRequest, pagarmeCustomerId, pagarmeSecretKey);
    } catch (error) {
      // Handle test/prod customer ID mismatch
      if (error.message.startsWith('CUSTOMER_NOT_FOUND:')) {
        const oldCustomerId = error.message.split(':')[1];
        console.log(`Admin subscription: Customer ${oldCustomerId} not found (likely test/prod mismatch). Creating new customer...`);
        
        const newCustomer = await createOrUpdatePagarmeCustomer(subscriptionRequest.metadata, subscriptionRequest.billingAddress, pagarmeSecretKey);
        pagarmeCustomerId = newCustomer.id;
        console.log(`Admin subscription created new customer: ${pagarmeCustomerId}`);
        
        // Update database with new customer ID
        const { error: updateError } = await supabase
          .from('Practitioners')
          .update({ evidens_pagarme_customer_id: pagarmeCustomerId })
          .eq('id', subscriptionRequest.targetUserId);
          
        if (updateError) {
          console.error('Failed to update with new customer ID for subscription:', updateError);
        }
        
        // Retry subscription creation with new customer
        subscription = await createPagarmeSubscription(subscriptionRequest, pagarmeCustomerId, pagarmeSecretKey);
      } else {
        throw error;
      }
    }
    
    // Check if subscription creation failed
    if (!subscription || subscription.status === 'failed') {
      throw new Error('Admin subscription creation failed. Please check payment method and try again.');
    }

    // Update user subscription data in database
    await updateUserSubscriptionData(
      supabase,
      subscriptionRequest.targetUserId,
      subscription,
      subscriptionRequest.adminNotes || 'Admin-created subscription',
      user.id,
      subscriptionRequest.trialDays
    );

    // Log subscription creation event
    const subscriptionEvent = {
      user_id: subscriptionRequest.targetUserId,
      event_type: 'admin_subscription_created',
      event_data: {
        subscription_id: subscription.id,
        plan_name: subscriptionRequest.planName,
        amount: subscriptionRequest.amount,
        billing_interval: subscriptionRequest.billingInterval,
        interval_count: subscriptionRequest.intervalCount,
        trial_days: subscriptionRequest.trialDays || 0,
        admin_created: true,
        admin_user_id: user.id
      },
      processing_status: 'processed',
      processed_at: new Date().toISOString()
    };

    const { error: logError } = await supabase
      .from('payment_events')
      .insert(subscriptionEvent);

    if (logError) {
      console.error('Failed to log subscription creation event:', logError);
      // Don't fail the request for logging errors
    }

    // Return success response with subscription data
    return createSuccessResponse({
      subscription_id: subscription.id,
      code: subscription.code,
      status: subscription.status,
      start_at: subscription.start_at,
      interval: subscription.interval,
      interval_count: subscription.interval_count,
      plan_name: subscriptionRequest.planName,
      amount: subscriptionRequest.amount,
      target_user_id: subscriptionRequest.targetUserId,
      trial_days: subscriptionRequest.trialDays || 0,
      payment_method: subscriptionRequest.paymentMethod,
      admin_created: true,
      admin_user_id: user.id,
      customer_id: pagarmeCustomerId,
      current_cycle: subscription.current_cycle,
      created_at: new Date().toISOString()
    }, {}, origin);

  } catch (error) {
    console.error('Admin subscription creation error:', error);
    return createErrorResponse(error, {}, origin);
  }
});