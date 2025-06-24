
// ABOUTME: Publication management Edge Function for admin content workflow following the simplified pattern that works

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Set the auth header for this request
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Check if user has admin or editor role
    const userRole = user.app_metadata?.role;
    if (!userRole || !['admin', 'editor'].includes(userRole)) {
      throw new Error('Insufficient permissions: Admin or editor role required');
    }

    // Parse request body
    const payload = await req.json();
    
    if (!payload.action || !payload.reviewId) {
      throw new Error('Action and reviewId are required');
    }

    if (payload.action === 'schedule' && !payload.scheduledDate) {
      throw new Error('Scheduled date is required for schedule action');
    }

    console.log('Publication management request:', { 
      action: payload.action, 
      reviewId: payload.reviewId,
      userRole 
    });

    // First, verify the review exists and get current state
    const { data: currentReview, error: fetchError } = await supabase
      .from('Reviews')
      .select('*')
      .eq('id', payload.reviewId)
      .single();

    if (fetchError || !currentReview) {
      throw new Error(`Review not found: ${payload.reviewId}`);
    }

    let updateData: any = {};
    let historyAction = '';

    switch (payload.action) {
      case 'publish':
        updateData = {
          status: 'published',
          published_at: new Date().toISOString(),
          reviewer_id: user.id,
          reviewed_at: new Date().toISOString(),
          review_status: 'approved'
        };
        historyAction = 'published';
        break;

      case 'schedule':
        updateData = {
          status: 'scheduled',
          scheduled_publish_at: payload.scheduledDate,
          reviewer_id: user.id,
          reviewed_at: new Date().toISOString(),
          review_status: 'approved'
        };
        historyAction = 'scheduled';
        break;

      case 'reject':
        updateData = {
          review_status: 'rejected',
          reviewer_id: user.id,
          reviewed_at: new Date().toISOString(),
          publication_notes: payload.notes
        };
        historyAction = 'rejected';
        break;

      case 'request_changes':
        updateData = {
          review_status: 'changes_requested',
          reviewer_id: user.id,
          reviewed_at: new Date().toISOString(),
          publication_notes: payload.notes
        };
        historyAction = 'changes_requested';
        break;

      default:
        throw new Error(`Invalid action: ${payload.action}`);
    }

    // Update the review
    const { data: updatedReview, error: updateError } = await supabase
      .from('Reviews')
      .update(updateData)
      .eq('id', payload.reviewId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update review: ${updateError.message}`);
    }

    // Log the action in publication history
    const { error: historyError } = await supabase
      .from('Publication_History')
      .insert({
        review_id: payload.reviewId,
        action: historyAction,
        performed_by: user.id,
        notes: payload.notes,
        metadata: {
          ...payload.metadata,
          scheduled_date: payload.scheduledDate,
          previous_status: currentReview.status,
          previous_review_status: currentReview.review_status
        }
      });

    if (historyError) {
      console.error('Failed to log publication history:', historyError);
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_performed_by: user.id,
      p_action_type: payload.action.toUpperCase(),
      p_resource_type: 'Reviews',
      p_resource_id: payload.reviewId.toString(),
      p_old_values: currentReview,
      p_new_values: updatedReview,
      p_metadata: { 
        source: 'admin_panel',
        action: payload.action,
        notes: payload.notes
      }
    });

    const result = {
      reviewId: payload.reviewId,
      action: payload.action,
      previousStatus: currentReview.status,
      newStatus: updatedReview.status,
      scheduledDate: payload.scheduledDate,
      notes: payload.notes,
      updatedAt: new Date().toISOString()
    };

    console.log('Publication management response:', {
      reviewId: result.reviewId,
      action: result.action,
      statusChange: `${result.previousStatus} -> ${result.newStatus}`
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Publication management error:', error);
    
    const errorMessage = error.message || 'Unknown error occurred';
    const statusCode = errorMessage.includes('authentication') ? 401 :
                      errorMessage.includes('permissions') ? 403 : 500;

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'Publication management operation failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
});
