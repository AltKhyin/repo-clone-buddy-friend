// ABOUTME: V2 subscription activation Edge Function for direct payment-to-account linking

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ActivationRequest {
  userId: string;
  paymentData: {
    planId: string;
    amount: number;
    paymentMethod: string;
    transactionId: string;
    paidAt: string;
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
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client for request verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Initialize admin client for subscription updates
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify requesting user (for security - anyone can call this but we log who)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const activationData: ActivationRequest = await req.json()
    
    console.log('⚡ V2 Subscription activation for user:', activationData.userId)
    console.log('⚡ Requested by:', user.id)
    console.log('⚡ Plan data:', activationData.planData)

    // Get current user subscription data
    const { data: currentUser, error: getUserError } = await supabaseAdmin
      .from('Practitioners')
      .select('subscription_ends_at, subscription_tier')
      .eq('id', activationData.userId)
      .single()

    if (getUserError || !currentUser) {
      console.error('❌ User not found:', getUserError)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Calculate new subscription period
    const now = new Date()
    const currentEndDate = currentUser?.subscription_ends_at ? new Date(currentUser.subscription_ends_at) : now
    
    // If current subscription is still active, extend it. Otherwise start fresh.
    const subscriptionStartsAt = currentEndDate > now ? currentEndDate : now
    const subscriptionEndsAt = new Date(subscriptionStartsAt)
    subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + activationData.planData.durationDays)

    console.log('⚡ Subscription period calculation:')
    console.log('- Current end date:', currentUser.subscription_ends_at)
    console.log('- New start date:', subscriptionStartsAt.toISOString())
    console.log('- New end date:', subscriptionEndsAt.toISOString())
    console.log('- Duration days:', activationData.planData.durationDays)

    // Update user: add time + set to premium (or keep premium)
    const { error: updateError } = await supabaseAdmin
      .from('Practitioners')
      .update({
        subscription_tier: 'premium', // Any payment = premium
        subscription_starts_at: subscriptionStartsAt.toISOString(),
        subscription_ends_at: subscriptionEndsAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', activationData.userId)

    if (updateError) {
      console.error('❌ Error updating subscription:', updateError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update subscription',
          details: updateError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Subscription activated successfully for user:', activationData.userId)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription activated successfully',
        data: {
          userId: activationData.userId,
          subscriptionStartsAt: subscriptionStartsAt.toISOString(),
          subscriptionEndsAt: subscriptionEndsAt.toISOString(),
          subscriptionTier: 'premium',
          durationDays: activationData.planData.durationDays,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Error in subscription activation:', error)
    
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