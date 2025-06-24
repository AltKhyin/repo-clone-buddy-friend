
// ABOUTME: Edge Function for casting votes on suggestions with rate limiting and proper validation.

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
    const { suggestion_id, action } = await req.json();

    // Validate input
    if (!suggestion_id || typeof suggestion_id !== 'number') {
      return new Response(
        JSON.stringify({ error: { message: 'Invalid suggestion_id', code: 'VALIDATION_FAILED' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!action || !['upvote', 'remove_vote'].includes(action)) {
      return new Response(
        JSON.stringify({ error: { message: 'Invalid action. Must be "upvote" or "remove_vote"', code: 'VALIDATION_FAILED' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${action} for suggestion ${suggestion_id} by user ${user.id}`);

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('Suggestion_Votes')
      .select('*')
      .eq('suggestion_id', suggestion_id)
      .eq('practitioner_id', user.id)
      .single();

    let result;
    if (action === 'upvote') {
      if (existingVote) {
        // User already voted, no change needed
        result = { message: 'Vote already exists', suggestion_id, action: 'no_change' };
      } else {
        // Insert new vote
        const { error: insertError } = await supabase
          .from('Suggestion_Votes')
          .insert({
            suggestion_id,
            practitioner_id: user.id,
            vote_type: 'up'
          });

        if (insertError) {
          console.error('Insert vote error:', insertError);
          return new Response(
            JSON.stringify({ error: { message: 'Failed to cast vote', code: 'DATABASE_ERROR' } }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = { message: 'Vote cast successfully', suggestion_id, action: 'voted' };
      }
    } else { // remove_vote
      if (existingVote) {
        // Remove existing vote
        const { error: deleteError } = await supabase
          .from('Suggestion_Votes')
          .delete()
          .eq('suggestion_id', suggestion_id)
          .eq('practitioner_id', user.id);

        if (deleteError) {
          console.error('Delete vote error:', deleteError);
          return new Response(
            JSON.stringify({ error: { message: 'Failed to remove vote', code: 'DATABASE_ERROR' } }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = { message: 'Vote removed successfully', suggestion_id, action: 'removed' };
      } else {
        // No vote to remove
        result = { message: 'No vote to remove', suggestion_id, action: 'no_change' };
      }
    }

    // Get updated vote count
    const { data: suggestion } = await supabase
      .from('Suggestions')
      .select('upvotes')
      .eq('id', suggestion_id)
      .single();

    return new Response(
      JSON.stringify({
        ...result,
        new_vote_count: suggestion?.upvotes || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Critical error in cast-vote:', error);
    return new Response(
      JSON.stringify({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
