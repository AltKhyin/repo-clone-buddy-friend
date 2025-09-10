// ABOUTME: Edge Function to create pagar.me standalone subscriptions with inline pricing

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface SubscriptionCreationRequest {
  planId: string; // EVIDENS PaymentPlan ID
  customerId: string; // EVIDENS customer ID  
  paymentMethod: 'credit_card' | 'pix';
  cardData?: {
    number: string;
    holderName: string;
    expirationMonth: string;
    expirationYear: string;
    cvv: string;
  };
  billingAddress?: {
    line_1: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
  };
  installments?: number;
  metadata: {
    customerName: string;
    customerEmail: string;
    customerDocument: string;
    customerPhone: string;
  };
}

function sendError(message: string, status = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

function sendSuccess(data: any) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return sendError('Method not allowed', 405);
  }

  try {
    // Verify JWT and extract user (REQUIRED for authenticated subscription creation)
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      return sendError('Authentication required for subscription creation', 401)
    }

    // Initialize Supabase client with service role for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader)
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return sendError('Invalid authentication token', 401)
    }

    console.log('✅ Authenticated user:', user.id, user.email)

    // Parse request body
    const request: SubscriptionCreationRequest = await req.json();
    
    // Comprehensive input validation
    console.log('🔍 Validating subscription request:', {
      planId: request.planId,
      customerId: request.customerId,
      paymentMethod: request.paymentMethod,
      hasMetadata: !!request.metadata,
      hasCardData: !!request.cardData,
      hasBillingAddress: !!request.billingAddress
    });

    // Validate required fields
    if (!request.planId || !request.customerId || !request.paymentMethod || !request.metadata) {
      return sendError('Missing required fields: planId, customerId, paymentMethod, metadata');
    }

    // Validate metadata fields
    const { customerName, customerEmail, customerDocument, customerPhone } = request.metadata;
    if (!customerName || !customerEmail || !customerDocument || !customerPhone) {
      return sendError('Missing required metadata fields: customerName, customerEmail, customerDocument, customerPhone');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return sendError('Invalid email format');
    }

    // Validate credit card requirements
    if (request.paymentMethod === 'credit_card') {
      if (!request.cardData || !request.billingAddress) {
        return sendError('Credit card payments require cardData and billingAddress');
      }
      
      const { number, holderName, expirationMonth, expirationYear, cvv } = request.cardData;
      if (!number || !holderName || !expirationMonth || !expirationYear || !cvv) {
        return sendError('Missing required card data fields');
      }
      
      const { line_1, zip_code, city, state, country } = request.billingAddress;
      if (!line_1 || !zip_code || !city || !state || !country) {
        return sendError('Missing required billing address fields');
      }
    }

    // Supabase client already initialized above for JWT verification

    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from('PaymentPlans')
      .select('*')
      .eq('id', request.planId)
      .single();

    if (planError || !plan) {
      return sendError('Plan not found');
    }

    // Validate plan is subscription type
    if (plan.type !== 'subscription') {
      return sendError('Plan must be subscription type for subscription creation');
    }

    // Validate credit card requirements
    if (request.paymentMethod === 'credit_card') {
      if (!request.cardData || !request.billingAddress) {
        return sendError('Card token is required for credit card subscriptions');
      }
    }

    // Create pagar.me subscription
    const pagarmeApiKey = Deno.env.get('PAGARME_SECRET_KEY');
    if (!pagarmeApiKey) {
      return sendError('Payment provider configuration missing', 500);
    }

    // Prepare standalone subscription payload with inline pricing
    const subscriptionPayload: any = {
      // Required description field
      description: plan.description || `Assinatura ${plan.name}`,
      
      // Required quantity field (typically 1 for subscriptions)
      quantity: 1,
      
      // Inline pricing scheme instead of referencing a pre-created plan
      pricing_scheme: {
        scheme_type: 'unit',
        price: plan.amount // Price in cents
      },
      
      // Billing configuration
      interval: plan.billing_interval || 'month',
      interval_count: plan.billing_interval_count || 1,
      billing_type: plan.billing_type || 'prepaid', // Required billing type
      
      // Customer information
      customer: {
        name: request.metadata.customerName,
        email: request.metadata.customerEmail,
        document: request.metadata.customerDocument.replace(/\D/g, ''), // Remove all non-numeric characters
        phone: request.metadata.customerPhone.replace(/\D/g, ''), // Remove all non-numeric characters
        type: 'individual'
      },
      
      // Metadata for tracking
      metadata: {
        evidens_plan_id: plan.id,
        evidens_customer_id: request.customerId,
        evidens_plan_name: plan.name,
        flow_type: 'standalone_subscription'
      }
    };

    // Add payment method specific data
    if (request.paymentMethod === 'credit_card') {
      subscriptionPayload.payment_method = 'credit_card';
      subscriptionPayload.card = {
        number: request.cardData!.number,
        holder_name: request.cardData!.holderName,
        exp_month: request.cardData!.expirationMonth,
        exp_year: request.cardData!.expirationYear,
        cvv: request.cardData!.cvv,
        billing_address: {
          line_1: request.billingAddress!.line_1,
          zip_code: request.billingAddress!.zip_code,
          city: request.billingAddress!.city,
          state: request.billingAddress!.state,
          country: request.billingAddress!.country
        }
      };
      
      if (request.installments && request.installments > 1) {
        subscriptionPayload.installments = request.installments;
      }
    } else if (request.paymentMethod === 'pix') {
      // CRITICAL FIX: Handle PIX payment method for subscriptions
      subscriptionPayload.payment_method = 'pix';
      console.log('🔍 Setting PIX payment method for subscription');
    } else {
      // Default to PIX if no valid payment method specified
      console.warn('⚠️ Unknown payment method, defaulting to PIX:', request.paymentMethod);
      subscriptionPayload.payment_method = 'pix';
    }

    // Log payload structure (without sensitive data) for debugging
    console.log('🚀 Creating pagar.me subscription with payload structure:', {
      description: subscriptionPayload.description,
      quantity: subscriptionPayload.quantity,
      pricing_scheme: subscriptionPayload.pricing_scheme,
      interval: subscriptionPayload.interval,
      interval_count: subscriptionPayload.interval_count,
      billing_type: subscriptionPayload.billing_type,
      payment_method: subscriptionPayload.payment_method,
      hasCustomer: !!subscriptionPayload.customer,
      hasCard: !!subscriptionPayload.card,
      hasMetadata: !!subscriptionPayload.metadata
    });

    // Call pagar.me API
    console.log('📡 Sending request to pagar.me API...');
    const pagarmeResponse = await fetch('https://sdx-api.pagar.me/core/v5/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(pagarmeApiKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionPayload)
    });

    console.log('📥 Pagar.me API response status:', pagarmeResponse.status);

    if (!pagarmeResponse.ok) {
      const errorData = await pagarmeResponse.json();
      console.error('Pagar.me subscription creation failed:', errorData);
      
      // Map pagar.me errors to user-friendly Portuguese messages
      let errorMessage = 'Falha ao criar assinatura';
      
      if (errorData.errors) {
        const firstError = Object.values(errorData.errors)[0] as any;
        if (Array.isArray(firstError) && firstError.length > 0) {
          const originalError = firstError[0];
          
          // Map common validation errors to Portuguese
          if (originalError.includes('document') && originalError.includes('not a valid number')) {
            errorMessage = 'CPF/CNPJ inválido. Use apenas números.';
          } else if (originalError.includes('quantity') && originalError.includes('required')) {
            errorMessage = 'Erro interno: quantidade não especificada.';
          } else if (originalError.includes('description') && originalError.includes('required')) {
            errorMessage = 'Erro interno: descrição não especificada.';
          } else if (originalError.includes('card') && originalError.includes('invalid')) {
            errorMessage = 'Dados do cartão inválidos. Verifique número, validade e CVV.';
          } else if (originalError.includes('email') && originalError.includes('invalid')) {
            errorMessage = 'Email inválido. Verifique o formato do email.';
          } else if (originalError.includes('phone') && originalError.includes('invalid')) {
            errorMessage = 'Telefone inválido. Use apenas números.';
          } else if (originalError.includes('address') || originalError.includes('zip_code')) {
            errorMessage = 'Dados do endereço inválidos. Verifique CEP, cidade e estado.';
          } else {
            errorMessage = originalError;
          }
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      console.error('❌ Subscription creation failed with user message:', errorMessage);
      return sendError(`Subscription creation failed: ${errorMessage}`);
    }

    const subscription = await pagarmeResponse.json();
    console.log('✅ Pagar.me subscription created successfully:', {
      id: subscription.id,
      status: subscription.status,
      next_billing_at: subscription.next_billing_at
    });

    // Get current user access time to calculate new expiration
    // Use authenticated user UID to lookup Practitioners record
    console.log('🔍 Getting current user access data using UID:', user.id);
    const { data: currentUser, error: getUserError } = await supabase
      .from('Practitioners')
      .select('id, subscription_end_date, subscription_tier')
      .eq('id', user.id)
      .single();

    if (getUserError) {
      console.error('Failed to get user data for access calculation:', getUserError);
      // If practitioner record doesn't exist, this is a critical issue
      if (getUserError.code === 'PGRST116') {
        return sendError('Practitioner record not found. Please contact support.', 404);
      }
      return sendError('Failed to retrieve user subscription data', 500);
    }

    console.log('✅ Found practitioner record:', currentUser.id);

    // Calculate new access time using EVIDENS plan days
    console.log('🕐 Calculating access time using plan days:', plan.days);
    
    // Simple access time calculation directly in Edge Function
    let newEndDate: string;
    const planDays = plan.days || 30; // Use plan.days field
    const paymentDate = new Date();
    
    if (!currentUser.subscription_end_date) {
      // No existing access - start from payment date
      console.log('📅 No existing access, creating new access period');
      const endDate = new Date(paymentDate);
      endDate.setDate(endDate.getDate() + planDays);
      newEndDate = endDate.toISOString();
    } else {
      const existingEndDate = new Date(currentUser.subscription_end_date);
      
      if (existingEndDate <= paymentDate) {
        // User is overdue - add FULL time from payment date (as requested)
        console.log('📅 User is overdue, adding FULL purchased time from payment date');
        const endDate = new Date(paymentDate);
        endDate.setDate(endDate.getDate() + planDays);
        newEndDate = endDate.toISOString();
      } else {
        // User still has active access - extend existing time
        console.log('📅 User has active access, extending existing time');
        const endDate = new Date(existingEndDate);
        endDate.setDate(endDate.getDate() + planDays);
        newEndDate = endDate.toISOString();
      }
    }

    console.log('✅ Calculated new access end date:', newEndDate);

    // Update EVIDENS database with subscription details AND access time
    const { error: updateError } = await supabase
      .from('Practitioners')
      .update({
        // Core access fields (what admin interface shows)
        subscription_end_date: newEndDate,
        subscription_tier: 'premium',
        
        // Subscription metadata  
        subscription_status: subscription.status === 'active' ? 'active' : 'pending',
        subscription_id: subscription.id, // This IS the pagarme subscription ID
        subscription_plan: plan.name,
        subscription_start_date: paymentDate.toISOString(),
        next_billing_date: subscription.next_billing_at,
        
        // Tracking and admin info
        last_payment_date: paymentDate.toISOString(),
        subscription_created_by: 'payment_system',
        admin_subscription_notes: `Payment processed: +${planDays} days on ${paymentDate.toLocaleDateString('pt-BR')}. Upgraded to premium.`,
        updated_at: paymentDate.toISOString()
      })
      .eq('id', currentUser.id);

    if (updateError) {
      console.error('Failed to update practitioner:', updateError);
      // Don't fail the whole operation, just log it
    }

    return sendSuccess({
      success: true,
      message: 'Subscription created successfully',
      subscription_id: subscription.id,
      status: subscription.status,
      plan_name: plan.name,
      subscription_details: {
        id: subscription.id,
        status: subscription.status,
        next_billing_at: subscription.next_billing_at,
        current_cycle: subscription.current_cycle,
        pricing_scheme: subscription.pricing_scheme
      }
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    return sendError(error.message || 'Internal server error', 500);
  }
});
