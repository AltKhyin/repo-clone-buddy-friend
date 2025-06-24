
// ABOUTME: User management Edge Function using simplified pattern proven to work in production

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
    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Check if user has admin role (user management requires admin)
    const userRole = user.app_metadata?.role;
    if (!userRole || userRole !== 'admin') {
      throw new Error('Insufficient permissions: Admin role required');
    }

    if (req.method === 'GET') {
      // Handle GET request - fetch users list
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const search = url.searchParams.get('search') || '';
      const role = url.searchParams.get('role') || '';

      console.log('Fetching users:', { page, limit, search, role });

      // Build query - removed email column as it doesn't exist in Practitioners table
      let query = supabase
        .from('Practitioners')
        .select(`
          id,
          full_name,
          avatar_url,
          role,
          subscription_tier,
          profession_flair,
          display_hover_card,
          contribution_score,
          created_at
        `);

      // Apply filters
      if (search) {
        query = query.or(`full_name.ilike.%${search}%`);
      }

      if (role && role !== 'all') {
        query = query.eq('role', role);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: users, error: usersError } = await query;

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw new Error(`Database error: ${usersError.message}`);
      }

      // Get total count
      let countQuery = supabase
        .from('Practitioners')
        .select('id', { count: 'exact', head: true });

      if (search) {
        countQuery = countQuery.or(`full_name.ilike.%${search}%`);
      }

      if (role && role !== 'all') {
        countQuery = countQuery.eq('role', role);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error('Error getting user count:', countError);
        throw new Error(`Count error: ${countError.message}`);
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      const response = {
        users: users || [],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (req.method === 'POST') {
      // Handle POST request - update user role/subscription
      const body = await req.json();
      const { userId, role: newRole, subscriptionTier } = body;

      if (!userId) {
        throw new Error('User ID is required');
      }

      console.log('Updating user:', { userId, newRole, subscriptionTier });

      // Update user in Practitioners table
      const updateData: any = {};
      if (newRole) updateData.role = newRole;
      if (subscriptionTier) updateData.subscription_tier = subscriptionTier;

      const { data: updatedUser, error: updateError } = await supabase
        .from('Practitioners')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        throw new Error(`Update error: ${updateError.message}`);
      }

      // If role was updated, also update auth.users metadata
      if (newRole) {
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
          userId,
          {
            app_metadata: {
              role: newRole,
              subscription_tier: subscriptionTier || updatedUser.subscription_tier,
            },
          }
        );

        if (authUpdateError) {
          console.error('Error updating auth metadata:', authUpdateError);
          // Don't throw here, as the main update succeeded
        }
      }

      return new Response(JSON.stringify({
        success: true,
        user: updatedUser,
        message: 'User updated successfully',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      throw new Error('Method not allowed');
    }

  } catch (error) {
    console.error('User management error:', error);
    
    const errorMessage = error.message || 'Unknown error occurred';
    const statusCode = errorMessage.includes('authentication') ? 401 :
                      errorMessage.includes('permissions') ? 403 :
                      errorMessage.includes('Method not allowed') ? 405 : 500;

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'User management operation failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
});
