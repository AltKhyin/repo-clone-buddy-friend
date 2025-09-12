// ABOUTME: Supabase native user invitation with payment data for seamless account creation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationRequest {
  email: string;
  paymentData: {
    planId: string;
    amount: number;
    paymentMethod: string;
    transactionId: string;
    paidAt: string;
  };
  customerData: {
    name: string;
    email: string;
    document: string;
    phone: string;
  };
  planData: {
    id: string;
    name: string;
    description?: string;
    durationDays: number;
    finalAmount: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize admin client for user invitation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Optional: Verify requesting user if authenticated (for security logging)
    const authHeader = req.headers.get('Authorization')
    let requestingUser = null;
    
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      )
      
      const { data: { user } } = await supabaseClient.auth.getUser()
      requestingUser = user;
    }

    // Parse request body
    const invitationData: InvitationRequest = await req.json()
    
    console.log('📧 Supabase invitation request for:', invitationData.email)
    console.log('📧 Requested by:', requestingUser?.id || 'unauthenticated')
    console.log('📧 Plan:', invitationData.planData.name)

    // Prepare payment metadata for user invitation
    const paymentMetadata = {
      paymentData: invitationData.paymentData,
      planData: invitationData.planData,
      customerData: invitationData.customerData,
    };

    // Use Supabase's built-in invitation system with admin client
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      invitationData.email,
      {
        redirectTo: `${req.headers.get('Origin') || 'http://localhost:8080'}/complete-registration`,
        data: {
          // Include payment information in user metadata
          full_name: invitationData.customerData.name,
          payment_metadata: JSON.stringify(paymentMetadata),
          subscription_tier: 'premium',
          invited_via: 'payment',
          plan_name: invitationData.planData.name,
          plan_amount: invitationData.planData.finalAmount,
          transaction_id: invitationData.paymentData.transactionId,
        }
      }
    );

    if (error) {
      console.error('❌ Supabase invitation error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send invitation',
          details: error.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!data.user) {
      console.error('❌ No user data returned from invitation');
      return new Response(
        JSON.stringify({ error: 'No user data returned from invitation' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Supabase invitation sent successfully:', data.user.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully',
        data: {
          userId: data.user.id,
          email: invitationData.email,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Error in user invitation:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})