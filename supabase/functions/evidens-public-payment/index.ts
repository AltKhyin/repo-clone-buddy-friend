// ABOUTME: Public payment Edge Function for unauthenticated users with full subscription support

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface PublicPaymentRequest {
  planId: string;
  customerId: string; // This will be customer email or identifier
  paymentMethod: 'pix' | 'credit_card';
  installments?: number;
  metadata: {
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
  cardData?: {
    number: string;
    holderName: string;
    expirationMonth: string;
    expirationYear: string;
    cvv: string;
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
    // Parse request body
    const request: PublicPaymentRequest = await req.json();
    
    console.log('🌐 Public payment request:', {
      planId: request.planId,
      paymentMethod: request.paymentMethod,
      customerEmail: request.metadata.customerEmail,
      hasCardData: !!request.cardData,
      hasBillingAddress: !!request.billingAddress
    });

    // Validate required fields
    if (!request.planId || !request.paymentMethod || !request.metadata) {
      return sendError('Missing required fields: planId, paymentMethod, metadata');
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

    // Initialize Supabase client with service role for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the plan details to determine payment flow type
    const { data: plan, error: planError } = await supabase
      .from('PaymentPlans')
      .select('*')
      .eq('id', request.planId)
      .single();

    if (planError || !plan) {
      return sendError('Plan not found');
    }

    // Validate minimum amount
    if (plan.amount < 50) {
      return sendError(`Amount (R$ ${(plan.amount / 100).toFixed(2)}) is below minimum of R$ 0,50`);
    }

    console.log('📋 Plan details:', {
      name: plan.name,
      type: plan.type,
      amount: plan.amount,
      billing_interval: plan.billing_interval
    });

    // Get pagar.me API key
    const pagarmeApiKey = Deno.env.get('PAGARME_SECRET_KEY');
    if (!pagarmeApiKey) {
      return sendError('Payment provider configuration missing', 500);
    }

    // Determine if this should be a subscription or one-time payment
    const isSubscriptionPlan = plan.type === 'subscription' && plan.billing_interval;

    if (isSubscriptionPlan) {
      console.log('🔄 Creating subscription for unauthenticated user');
      
      // Create subscription (same as evidens-create-subscription but for public use)
      const subscriptionPayload: any = {
        description: plan.description || `Assinatura ${plan.name}`,
        quantity: 1,
        pricing_scheme: {
          scheme_type: 'unit',
          price: plan.amount
        },
        interval: plan.billing_interval || 'month',
        interval_count: plan.billing_interval_count || 1,
        billing_type: plan.billing_type || 'prepaid',
        customer: {
          name: customerName,
          email: customerEmail,
          document: customerDocument.replace(/\D/g, ''),
          phone: customerPhone.replace(/\D/g, ''),
          type: 'individual'
        },
        metadata: {
          evidens_plan_id: plan.id,
          evidens_plan_name: plan.name,
          flow_type: 'public_subscription',
          unauthenticated_user: true
        }
      };

      // Add payment method specific data
      if (request.paymentMethod === 'credit_card') {
        if (!request.cardData || !request.billingAddress) {
          return sendError('Credit card payments require cardData and billingAddress');
        }

        subscriptionPayload.payment_method = 'credit_card';
        subscriptionPayload.card = {
          number: request.cardData.number,
          holder_name: request.cardData.holderName,
          exp_month: request.cardData.expirationMonth,
          exp_year: request.cardData.expirationYear,
          cvv: request.cardData.cvv,
          billing_address: {
            line_1: request.billingAddress.line_1,
            zip_code: request.billingAddress.zip_code,
            city: request.billingAddress.city,
            state: request.billingAddress.state,
            country: request.billingAddress.country
          }
        };

        if (request.installments && request.installments > 1) {
          subscriptionPayload.installments = request.installments;
        }
      } else if (request.paymentMethod === 'pix') {
        subscriptionPayload.payment_method = 'boleto'; // PIX through boleto for subscriptions
      }

      // Create subscription via pagar.me API
      console.log('📡 Creating subscription via pagar.me...');
      const pagarmeResponse = await fetch('https://sdx-api.pagar.me/core/v5/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(pagarmeApiKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionPayload)
      });

      if (!pagarmeResponse.ok) {
        const errorData = await pagarmeResponse.json();
        console.error('Subscription creation failed:', errorData);
        return sendError(`Subscription creation failed: ${JSON.stringify(errorData)}`);
      }

      const subscription = await pagarmeResponse.json();
      console.log('✅ Subscription created:', subscription.id);

      return sendSuccess({
        success: true,
        type: 'subscription',
        subscription_id: subscription.id,
        status: subscription.status,
        next_billing_at: subscription.next_billing_at,
        current_cycle: subscription.current_cycle,
        customer_email: customerEmail,
        plan_name: plan.name,
        message: 'Subscription created successfully. Account will be created automatically upon payment confirmation.',
        // Return order-like structure for compatibility with existing success flow
        id: subscription.id,
        charges: subscription.charges || []
      });

    } else {
      console.log('💳 Creating one-time payment for unauthenticated user');
      
      // Create one-time order
      const orderPayload: any = {
        customer: {
          name: customerName,
          email: customerEmail,
          document: customerDocument.replace(/\D/g, ''),
          phone: customerPhone.replace(/\D/g, ''),
          type: 'individual'
        },
        items: [{
          amount: plan.amount,
          description: plan.description || plan.name,
          quantity: 1
        }],
        payments: [],
        metadata: {
          evidens_plan_id: plan.id,
          evidens_plan_name: plan.name,
          flow_type: 'public_onetime',
          unauthenticated_user: true
        }
      };

      // Add payment method
      if (request.paymentMethod === 'pix') {
        orderPayload.payments.push({
          payment_method: 'pix',
          pix: {}
        });
      } else if (request.paymentMethod === 'credit_card') {
        if (!request.cardData || !request.billingAddress) {
          return sendError('Credit card payments require cardData and billingAddress');
        }

        orderPayload.payments.push({
          payment_method: 'credit_card',
          credit_card: {
            card: {
              number: request.cardData.number,
              holder_name: request.cardData.holderName,
              exp_month: request.cardData.expirationMonth,
              exp_year: request.cardData.expirationYear,
              cvv: request.cardData.cvv,
              billing_address: {
                line_1: request.billingAddress.line_1,
                zip_code: request.billingAddress.zip_code,
                city: request.billingAddress.city,
                state: request.billingAddress.state,
                country: request.billingAddress.country
              }
            },
            installments: request.installments || 1
          }
        });
      }

      // Create order via pagar.me API
      console.log('📡 Creating order via pagar.me...');
      const pagarmeResponse = await fetch('https://sdx-api.pagar.me/core/v5/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(pagarmeApiKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload)
      });

      if (!pagarmeResponse.ok) {
        const errorData = await pagarmeResponse.json();
        console.error('Order creation failed:', errorData);
        return sendError(`Order creation failed: ${JSON.stringify(errorData)}`);
      }

      const order = await pagarmeResponse.json();
      console.log('✅ Order created:', order.id);

      return sendSuccess({
        success: true,
        type: 'order',
        ...order,
        customer_email: customerEmail,
        plan_name: plan.name,
        message: 'Payment created successfully. Account will be created automatically upon payment confirmation.'
      });
    }

  } catch (error) {
    console.error('Public payment error:', error);
    return sendError(error.message || 'Internal server error', 500);
  }
});