// ABOUTME: EVIDENS subscription management Edge Function - cancel, reactivate, pause subscriptions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionManagementRequest {
  subscriptionId: string; // Pagar.me subscription ID
  action: 'cancel' | 'reactivate' | 'pause';
  reason?: string;
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

async function manageSubscription(
  subscriptionId: string,
  action: string,
  reason: string | undefined,
  pagarmeSecretKey: string
): Promise<any> {
  const authToken = btoa(`${pagarmeSecretKey}:`);

  let endpoint: string;
  let method: string;
  let body: any = {};

  switch (action) {
    case 'cancel':
      endpoint = `https://sdx-api.pagar.me/core/v5/subscriptions/${subscriptionId}`;
      method = 'DELETE';
      if (reason) {
        body.cancellation_reason = reason;
      }
      break;
      
    case 'reactivate':
      endpoint = `https://sdx-api.pagar.me/core/v5/subscriptions/${subscriptionId}/reactivate`;
      method = 'POST';
      break;
      
    case 'pause':
      endpoint = `https://sdx-api.pagar.me/core/v5/subscriptions/${subscriptionId}/pause`;
      method = 'POST';
      if (reason) {
        body.pause_reason = reason;
      }
      break;
      
    default:
      throw new Error(`Unsupported action: ${action}`);
  }

  console.log(`${action.toUpperCase()} subscription:`, {
    subscriptionId,
    endpoint,
    method,
    hasReason: Boolean(reason)
  });

  const response = await fetch(endpoint, {
    method,
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`Pagar.me subscription ${action} failed:`, error);
    throw new Error(`Failed to ${action} subscription: ${error.message || 'Unknown error'}`);
  }

  const result = await response.json();
  console.log(`Pagar.me subscription ${action} successful:`, {
    subscriptionId,
    status: result.status,
    action
  });
  
  return result;
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
    const managementRequest: SubscriptionManagementRequest = await req.json();
    
    // Validate required fields
    if (!managementRequest.subscriptionId || !managementRequest.action) {
      return sendError('Missing required fields: subscriptionId, action');
    }

    if (!['cancel', 'reactivate', 'pause'].includes(managementRequest.action)) {
      return sendError('Invalid action. Must be: cancel, reactivate, or pause');
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

    // Verify user owns this subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('evidens_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('pagarme_subscription_id', managementRequest.subscriptionId)
      .single();

    if (subscriptionError || !subscription) {
      return sendError('Subscription not found or access denied', 404);
    }

    // Perform the subscription management action with Pagar.me
    const result = await manageSubscription(
      managementRequest.subscriptionId,
      managementRequest.action,
      managementRequest.reason,
      pagarmeSecretKey
    );

    // Update local database based on action
    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    switch (managementRequest.action) {
      case 'cancel':
        updateData.status = 'canceled';
        updateData.canceled_at = new Date().toISOString();
        break;
      case 'reactivate':
        updateData.status = 'active';
        updateData.canceled_at = null;
        break;
      case 'pause':
        updateData.status = 'paused';
        break;
    }

    // Update subscription record
    const { error: updateError } = await supabase
      .from('evidens_subscriptions')
      .update(updateData)
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Failed to update subscription record:', updateError);
      // Don't fail the entire operation, but log the issue
    }

    // Update practitioner subscription status
    let practitionerUpdateData: any = {
      subscription_status: updateData.status
    };

    if (managementRequest.action === 'cancel') {
      practitionerUpdateData.subscription_expires_at = new Date().toISOString();
    }

    const { error: practitionerUpdateError } = await supabase
      .from('Practitioners')
      .update(practitionerUpdateData)
      .eq('id', user.id);

    if (practitionerUpdateError) {
      console.error('Failed to update practitioner status:', practitionerUpdateError);
      // Don't fail the entire operation, but log the issue
    }

    // Return success response
    return sendSuccess({
      id: managementRequest.subscriptionId,
      action: managementRequest.action,
      status: result.status,
      message: `Subscription ${managementRequest.action}ed successfully`,
      pagarme_response: {
        id: result.id,
        status: result.status,
        updated_at: result.updated_at
      },
      local_updates: {
        subscription_updated: !updateError,
        practitioner_updated: !practitionerUpdateError
      }
    });

  } catch (error) {
    console.error('Subscription management error:', error);
    return sendError(`Subscription management failed: ${error.message}`);
  }
});