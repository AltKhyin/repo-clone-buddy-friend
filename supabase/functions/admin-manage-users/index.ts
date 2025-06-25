// ABOUTME: Admin endpoint for comprehensive user management operations with role updates and JWT claim synchronization.

import { handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getUserFromRequest } from '../_shared/auth.ts';
import { sendSuccess, sendError } from '../_shared/api-helpers.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface UserManagementPayload {
  action: 'promote' | 'demote' | 'ban' | 'unban' | 'delete' | 'list' | 'update_profile' | 'get';
  targetUserId?: string;
  newRole?: 'admin' | 'moderator' | 'practitioner';
  subscriptionTier?: 'free' | 'premium' | 'pro';
  reason?: string;
  profileData?: {
    full_name?: string;
    bio?: string;
    avatar_url?: string;
  };
  filters?: {
    role?: string;
    subscription_tier?: string;
    banned?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // Authenticate and verify admin privileges
    const { user, error: authError } = await getUserFromRequest(req);
    if (authError || !user) {
      return sendError('Authentication required', 401);
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // Check if user is admin
    const { data: adminCheck } = await supabaseAdmin
      .from('Practitioners')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminCheck?.role !== 'admin') {
      return sendError('Admin privileges required', 403);
    }

    // Parse request body
    const payload: UserManagementPayload = await req.json();
    const { action, targetUserId, newRole, subscriptionTier, reason, profileData, filters } = payload;

    let result;

    switch (action) {
      case 'list':
        // List users with filters
        let query = supabaseAdmin
          .from('Practitioners')
          .select(`
            id, 
            full_name, 
            email, 
            role, 
            subscription_tier, 
            banned, 
            created_at, 
            avatar_url,
            profession_flair,
            display_hover_card,
            contribution_score
          `, { count: 'exact' });

        if (filters?.role) {
          query = query.eq('role', filters.role);
        }
        if (filters?.subscription_tier) {
          query = query.eq('subscription_tier', filters.subscription_tier);
        }
        if (filters?.banned !== undefined) {
          query = query.eq('banned', filters.banned);
        }
        if (filters?.search) {
          query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }

        const page = (filters?.page || 1) - 1; // Convert to 0-based indexing
        const limit = Math.min(filters?.limit || 20, 100); // Cap at 100
        query = query.range(page * limit, (page + 1) * limit - 1);

        const { data: users, error: listError, count } = await query;
        if (listError) throw new Error(`Failed to list users: ${listError.message}`);

        // Normalize user data to ensure all required fields are present
        const normalizedUsers = (users || []).map(user => ({
          id: user.id,
          full_name: user.full_name || 'Nome não informado',
          email: user.email,
          role: user.role || 'practitioner',
          subscription_tier: user.subscription_tier || 'free',
          banned: user.banned || false,
          created_at: user.created_at,
          avatar_url: user.avatar_url,
          profession_flair: user.profession_flair,
          display_hover_card: user.display_hover_card || false,
          contribution_score: user.contribution_score || 0
        }));

        result = {
          users: normalizedUsers,
          pagination: {
            page: page + 1, // Convert back to 1-based for frontend
            limit,
            total: count || 0,
            hasMore: (normalizedUsers?.length || 0) === limit
          }
        };
        break;

      case 'get':
        // Get single user details
        if (!targetUserId) {
          return sendError('Target user ID required', 400);
        }

        const { data: singleUser, error: getUserError } = await supabaseAdmin
          .from('Practitioners')
          .select('id, full_name, email, role, subscription_tier, banned, created_at, avatar_url, contribution_score')
          .eq('id', targetUserId)
          .single();

        if (getUserError) {
          throw new Error(`Failed to fetch user: ${getUserError.message}`);
        }

        result = singleUser;
        break;

      case 'promote':
      case 'demote':
        if (!targetUserId || !newRole) {
          return sendError('Target user ID and new role required', 400);
        }

        // Update role in database
        const { error: roleError } = await supabaseAdmin
          .from('Practitioners')
          .update({ 
            role: newRole,
            subscription_tier: subscriptionTier || 'free'
          })
          .eq('id', targetUserId);

        if (roleError) throw new Error(`Failed to update role: ${roleError.message}`);

        // Update JWT claims
        const { error: claimsError } = await supabaseAdmin.auth.admin.updateUserById(
          targetUserId,
          {
            app_metadata: {
              role: newRole,
              subscription_tier: subscriptionTier || 'free'
            }
          }
        );

        if (claimsError) {
          console.warn('Failed to update JWT claims:', claimsError);
        }

        result = { 
          success: true, 
          message: `User ${action}d to ${newRole}`,
          updatedUserId: targetUserId,
          newRole,
          subscriptionTier: subscriptionTier || 'free'
        };
        break;

      case 'ban':
      case 'unban':
        if (!targetUserId) {
          return sendError('Target user ID required', 400);
        }

        const banned = action === 'ban';
        const { error: banError } = await supabaseAdmin
          .from('Practitioners')
          .update({ banned })
          .eq('id', targetUserId);

        if (banError) throw new Error(`Failed to ${action} user: ${banError.message}`);

        // Log moderation action
        if (reason) {
          await supabaseAdmin
            .from('ModerationLogs')
            .insert({
              moderator_id: user.id,
              target_user_id: targetUserId,
              action: action,
              reason: reason,
              created_at: new Date().toISOString()
            });
        }

        result = { 
          success: true, 
          message: `User ${action}ned successfully`,
          targetUserId,
          banned
        };
        break;

      case 'update_profile':
        if (!targetUserId || !profileData) {
          return sendError('Target user ID and profile data required', 400);
        }

        const { error: profileError } = await supabaseAdmin
          .from('Practitioners')
          .update(profileData)
          .eq('id', targetUserId);

        if (profileError) throw new Error(`Failed to update profile: ${profileError.message}`);

        result = { 
          success: true, 
          message: 'Profile updated successfully',
          targetUserId,
          updatedFields: Object.keys(profileData)
        };
        break;

      case 'delete':
        if (!targetUserId) {
          return sendError('Target user ID required', 400);
        }

        // This is a dangerous operation - require explicit confirmation
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
        if (deleteError) throw new Error(`Failed to delete user: ${deleteError.message}`);

        result = { 
          success: true, 
          message: 'User deleted successfully',
          deletedUserId: targetUserId
        };
        break;

      default:
        return sendError(`Invalid action: ${action}`, 400);
    }

    return sendSuccess(result);

  } catch (error) {
    console.error('Admin user management error:', error);
    return sendError(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});