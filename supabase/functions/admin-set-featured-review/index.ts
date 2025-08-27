// ABOUTME: Admin-only Edge Function for setting the homepage featured review

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

// Inline CORS headers for security
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper functions for standardized responses
const sendError = (message: string, status: number = 400) => {
  return new Response(
    JSON.stringify({ error: { message, code: 'ADMIN_ERROR' } }),
    {
      status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    }
  );
};

const sendSuccess = (data: any) => {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    }
  );
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return sendError('Method not allowed', 405);
    }

    const supabase: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify JWT and extract user
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      return sendError('Authorization header required', 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      return sendError('Invalid authentication', 401);
    }

    // Verify admin permissions
    const { data: practitioner, error: practitionerError } = await supabase
      .from('Practitioners')
      .select('role')
      .eq('id', user.id)
      .single();

    if (practitionerError || !practitioner || practitioner.role !== 'admin') {
      return sendError('Admin access required', 403);
    }

    // Parse request body
    const { reviewId } = await req.json();

    // Validate reviewId
    if (!reviewId || typeof reviewId !== 'number') {
      return sendError('Valid reviewId is required');
    }

    // Verify the review exists and is published
    const { data: review, error: reviewError } = await supabase
      .from('Reviews')
      .select('id, title, status')
      .eq('id', reviewId)
      .eq('status', 'published')
      .single();

    if (reviewError || !review) {
      return sendError('Review not found or not published');
    }

    // Update SiteSettings with the new featured review ID
    const { error: updateError } = await supabase
      .from('SiteSettings')
      .update({ value: reviewId })
      .eq('key', 'featured_review_id');

    if (updateError) {
      console.error('Failed to update featured review setting:', updateError);
      return sendError('Failed to set featured review', 500);
    }

    // Log the action for audit purposes
    console.log(`Admin ${user.id} set review ${reviewId} (${review.title}) as featured`);

    return sendSuccess({
      message: 'Featured review updated successfully',
      reviewId,
      reviewTitle: review.title,
    });

  } catch (error) {
    console.error('Critical error in admin-set-featured-review:', error);
    return sendError('Internal server error', 500);
  }
});