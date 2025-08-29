// ABOUTME: EVIDENS payment status checking Edge Function - polls Pagar.me for payment updates

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PagarmeOrder {
  id: string;
  code: string;
  amount: number;
  currency: string;
  status: string;
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

async function fetchPagarmeOrderStatus(
  orderId: string,
  pagarmeSecretKey: string
): Promise<PagarmeOrder> {
  const authToken = btoa(`${pagarmeSecretKey}:`);
  
  const response = await fetch(`https://api.pagar.me/core/v5/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch order status: ${error.message || 'Unknown error'}`);
  }

  return await response.json();
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return sendError('Method not allowed', 405);
  }

  try {
    // Get order ID from query params
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    
    if (!orderId) {
      return sendError('Missing orderId parameter');
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

    // Get payment transaction from database to verify ownership
    const { data: transaction, error: transactionError } = await supabase
      .from('evidens_payment_transactions')
      .select('*')
      .eq('pagarme_order_id', orderId)
      .eq('user_id', user.id)
      .single();

    if (transactionError || !transaction) {
      return sendError('Payment transaction not found or access denied', 404);
    }

    // Get Pagar.me configuration
    const pagarmeSecretKey = Deno.env.get('PAGARME_SECRET_KEY');
    if (!pagarmeSecretKey) {
      return sendError('Payment system configuration error', 500);
    }

    // Fetch current status from Pagar.me
    const order = await fetchPagarmeOrderStatus(orderId, pagarmeSecretKey);
    
    // Update database if status changed
    const pagarmeStatus = order.charges[0]?.status || order.status;
    let dbStatus = 'pending';
    
    switch (pagarmeStatus) {
      case 'paid':
        dbStatus = 'paid';
        break;
      case 'processing':
        dbStatus = 'processing';
        break;
      case 'failed':
      case 'canceled':
        dbStatus = 'failed';
        break;
      default:
        dbStatus = 'pending';
    }

    // Update database status if changed
    if (transaction.status !== dbStatus) {
      await supabase
        .from('evidens_payment_transactions')
        .update({ 
          status: dbStatus,
          updated_at: new Date().toISOString()
        })
        .eq('pagarme_order_id', orderId);

      // If payment is successful, update subscription status
      if (dbStatus === 'paid') {
        const result = await supabase.rpc('update_evidens_payment_status', {
          order_id: orderId,
          new_status: 'paid',
          pagarme_data: order
        });
        
        if (result.error) {
          console.error('Error updating subscription:', result.error);
        }
      }
    }

    // Return updated payment information
    return sendSuccess({
      id: order.id,
      code: order.code,
      amount: order.amount,
      currency: order.currency,
      status: dbStatus,
      pagarme_status: pagarmeStatus,
      payment_method: transaction.payment_method,
      // PIX specific data
      qr_code: order.charges[0]?.last_transaction?.qr_code_text || order.charges[0]?.last_transaction?.qr_code,
      qr_code_url: order.charges[0]?.last_transaction?.qr_code_url,
      expires_at: order.charges[0]?.last_transaction?.expires_at,
      // Credit card specific data
      authorization_code: order.charges[0]?.last_transaction?.authorization_code,
      created_at: transaction.created_at,
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return sendError(`Payment status check failed: ${error.message}`);
  }
});