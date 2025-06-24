
// ABOUTME: Admin Edge Function for audit log access following the simplified pattern that works

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
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Set the auth header for this request
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Check if user has admin role
    const userRole = user.app_metadata?.role;
    if (!userRole || userRole !== 'admin') {
      throw new Error('Insufficient permissions: Admin role required');
    }

    // Parse request parameters
    const url = new URL(req.url);
    const params = {
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: Math.min(parseInt(url.searchParams.get('limit') || '50'), 100),
      actionType: url.searchParams.get('actionType'),
      resourceType: url.searchParams.get('resourceType'),
      performedBy: url.searchParams.get('performedBy'),
      startDate: url.searchParams.get('startDate'),
      endDate: url.searchParams.get('endDate')
    };

    console.log('Audit log request:', params);

    let query = supabase
      .from('SystemAuditLog')
      .select(`
        *,
        Practitioners!performed_by(full_name, avatar_url)
      `);

    // Apply filters
    if (params.actionType) {
      query = query.eq('action_type', params.actionType);
    }
    if (params.resourceType) {
      query = query.eq('resource_type', params.resourceType);
    }
    if (params.performedBy) {
      query = query.eq('performed_by', params.performedBy);
    }
    if (params.startDate) {
      query = query.gte('created_at', params.startDate);
    }
    if (params.endDate) {
      query = query.lte('created_at', params.endDate);
    }

    // Apply pagination
    const offset = (params.page - 1) * params.limit;
    query = query
      .range(offset, offset + params.limit - 1)
      .order('created_at', { ascending: false });

    const { data: logs, error: logsError } = await query;
    
    if (logsError) {
      throw new Error(`Failed to fetch audit logs: ${logsError.message}`);
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('SystemAuditLog')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Failed to get total count:', countError);
    }

    const result = {
      logs: logs || [],
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalCount || 0,
        hasMore: (totalCount || 0) > offset + params.limit
      }
    };

    console.log('Audit log response:', {
      logCount: result.logs.length,
      page: params.page,
      total: result.pagination.total
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Audit log error:', error);
    
    const errorMessage = error.message || 'Unknown error occurred';
    const statusCode = errorMessage.includes('authentication') ? 401 :
                      errorMessage.includes('permissions') ? 403 : 500;

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'Audit log fetch failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
});
