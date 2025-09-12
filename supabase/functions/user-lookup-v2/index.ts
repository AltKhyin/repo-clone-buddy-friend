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

    // Initialize admin client for user lookup
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify requesting user
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
    console.log('🔍 Requested by user:', user.id)

    // Check if the email matches the current logged-in user
    const isCurrentUserEmail = user.email === normalizedEmail
    
    if (isCurrentUserEmail) {
      // Get practitioner data for current user
      const { data: practitioner, error: practitionerError } = await supabaseAdmin
        .from('Practitioners')
        .select('id, full_name, subscription_tier, subscription_ends_at')
        .eq('id', user.id)
        .single()
      
      if (practitionerError) {
        console.error('❌ Error fetching current user practitioner data:', practitionerError)
        // User exists in auth but not in Practitioners table
        return new Response(
          JSON.stringify({
            exists: true,
            userId: user.id,
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
          userId: user.id,
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
          isLoggedIn: false, // Not the current logged-in user
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
        isLoggedIn: false, // Not the current logged-in user
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