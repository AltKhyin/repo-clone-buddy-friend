
// ABOUTME: Admin Edge Function for role assignment and management operations following the simplified pattern that works

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

    // Parse request body
    const payload = await req.json();
    console.log('Role management request:', { action: payload.action, userId: payload.userId });

    let result;

    switch (payload.action) {
      case 'list_available_roles':
        result = await handleListAvailableRoles();
        break;
      
      case 'list_user_roles':
        if (!payload.userId) throw new Error('User ID is required for listing user roles');
        result = await handleListUserRoles(supabase, payload.userId);
        break;
      
      case 'assign_role':
        if (!payload.userId || !payload.roleName) {
          throw new Error('User ID and role name are required for role assignment');
        }
        result = await handleAssignRole(supabase, payload.userId, payload.roleName, payload.expiresAt, user.id);
        break;
      
      case 'revoke_role':
        if (!payload.userId || !payload.roleName) {
          throw new Error('User ID and role name are required for role revocation');
        }
        result = await handleRevokeRole(supabase, payload.userId, payload.roleName, user.id);
        break;
      
      default:
        throw new Error(`Invalid action: ${payload.action}`);
    }

    console.log('Role management response:', { action: payload.action, success: true });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Role management error:', error);
    
    const errorMessage = error.message || 'Unknown error occurred';
    const statusCode = errorMessage.includes('authentication') ? 401 :
                      errorMessage.includes('permissions') ? 403 : 500;

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'Role management operation failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
});

// Helper function to list available roles
async function handleListAvailableRoles() {
  return {
    availableRoles: ['editor', 'moderator']
  };
}

async function handleListUserRoles(supabase: any, userId: string) {
  const { data: userRoles, error } = await supabase
    .rpc('get_user_roles', { p_user_id: userId });

  if (error) {
    console.error('Error fetching user roles:', error);
    throw new Error(`Failed to fetch user roles: ${error.message}`);
  }

  return {
    roles: userRoles || []
  };
}

async function handleAssignRole(supabase: any, userId: string, roleName: string, expiresAt: string | undefined, performedBy: string) {
  const roleData: any = {
    practitioner_id: userId,
    role_name: roleName,
    granted_by: performedBy,
    granted_at: new Date().toISOString(),
    is_active: true
  };

  if (expiresAt) {
    roleData.expires_at = expiresAt;
  }

  const { data: newRole, error: roleError } = await supabase
    .from('UserRoles')
    .insert(roleData)
    .select()
    .single();

  if (roleError) {
    console.error('Error assigning role:', roleError);
    throw new Error(`Failed to assign role: ${roleError.message}`);
  }

  const roleHierarchy = { 'admin': 4, 'editor': 3, 'moderator': 2, 'practitioner': 1 };
  const newRoleLevel = roleHierarchy[roleName as keyof typeof roleHierarchy] || 1;

  const { data: currentUser, error: userError } = await supabase
    .from('Practitioners')
    .select('role')
    .eq('id', userId)
    .single();

  if (!userError && currentUser) {
    const currentRoleLevel = roleHierarchy[currentUser.role as keyof typeof roleHierarchy] || 1;
    
    if (newRoleLevel > currentRoleLevel) {
      await supabase
        .from('Practitioners')
        .update({ role: roleName })
        .eq('id', userId);
    }
  }

  await supabase.rpc('log_audit_event', {
    p_performed_by: performedBy,
    p_action_type: 'ASSIGN_ROLE',
    p_resource_type: 'UserRoles',
    p_resource_id: userId,
    p_new_values: { role_name: roleName, expires_at: expiresAt },
    p_metadata: { source: 'admin_panel' }
  });

  return { success: true, role: newRole };
}

async function handleRevokeRole(supabase: any, userId: string, roleName: string, performedBy: string) {
  const { error: deleteError } = await supabase
    .from('UserRoles')
    .delete()
    .eq('practitioner_id', userId)
    .eq('role_name', roleName);

  if (deleteError) {
    console.error('Error revoking role:', deleteError);
    throw new Error(`Failed to revoke role: ${deleteError.message}`);
  }

  const { data: remainingRoles, error: rolesError } = await supabase
    .from('UserRoles')
    .select('role_name')
    .eq('practitioner_id', userId)
    .eq('is_active', true)
    .or('expires_at.is.null,expires_at.gt.now()');

  if (!rolesError) {
    const roleHierarchy = { 'admin': 4, 'editor': 3, 'moderator': 2, 'practitioner': 1 };
    let highestRole = 'practitioner';
    let highestLevel = 1;

    remainingRoles?.forEach((role: any) => {
      const level = roleHierarchy[role.role_name as keyof typeof roleHierarchy] || 1;
      if (level > highestLevel) {
        highestLevel = level;
        highestRole = role.role_name;
      }
    });

    await supabase
      .from('Practitioners')
      .update({ role: highestRole })
      .eq('id', userId);
  }

  await supabase.rpc('log_audit_event', {
    p_performed_by: performedBy,
    p_action_type: 'REVOKE_ROLE',
    p_resource_type: 'UserRoles',
    p_resource_id: userId,
    p_old_values: { role_name: roleName },
    p_metadata: { source: 'admin_panel' }
  });

  return { success: true, message: `Role ${roleName} revoked successfully` };
}
