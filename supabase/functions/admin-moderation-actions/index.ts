
// ABOUTME: Moderation actions Edge Function for admin community management following the simplified pattern that works

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
    
    if (!payload.action || !payload.targetType || !payload.targetId) {
      throw new Error('Action, targetType, and targetId are required');
    }

    const validActions = ['pin', 'unpin', 'lock', 'unlock', 'delete', 'feature', 'warn_user'];
    if (!validActions.includes(payload.action)) {
      throw new Error(`Invalid action: ${payload.action}`);
    }

    const validTargetTypes = ['post', 'comment', 'user'];
    if (!validTargetTypes.includes(payload.targetType)) {
      throw new Error(`Invalid targetType: ${payload.targetType}`);
    }

    console.log('Moderation action request:', { 
      action: payload.action, 
      targetType: payload.targetType,
      targetId: payload.targetId,
      userRole 
    });

    let result;

    switch (payload.targetType) {
      case 'post':
      case 'comment':
        result = await moderatePost(supabase, payload, user.id);
        break;
      case 'user':
        result = await moderateUser(supabase, payload, user.id);
        break;
      default:
        throw new Error(`Unsupported target type: ${payload.targetType}`);
    }

    // Log the moderation action
    const { error: logError } = await supabase
      .from('CommunityModerationActions')
      .insert({
        post_id: payload.targetType === 'post' ? parseInt(payload.targetId) : null,
        moderator_id: user.id,
        action_type: payload.action,
        reason: payload.reason,
        metadata: {
          ...payload.metadata,
          target_type: payload.targetType,
          target_id: payload.targetId,
          duration: payload.duration
        }
      });

    if (logError) {
      console.error('Failed to log moderation action:', logError);
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_performed_by: user.id,
      p_action_type: `MODERATE_${payload.action.toUpperCase()}`,
      p_resource_type: payload.targetType === 'post' ? 'CommunityPosts' : 'Practitioners',
      p_resource_id: payload.targetId,
      p_metadata: { 
        source: 'admin_panel',
        moderation_action: payload.action,
        target_type: payload.targetType,
        reason: payload.reason,
        duration: payload.duration
      }
    });

    const response = {
      action: payload.action,
      targetType: payload.targetType,
      targetId: payload.targetId,
      reason: payload.reason,
      moderatorId: user.id,
      result,
      timestamp: new Date().toISOString()
    };

    console.log('Moderation action response:', {
      action: payload.action,
      targetType: payload.targetType,
      success: !!result
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Moderation action error:', error);
    
    const errorMessage = error.message || 'Unknown error occurred';
    const statusCode = errorMessage.includes('authentication') ? 401 :
                      errorMessage.includes('permissions') ? 403 : 500;

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'Moderation action failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
});

// Helper function to moderate posts/comments
async function moderatePost(supabase: any, payload: any, moderatorId: string) {
  const postId = parseInt(payload.targetId);

  switch (payload.action) {
    case 'pin':
      return await supabase.rpc('handle_post_action', {
        p_post_id: postId,
        p_user_id: moderatorId,
        p_action_type: 'pin'
      });

    case 'unpin':
      return await supabase.rpc('handle_post_action', {
        p_post_id: postId,
        p_user_id: moderatorId,
        p_action_type: 'unpin'
      });

    case 'lock':
      return await supabase.rpc('handle_post_action', {
        p_post_id: postId,
        p_user_id: moderatorId,
        p_action_type: 'lock'
      });

    case 'unlock':
      return await supabase.rpc('handle_post_action', {
        p_post_id: postId,
        p_user_id: moderatorId,
        p_action_type: 'unlock'
      });

    case 'delete':
      return await supabase.rpc('handle_post_action', {
        p_post_id: postId,
        p_user_id: moderatorId,
        p_action_type: 'delete'
      });

    default:
      throw new Error(`Unsupported post action: ${payload.action}`);
  }
}

// Helper function to moderate users
async function moderateUser(supabase: any, payload: any, moderatorId: string) {
  const userId = payload.targetId;

  switch (payload.action) {
    case 'warn_user':
      // Create a notification for the user
      const { data, error } = await supabase
        .from('Notifications')
        .insert({
          practitioner_id: userId,
          content: `Moderator warning: ${payload.reason || 'Please review community guidelines'}`,
          link: '/community/guidelines'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to warn user: ${error.message}`);
      }

      return { notificationId: data.id, warned: true };

    default:
      throw new Error(`Unsupported user action: ${payload.action}`);
  }
}
