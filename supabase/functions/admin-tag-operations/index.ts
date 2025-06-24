
// ABOUTME: Tag management operations Edge Function for admin tag system following the mandatory 7-step pattern

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  authenticateUser,
  handleCorsPreflightRequest,
  RateLimitError
} from '../_shared/api-helpers.ts';
import { checkRateLimit, rateLimitHeaders } from '../_shared/rate-limit.ts';

interface TagOperationPayload {
  action: 'create' | 'update' | 'delete' | 'merge' | 'list' | 'hierarchy';
  tagId?: number;
  tagName?: string;
  parentId?: number;
  mergeTargetId?: number;
  filters?: {
    search?: string;
    parentId?: number;
    limit?: number;
    offset?: number;
  };
}

Deno.serve(async (req) => {
  // STEP 1: CORS Preflight Handling (MANDATORY FIRST)
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // STEP 2: Manual Authentication (requires verify_jwt = false in config.toml)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const user = await authenticateUser(supabase, req.headers.get('Authorization'));
    
    // Verify admin/editor role using JWT claims
    const userRole = user.app_metadata?.role;
    if (!userRole || !['admin', 'editor'].includes(userRole)) {
      throw new Error('FORBIDDEN: Tag operations require admin or editor role');
    }

    // STEP 3: Rate Limiting Implementation
    const rateLimitResult = await checkRateLimit(req, 'admin-tag-operations', 60, 60000);
    if (!rateLimitResult.allowed) {
      throw RateLimitError;
    }

    // STEP 4: Input Parsing & Validation
    let payload: TagOperationPayload;
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      payload = {
        action: 'list',
        filters: {
          search: url.searchParams.get('search') || undefined,
          parentId: url.searchParams.get('parentId') ? parseInt(url.searchParams.get('parentId')!) : undefined,
          limit: parseInt(url.searchParams.get('limit') || '50'),
          offset: parseInt(url.searchParams.get('offset') || '0')
        }
      };
    } else {
      payload = await req.json();
    }
    
    if (!payload.action) {
      throw new Error('VALIDATION_FAILED: Action is required');
    }

    const validActions = ['create', 'update', 'delete', 'merge', 'list', 'hierarchy'];
    if (!validActions.includes(payload.action)) {
      throw new Error(`VALIDATION_FAILED: Invalid action: ${payload.action}`);
    }

    console.log('Tag operation request:', { 
      action: payload.action, 
      tagId: payload.tagId,
      userRole 
    });

    // STEP 5: Core Business Logic Execution
    const result = await handleTagOperation(supabase, payload, user.id);

    // STEP 6: Standardized Success Response
    return createSuccessResponse(result, rateLimitHeaders(rateLimitResult));

  } catch (error) {
    // STEP 7: Centralized Error Handling
    console.error('Tag operation error:', error);
    return createErrorResponse(error);
  }
});

// Helper function to handle tag operations
async function handleTagOperation(supabase: any, payload: TagOperationPayload, performedBy: string) {
  try {
    switch (payload.action) {
      case 'list':
        return await listTags(supabase, payload.filters);
      
      case 'hierarchy':
        return await getTagHierarchy(supabase);
      
      case 'create':
        if (!payload.tagName) {
          throw new Error('Tag name is required for create action');
        }
        return await createTag(supabase, payload.tagName, payload.parentId, performedBy);
      
      case 'update':
        if (!payload.tagId || !payload.tagName) {
          throw new Error('Tag ID and name are required for update action');
        }
        return await updateTag(supabase, payload.tagId, payload.tagName, payload.parentId, performedBy);
      
      case 'delete':
        if (!payload.tagId) {
          throw new Error('Tag ID is required for delete action');
        }
        return await deleteTag(supabase, payload.tagId, performedBy);
      
      case 'merge':
        if (!payload.tagId || !payload.mergeTargetId) {
          throw new Error('Source tag ID and target tag ID are required for merge action');
        }
        return await mergeTags(supabase, payload.tagId, payload.mergeTargetId, performedBy);
      
      default:
        throw new Error(`Unsupported action: ${payload.action}`);
    }
  } catch (error) {
    console.error('Error in handleTagOperation:', error);
    throw error;
  }
}

// Helper function to list tags with filtering
async function listTags(supabase: any, filters: any = {}) {
  let query = supabase
    .from('Tags')
    .select(`
      id,
      tag_name,
      parent_id,
      created_at,
      parent:Tags!parent_id(tag_name)
    `);

  if (filters.search) {
    query = query.ilike('tag_name', `%${filters.search}%`);
  }

  if (filters.parentId !== undefined) {
    if (filters.parentId === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', filters.parentId);
    }
  }

  const limit = Math.min(filters.limit || 50, 100);
  const offset = filters.offset || 0;

  query = query
    .range(offset, offset + limit - 1)
    .order('tag_name', { ascending: true });

  const { data: tags, error: tagsError } = await query;
  
  if (tagsError) {
    throw new Error(`Failed to fetch tags: ${tagsError.message}`);
  }

  // Get usage count for each tag
  const tagIds = tags?.map(tag => tag.id) || [];
  const { data: usageCounts, error: usageError } = await supabase
    .from('ReviewTags')
    .select('tag_id, count:id.count()')
    .in('tag_id', tagIds);

  if (usageError) {
    console.error('Error fetching tag usage counts:', usageError);
  }

  // Merge usage counts with tags
  const usageMap = (usageCounts || []).reduce((acc: any, item: any) => {
    acc[item.tag_id] = item.count || 0;
    return acc;
  }, {});

  const enrichedTags = (tags || []).map(tag => ({
    ...tag,
    usage_count: usageMap[tag.id] || 0
  }));

  return {
    tags: enrichedTags,
    pagination: {
      limit,
      offset,
      total: enrichedTags.length
    }
  };
}

