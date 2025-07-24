// ABOUTME: Admin Edge Function for page access control management supporting CRUD operations

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Valid access levels - simplified to admin from editor_admin
const VALID_ACCESS_LEVELS = ['public', 'free', 'premium', 'admin'];

interface PageAccessControlData {
  page_path: string;
  required_access_level: string;
  redirect_url?: string;
  is_active?: boolean;
}

Deno.serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`Processing ${req.method} request to admin-page-access-control`);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);

    if (!authHeader) {
      throw new Error('UNAUTHORIZED: Missing authorization header');
    }

    // Authenticate user
    const token = authHeader.replace('Bearer ', '');
    console.log('Extracted token length:', token.length);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('UNAUTHORIZED: Invalid authentication');
    }

    console.log('User authenticated:', user.id, 'Role:', user.app_metadata?.role);

    // Check if user has admin or editor role (transitional - editor will be migrated to admin)
    const userRole = user.app_metadata?.role;
    if (!userRole || !['admin', 'editor'].includes(userRole)) {
      console.error('Insufficient role:', userRole);
      throw new Error('FORBIDDEN: Admin or editor role required');
    }

    // Route based on HTTP method
    let result;

    switch (req.method) {
      case 'GET':
        result = await handleGetRequest(req, supabase);
        break;
      case 'POST':
        result = await handlePostRequest(req, supabase, user.id);
        break;
      case 'PUT':
        result = await handlePutRequest(req, supabase, user.id);
        break;
      case 'DELETE':
        result = await handleDeleteRequest(req, supabase, user.id);
        break;
      default:
        throw new Error('VALIDATION_FAILED: Method not allowed');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Page access control error:', error);

    const errorMessage = error.message || 'Unknown error occurred';
    let statusCode = 500;

    if (errorMessage.includes('UNAUTHORIZED:')) {
      statusCode = 401;
    } else if (errorMessage.includes('FORBIDDEN:')) {
      statusCode = 403;
    } else if (errorMessage.includes('VALIDATION_FAILED:')) {
      statusCode = 400;
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage.replace(/^(UNAUTHORIZED|FORBIDDEN|VALIDATION_FAILED): /, ''),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    );
  }
});

// Handle GET requests - read access control rules
async function handleGetRequest(req: Request, supabase: any) {
  const url = new URL(req.url);
  const pagePath = url.searchParams.get('page_path');
  const accessLevel = url.searchParams.get('access_level');
  const isActive = url.searchParams.get('is_active');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  // If specific page path requested, return single rule
  if (pagePath) {
    const { data, error } = await supabase
      .from('PageAccessControl')
      .select('*')
      .eq('page_path', pagePath)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - return null for non-existent pages
        return null;
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  // Build query for multiple rules
  let query = supabase
    .from('PageAccessControl')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  // Apply filters
  if (accessLevel && VALID_ACCESS_LEVELS.includes(accessLevel)) {
    query = query.eq('required_access_level', accessLevel);
  }

  if (isActive !== null) {
    query = query.eq('is_active', isActive === 'true');
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return {
    data: data || [],
    total_count: count || 0,
    limit,
    offset,
  };
}

// Handle POST requests - create new access control rule
async function handlePostRequest(req: Request, supabase: any, userId: string) {
  const payload = await req.json();

  // Validate required fields
  if (!payload.page_path || !payload.required_access_level) {
    throw new Error('VALIDATION_FAILED: page_path and required_access_level are required');
  }

  // Validate access level
  if (!VALID_ACCESS_LEVELS.includes(payload.required_access_level)) {
    throw new Error(
      `VALIDATION_FAILED: Invalid access level. Must be one of: ${VALID_ACCESS_LEVELS.join(', ')}`
    );
  }

  // Prepare data
  const accessControlData: PageAccessControlData = {
    page_path: payload.page_path,
    required_access_level: payload.required_access_level,
    redirect_url: payload.redirect_url || '/login',
    is_active: payload.is_active ?? true,
  };

  // Insert new rule
  const { data, error } = await supabase
    .from('PageAccessControl')
    .insert(accessControlData)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('VALIDATION_FAILED: Page path already exists');
    }
    throw new Error(`Database error: ${error.message}`);
  }

  // Log audit event (optional - don't fail operation if this fails)
  try {
    await supabase.rpc('log_audit_event', {
      p_performed_by: userId,
      p_action_type: 'CREATE_PAGE_ACCESS_RULE',
      p_resource_type: 'PageAccessControl',
      p_resource_id: data.id.toString(),
      p_new_values: accessControlData,
      p_metadata: { source: 'admin_panel' },
    });
  } catch (auditError) {
    // Audit logging is optional - don't fail the operation
    console.log('Audit logging failed, but operation succeeded:', auditError);
  }

  return data;
}

// Handle PUT requests - update existing access control rule
async function handlePutRequest(req: Request, supabase: any, userId: string) {
  const payload = await req.json();

  if (!payload.id) {
    throw new Error('VALIDATION_FAILED: id is required for updates');
  }

  // Validate access level if provided
  if (
    payload.required_access_level &&
    !VALID_ACCESS_LEVELS.includes(payload.required_access_level)
  ) {
    throw new Error(
      `VALIDATION_FAILED: Invalid access level. Must be one of: ${VALID_ACCESS_LEVELS.join(', ')}`
    );
  }

  // Prepare update data
  const updateData: Partial<PageAccessControlData> = {};

  if (payload.required_access_level)
    updateData.required_access_level = payload.required_access_level;
  if (payload.redirect_url !== undefined) updateData.redirect_url = payload.redirect_url;
  if (payload.is_active !== undefined) updateData.is_active = payload.is_active;

  // Update rule
  const { data, error } = await supabase
    .from('PageAccessControl')
    .update(updateData)
    .eq('id', payload.id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('VALIDATION_FAILED: Page access rule not found');
    }
    throw new Error(`Database error: ${error.message}`);
  }

  // Log audit event (optional - don't fail operation if this fails)
  try {
    await supabase.rpc('log_audit_event', {
      p_performed_by: userId,
      p_action_type: 'UPDATE_PAGE_ACCESS_RULE',
      p_resource_type: 'PageAccessControl',
      p_resource_id: data.id.toString(),
      p_new_values: updateData,
      p_metadata: { source: 'admin_panel' },
    });
  } catch (auditError) {
    // Audit logging is optional - don't fail the operation
    console.log('Audit logging failed, but operation succeeded:', auditError);
  }

  return data;
}

// Handle DELETE requests - remove access control rule
async function handleDeleteRequest(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    throw new Error('VALIDATION_FAILED: id parameter is required for deletion');
  }

  // Get the rule before deletion for audit logging
  const { data: existingRule } = await supabase
    .from('PageAccessControl')
    .select('*')
    .eq('id', id)
    .single();

  // Delete rule
  const { error } = await supabase.from('PageAccessControl').delete().eq('id', id);

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('VALIDATION_FAILED: Page access rule not found');
    }
    throw new Error(`Database error: ${error.message}`);
  }

  // Log audit event (optional - don't fail operation if this fails)
  if (existingRule) {
    try {
      await supabase.rpc('log_audit_event', {
        p_performed_by: userId,
        p_action_type: 'DELETE_PAGE_ACCESS_RULE',
        p_resource_type: 'PageAccessControl',
        p_resource_id: id,
        p_old_values: existingRule,
        p_metadata: { source: 'admin_panel' },
      });
    } catch (auditError) {
      // Audit logging is optional - don't fail the operation
      console.log('Audit logging failed, but operation succeeded:', auditError);
    }
  }

  return { success: true, message: 'Page access rule deleted successfully' };
}
