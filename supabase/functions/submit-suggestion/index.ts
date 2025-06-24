
// ABOUTME: Edge Function for submitting new suggestions with rate limiting and validation.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS Headers - MANDATORY FOR ALL EDGE FUNCTIONS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: { message: 'Authorization required', code: 'UNAUTHORIZED' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: { message: 'Invalid authentication', code: 'UNAUTHORIZED' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { title, description } = await req.json();

    // Validate input
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: { message: 'Title is required', code: 'VALIDATION_FAILED' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (title.trim().length > 200) {
      return new Response(
        JSON.stringify({ error: { message: 'Title must be 200 characters or less', code: 'VALIDATION_FAILED' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (description && typeof description === 'string' && description.trim().length > 500) {
      return new Response(
        JSON.stringify({ error: { message: 'Description must be 500 characters or less', code: 'VALIDATION_FAILED' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Submitting suggestion "${title}" by user ${user.id}`);

    // Insert new suggestion
    const { data: newSuggestion, error: insertError } = await supabase
      .from('Suggestions')
      .insert({
        title: title.trim(),
        description: description ? description.trim() : null,
        practitioner_id: user.id,
        status: 'pending',
        upvotes: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert suggestion error:', insertError);
      return new Response(
        JSON.stringify({ error: { message: 'Failed to submit suggestion', code: 'DATABASE_ERROR' } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Suggestion submitted successfully',
        suggestion: newSuggestion
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Critical error in submit-suggestion:', error);
    return new Response(
      JSON.stringify({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
