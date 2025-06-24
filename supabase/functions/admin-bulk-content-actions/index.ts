
// ABOUTME: Bulk content operations Edge Function for admin content management following the simplified pattern that works

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
    
    if (!payload.action || !payload.reviewIds || !Array.isArray(payload.reviewIds)) {
      throw new Error('Action and reviewIds array are required');
    }

    if (payload.reviewIds.length === 0) {
      throw new Error('At least one review ID is required');
    }

    if (payload.reviewIds.length > 50) {
      throw new Error('Maximum 50 reviews can be processed at once');
    }

    console.log('Bulk content action request:', { 
      action: payload.action, 
      count: payload.reviewIds.length,
      userRole 
    });

    // Process bulk operations
    const results = [];
    const errors = [];

    for (const reviewId of payload.reviewIds) {
      try {
        let result;
        
        switch (payload.action) {
          case 'publish':
            result = await publishReview(supabase, reviewId, user.id);
            break;
          case 'unpublish':
            result = await unpublishReview(supabase, reviewId, user.id);
            break;
          case 'delete':
            result = await deleteReview(supabase, reviewId, user.id);
            break;
          case 'archive':
            result = await archiveReview(supabase, reviewId, user.id);
            break;
          default:
            throw new Error(`Invalid action: ${payload.action}`);
        }

        results.push({ reviewId, success: true, result });
      } catch (error) {
        console.error(`Error processing review ${reviewId}:`, error);
        errors.push({ reviewId, error: error.message });
      }
    }

    // Log bulk operation
    await supabase.rpc('log_audit_event', {
      p_performed_by: user.id,
      p_action_type: `BULK_${payload.action.toUpperCase()}`,
      p_resource_type: 'Reviews',
      p_metadata: { 
        source: 'admin_panel',
        review_ids: payload.reviewIds,
        success_count: results.length,
        error_count: errors.length,
        reason: payload.reason
      }
    });

    const response = {
      action: payload.action,
      processed: payload.reviewIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    };

    console.log('Bulk operation response:', {
      action: payload.action,
      processed: response.processed,
      successful: response.successful,
      failed: response.failed
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Bulk content action error:', error);
    
    const errorMessage = error.message || 'Unknown error occurred';
    const statusCode = errorMessage.includes('authentication') ? 401 :
                      errorMessage.includes('permissions') ? 403 : 500;

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'Bulk content operation failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
});

// Helper functions for individual review operations
async function publishReview(supabase: any, reviewId: number, performedBy: string) {
  const { data, error } = await supabase
    .from('Reviews')
    .update({ 
      status: 'published',
      published_at: new Date().toISOString()
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw new Error(`Failed to publish review: ${error.message}`);
  return data;
}

async function unpublishReview(supabase: any, reviewId: number, performedBy: string) {
  const { data, error } = await supabase
    .from('Reviews')
    .update({ 
      status: 'draft',
      published_at: null
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw new Error(`Failed to unpublish review: ${error.message}`);
  return data;
}

async function deleteReview(supabase: any, reviewId: number, performedBy: string) {
  const { data, error } = await supabase
    .from('Reviews')
    .delete()
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw new Error(`Failed to delete review: ${error.message}`);
  return data;
}

async function archiveReview(supabase: any, reviewId: number, performedBy: string) {
  const { data, error } = await supabase
    .from('Reviews')
    .update({ status: 'archived' })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw new Error(`Failed to archive review: ${error.message}`);
  return data;
}
