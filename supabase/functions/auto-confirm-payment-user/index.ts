// ABOUTME: Edge Function to auto-confirm payment users, bypassing email confirmation flow

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoConfirmRequest {
  userId: string;
  email: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { userId, email }: AutoConfirmRequest = await req.json();

    console.log('Auto-confirming payment user:', { userId, email });

    // Auto-confirm the user's email
    const { data: updateResult, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email_confirmed_at: new Date().toISOString() }
    );

    if (updateError) {
      console.error('Failed to auto-confirm user:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to confirm email: ${updateError.message}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Payment user auto-confirmed successfully:', email);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment user email auto-confirmed successfully',
        userId,
        email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in auto-confirm-payment-user:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});