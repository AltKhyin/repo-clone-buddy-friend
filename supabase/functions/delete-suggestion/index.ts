// ABOUTME: Edge Function for deleting suggestions with admin authentication.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSuccessResponse, createErrorResponse, authenticateUser } from '../_shared/api-helpers.ts';

serve(async (req: Request) => {
  // CORS Preflight Handling
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const origin = req.headers.get('Origin');

  try {
    // Create Supabase client with service role for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authentication (Admin required)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('UNAUTHORIZED: Authorization required');
    }

    const user = await authenticateUser(supabase, authHeader);

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('UserRoles')
      .select('role_name')
      .eq('practitioner_id', user.id)
      .eq('is_active', true)
      .single();

    if (!userRole || userRole.role_name !== 'admin') {
      throw new Error('FORBIDDEN: Admin access required');
    }

    const { suggestionId, deleteAll } = await req.json();

    if (deleteAll) {
      // Delete all suggestions
      const { error } = await supabase
        .from('Suggestions')
        .delete()
        .neq('id', 0); // Delete all rows

      if (error) {
        throw new Error(`Failed to delete all suggestions: ${error.message}`);
      }

      return createSuccessResponse({ 
        message: 'All suggestions deleted successfully',
        deletedCount: 'all'
      }, {}, origin);
    } else {
      // Delete single suggestion
      if (!suggestionId) {
        throw new Error('VALIDATION_FAILED: suggestionId is required');
      }

      const { error } = await supabase
        .from('Suggestions')
        .delete()
        .eq('id', suggestionId);

      if (error) {
        throw new Error(`Failed to delete suggestion: ${error.message}`);
      }

      return createSuccessResponse({ 
        message: 'Suggestion deleted successfully',
        deletedId: suggestionId
      }, {}, origin);
    }

  } catch (error) {
    console.error('Error in delete-suggestion:', error);
    return createErrorResponse(error, {}, origin);
  }
});