
// ABOUTME: Admin endpoint for comprehensive user management with role assignments and data updates

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import {
  createSuccessResponse,
  createErrorResponse,
  authenticateUser,
  handleCorsPreflightRequest,
  RateLimitError
} from '../_shared/api-helpers.ts';
import { checkAdminRateLimit, rateLimitHeaders } from '../_shared/rate-limit.ts';

Deno.serve(async (req) => {
  // STEP 1: CORS Preflight Handling
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // STEP 2: Authentication & Authorization
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const user = await authenticateUser(supabase, req.headers.get('Authorization'));

    // Verify admin privileges
    const { data: practitioner, error: practitionerError } = await supabase
      .from('Practitioners')
      .select('role')
      .eq('id', user.id)
      .single();

    if (practitionerError || !practitioner || practitioner.role !== 'admin') {
      throw new Error('FORBIDDEN: Admin access required');
    }

    // STEP 3: Rate Limiting
    const rateLimitResult = await checkAdminRateLimit(req);
    if (!rateLimitResult.success) {
      throw RateLimitError;
    }

    console.log(`Admin user management request from: ${user.id}, method: ${req.method}`);

    if (req.method === 'GET') {
      // STEP 4: Input Validation (GET - query parameters)
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
      const search = url.searchParams.get('search') || '';
      const roleFilter = url.searchParams.get('role') || '';

      // STEP 5: Core Business Logic - Fetch Users
      let query = supabase
        .from('Practitioners')
        .select('id, full_name, avatar_url, role, subscription_tier, contribution_score, created_at', { count: 'exact' });

      if (search) {
        query = query.ilike('full_name', `%${search}%`);
      }
      if (roleFilter) {
        query = query.eq('role', roleFilter);
      }

      const { data: users, error: usersError, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }

      const result = {
        users: users || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };

      // STEP 6: Standardized Success Response
      return createSuccessResponse(result, rateLimitHeaders(rateLimitResult));

    } else if (req.method === 'POST') {
      // STEP 4: Input Validation (POST - body data)
      const { userId, role, subscriptionTier } = await req.json();
      
      if (!userId || typeof userId !== 'string') {
        throw new Error('VALIDATION_FAILED: userId is required and must be a string');
      }

      const updateData: any = {};
      if (role) {
        if (!['practitioner', 'editor', 'admin'].includes(role)) {
          throw new Error('VALIDATION_FAILED: role must be practitioner, editor, or admin');
        }
        updateData.role = role;
      }
      if (subscriptionTier) {
        if (!['free', 'premium'].includes(subscriptionTier)) {
          throw new Error('VALIDATION_FAILED: subscriptionTier must be free or premium');
        }
        updateData.subscription_tier = subscriptionTier;
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error('VALIDATION_FAILED: At least one field (role or subscriptionTier) must be provided');
      }

      // STEP 5: Core Business Logic - Update User (Hardened)
      const { data: updatedUsers, error: updateError } = await supabase
        .from('Practitioners')
        .update(updateData)
        .eq('id', userId)
        .select(); // Use .select() without .single() to avoid crashes

      if (updateError) {
        console.error('Error updating user:', updateError);
        throw new Error(`Update error: ${updateError.message}`);
      }

      // Check if the user was actually found and updated
      if (!updatedUsers || updatedUsers.length === 0) {
        throw new Error(`User not found with ID: ${userId}`);
      }

      const updatedUser = updatedUsers[0];

      // If role was updated, also update auth.users metadata
      if (role) {
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
          userId,
          {
            app_metadata: { role: role }
          }
        );

        if (authUpdateError) {
          console.error('Error updating auth metadata:', authUpdateError);
          // Don't fail the entire operation, but log the issue
        }
      }

      const result = {
        message: 'User updated successfully',
        user: updatedUser
      };

      // STEP 6: Standardized Success Response
      return createSuccessResponse(result, rateLimitHeaders(rateLimitResult));

    } else {
      throw new Error('METHOD_NOT_ALLOWED: Only GET and POST methods are supported');
    }

  } catch (error) {
    // STEP 7: Centralized Error Handling
    console.error('Error in admin-manage-users:', error);
    return createErrorResponse(error);
  }
});
