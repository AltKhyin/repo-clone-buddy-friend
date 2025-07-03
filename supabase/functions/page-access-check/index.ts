// ABOUTME: Public Edge Function for checking page access control rules without admin authentication

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow GET requests for this public function
    if (req.method !== 'GET') {
      throw new Error('METHOD_NOT_ALLOWED: Only GET requests are allowed');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const pagePath = url.searchParams.get('page_path');

    if (!pagePath) {
      throw new Error('BAD_REQUEST: page_path parameter is required');
    }

    // Query the PageAccessControl table for the specific page
    // This query will work with the public RLS policy
    const { data, error } = await supabase
      .from('PageAccessControl')
      .select('id, page_path, required_access_level, redirect_url, is_active')
      .eq('page_path', pagePath)
      .eq('is_active', true)
      .maybeSingle(); // Use maybeSingle to return null if not found instead of throwing

    if (error) {
      console.error('Database error:', error);
      throw new Error(`DATABASE_ERROR: ${error.message}`);
    }

    // Return the page access control data (or null if not found)
    return new Response(
      JSON.stringify({
        success: true,
        data: data,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Page access check error:', error);

    const errorMessage = error.message || 'Unknown error occurred';
    let statusCode = 500;

    if (errorMessage.includes('METHOD_NOT_ALLOWED:')) {
      statusCode = 405;
    } else if (errorMessage.includes('BAD_REQUEST:')) {
      statusCode = 400;
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage.replace(/^(METHOD_NOT_ALLOWED|BAD_REQUEST|DATABASE_ERROR): /, ''),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    );
  }
});
