// ABOUTME: Admin content type operations edge function with CRUD functionality following admin-tag-operations pattern

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { sendSuccess, sendError } from '../_shared/response-helpers.ts';
import { validateAdminRole } from '../_shared/auth-helpers.ts';
import { rateLimitByUser } from '../_shared/rate-limit.ts';

interface ContentTypeOperation {
  action: 'create' | 'update' | 'delete' | 'list';
  contentType?: {
    label: string;
    description?: string;
    text_color: string;
    border_color: string;
    background_color: string;
  };
  contentTypeId?: number;
}

// Hex color validation
const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Validate authentication and admin role
    const authResult = await validateAdminRole(supabase);
    if (!authResult.isValid) {
      return sendError(authResult.error!, authResult.status!);
    }

    const { userId } = authResult;

    // Rate limiting for admin users
    const rateLimitResult = await rateLimitByUser(supabase, userId, 'admin-content-type-ops', 30, 300); // 30 requests per 5 minutes
    if (!rateLimitResult.allowed) {
      return sendError('Rate limit exceeded. Please try again later.', 429);
    }

    // Parse request body
    let operation: ContentTypeOperation;
    try {
      operation = await req.json();
    } catch (error) {
      return sendError('Invalid JSON in request body', 400);
    }

    // Validate operation
    if (!operation.action || !['create', 'update', 'delete', 'list'].includes(operation.action)) {
      return sendError('Invalid or missing action. Must be one of: create, update, delete, list', 400);
    }

    switch (operation.action) {
      case 'list': {
        const { data, error } = await supabase
          .from('ContentTypes')
          .select('*')
          .order('label');

        if (error) {
          console.error('Failed to list content types:', error);
          return sendError('Failed to retrieve content types', 500);
        }

        return sendSuccess({ contentTypes: data });
      }

      case 'create': {
        if (!operation.contentType) {
          return sendError('Content type data is required for create operation', 400);
        }

        const { label, description, text_color, border_color, background_color } = operation.contentType;

        // Validation
        if (!label || label.trim().length === 0) {
          return sendError('Content type label is required', 400);
        }

        if (!isValidHexColor(text_color) || !isValidHexColor(border_color) || !isValidHexColor(background_color)) {
          return sendError('All colors must be valid hex codes (e.g., #FF0000)', 400);
        }

        // Check for duplicate labels
        const { data: existing } = await supabase
          .from('ContentTypes')
          .select('id')
          .eq('label', label.trim())
          .single();

        if (existing) {
          return sendError('A content type with this label already exists', 409);
        }

        // Create new content type
        const { data, error } = await supabase
          .from('ContentTypes')
          .insert({
            label: label.trim(),
            description: description?.trim() || null,
            text_color,
            border_color,
            background_color,
            created_by: userId,
            is_system: false
          })
          .select()
          .single();

        if (error) {
          console.error('Failed to create content type:', error);
          return sendError('Failed to create content type', 500);
        }

        return sendSuccess({ contentType: data, message: 'Content type created successfully' });
      }

      case 'update': {
        if (!operation.contentTypeId || !operation.contentType) {
          return sendError('Content type ID and data are required for update operation', 400);
        }

        const { label, description, text_color, border_color, background_color } = operation.contentType;

        // Validation
        if (!label || label.trim().length === 0) {
          return sendError('Content type label is required', 400);
        }

        if (!isValidHexColor(text_color) || !isValidHexColor(border_color) || !isValidHexColor(background_color)) {
          return sendError('All colors must be valid hex codes (e.g., #FF0000)', 400);
        }

        // Check if content type exists
        const { data: existing, error: fetchError } = await supabase
          .from('ContentTypes')
          .select('id')
          .eq('id', operation.contentTypeId)
          .single();

        if (fetchError || !existing) {
          return sendError('Content type not found', 404);
        }

        // Check for duplicate labels (excluding current content type)
        const { data: duplicate } = await supabase
          .from('ContentTypes')
          .select('id')
          .eq('label', label.trim())
          .neq('id', operation.contentTypeId)
          .single();

        if (duplicate) {
          return sendError('A content type with this label already exists', 409);
        }

        // Update content type
        const { data, error } = await supabase
          .from('ContentTypes')
          .update({
            label: label.trim(),
            description: description?.trim() || null,
            text_color,
            border_color,
            background_color
          })
          .eq('id', operation.contentTypeId)
          .select()
          .single();

        if (error) {
          console.error('Failed to update content type:', error);
          return sendError('Failed to update content type', 500);
        }

        return sendSuccess({ contentType: data, message: 'Content type updated successfully' });
      }

      case 'delete': {
        if (!operation.contentTypeId) {
          return sendError('Content type ID is required for delete operation', 400);
        }

        // Check if content type exists
        const { data: existing, error: fetchError } = await supabase
          .from('ContentTypes')
          .select('id, label')
          .eq('id', operation.contentTypeId)
          .single();

        if (fetchError || !existing) {
          return sendError('Content type not found', 404);
        }

        // Check if content type is in use
        const { data: inUse } = await supabase
          .from('ReviewContentTypes')
          .select('id')
          .eq('content_type_id', operation.contentTypeId)
          .limit(1)
          .single();

        if (inUse) {
          return sendError('Cannot delete content type that is currently in use by reviews', 409);
        }

        // Delete content type
        const { error } = await supabase
          .from('ContentTypes')
          .delete()
          .eq('id', operation.contentTypeId);

        if (error) {
          console.error('Failed to delete content type:', error);
          return sendError('Failed to delete content type', 500);
        }

        return sendSuccess({ message: `Content type "${existing.label}" deleted successfully` });
      }

      default:
        return sendError('Invalid action specified', 400);
    }

  } catch (error) {
    console.error('Unexpected error in content type operations:', error);
    return sendError('Internal server error', 500);
  }
});