// Helper function to get full tag hierarchy
async function getTagHierarchy(supabase: any) {
  const { data: allTags, error } = await supabase
    .from('Tags')
    .select('*')
    .order('tag_name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch tag hierarchy: ${error.message}`);
  }

  // Build hierarchy tree
  const tagMap = new Map();
  const rootTags = [];

  // First pass: create tag map
  allTags?.forEach((tag: any) => {
    tagMap.set(tag.id, { ...tag, children: [] });
  });

  // Second pass: build hierarchy
  allTags?.forEach((tag: any) => {
    if (tag.parent_id) {
      const parent = tagMap.get(tag.parent_id);
      if (parent) {
        parent.children.push(tagMap.get(tag.id));
      }
    } else {
      rootTags.push(tagMap.get(tag.id));
    }
  });

  return { hierarchy: rootTags };
}

// Helper function to create a new tag
async function createTag(supabase: any, tagName: string, parentId: number | undefined, performedBy: string) {
  const { data, error } = await supabase
    .from('Tags')
    .insert({
      tag_name: tagName.trim(),
      parent_id: parentId || null
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create tag: ${error.message}`);
  }

  // Log audit event
  await supabase.rpc('log_audit_event', {
    p_performed_by: performedBy,
    p_action_type: 'CREATE',
    p_resource_type: 'Tags',
    p_resource_id: data.id.toString(),
    p_new_values: data,
    p_metadata: { source: 'admin_panel' }
  });

  return data;
}

// Helper function to update a tag
async function updateTag(supabase: any, tagId: number, tagName: string, parentId: number | undefined, performedBy: string) {
  const { data, error } = await supabase
    .from('Tags')
    .update({
      tag_name: tagName.trim(),
      parent_id: parentId || null
    })
    .eq('id', tagId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update tag: ${error.message}`);
  }

  // Log audit event
  await supabase.rpc('log_audit_event', {
    p_performed_by: performedBy,
    p_action_type: 'UPDATE',
    p_resource_type: 'Tags',
    p_resource_id: tagId.toString(),
    p_new_values: data,
    p_metadata: { source: 'admin_panel' }
  });

  return data;
}

// Helper function to delete a tag
async function deleteTag(supabase: any, tagId: number, performedBy: string) {
  // Check if tag has children
  const { data: children, error: childrenError } = await supabase
    .from('Tags')
    .select('id')
    .eq('parent_id', tagId);

  if (childrenError) {
    throw new Error(`Failed to check for child tags: ${childrenError.message}`);
  }

  if (children && children.length > 0) {
    throw new Error('Cannot delete tag with child tags. Remove or reassign children first.');
  }

  // Check usage count
  const { count: usageCount, error: usageError } = await supabase
    .from('ReviewTags')
    .select('*', { count: 'exact', head: true })
    .eq('tag_id', tagId);

  if (usageError) {
    throw new Error(`Failed to check tag usage: ${usageError.message}`);
  }

  if (usageCount && usageCount > 0) {
    throw new Error(`Cannot delete tag that is used by ${usageCount} review(s). Remove associations first.`);
  }

  const { data, error } = await supabase
    .from('Tags')
    .delete()
    .eq('id', tagId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to delete tag: ${error.message}`);
  }

  // Log audit event
  await supabase.rpc('log_audit_event', {
    p_performed_by: performedBy,
    p_action_type: 'DELETE',
    p_resource_type: 'Tags',
    p_resource_id: tagId.toString(),
    p_old_values: data,
    p_metadata: { source: 'admin_panel' }
  });

  return { deleted: true, tagId };
}

// Helper function to merge tags
async function mergeTags(supabase: any, sourceTagId: number, targetTagId: number, performedBy: string) {
  // Verify both tags exist
  const { data: sourceTags, error: sourceError } = await supabase
    .from('Tags')
    .select('*')
    .in('id', [sourceTagId, targetTagId]);

  if (sourceError || !sourceTags || sourceTags.length !== 2) {
    throw new Error('One or both tags not found');
  }

  // Move all associations from source to target
  const { error: moveError } = await supabase
    .from('ReviewTags')
    .update({ tag_id: targetTagId })
    .eq('tag_id', sourceTagId);

  if (moveError) {
    throw new Error(`Failed to move tag associations: ${moveError.message}`);
  }

  // Delete the source tag
  const { error: deleteError } = await supabase
    .from('Tags')
    .delete()
    .eq('id', sourceTagId);

  if (deleteError) {
    throw new Error(`Failed to delete source tag: ${deleteError.message}`);
  }

  // Log audit event
  await supabase.rpc('log_audit_event', {
    p_performed_by: performedBy,
    p_action_type: 'MERGE',
    p_resource_type: 'Tags',
    p_resource_id: targetTagId.toString(),
    p_metadata: { 
      source: 'admin_panel',
      source_tag_id: sourceTagId,
      target_tag_id: targetTagId
    }
  });

  return { 
    merged: true, 
    sourceTagId, 
    targetTagId,
    targetTag: sourceTags.find(t => t.id === targetTagId)
  };
}
