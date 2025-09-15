// ABOUTME: V2 user lookup Edge Function with admin access for payment processing

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Result of user lookup by email
 */
interface UserLookupResult {
  exists: boolean;
  userId?: string;
  isLoggedIn: boolean;
  practitionerData?: {
    id: string;
    email: string;
    full_name: string;
    subscription_tier: string;
    subscription_ends_at: string | null;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize admin client for user lookup (always use service role for payment processing)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Check if this is an authenticated request
    const authHeader = req.headers.get('Authorization')
    let currentUser = null

    if (authHeader) {
      // Initialize Supabase client for user verification
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      )

      // Try to get current user (but don't fail if unauthorized)
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      if (!userError && user) {
        currentUser = user
        console.log('🔍 V2 User lookup - authenticated request by user:', user.id)
      } else {
        console.log('🔍 V2 User lookup - unauthenticated request (payment processing)')
      }
    } else {
      console.log('🔍 V2 User lookup - no auth header (payment processing)')
    }

    // Parse request body
    const { email } = await req.json()
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    console.log('🔍 V2 User lookup for email:', normalizedEmail)
    console.log('🔍 Requested by user:', currentUser?.id || 'unauthenticated')

    // Check if the email matches the current logged-in user (if any)
    const isCurrentUserEmail = currentUser?.email === normalizedEmail

    if (isCurrentUserEmail && currentUser) {
      // Get practitioner data for current user
      const { data: practitioner, error: practitionerError } = await supabaseAdmin
        .from('Practitioners')
        .select('id, full_name, subscription_tier, subscription_ends_at')
        .eq('id', currentUser.id)
        .single()

      if (practitionerError) {
        console.error('❌ Error fetching current user practitioner data:', practitionerError)
        // User exists in auth but not in Practitioners table
        return new Response(
          JSON.stringify({
            exists: true,
            userId: currentUser.id,
            isLoggedIn: true,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({
          exists: true,
          userId: currentUser.id,
          isLoggedIn: true,
          practitionerData: {
            id: practitioner.id,
            email: normalizedEmail,
            full_name: practitioner.full_name || '',
            subscription_tier: practitioner.subscription_tier,
            subscription_ends_at: practitioner.subscription_ends_at,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Use admin client to check if email exists in auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error checking auth users:', authError)
      return new Response(
        JSON.stringify({
          exists: false,
          isLoggedIn: false,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Find user by email
    const existingUser = authUsers.users.find(u => u.email === normalizedEmail)
    
    if (!existingUser) {
      console.log('👤 V2: Email not found in auth users, treating as new user')
      return new Response(
        JSON.stringify({
          exists: false,
          isLoggedIn: false,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // User exists in auth, get their practitioner data
    const { data: practitioner, error: practitionerError } = await supabaseAdmin
      .from('Practitioners')
      .select('id, full_name, subscription_tier, subscription_ends_at')
      .eq('id', existingUser.id)
      .single()
    
    if (practitionerError) {
      console.log('👤 V2: User exists in auth but not in Practitioners table')
      return new Response(
        JSON.stringify({
          exists: true,
          userId: existingUser.id,
          isLoggedIn: currentUser?.id === existingUser.id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('👤 V2: Found existing user with practitioner data')
    return new Response(
      JSON.stringify({
        exists: true,
        userId: existingUser.id,
        isLoggedIn: currentUser?.id === existingUser.id,
        practitionerData: {
          id: practitioner.id,
          email: normalizedEmail,
          full_name: practitioner.full_name || '',
          subscription_tier: practitioner.subscription_tier,
          subscription_ends_at: practitioner.subscription_ends_at,
        },
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Error in user lookup:', error)
    
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