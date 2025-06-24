
// ABOUTME: Centralized authentication utilities for Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

export const authenticateRequest = async (req: Request): Promise<AuthResult> => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return { success: false, error: 'Missing authorization header' };
    }

    const { data: { user }, error } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (error || !user) {
      return { success: false, error: 'Invalid authentication' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
};

export const requireRole = (user: any, requiredRoles: string[]): { success: boolean; error?: string } => {
  const userRole = user?.app_metadata?.role;
  
  if (!userRole) {
    return { success: false, error: 'User role not found' };
  }
  
  if (!requiredRoles.includes(userRole)) {
    return { success: false, error: `Insufficient permissions: ${requiredRoles.join(' or ')} role required` };
  }
  
  return { success: true };
};
