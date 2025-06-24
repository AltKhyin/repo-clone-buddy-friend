// supabase/functions/cast-suggestion-vote/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Define standard CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define the expected request structure for type safety
interface CastVoteRequest {
  suggestion_id: number;
  action: 'upvote' | 'remove_vote';
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Correctly initialize the Supabase client using the Service Role Key for elevated privileges
    // This allows the function to perform necessary database operations.
    const supabase: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Securely get the user object from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(JSON.stringify({ error: { message: 'Unauthorized' } }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { suggestion_id, action }: CastVoteRequest = await req.json();

    // Validate the incoming payload
    if (!suggestion_id || !['upvote', 'remove_vote'].includes(action)) {
      return new Response(JSON.stringify({ error: { message: 'Invalid request parameters' } }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- Core Voting Logic ---
    if (action === 'upvote') {
      // Use upsert for resilience. It will insert a vote if none exists
      // and do nothing if a vote already exists, preventing errors from double-clicks.
      const { error } = await supabase.from('Suggestion_Votes').upsert({
        suggestion_id: suggestion_id,
        practitioner_id: user.id,
      });
      if (error) throw error;
    } else if (action === 'remove_vote') {
      // Delete the specific vote belonging to the user for the given suggestion.
      const { error } = await supabase.from('Suggestion_Votes').delete()
        .match({ suggestion_id: suggestion_id, practitioner_id: user.id });
      if (error) throw error;
    }

    // --- Authoritative Re-fetch ---
    // After the mutation and the database trigger have run, re-fetch the suggestion
    // to get the true, authoritative upvotes count.
    const { data: updatedSuggestion, error: fetchError } = await supabase
      .from('Suggestions')
      .select('upvotes')
      .eq('id', suggestion_id)
      .single();

    if (fetchError) throw fetchError;

    // --- Construct Final Response ---
    // The response now contains the REAL data from the database.
    const responsePayload = {
      message: 'Vote action processed successfully.',
      suggestion_id: suggestion_id,
      action: action === 'upvote' ? 'voted' : 'removed',
      new_vote_count: updatedSuggestion.upvotes,
      user_has_voted: action === 'upvote',
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`Critical error in cast-suggestion-vote: ${error.message}`);
    return new Response(JSON.stringify({ error: { message: error.message || 'Internal server error' } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});