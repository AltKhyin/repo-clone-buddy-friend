// ABOUTME: Edge function to assign admin role to the current authenticated user
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT token and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has admin role
    const { data: existingRole } = await supabaseClient
      .from('UserRoles')
      .select('*')
      .eq('practitioner_id', user.id)
      .eq('role_name', 'admin')
      .eq('is_active', true)
      .single();

    if (existingRole) {
      return new Response(
        JSON.stringify({ 
          message: 'User already has admin role',
          userId: user.id,
          email: user.email
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign admin role to the user
    const { data, error } = await supabaseClient
      .from('UserRoles')
      .insert({
        practitioner_id: user.id,
        role_name: 'admin',
        is_active: true,
        granted_at: new Date().toISOString(),
        granted_by: user.id // Self-assigned for initial setup
      })
      .select()
      .single();

    if (error) {
      console.error('Error assigning admin role:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to assign admin role', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Admin role assigned successfully',
        userId: user.id,
        email: user.email,
        roleData: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});