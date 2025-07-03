// ABOUTME: Enhanced route protection component that unifies 4-tier access control with legacy role-based protection

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { usePageAccessControl } from '../../../packages/hooks/usePageAccessControl';
import type { AccessLevel } from '../../lib/accessControl';

type LegacyRole = 'admin' | 'editor' | 'moderator' | 'practitioner';
type ProtectionMode = '4-tier' | 'legacy-role';

interface EnhancedProtectedRouteProps {
  children: React.ReactNode;

  // 4-tier access control options (both naming conventions supported)
  requiredAccessLevel?: AccessLevel;
  requiredLevel?: AccessLevel; // Alias for requiredAccessLevel
  redirectUrl?: string;

  // Legacy role-based options
  requiredRole?: LegacyRole;
  requiredRoles?: LegacyRole[];
  fallbackPath?: string;

  // Mode selection
  mode?: ProtectionMode;

  // UI customization
  loadingComponent?: React.ReactNode;
}

const DefaultLoadingComponent = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Verificando acesso...</p>
    </div>
  </div>
);

// Legacy role hierarchy for backward compatibility
const ROLE_HIERARCHY = {
  admin: 3,
  editor: 2,
  moderator: 2,
  practitioner: 1,
} as const;

function hasRequiredRole(userRole: string | undefined, requiredRole: LegacyRole): boolean {
  if (!userRole) return false;

  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY];
  const requiredLevel = ROLE_HIERARCHY[requiredRole];

  if (userLevel === undefined || requiredLevel === undefined) return false;

  return userLevel >= requiredLevel;
}

function hasAnyRequiredRole(userRole: string | undefined, requiredRoles: LegacyRole[]): boolean {
  if (!userRole || !requiredRoles.length) return false;

  return requiredRoles.some(role => hasRequiredRole(userRole, role));
}

export const EnhancedProtectedRoute: React.FC<EnhancedProtectedRouteProps> = ({
  children,
  requiredAccessLevel,
  requiredLevel, // Alias support
  redirectUrl,
  requiredRole,
  requiredRoles,
  fallbackPath = '/acesso-negado',
  mode = '4-tier',
  loadingComponent = <DefaultLoadingComponent />,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session, isLoading: authLoading } = useAuthStore();

  // Resolve the required access level (support both parameter names)
  const resolvedRequiredLevel = requiredLevel || requiredAccessLevel || 'public';

  // Get 4-tier access control data
  const pageAccessControl = usePageAccessControl(location.pathname, {
    defaultRequiredLevel: resolvedRequiredLevel,
    defaultRedirectUrl: redirectUrl || '/login',
  });

  // Handle authentication check
  useEffect(() => {
    if (authLoading || pageAccessControl.isLoading) return;

    // Check if user is authenticated for protected routes
    const needsAuthentication =
      mode === '4-tier' ? pageAccessControl.requiredAccessLevel !== 'public' : true;

    if (needsAuthentication && (!user || !session)) {
      const loginRedirect =
        mode === '4-tier' ? pageAccessControl.redirectUrl || '/login' : '/login';
      navigate(loginRedirect);
      return;
    }

    // Handle access control based on mode
    if (mode === '4-tier') {
      // Use new 4-tier access control system
      if (!pageAccessControl.hasAccess && pageAccessControl.redirectUrl) {
        navigate(pageAccessControl.redirectUrl);
      }
    } else if (mode === 'legacy-role') {
      // Use legacy role-based protection
      if (user) {
        const userRole = user.app_metadata?.role;
        let hasAccess = false;

        if (requiredRoles) {
          hasAccess = hasAnyRequiredRole(userRole, requiredRoles);
        } else if (requiredRole) {
          hasAccess = hasRequiredRole(userRole, requiredRole);
        } else {
          // Default to practitioner level if no role specified
          hasAccess = hasRequiredRole(userRole, 'practitioner');
        }

        if (!hasAccess) {
          navigate(fallbackPath);
        }
      }
    }
  }, [
    authLoading,
    pageAccessControl.isLoading,
    pageAccessControl.hasAccess,
    pageAccessControl.redirectUrl,
    pageAccessControl.requiredAccessLevel,
    user,
    session,
    mode,
    requiredRole,
    requiredRoles,
    fallbackPath,
    navigate,
  ]);

  // Show loading state
  if (authLoading || pageAccessControl.isLoading) {
    return <>{loadingComponent}</>;
  }

  // Show nothing while redirecting
  const shouldRedirect = mode === '4-tier' ? !pageAccessControl.hasAccess : false; // Legacy mode handles its own redirects

  if (shouldRedirect) {
    return null;
  }

  // For legacy mode, check access synchronously
  if (mode === 'legacy-role' && user) {
    const userRole = user.app_metadata?.role;
    let hasAccess = false;

    if (requiredRoles) {
      hasAccess = hasAnyRequiredRole(userRole, requiredRoles);
    } else if (requiredRole) {
      hasAccess = hasRequiredRole(userRole, requiredRole);
    } else {
      hasAccess = hasRequiredRole(userRole, 'practitioner');
    }

    if (!hasAccess) {
      return null; // Will redirect via useEffect
    }
  }

  // Render protected content
  return <>{children}</>;
};
