// ABOUTME: Admin endpoint for comprehensive tag management operations with enhanced analytics and hierarchy support.

import { handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getUserFromRequest } from '../_shared/auth.ts';
import { sendSuccess, sendError } from '../_shared/api-helpers.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface TagOperationPayload {
  action: 'create' | 'update' | 'delete' | 'merge' | 'move' | 'cleanup';
  tagId?: number;
  parentId?: number | null;
  name?: string;
  description?: string;
  mergeTargetId?: number;
  bulkTagIds?: number[];
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

    if (req.method === 'GET') {
      // Fetch all tags with usage statistics
      const { data: tags, error: tagsError } = await supabaseAdmin
        .from('Tags')
        .select(`
          id,
          tag_name,
          parent_id,
          created_at,
          ReviewTags(count)
        `)
        .order('tag_name');

      if (tagsError) {
        throw new Error(`Failed to fetch tags: ${tagsError.message}`);
      }

      // Transform data to include usage statistics
      const tagsWithStats = (tags || []).map(tag => ({
        id: tag.id,
        tag_name: tag.tag_name,
        parent_id: tag.parent_id,
        created_at: tag.created_at,
        usage_count: Array.isArray(tag.ReviewTags) ? tag.ReviewTags.length : 0,
        direct_children: 0, // Will be calculated client-side
        total_descendants: 0, // Will be calculated client-side
        recent_usage: 0 // Will be calculated client-side
      }));

      return sendSuccess(tagsWithStats);

    } else if (req.method === 'POST') {
      // Parse request body for tag operations
      let payload: TagOperationPayload;
      try {
        const bodyText = await req.text();
        if (!bodyText || bodyText.trim() === '') {
          return sendError('Request body is empty', 400);
        }
        payload = JSON.parse(bodyText);
      } catch (parseError) {
        return sendError('Invalid JSON in request body', 400);
      }
      
      const { action, tagId, parentId, name, description, mergeTargetId, bulkTagIds } = payload;

      let result;

      switch (action) {
        case 'create':
          if (!name) {
            return sendError('Tag name is required', 400);
          }

          const { data: newTag, error: createError } = await supabaseAdmin
            .from('Tags')
            .insert({
              tag_name: name.trim(),
              parent_id: parentId,
              description: description?.trim()
            })
            .select()
            .single();

          if (createError) {
            if (createError.code === '23505') {
              throw new Error('A tag with this name already exists');
            }
            throw new Error(`Failed to create tag: ${createError.message}`);
          }

          result = {
            message: 'Tag created successfully',
            tag: newTag
          };
          break;

        case 'update':
          if (!tagId) {
            return sendError('Tag ID is required', 400);
          }

          const updateData: any = {};
          if (name !== undefined) updateData.tag_name = name.trim();
          if (parentId !== undefined) updateData.parent_id = parentId;
          if (description !== undefined) updateData.description = description?.trim();

          if (Object.keys(updateData).length === 0) {
            return sendError('At least one field must be provided for update', 400);
          }

          const { data: updatedTag, error: updateError } = await supabaseAdmin
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

        case 'delete':
          if (!tagId) {
            return sendError('Tag ID is required', 400);
          }

          // Check if tag has children
          const { data: children } = await supabaseAdmin
            .from('Tags')
            .select('id')
            .eq('parent_id', tagId);

          if (children && children.length > 0) {
            return sendError('Cannot delete tag with child tags', 400);
          }

          // Check if tag is used in reviews
          const { data: reviews } = await supabaseAdmin
            .from('ReviewTags')
            .select('id')
            .eq('tag_id', tagId);

          if (reviews && reviews.length > 0) {
            return sendError('Cannot delete tag that is used in reviews', 400);
          }

          const { error: deleteError } = await supabaseAdmin
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

        case 'merge':
          if (!tagId || !mergeTargetId) {
            return sendError('Both source and target tag IDs are required for merge', 400);
          }

          // Update all ReviewTags to use the target tag
          const { error: mergeError } = await supabaseAdmin
            .from('ReviewTags')
            .update({ tag_id: mergeTargetId })
            .eq('tag_id', tagId);

          if (mergeError) {
            throw new Error(`Failed to merge tags: ${mergeError.message}`);
          }

          // Delete the source tag
          const { error: deleteSourceError } = await supabaseAdmin
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

        case 'cleanup':
          // Remove unused tags (tags with no ReviewTags associations)
          const { data: unusedTags, error: unusedError } = await supabaseAdmin
            .from('Tags')
            .select('id')
            .not('id', 'in', `(SELECT DISTINCT tag_id FROM "ReviewTags")`);

          if (unusedError) {
            throw new Error(`Failed to identify unused tags: ${unusedError.message}`);
          }

          if (!unusedTags || unusedTags.length === 0) {
            result = {
              message: 'No unused tags found',
              removedCount: 0
            };
          } else {
            const { error: cleanupError } = await supabaseAdmin
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

        default:
          return sendError(`Invalid action: ${action}`, 400);
      }

      return sendSuccess(result);

    } else {
      return sendError('Only GET and POST methods are supported', 405);
    }

  } catch (error) {
    console.error('Admin tag operations error:', error);
    return sendError(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});