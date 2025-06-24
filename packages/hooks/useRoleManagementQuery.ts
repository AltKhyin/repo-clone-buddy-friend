
// ABOUTME: TanStack Query hooks for role management operations including assignment, revocation, and available roles

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RoleAssignmentPayload {
  userId: string;
  roleName: string;
  expiresAt?: string;
}

interface RoleRevocationPayload {
  userId: string;
  roleName: string;
}

interface UserRole {
  role_name: string;
  granted_at: string;
  expires_at?: string;
}

interface UserRolesResponse {
  roles: UserRole[];
}

interface AvailableRolesResponse {
  availableRoles: string[];
}

// Hook for fetching user roles
export const useUserRolesQuery = (userId: string) => {
  return useQuery({
    queryKey: ['admin', 'user-roles', userId],
    queryFn: async (): Promise<UserRolesResponse> => {
      console.log('Fetching user roles via Edge Function...', { userId });
      
      const { data, error } = await supabase.functions.invoke('admin-assign-roles', {
        body: {
          action: 'list_user_roles',
          userId
        }
      });
      
      if (error) {
        console.error('Error fetching user roles:', error);
        throw new Error(`Failed to fetch user roles: ${error.message}`);
      }

      return data as UserRolesResponse;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.error('User roles query failed:', error);
      return failureCount < 2;
    }
  });
};

// Hook for fetching available roles
export const useAvailableRolesQuery = () => {
  return useQuery({
    queryKey: ['admin', 'available-roles'],
    queryFn: async (): Promise<AvailableRolesResponse> => {
      console.log('Fetching available roles via Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('admin-assign-roles', {
        body: {
          action: 'list_available_roles'
        }
      });
      
      if (error) {
        console.error('Error fetching available roles:', error);
        throw new Error(`Failed to fetch available roles: ${error.message}`);
      }

      return data as AvailableRolesResponse;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (roles don't change often)
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.error('Available roles query failed:', error);
      return failureCount < 2;
    }
  });
};

// Hook for assigning roles
export const useAssignRoleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RoleAssignmentPayload) => {
      console.log('Assigning role via Edge Function...', payload);
      
      const { data, error } = await supabase.functions.invoke('admin-assign-roles', {
        body: {
          action: 'assign_role',
          userId: payload.userId,
          roleName: payload.roleName,
          expiresAt: payload.expiresAt
        }
      });
      
      if (error) {
        console.error('Error assigning role:', error);
        throw new Error(`Failed to assign role: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-roles', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      console.log('Role assigned successfully:', data);
    },
    onError: (error) => {
      console.error('Role assignment failed:', error);
    }
  });
};

// Hook for revoking roles
export const useRevokeRoleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RoleRevocationPayload) => {
      console.log('Revoking role via Edge Function...', payload);
      
      const { data, error } = await supabase.functions.invoke('admin-assign-roles', {
        body: {
          action: 'revoke_role',
          userId: payload.userId,
          roleName: payload.roleName
        }
      });
      
      if (error) {
        console.error('Error revoking role:', error);
        throw new Error(`Failed to revoke role: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-roles', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      console.log('Role revoked successfully:', data);
    },
    onError: (error) => {
      console.error('Role revocation failed:', error);
    }
  });
};
