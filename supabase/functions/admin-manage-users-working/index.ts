// ABOUTME: Working admin endpoint with simplified architecture

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  // Extract origin for CORS handling
  const origin = req.headers.get('Origin');

  try {
    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // Simple auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // Get user from auth token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const payload = await req.json();
    const { action, filters, userId, adjustmentDays } = payload;

    // Handle list action (main functionality)
    if (action === 'list') {
      // List users with comprehensive data
      let query = supabaseAdmin.from('Practitioners').select(
        `
          id, 
          full_name, 
          role, 
          subscription_tier, 
          created_at, 
          avatar_url,
          profession,
          display_hover_card,
          contribution_score,
          subscription_start_date,
          subscription_end_date,
          subscription_created_by,
          admin_subscription_notes,
          subscription_days_granted,
          facebook_url,
          instagram_url,
          linkedin_url,
          twitter_url,
          youtube_url,
          website_url
        `,
        { count: 'exact' }
      );

      if (filters?.role) {
        query = query.eq('role', filters.role);
      }
      if (filters?.subscription_tier) {
        query = query.eq('subscription_tier', filters.subscription_tier);
      }
      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%`);
      }

      const page = (filters?.page || 1) - 1;
      const limit = Math.min(filters?.limit || 20, 100);
      query = query.range(page * limit, (page + 1) * limit - 1);

      const { data: users, error: listError, count } = await query;
      if (listError) {
        return new Response(JSON.stringify({ error: `Failed to list users: ${listError.message}` }), {
          status: 500,
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // Get emails and JWT claims from auth.users
      const userIds = (users || []).map(user => user.id);
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const emailMap = new Map(authUsers.users?.map(u => [u.id, u.email]) || []);
      const jwtClaimsMap = new Map(authUsers.users?.map(u => [u.id, {
        role: u.raw_app_meta_data?.role,
        subscription_tier: u.raw_app_meta_data?.subscription_tier
      }]) || []);

      // Get activity metrics
      const { data: activityMetrics } = await supabaseAdmin.rpc('get_user_activity_metrics', {
        user_ids: userIds
      });

      const metricsMap = new Map();
      activityMetrics?.forEach(metric => {
        metricsMap.set(metric.user_id, metric);
      });

      // Normalize user data
      const normalizedUsers = (users || []).map(user => {
        const userMetrics = metricsMap.get(user.id) || {};
        const jwtClaims = jwtClaimsMap.get(user.id) || {};
        
        return {
          id: user.id,
          full_name: user.full_name || 'Nome não informado',
          email: emailMap.get(user.id) || 'Email não encontrado',
          role: user.role || 'practitioner',
          subscription_tier: user.subscription_tier || 'free',
          created_at: user.created_at,
          avatar_url: user.avatar_url,
          profession: user.profession,
          display_hover_card: user.display_hover_card || false,
          contribution_score: user.contribution_score || 0,
          
          // Subscription timing fields
          subscription_start_date: user.subscription_start_date,
          subscription_end_date: user.subscription_end_date,
          subscription_created_by: user.subscription_created_by,
          admin_subscription_notes: user.admin_subscription_notes,
          subscription_days_granted: user.subscription_days_granted,
          
          // Social media links
          socialMediaLinks: {
            facebook_url: user.facebook_url,
            instagram_url: user.instagram_url,
            linkedin_url: user.linkedin_url,
            twitter_url: user.twitter_url,
            youtube_url: user.youtube_url,
            website_url: user.website_url,
          },
          
          // Activity metrics
          activityMetrics: {
            postsCount: userMetrics.posts_count || 0,
            commentsCount: userMetrics.comments_count || 0,
            votesGiven: userMetrics.votes_given || 0,
            reviewsAuthored: userMetrics.reviews_count || 0,
            lastLoginAt: userMetrics.last_login_at,
          },
          
          // JWT Claims
          jwtClaims: {
            role: jwtClaims.role,
            subscription_tier: jwtClaims.subscription_tier,
            syncStatus: {
              roleMatch: jwtClaims.role === user.role,
              tierMatch: jwtClaims.subscription_tier === user.subscription_tier,
            }
          }
        };
      });

      const result = {
        users: normalizedUsers,
        pagination: {
          page: page + 1,
          limit,
          total: count || 0,
          hasMore: (normalizedUsers?.length || 0) === limit,
        },
      };

      return new Response(JSON.stringify(result), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // Handle subscription time adjustment
    if (action === 'adjust_subscription_time') {
      if (!userId || !adjustmentDays) {
        return new Response(JSON.stringify({ error: 'userId and adjustmentDays are required' }), {
          status: 400,
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // Get current user subscription data
      const { data: currentUser, error: getUserError } = await supabaseAdmin
        .from('Practitioners')
        .select('subscription_end_date, subscription_tier')
        .eq('id', userId)
        .single();

      if (getUserError || !currentUser) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // Calculate new end date
      let newEndDate: string;
      const days = parseInt(adjustmentDays);
      
      if (currentUser.subscription_end_date) {
        // Adjust existing date
        const currentEndDate = new Date(currentUser.subscription_end_date);
        currentEndDate.setDate(currentEndDate.getDate() + days);
        newEndDate = currentEndDate.toISOString();
      } else {
        // Create new end date from today + days
        const today = new Date();
        today.setDate(today.getDate() + days);
        newEndDate = today.toISOString();
      }

      // Update subscription timing
      const updateData: any = {
        subscription_end_date: newEndDate,
        subscription_created_by: 'admin',
        admin_subscription_notes: `Adjusted by admin: ${days > 0 ? '+' : ''}${days} days on ${new Date().toLocaleDateString('pt-BR')}`,
      };

      // If user is free tier and we're adding time, upgrade to premium
      if (currentUser.subscription_tier === 'free' && days > 0) {
        updateData.subscription_tier = 'premium';
        updateData.subscription_start_date = new Date().toISOString();
      }

      const { error: updateError } = await supabaseAdmin
        .from('Practitioners')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        return new Response(JSON.stringify({ error: `Failed to adjust subscription time: ${updateError.message}` }), {
          status: 500,
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Subscription time adjusted by ${days} days`,
        newEndDate 
      }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // Handle role promotion/demotion
    if (action === 'promote' || action === 'demote') {
      const { targetUserId, newRole, subscriptionTier } = payload;

      if (!targetUserId || !newRole) {
        return new Response(JSON.stringify({ error: 'targetUserId and newRole are required' }), {
          status: 400,
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // Get current user data
      const { data: currentUser, error: getUserError } = await supabaseAdmin
        .from('Practitioners')
        .select('role, subscription_tier')
        .eq('id', targetUserId)
        .single();

      if (getUserError || !currentUser) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // Prepare update data
      const updateData: any = {
        role: newRole,
      };

      // Update subscription tier if provided
      if (subscriptionTier) {
        updateData.subscription_tier = subscriptionTier;
      }

      // Update user role and subscription tier in Practitioners table
      const { error: updateError } = await supabaseAdmin
        .from('Practitioners')
        .update(updateData)
        .eq('id', targetUserId);

      if (updateError) {
        return new Response(JSON.stringify({ error: `Failed to update user: ${updateError.message}` }), {
          status: 500,
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // Update JWT claims in auth.users metadata
      try {
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          user_metadata: {
            role: newRole,
            subscription_tier: subscriptionTier || currentUser.subscription_tier,
          }
        });

        if (authUpdateError) {
          console.warn('Failed to update auth metadata:', authUpdateError.message);
          // Don't fail the request, just log the warning
        }
      } catch (authError) {
        console.warn('Auth metadata update failed:', authError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: `User ${action}d successfully`,
        updatedUser: {
          id: targetUserId,
          role: newRole,
          subscription_tier: subscriptionTier || currentUser.subscription_tier
        }
      }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // Default response for other actions (can be extended)
    return new Response(JSON.stringify({ error: `Action ${action} not implemented yet` }), {
      status: 400,
      headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Admin user management error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});