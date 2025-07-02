// ABOUTME: Edge Function to refresh user JWT claims for proper RLS policy enforcement

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RefreshClaimsRequest {
  user_id: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current user data from database
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('auth.users')
      .select('raw_app_meta_data')
      .eq('id', user.id)
      .single();

    if (dbError || !userData) {
      return new Response(JSON.stringify({ error: 'Failed to fetch user data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract role and subscription_tier from metadata
    const role = userData.raw_app_meta_data?.role || 'practitioner';
    const subscription_tier = userData.raw_app_meta_data?.subscription_tier || 'free';

    // Update user with proper JWT claims in app_metadata
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...userData.raw_app_meta_data,
        role,
        subscription_tier,
        // Add claims in the format Supabase expects for JWT
        claims_role: role,
        claims_subscription_tier: subscription_tier,
      },
    });

    if (updateError) {
      console.error('Failed to update user claims:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update user claims' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User claims updated successfully',
        role,
        subscription_tier,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in refresh-user-claims:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
