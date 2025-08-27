// ABOUTME: Admin endpoint for comprehensive tag management operations with enhanced analytics and hierarchy support.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSuccessResponse, createErrorResponse, authenticateUser } from '../_shared/api-helpers.ts';
import { checkRateLimit, rateLimitHeaders, RateLimitError } from '../_shared/rate-limit.ts';
import { getUserFromRequest, requireRole } from '../_shared/auth.ts';

interface TagOperationPayload {
  operation: 'create' | 'update' | 'delete' | 'merge' | 'move' | 'cleanup';
  tag_data?: {
    tag_name?: string;
    color?: string;
    description?: string;
    parent_id?: number | null;
  };
  tagId?: number;
  parentId?: number | null;
  name?: string;
  description?: string;
  mergeTargetId?: number;
  bulkTagIds?: number[];
}

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  
  // STEP 1: CORS Preflight Handling
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  try {
    // STEP 2: Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // STEP 3: Rate Limiting
    const rateLimitResult = await checkRateLimit(req, { windowMs: 60000, maxRequests: 30 });
    if (!rateLimitResult.success) {
      throw RateLimitError;
    }

    // STEP 4: Authentication (Required for admin operations)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('UNAUTHORIZED: Authentication required for admin operations');
    }

    // Create a client for user authentication (using anon key)
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await userSupabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('UNAUTHORIZED: Invalid authentication token');
    }

    // STEP 5: Authorization - Check admin role
    const { data: adminCheck } = await supabase
      .from('Practitioners')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminCheck?.role !== 'admin') {
      throw new Error('FORBIDDEN: Admin privileges required');
    }

    // STEP 6: Core Business Logic
    if (req.method === 'GET') {
      // Fetch all tags with usage statistics
      const { data: tags, error: tagsError } = await supabase
        .from('Tags')
        .select(`
          id,
          tag_name,
          parent_id,
          created_at,
          color,
          description
        `)
        .order('tag_name');

      if (tagsError) {
        throw new Error(`Failed to fetch tags: ${tagsError.message}`);
      }

      // Get usage statistics separately to avoid join issues
      const tagsWithStats = await Promise.all((tags || []).map(async (tag) => {
        const { count: usageCount } = await supabase
          .from('ReviewTags')
          .select('*', { count: 'exact' })
          .eq('tag_id', tag.id);

        return {
          id: tag.id,
          tag_name: tag.tag_name,
          parent_id: tag.parent_id,
          created_at: tag.created_at,
          color: tag.color,
          description: tag.description,
          usage_count: usageCount || 0,
          direct_children: 0, // Will be calculated client-side
          total_descendants: 0, // Will be calculated client-side
          recent_usage: 0 // Will be calculated client-side
        };
      }));

      // STEP 7: Standardized Success Response
      return createSuccessResponse(tagsWithStats, rateLimitHeaders(rateLimitResult), origin);

    } else if (req.method === 'POST') {
      // Parse request body for tag operations
      let payload: TagOperationPayload;
      try {
        const bodyText = await req.text();
        if (!bodyText || bodyText.trim() === '') {
          throw new Error('VALIDATION_FAILED: Request body is empty');
        }
        payload = JSON.parse(bodyText);
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message.includes('VALIDATION_FAILED')) {
          throw parseError;
        }
        throw new Error('VALIDATION_FAILED: Invalid JSON in request body');
      }
      
      // Support both old and new payload formats
      const action = payload.operation || payload.action;
      const { tagId, parentId, mergeTargetId, bulkTagIds } = payload;
      
      // Extract tag data from tag_data object or direct properties
      const name = payload.tag_data?.tag_name || payload.name;
      const description = payload.tag_data?.description || payload.description;
      const color = payload.tag_data?.color;

      let result;

      switch (action) {
        case 'create': {
          if (!name) {
            throw new Error('VALIDATION_FAILED: Tag name is required');
          }

          const { data: newTag, error: createError } = await supabase
            .from('Tags')
            .insert({
              tag_name: name.trim(),
              parent_id: parentId || payload.tag_data?.parent_id,
              description: description?.trim(),
              color: color
            })
            .select()
            .single();

          if (createError) {
            if (createError.code === '23505') {
              throw new Error('VALIDATION_FAILED: A tag with this name already exists');
            }
            throw new Error(`Failed to create tag: ${createError.message}`);
          }

          result = {
            message: 'Tag created successfully',
            tag: newTag
          };
          break;
        }

        case 'update': {
          if (!tagId) {
            throw new Error('VALIDATION_FAILED: Tag ID is required');
          }

          const updateData: Record<string, unknown> = {};
          if (name !== undefined) updateData.tag_name = name.trim();
          if (parentId !== undefined) updateData.parent_id = parentId;
          if (description !== undefined) updateData.description = description?.trim();

          if (Object.keys(updateData).length === 0) {
            throw new Error('VALIDATION_FAILED: At least one field must be provided for update');
          }

          const { data: updatedTag, error: updateError } = await supabase
            .from('Tags')
            .update(updateData)
            .eq('id', tagId)
            .select()
            .single();

          if (updateError) {
            throw new Error(`Failed to update tag: ${updateError.message}`);
          }

          result = {
            message: 'Tag updated successfully',
            tag: updatedTag
          };
          break;
        }

        case 'delete': {
          if (!tagId) {
            throw new Error('VALIDATION_FAILED: Tag ID is required');
          }

          // Check if tag has children
          const { data: children } = await supabase
            .from('Tags')
            .select('id')
            .eq('parent_id', tagId);

          if (children && children.length > 0) {
            throw new Error('VALIDATION_FAILED: Cannot delete tag with child tags');
          }

          // Check if tag is used in reviews
          const { data: reviews } = await supabase
            .from('ReviewTags')
            .select('id')
            .eq('tag_id', tagId);

          if (reviews && reviews.length > 0) {
            throw new Error('VALIDATION_FAILED: Cannot delete tag that is used in reviews');
          }

          const { error: deleteError } = await supabase
            .from('Tags')
            .delete()
            .eq('id', tagId);

          if (deleteError) {
            throw new Error(`Failed to delete tag: ${deleteError.message}`);
          }

          result = {
            message: 'Tag deleted successfully',
            tagId
          };
          break;
        }

        case 'merge': {
          if (!tagId || !mergeTargetId) {
            throw new Error('VALIDATION_FAILED: Both source and target tag IDs are required for merge');
          }

          // Update all ReviewTags to use the target tag
          const { error: mergeError } = await supabase
            .from('ReviewTags')
            .update({ tag_id: mergeTargetId })
            .eq('tag_id', tagId);

          if (mergeError) {
            throw new Error(`Failed to merge tags: ${mergeError.message}`);
          }

          // Delete the source tag
          const { error: deleteSourceError } = await supabase
            .from('Tags')
            .delete()
            .eq('id', tagId);

          if (deleteSourceError) {
            throw new Error(`Failed to delete source tag: ${deleteSourceError.message}`);
          }

          result = {
            message: 'Tags merged successfully',
            sourceTagId: tagId,
            targetTagId: mergeTargetId
          };
          break;
        }

        case 'cleanup': {
          // Remove unused tags (tags with no ReviewTags associations)
          // First get all used tag IDs
          const { data: usedTagIds, error: usedError } = await supabase
            .from('ReviewTags')
            .select('tag_id');

          if (usedError) {
            throw new Error(`Failed to get used tags: ${usedError.message}`);
          }

          // Extract the IDs into an array
          const usedIds = usedTagIds?.map(row => row.tag_id) || [];

          // Now get unused tags
          const { data: unusedTags, error: unusedError } = usedIds.length > 0 
            ? await supabase
                .from('Tags')
                .select('id')
                .not('id', 'in', `(${usedIds.join(',')})`)
            : await supabase
                .from('Tags')
                .select('id');

          if (unusedError) {
            throw new Error(`Failed to identify unused tags: ${unusedError.message}`);
          }

          if (!unusedTags || unusedTags.length === 0) {
            result = {
              message: 'No unused tags found',
              removedCount: 0
            };
          } else {
            const { error: cleanupError } = await supabase
              .from('Tags')
              .delete()
              .in('id', unusedTags.map(tag => tag.id));

            if (cleanupError) {
              throw new Error(`Failed to cleanup unused tags: ${cleanupError.message}`);
            }

            result = {
              message: `Cleaned up ${unusedTags.length} unused tags`,
              removedCount: unusedTags.length
            };
          }
          break;
        }

        default:
          throw new Error(`VALIDATION_FAILED: Invalid action: ${action}`);
      }

      // STEP 7: Standardized Success Response
      return createSuccessResponse(result, rateLimitHeaders(rateLimitResult), origin);

    } else {
      throw new Error('VALIDATION_FAILED: Only GET and POST methods are supported');
    }

  } catch (error) {
    // STEP 8: Centralized Error Handling
    console.error('Error in admin-tag-operations:', error);
    return createErrorResponse(error, {}, origin);
  }
});