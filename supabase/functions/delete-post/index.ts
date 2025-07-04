// ABOUTME: Delete post Edge Function - allows users to delete their own posts and admins to delete any post

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

    const { postId, reason } = await req.json();

    if (!postId) {
      return new Response(JSON.stringify({ error: 'Missing postId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Get post and user data
    const { data: post, error: postError } = await supabase
      .from('CommunityPosts')
      .select('*, author_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { data: userProfile } = await supabase
      .from('Practitioners')
      .select('role')
      .eq('id', user.id)
      .single();

    // Check permissions: user is author OR user is admin/editor
    const isAuthor = post.author_id === user.id;
    const canModerate = userProfile?.role === 'admin' || userProfile?.role === 'editor';
    
    if (!isAuthor && !canModerate) {
      return new Response(JSON.stringify({ error: 'You can only delete your own posts' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Delete the post
    const { error: deleteError } = await supabase
      .from('CommunityPosts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return new Response(JSON.stringify({ error: 'Failed to delete post' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Log moderation action if admin deleted someone else's post
    if (!isAuthor && canModerate) {
      await supabase
        .from('CommunityModerationActions')
        .insert({
          post_id: postId,
          moderator_id: user.id,
          action_type: 'delete',
          reason: reason || 'Admin deletion',
          metadata: { deleted_post: post }
        });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Post deleted successfully',
      postId 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Delete post error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});