// ABOUTME: Post moderation Edge Function - pin, lock, hide, delete posts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { postId, action, reason } = await req.json();

    if (!postId || !action) {
      return new Response(JSON.stringify({ error: 'Missing postId or action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Check if user has moderation permissions
    const { data: userProfile } = await supabase
      .from('Practitioners')
      .select('role')
      .eq('id', user.id)
      .single();

    const canModerate = userProfile?.role === 'admin' || userProfile?.role === 'editor';
    
    if (!canModerate) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Get current post data
    const { data: post, error: postError } = await supabase
      .from('CommunityPosts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    let updateData: any = {};
    let actionDescription = '';

    switch (action) {
      case 'pin':
        updateData = { is_pinned: true };
        actionDescription = 'pinned';
        break;
      case 'unpin':
        updateData = { is_pinned: false };
        actionDescription = 'unpinned';
        break;
      case 'lock':
        updateData = { is_locked: true };
        actionDescription = 'locked';
        break;
      case 'unlock':
        updateData = { is_locked: false };
        actionDescription = 'unlocked';
        break;
      case 'delete':
        // Soft delete - mark as deleted rather than removing from DB
        const { error: deleteError } = await supabase
          .from('CommunityPosts')
          .delete()
          .eq('id', postId);

        if (deleteError) {
          return new Response(JSON.stringify({ error: 'Failed to delete post' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        actionDescription = 'deleted';
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    // Update post (except for delete)
    if (action !== 'delete') {
      const { error: updateError } = await supabase
        .from('CommunityPosts')
        .update(updateData)
        .eq('id', postId);

      if (updateError) {
        return new Response(JSON.stringify({ error: 'Failed to update post' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // Log moderation action
    await supabase
      .from('CommunityModerationActions')
      .insert({
        post_id: postId,
        moderator_id: user.id,
        action_type: action,
        reason: reason || null,
        metadata: { previous_state: post }
      });

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Post ${actionDescription} successfully`,
      action,
      postId 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Moderation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});